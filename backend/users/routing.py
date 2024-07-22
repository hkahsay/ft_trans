from django.urls import re_path
# from channels.routing import ProtocolTypeRouter, URLRouter
# from django.urls import path
from users.consumers.Chat_Consumers import ChatConsumer

from users.consumers.Game_Consumer import GameConsumer
from users.consumers.Game_Consumer_solo import GameConsumerSolo


websocket_urlpatterns = [
    re_path("ws/users/chat/", ChatConsumer.as_asgi()),
   
    re_path("ws/users/games/online/(?P<oppName>\w+)/", GameConsumer.as_asgi()),
    re_path("ws/users/games/local/", GameConsumerSolo.as_asgi()),
]



