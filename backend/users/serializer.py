from rest_framework import serializers

from .models import Users, Games, Friendlist_Users, Settings, Tournament, TournamentPlayer, TournamentMatch



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
        fields = ['id', 'start_time', 'end_time', 'player1', 'player1_score', 'player2', 'player2_score', 'settings', 'round']
        # fields = ["start_time", "end_time", "settings", "id"]
            # for later use when real live game is created
        def create(self, validated_data):
            settings_data = validated_data.pop('settings')
            settings = Settings.objects.create(**settings_data)
            game = Games.objects.create(settings=settings, **validated_data)
            return game


class TournamentGameSerializer(serializers.Serializer):
    player1 = serializers.PrimaryKeyRelatedField(queryset=Users.objects.all())
    player2 = serializers.PrimaryKeyRelatedField(queryset=Users.objects.all())
    player1_score = serializers.IntegerField()
    player2_score = serializers.IntegerField()
    settings = SettingsSerializer()


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




class TournamentPlayerSerializer(serializers.ModelSerializer):

    player_username = serializers.CharField(source='player.username', read_only=True)

    class Meta:
        model = TournamentPlayer
        fields = ['id', 'tournament', 'player', 'player_username', 'eliminated']


class TournamentSerializer(serializers.ModelSerializer):
    creator = UsersSerializer()
    players = TournamentPlayerSerializer(source='tournament_players', many=True, read_only=True)
    winner = UsersSerializer()

    class Meta:
        model = Tournament
        fields = ['id', 'name', 'creator', 'players', 'created_at', 'is_active', 'winner', 'tree']

class TournamentMatchSerializer(serializers.ModelSerializer):
    player1_username = serializers.SerializerMethodField()
    player2_username = serializers.SerializerMethodField()

    class Meta:
        model = TournamentMatch
        fields = ['id', 'tournament', 'player1', 'player2', 'player1_username', 'player2_username', 'winner', 'round']

    def get_player1_username(self, obj):
        return obj.player1.username if obj.player1 else None

    def get_player2_username(self, obj):
        return obj.player2.username if obj.player2 else None