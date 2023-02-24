from tutorial.quickstart.models import *
from rest_framework import viewsets
from rest_framework import permissions
from rest_framework.decorators import api_view
from rest_framework import generics
from rest_framework.response import Response
from tutorial.quickstart.serializers import * 
from rest_framework import status
from django.http.response import JsonResponse
import django_filters.rest_framework
import os
from rest_framework.decorators import action
import datetime
import pytz
from rest_framework.pagination import PageNumberPagination
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions

class TakeViewSet(viewsets.ModelViewSet):
    """
    """
    queryset = Take.objects.all()
    serializer_class = TakeSerializer
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_fields = ['nft_id']
    # permission_classes = [permissions.IsAuthenticated]

class RemixViewSet(viewsets.ModelViewSet):
    """
    """
    queryset = Remix.objects.all()
    serializer_class = RemixSerializer
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    # permission_classes = [permissions.IsAuthenticated]

class UserViewSet(viewsets.ModelViewSet):
    """
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    # permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='by-address/(?P<address>[^.]+)/recent-takes', url_name='recent-takes')
    def recent_takes(self, request, address=None):
        serializer_context = {
            'request': request,
        }
        user = self.queryset.get(address=address)
        takes = user.created_takes.all().order_by('-created_at')

        paginator = PageNumberPagination()
        paginator.page_size = 12
        result_page = paginator.paginate_queryset(takes, request)
        serializer = TakeSerializerDepth1(takes, many=True, context=serializer_context)
        return paginator.get_paginated_response(serializer.data)

        # serializer = TakeSerializerDepth1(takes, many=True, context=serializer_context)
        # return Response(serializer.data)


class PinnedTakeList(generics.ListCreateAPIView):
    queryset = PinnedTake.objects.all()
    serializer_class = PinnedTakeSerializer


class PinnedTakeDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = PinnedTake.objects.all()
    serializer_class = PinnedTakeSerializer




class PhraseViewSet(viewsets.ModelViewSet):
    """
    """
    queryset = Phrase.objects.all()
    serializer_class = PhraseSerializer
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_fields = ['name']
    # permission_classes = [permissions.IsAuthenticated]

    # @action(detail=False, methods=['get'], url_path='by-name/(?P<name>[^.]+)/takes', url_name='takes')
    # def recent_takes(self, request, address=None):
    #     serializer_context = {
    #         'request': request,
    #     }
    #     user = self.queryset.get(name=name)
    #     takes = user.created_takes.all().order_by('-created_at')

    #     paginator = PageNumberPagination()
    #     paginator.page_size = 12
    #     result_page = paginator.paginate_queryset(takes, request)
    #     serializer = TakeSerializerDepth1(takes, many=True, context=serializer_context)
    #     return paginator.get_paginated_response(serializer.data)

class LikeViewSet(viewsets.ModelViewSet):
    """
    """
    queryset = Like.objects.all()
    serializer_class = LikeSerializer
    # filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    # permission_classes = [permissions.IsAuthenticated]

@api_view(['POST'])
def on_new_take(request):
    print(request.data)
    
    # Parse.
    # data = JSONParser().parse(request.data)
    data = request.data

    # Verify api key.
    if data['apiKey'] != str(os.getenv('INDEXER_API_KEY')):
        return JsonResponse({"error":"INVALID_API_KEY"}, status=status.HTTP_401_UNAUTHORIZED)

    # Create a user.
    user, created = User.objects.get_or_create(address=data['creator_address'])

    # Create a new Take.
    created_at = datetime.datetime.fromtimestamp(data['created_at'], tz=pytz.UTC)
    take, created = Take.objects.get_or_create(nft_id=data['nft_id'], creator=user, created_at=created_at)
    if not created:
        return JsonResponse({"error":"ALREADY_INDEXED"}, status=status.HTTP_200_OK) 
    take.nft_id = data['nft_id']
    take.text = data['text']
    take.creator = user
    take.save()

    # Parse the placeholders.
    placeholders = []
    for placeholder in data['placeholders']:
        # Lookup the Phrase.
        phrase, created = Phrase.objects.get_or_create(name=placeholder)
        phrase.save()

        # Now create the placeholder relation.
        template_phrase, created = TemplatePhrase.objects.get_or_create(phrase=phrase, template_take=take)
        template_phrase.save()

    # Create a new Remix for each source.
    for source_id in data['sources']:
        remix = Remix()
        remix.source = Take.objects.get(nft_id=source_id)
        remix.mix = take
        remix.save()

    return JsonResponse({}, status=status.HTTP_201_CREATED) 

@api_view(['GET'])
def latest_indexed_take(request):
    # Get the highest take id indexed.
    take = Take.objects.order_by('-nft_id').first()
    if take is None:
        return JsonResponse({"error":"NO_INDEXED_TAKES"}, status=status.HTTP_200_OK)
    return JsonResponse({"head":take.nft_id}, status=status.HTTP_200_OK)




import json
from siwe.siwe import SiweMessage
from django.contrib.auth import authenticate
from django.contrib.auth import login as auth_login
from django.contrib.auth import logout as auth_logout
from django.shortcuts import redirect
from django.conf import settings

@api_view(['POST'])
@csrf_exempt
def login(request):
    body = json.loads(request.body)

    auth_kwargs = {
        # Convert mesage to snake_case variables.
        "siwe_message": SiweMessage(
            message={
                'domain': body["message"]["domain"],
                'address': body["message"]["address"],
                'statement': body["message"]["statement"],
                'uri': body["message"]["uri"],
                'version': body["message"]["version"],
                'chain_id': body["message"]["chainId"],
                'nonce': body["message"]["nonce"],
                'issued_at': body["message"]["issuedAt"],
            }
        ),
        "signature": body["signature"]
    }
    
    user = authenticate(request, **auth_kwargs)
    if user is not None:
        if user.is_active:
            auth_login(request, user)
            return JsonResponse({"ok": True, "message": "Successful login."})
        else:
            return JsonResponse(
                {"ok": False, "message": "Wallet disabled."}, status=401
            )
    return JsonResponse({"ok": False, "message": "Invalid login."}, status=403)

@api_view(["POST"])
@csrf_exempt
def logout(request):
    auth_logout(request)
    return redirect(settings.LOGIN_URL)

@api_view(['GET'])
def session(request):
    if request.user.is_authenticated:
        serializer = DjangoUserSerializer(request.user)
        return Response(serializer.data)
    else:
        return Response(None)