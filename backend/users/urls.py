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
    UpdateUserInfo,
    CreateTournament,
    StartTournament,
    ListTournaments,
    RemoteCreation,
    PlayGame,
    FetchTournamentDetails,
    

    
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
    path('tournaments/creation/', CreateTournament.as_view(), name='create_tournament'),
    path('remote/creation/', RemoteCreation.as_view(), name='remote_creation'),
    path('tournaments/', ListTournaments.as_view(), name='list-tournaments'),
    path('tournaments/<int:pk>/', FetchTournamentDetails.as_view(), name='tournament-detail'),
    path('tournaments/<int:pk>/start/', StartTournament.as_view(), name='start_tournament'),
    path('tournaments/play/', PlayGame.as_view(), name='play_game'),
    path('getAllUsers/', ListAllUsers.as_view(), name='select-players-tournament'),
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
    # other paths...

]



