from typing import Any
import jwt

from django.urls import resolve
from django.http import JsonResponse
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from asgiref.sync import sync_to_async

from .models import Users

class WebSocketAuthenticationMiddleware:
    def __init__(self, app) -> None:
        self.app = app
    
    @sync_to_async
    def get_user_by_id(self, user_id):
        return Users.objects.get(id=user_id)

    async def __call__(self, scope, receive, send) -> Any:
        if scope["type"] == "websocket":

            cookies = {}
            for name, value in scope['headers']:
                if name.lower() == b'cookie':
                    for cookie in value.decode('utf-8').split(';'):
                        key, val = cookie.strip().split('=', 1)
                        cookies[key] = val

            access_token = cookies.get('access_token')
            secret = settings.JWT_SECRET_KEY

            if access_token is None:
                await send({
                    "type": "websocket.close",
                    "code": 401,
                })
                return
            
            try:
                payload = jwt.decode(access_token, secret, algorithms=["HS256"])
                user_id = payload['user_id']
                user = await self.get_user_by_id(user_id)
                scope["user"] = user
                #make user part of the scope of consumer
            except jwt.ExpiredSignatureError:
                pass
            except jwt.InvalidTokenError:
                pass

        await self.app(scope, receive, send)

        