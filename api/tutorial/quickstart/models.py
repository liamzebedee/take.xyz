from django.db import models
from django.contrib.auth.models import (
    BaseUserManager,
    AbstractBaseUser,
    PermissionsMixin,
)
from web3 import Web3
from django.core.exceptions import ValidationError

class Take(models.Model):
    nft_id = models.IntegerField(unique=True)
    text = models.TextField()
    creator = models.ForeignKey('User', on_delete=models.CASCADE, related_name='created_takes', null=False)
    created_at = models.DateTimeField()

    # A Take can have many remixes, and a remix can have many takes as sources.
    remixes = models.ManyToManyField('self', through='Remix', through_fields=('source', 'mix'), blank=True)
    # A take can have a few sources - ie. derived from a template.
    sources = models.ManyToManyField('self', through='Remix', through_fields=('mix', 'source'), blank=True)
    # A take can have multiple placeholder phrases - e.g. [xx]
    placeholders = models.ManyToManyField('Phrase', through='TemplatePhrase', through_fields=('template_take', 'phrase'), related_name="template_take", blank=True)
    # A take can fill in multiple placeholder phrases with substitutions - e.g. xx="apples"
    substitutions = models.ManyToManyField('Phrase', through='SubstitutionPhrase', through_fields=('substitution_take', 'phrase'), related_name="substitution_take", blank=True)

    # A take can quote multiple other takes.
    # quotes = models.ManyToOneRel('quotes', to='Take', related_name='quoted_takes', blank=True)
    # A take can have multiple likes.
    likes = models.ManyToOneRel('likes', to='User', related_name='liked_takes', field_name='take')
    

# 
# Relations.
# 
class Remix(models.Model):
    source = models.ForeignKey(Take, on_delete=models.CASCADE, related_name='remix_source')
    mix = models.ForeignKey(Take, on_delete=models.CASCADE, related_name='remix_mix')
    created_at = models.DateTimeField(auto_now_add=True)

class TemplatePhrase(models.Model):
    template_take = models.ForeignKey(Take, on_delete=models.CASCADE)
    phrase = models.ForeignKey('Phrase', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class SubstitutionPhrase(models.Model):
    substitution_take = models.ForeignKey(Take, on_delete=models.CASCADE)
    phrase = models.ForeignKey('Phrase', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class Phrase(models.Model):
    name = models.CharField(max_length=300, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    templates = models.ManyToManyField('Take', through='TemplatePhrase', through_fields=('phrase', 'template_take'), blank=True)
    # templates = models.ForeignKey(TemplatePhrase, on_delete=models.CASCADE, related_name='template_phrase_source')
    # substitution_takes = models.ForeignKey(Take, on_delete=models.CASCADE, related_name='take_substitutions')

class Like(models.Model):
    take = models.ForeignKey(Take, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

class User(models.Model):
    # Create an index on address
    address = models.CharField(max_length=42, unique=True, db_index=True)


class PinnedTake(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='pinned_takes')
    take = models.ForeignKey(Take, on_delete=models.CASCADE, related_name='pinned_takes')
    created_at = models.DateTimeField(auto_now_add=True)


# 
# User model.
# 

def validate_ethereum_address(value):
    if not Web3.isChecksumAddress(value):
        raise ValidationError

class DjangoUser(AbstractBaseUser, PermissionsMixin):
    # EIP-55 compliant: https://eips.ethereum.org/EIPS/eip-55
    ethereum_address = models.CharField(
        unique=True,
        primary_key=True,
        max_length=42,
        validators=[validate_ethereum_address],
    )
    # ens_name = models.CharField(max_length=255, blank=True, null=True)
    # ens_avatar = models.CharField(max_length=255, blank=True, null=True)
    created = models.DateTimeField("datetime created", auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)

    USERNAME_FIELD = "ethereum_address"

    def __str__(self):
        return self.ethereum_address

    @property
    def is_staff(self):
        "Is the user a member of staff?"
        # Simplest possible answer: All admins are staff
        return self.is_admin
