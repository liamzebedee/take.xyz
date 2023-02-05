from django.db import models

class Take(models.Model):
    nft_id = models.IntegerField(unique=True)
    text = models.TextField()
    creator = models.ForeignKey('User', on_delete=models.CASCADE, related_name='created_takes', null=False)
    # created_at = models.DateTimeField(auto_now_add=True)

    # A Take can have many remixes, and a remix can have many takes as sources.
    remixes = models.ManyToManyField('self', through='Remix', through_fields=('source', 'mix'), blank=True)
    # A take can have a few sources - ie. derived from a template.
    # make field optional/nullable
    sources = models.ManyToManyField('self', through='Remix', through_fields=('mix', 'source'), blank=True)

class Remix(models.Model):
    source = models.ForeignKey(Take, on_delete=models.CASCADE, related_name='remix_source')
    mix = models.ForeignKey(Take, on_delete=models.CASCADE, related_name='remix_mix')
    created_at = models.DateTimeField(auto_now_add=True)

class Like(models.Model):
    take = models.ForeignKey(Take, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

class User(models.Model):
    address = models.CharField(max_length=42, unique=True)
