import uuid
from uuid import UUID
from django.db import models 
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres.fields import ArrayField 
from django.utils import timezone
import random
from django.db.models import Q
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .utils import generate_tournament_tree, fill_winners, get_game_between
# https://docs.djangoproject.com/en/5.0/topics/db/models/
# https://docs.djangoproject.com/en/5.0/topics/auth/customizing/


class Users(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    id42 = models.IntegerField(default=0)
    tfa_token = models.CharField(max_length=100, default="ouistiti")
    tfa_enabled = models.BooleanField(default=False)
    picture = models.ImageField(null=True, blank=True, upload_to='images/', default='images/default.jpg')
    chatlist = models.ManyToManyField("Chatroom") #django manages through tables automatically
    blocklist = models.ManyToManyField("self", through="Blocklist_Users", symmetrical=False, related_name='blockers')
    friendlist = models.ManyToManyField("self", through="Friendlist_Users") #self ManyToMany relationship is symmetrical by default
    gamelist = models.ManyToManyField("Games")
    socket_id = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.username}:{str(self.id):.5}"


class Chatroom(models.Model):
    room_name = models.CharField(max_length=30)
    date_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.room_name:.10}"

class Message(models.Model):
    chat_id = models.ForeignKey(Chatroom, on_delete=models.CASCADE)
    sender_id = models.ForeignKey(Users, on_delete=models.SET("DELETED"))
    sender = models.CharField(max_length=100, default=None)
    msg_body = models.TextField( null=True, blank=True)
    thread_name = models.CharField(null=True, blank=True, max_length=50)
    date_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # return f"{self.sender_id:.6} : {self.msg_body:.10}"
        return self.msg_body
        

class Blocklist_Users(models.Model):
    blocker = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='blockerTT') #TT for trough table, used to access this dependancy table
    blocked = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='blockedTT')
    date_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.blockedBg} blocked by {self.boug}"

# https://docs.djangoproject.com/en/5.0/ref/models/fields/#choices
# https://stackoverflow.com/questions/18676156/how-to-properly-use-the-choices-field-option-in-django
class Friendlist_Users(models.Model):
    sender = models.ForeignKey(Users, on_delete=models.CASCADE, related_name="senderTT")
    receiver = models.ForeignKey(Users, on_delete=models.CASCADE, related_name="receiverTT")
    date_created = models.DateTimeField(auto_now_add=True)
    date_modified = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['sender', 'receiver'], name='unique_friendship')]

class Games(models.Model):
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(auto_now=True)
    player1 = models.ForeignKey(Users, on_delete=models.CASCADE, null=True, related_name='toto')
    player1_score = models.IntegerField(default=0)
    player2 = models.ForeignKey(Users, on_delete=models.CASCADE, null=True, related_name='tata')
    player2_score = models.IntegerField(default=0)
    settings = models.OneToOneField('Settings', on_delete=models.CASCADE, null=True)
     # winner = models.ForeignKey(Users, on_delete=models.SET_NULL, null=True, blank=True, related_name='Tournament_matches_won')
    round = models.IntegerField(default=1) #tournament rounds
    # tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)

    def get_winner(self):
        if self.player1_score > self.player2_score:
            print("self.player1",self.player1)
            return self.player1
        elif self.player2_score > self.player1_score:
            print("self.player2",self.player2)
            return self.player2
        else:
            return None
    

class Settings(models.Model):
    background_color = models.CharField(max_length=30)
    paddle_size = models.IntegerField(default=100)
    paddle_speed = models.IntegerField(default=100)
    paddle_color = models.CharField(max_length=30)
    ball_speed = models.IntegerField(default=100)

class UserGames(models.Model):
    user = models.ForeignKey(Users, on_delete=models.CASCADE)
    game = models.ForeignKey(Games, on_delete=models.CASCADE)
    score = models.IntegerField(default=0)

