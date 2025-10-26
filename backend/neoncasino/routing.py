from django.urls import re_path
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from games.routing import websocket_urlpatterns as games_websocket_urlpatterns
from transactions.routing import websocket_urlpatterns as transactions_websocket_urlpatterns

websocket_urlpatterns = games_websocket_urlpatterns + transactions_websocket_urlpatterns

application = ProtocolTypeRouter({
    'websocket': AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})

















