import datetime
import logging
from typing import Optional

import pytz

from django.conf import settings
from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.models import User, Group
from web3 import Web3, HTTPProvider
from web3.middleware import geth_poa_middleware

from siwe.siwe import (
    SiweMessage,
    ValidationError,
    ExpiredMessage,
    MalformedSession,
    InvalidSignature,
)

from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
DjangoUser = get_user_model()
# from .models import DjangoUser

# def _nonce_is_valid(nonce: str) -> bool:
#     """
#     Check if given nonce exists and has not yet expired.
#     :param nonce: The nonce string to validate.
#     :return: True if valid else False.
#     """
#     n = Nonce.objects.get(value=nonce)
#     is_valid = False
#     if n is not None and n.expiration > datetime.datetime.now(tz=pytz.UTC):
#         is_valid = True
#     n.delete()
#     return is_valid


from django.contrib.auth.models import User
from rest_framework import authentication
from rest_framework import exceptions
import json

# Using the Sign In With Ethereum (SIWE) standard.
class EthereumTokenAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        siwe = request.META.get('SIWE')
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

        try:
            user = SignInWithEthereumAuthBackend.authenticate(request, **auth_kwargs)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('No such user')

        return (user, None)


# Based off: https://github.com/payton/django-siwe-auth
class SignInWithEthereumAuthBackend(BaseBackend):
    def authenticate(self, request, signature: str, siwe_message: SiweMessage):
        print(1)
        try:
            siwe_message.verify(signature)
        except ExpiredMessage:
            logging.info("Authentication attempt rejected due to expired message.")
            return None
        except MalformedSession as e:
            logging.info(
                f"Authentication attempt rejected due to missing fields: {', '.join(e.missing_fields)}"
            )
            return None
        except InvalidSignature:
            logging.info("Authentication attempt rejected due to invalid signature.")
            return None
        except ValidationError:
            logging.info("Authentication attempt rejected due to invalid message.")
            return None

        # Validate nonce
        # if not _nonce_is_valid(siwe_message.nonce):
        #     return None

        # Message and nonce has been validated. Authentication complete. Continue with authorization/other.
        now = datetime.datetime.now(tz=pytz.UTC)
        try:
            user = DjangoUser.objects.get(ethereum_address=siwe_message.address)
            user.last_login = now
            user.save()
            logging.debug(f"Found wallet for address {siwe_message.address}")
            return user
        except DjangoUser.DoesNotExist:
            user = DjangoUser(
                ethereum_address=Web3.toChecksumAddress(siwe_message.address),
                # ens_name=ens_profile.name,
                # ens_avatar=ens_profile.avatar,
                last_login=now,
                password=None,
            )
            user.set_unusable_password()
            user.save()
            logging.debug(
                f"Could not find user for address {siwe_message.address}. Creating new User object."
            )
            return user

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None