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


class Tournament(models.Model):
    name = models.CharField(max_length=100, default='Unnamed Tournament')
    creator = models.ForeignKey(Users, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    winner = models.ForeignKey(Users, on_delete=models.SET_NULL, null=True, blank=True, related_name='tournaments_won')
    tree = models.JSONField(null=True, blank=True)


    def __str__(self):
        return f"Tournament {self.name} created by {self.creator.username}"



class Games(models.Model):
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(auto_now=True)
    player1 = models.ForeignKey(Users, on_delete=models.CASCADE, null=True, related_name='toto')
    player1_score = models.IntegerField(default=0)
    player2 = models.ForeignKey(Users, on_delete=models.CASCADE, null=True, related_name='tata')
    player2_score = models.IntegerField(default=0)
    settings = models.OneToOneField('Settings', on_delete=models.CASCADE, null=True)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, null=True, blank=True)
    round = models.IntegerField(default=1)

    

    # round = models.IntegerField(default=1) #tournament rounds
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
    

