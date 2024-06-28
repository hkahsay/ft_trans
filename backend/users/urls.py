# from django.conf.urls import url
from django.urls import path, include
from . import consumers
from . import views

    
from .auth.views import (
    AuthFormLogin,
    AuthIntraRequest,
    AuthIntraCallback,
    AuthFormSignup,
    AuthLogout,
)
from users import routing

from .me.views import (
    GetStatus,
    GetData,
)

from .views import (
    PlayerDetail,
    PlayerDetailGamesSettings,
    ListAllUsers,
    FriendListView,
    AddFriendView,
    BlockUserView,
    BlockedUsersListView,
    PublicPlayerDetailGamesSettings,
    UpdateUserInfo
)

urlpatterns = [
    path('auth/authorize/', AuthIntraRequest.as_view(), name='auth_authorize'),
    path('auth/callback/', AuthIntraCallback.as_view(), name='auth_callback'),
    path('auth/login/', AuthFormLogin.as_view(), name='auth_login'),
    path('auth/signup/', AuthFormSignup.as_view(), name='auth_signup'),
    path('auth/logout/', AuthLogout.as_view(), name='auth_logout'),
    path("", views.index, name="index"),
    path("chat/<str:room_name>/", views.room, name="room"),
    path('players/info/', PlayerDetailGamesSettings.as_view(), name="single-player-games"),
    path('players/info/<str:requestedPlayer>', PublicPlayerDetailGamesSettings.as_view(), name="public_player_info"),
    path('tournaments/creation/', ListAllUsers.as_view(), name='select-players-tournament'),
    path('me/status/', GetStatus.as_view(), name='auth_status'),
    path('me/data/', GetData.as_view(), name='auth_user'),
    path('profile/<str:username>', GetData.as_view(), name='user_profile'),
    # path('profile/<str:username>', GetGameStats.as_view(), name='user_profile'),
    path('friendlist/', FriendListView.as_view(), name='friend-list'),
    path('addfriend/', AddFriendView.as_view(), name='add-friend'),
    path('block/<str:username>/', BlockUserView.as_view(), name='block-user'),
    path('blocked/', BlockedUsersListView.as_view(), name='blocked-user'),
    path('update/', UpdateUserInfo.as_view(), name='update-user-info'),
    # path('users/update/', UpdateUserInfo.as_view(), name='update-user-info'),


]



