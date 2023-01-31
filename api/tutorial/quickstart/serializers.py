from tutorial.quickstart.models import Take, Remix, User

from rest_framework import serializers

class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['address', 'created_takes']
    
    # created_takes = TakeSerializer(many=True, read_only=True)

class TakeSerializerDepth1(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Take
        fields = ['nft_id', 'text', 'creator']
    
    creator = UserSerializer(read_only=True)

class TakeSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Take
        fields = ['nft_id', 'text', 'creator', 'remixes', 'sources']
    
    creator = UserSerializer(read_only=True)
    remixes = TakeSerializerDepth1(many=True, read_only=True)
    sources = TakeSerializerDepth1(many=True, read_only=True)

class RemixSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Remix
        fields = ['source', 'mix']

