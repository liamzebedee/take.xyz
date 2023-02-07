from tutorial.quickstart.models import Take, Remix, User, Phrase, TemplatePhrase, Like

from rest_framework import serializers

class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['address', 'created_takes']
    
    # created_takes = TakeSerializer(many=True, read_only=True)

class UserSerializerLite(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['address']

class PhraseBasicSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Phrase
        fields = ['name']

class TakeSerializerDepth1(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Take
        fields = ['nft_id', 'text', 'creator']
    # creator = UserSerializerLite(read_only=True)


class TakeSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Take
        fields = ['nft_id', 'text', 'creator', 'remixes', 'sources', 'placeholders', 'substitutions', 'likes']
    
    creator = UserSerializerLite(read_only=True)
    remixes = TakeSerializerDepth1(many=True, read_only=True)
    sources = TakeSerializerDepth1(many=True, read_only=True)
    placeholders = PhraseBasicSerializer(many=True, read_only=True)
    substitutions = PhraseBasicSerializer(many=True, read_only=True)
    likes = UserSerializerLite(many=True, read_only=True)


class RemixSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Remix
        fields = ['source', 'mix']

class PhraseSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Phrase
        fields = ['name', 'templates']
    
    templates = TakeSerializerDepth1(many=True, read_only=True)

class TemplatePhraseSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = TemplatePhrase
        fields = ['phrase', 'template_take']

class LikeSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Like
        fields = ['user', 'take']
    
    user = UserSerializerLite(read_only=True)
    take = TakeSerializerDepth1(read_only=True)