# to converts UUID objects to strings when JSON encoding.
class UUIDEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, UUID):
            return str(obj)
        return json.JSONEncoder.default(self, obj)
    
class Tournament(models.Model):
    name = models.CharField(max_length=100, default='Unnamed Tournament')
    creator = models.ForeignKey(Users, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    currentGame = models.ForeignKey(Games, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    winner = models.ForeignKey(Users, on_delete=models.SET_NULL, null=True, blank=True, related_name='tournaments_won')
    tournament_tree = models.JSONField(null=True, blank=True)


    def __str__(self):
        return f"Tournament {self.name} created by {self.creator.username}"

    def initialize_tournament(self):
        print(f"Initializing tournament {self.id}")
        remaining_players = self.tournament_players.filter(eliminated=False)
        if remaining_players.count() <= 1:
                self.end_tournament()
                return None
        players = list(remaining_players.values_list('player__id', flat=True))
        
        print(f"Initializing tournament with players: {players}")
        tournament_tree = generate_tournament_tree(players)
        self.save_tournament_tree(tournament_tree)
        print(f"Generated tournament tree: {tournament_tree}")

        self.is_active = True
        self.save()
        print(f"Tournament {self.id} initialized and saved")



    def save_tournament_tree(self, tree):
        self.tournament_tree = json.dumps(tree, cls=UUIDEncoder)
        self.save()

  
    def get_current_tournament_tree(self):
        if self.tournament_tree:
            return json.loads(self.tournament_tree)
        return None

    def update_game_result(self, game_id, player1_score, player2_score):
        game = Games.objects.get(id=game_id)
        game.player1_score = player1_score
        game.player2_score = player2_score
        game.save()

        # Update the tournament tree
        self.update_tournament_tree(game)
        print("game data after updated", game)


    def update_tournament_tree(self, game):
        tree = self.get_current_tournament_tree()
        winner = game.get_winner()
        print("winner", winner)
        if winner:
            loser = game.player2 if winner == game.player1 else game.player1

            # eliminate the loser
            TournamentPlayer.objects.filter(tournament=self, player=loser).update(eliminated=True)

            updated_tree = self.eliminate_loser(tree, str(game.player1.id), str(game.player2.id), str(winner.id))
            self.save_tournament_tree(updated_tree)

            # Check if the tournament is complete
            if isinstance(updated_tree, str):
                self.winner = Users.objects.get(id=updated_tree)
                self.is_active = False
                self.save()
        else:
            print("Game ended in a tie or has no winner")


    def eliminate_loser(self, tree, player1_id, player2_id, winner_id):
        if isinstance(tree, str):
            return tree
        if (tree['left'] == player1_id and tree['right'] == player2_id) or \
        (tree['left'] == player2_id and tree['right'] == player1_id):
            return winner_id
        tree['left'] = self.eliminate_loser(tree['left'], player1_id, player2_id, winner_id)
        tree['right'] = self.eliminate_loser(tree['right'], player1_id, player2_id, winner_id)
        return tree
    
    def is_tournament_complete(self):
        # Check if there's a winner at the root of the tournament tree
        tournament_tree = self.get_current_tournament_tree()
        return tournament_tree.get('winner') is not None
    

    def start_next_game(self, depth=0, max_depth=100):
        if depth > max_depth:
            print("Maximum recursion depth exceeded")
            return None

        if not self.is_active:
            print("Tournament is not active")
            return None

        tournament_tree = self.get_current_tournament_tree()
        if not tournament_tree:
            print("Tournament tree is empty")
            return None

        next_match = self.find_next_match(tournament_tree)
        print("next_match", next_match)
        if next_match:
            player1 = Users.objects.get(id=next_match['left'])
            player2 = Users.objects.get(id=next_match['right'])

            # Check if both players are still in the tournament
            active_players = TournamentPlayer.objects.filter(tournament=self, player__in=[player1, player2], eliminated=False)
            if active_players.count() != 2:
                print("One or both players have been eliminated")
                # Update the tournament tree to reflect the elimination
                winner = active_players.first().player if active_players.count() == 1 else None
                self.update_tournament_tree_after_elimination(next_match, winner)
                
                return self.start_next_game(depth + 1, max_depth)  # Recursively try to find the next valid game

            game = Games.objects.create(
                player1=player1,
                player2=player2,
                round=self.current_round()
            )

            self.current_game = game
            self.save()
            notify_next_match()
            return game
        else:
            print("No next match found")
            self.end_tournament()
            return None

    def update_tournament_tree_after_elimination(self, match, winner):
        tree = self.get_current_tournament_tree()
        updated_tree = self.eliminate_players_from_tree(tree, match['left'], match['right'], winner.id if winner else None)
        self.save_tournament_tree(updated_tree)

    def eliminate_players_from_tree(self, tree, player1_id, player2_id, winner_id):
        if isinstance(tree, str):
            return tree
        if (tree['left'] == player1_id and tree['right'] == player2_id) or \
           (tree['left'] == player2_id and tree['right'] == player1_id):
            return winner_id if winner_id else None
        tree['left'] = self.eliminate_players_from_tree(tree['left'], player1_id, player2_id, winner_id)
        tree['right'] = self.eliminate_players_from_tree(tree['right'], player1_id, player2_id, winner_id)
        return tree

    def end_tournament(self):
        self.is_active = False
        remaining_players = self.tournament_players.filter(eliminated=False)
        if remaining_players.count() == 1:
            self.winner = remaining_players.first().player
        self.save()


    def find_next_match(self, tree):
        print("Searching for next match in:", tree)
        if isinstance(tree, str):
            print("Reached a leaf node (player):", tree)
            return None
        if not tree.get('winner'):
            left = tree['left']
            right = tree['right']
            if isinstance(left, str) and isinstance(right, str):
                print("Potential match found. Left:", left, "Right:", right)
                return {
                    'left': left,
                    'right': right,
                }
        left_match = self.find_next_match(tree['left'])
        if left_match:
            return left_match
        right_match = self.find_next_match(tree['right'])
        return right_match
    
    def current_round(self):
        tree = self.get_current_tournament_tree()
        return self.calculate_depth(tree)
    
    # depth of tournament
    def calculate_depth(self, tree):
        if isinstance(tree, str):
            return 0
        return 1 + max(self.calculate_depth(tree['left']), self.calculate_depth(tree['right']))


    def notify_next_match(self, player1, player2, match):
        channel_layer = get_channel_layer()
        message = f"You are scheduled to play the next match in the {self.name} tournament against {player2.username}."
        async_to_sync(channel_layer.group_send)(
            "tournament_notifications",
            {
                "type": "tournament.notification",
                "message": message,
                "player_ids": [player1.id, player2.id],
                "match_id": match.id,
            }
        )

class TournamentPlayer(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='tournament_players')
    player = models.ForeignKey(Users, on_delete=models.CASCADE)
    eliminated = models.BooleanField(default=False)

# prevent duplicate entries of the same player in the same tournament.
    class Meta:
        unique_together = ('tournament', 'player') 

    def __str__(self):
        return f"{self.player.username} in {self.tournament.name}"
    
class TournamentMatch(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='tournament_matches')
    game = models.OneToOneField('Games', on_delete=models.CASCADE)
    player1 = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='tournament_matches_as_player1')
    player2 = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='tournament_matches_as_player2')
    winner = models.ForeignKey(Users, on_delete=models.SET_NULL, null=True, blank=True, related_name='Tournament_matches_won')
    round = models.IntegerField() #tournament rounds
    # played_at = models.DateTimeField(default=timezone.now, auto_now_add=True)

    def __sts__(self):
        return f"Match{self.player1.username} vs {self.player2.username} in {self.tournament.name}"
    

