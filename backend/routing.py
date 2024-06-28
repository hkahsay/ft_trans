from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from users.consumers import ChatConsumer
from users.consumers import statusConsumer


application = ProtocolTypeRouter({
    'websocket': URLRouter([
        path('ws/users/chat/', ChatConsumer.as_asgi()),
        path('ws/users/status/', statusConsumer.as_asgi()),

    ])
})
 