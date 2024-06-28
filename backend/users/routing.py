from django.urls import re_path

from .consumers import ChatConsumer

websocket_urlpatterns = [
    re_path("ws/users/chat/", ChatConsumer.as_asgi()),

]

