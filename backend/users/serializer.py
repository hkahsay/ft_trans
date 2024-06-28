from rest_framework import serializers

from .models import Users, Games, Friendlist_Users, Settings



class UsersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = ["id", "username", "first_name", "last_name", "date_joined", "tfa_enabled", "picture", "id42"]

class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settings
        fields = ['background_color', 'paddle_size', 'paddle_speed', 'paddle_color', 'ball_speed']

class GamesSerializer(serializers.ModelSerializer):
    player1 = UsersSerializer()
    player2 = UsersSerializer()
    settings = SettingsSerializer() 
    class Meta:
        model = Games
        fields = ['id', 'start_time', 'end_time', 'player1', 'player1_score', 'player2', 'player2_score', 'settings']
        # fields = ["start_time", "end_time", "settings", "id"]
  

class UsersGamesSettingsSerializer(serializers.ModelSerializer):
    # similar to the depth option below
    # https://www.django-rest-framework.org/api-guide/relations/#primarykeyrelatedfield
    #gamelist = GamesSerializer(many=True, read_only=True)
   
    class Meta:
        model = Users
        fields = ["id", "username", "first_name", "last_name", "date_joined", "tfa_enabled", "picture", "gamelist"]
        depth = 2

class PublicUsersGamesSettingsSerializer(serializers.ModelSerializer):
   
    class Meta:
        model = Users
        fields = ["id", "username", "first_name", "date_joined", "picture", "gamelist"]
        depth = 2

class FriendlistUsersSerializer(serializers.ModelSerializer):
    sender = UsersSerializer()
    receiver = UsersSerializer()
    
    class Meta:
        model = Friendlist_Users
        fields = ["id", "status", "date_created", "date_modified", "receiver"]



