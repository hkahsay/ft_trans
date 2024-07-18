from typing import Set
from django.shortcuts import render
from django.http import JsonResponse
from django.http import HttpResponseRedirect
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Users, Games, Settings, Friendlist_Users, Blocklist_Users, Tournament, TournamentMatch, TournamentPlayer
from .serializer import UsersSerializer, GamesSerializer, PublicUsersGamesSettingsSerializer, TournamentGameSerializer, TournamentSerializer, TournamentMatchSerializer, UsersGamesSettingsSerializer 

from django.db.models import Max

from django.shortcuts import get_object_or_404
from dotenv import load_dotenv
import requests
import jwt
import os
import random
import logging
import json
from uuid import UUID
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)


load_dotenv()



def index(request):
    return render(request, "chat/index.html")

def room(request, room_name):
    return render(request, "users/chat/", {"room_name": room_name})



def fill_winners(games, tree):
    if isinstance(tree, dict) and 'id' in tree:
        return tree
    
    left = fill_winners(games, tree['left'])
    right = fill_winners(games, tree['right'])
    
    left_winner = left['winner'] if isinstance(left, dict) and 'winner' in left else left
    right_winner = right['winner'] if isinstance(right, dict) and 'winner' in right else right
    
    if left_winner and right_winner:
        game = games.filter(
            player1__id__in=[left_winner['id'], right_winner['id']],
            player2__id__in=[left_winner['id'], right_winner['id']]
        ).order_by('-round').first()
        
        if game:
            winner = left_winner if game.player1_score > game.player2_score else right_winner
            print(f"Game winner: {winner['username']}")  # Add this line for debugging
        else:
            winner = None
            print("No game found for these players")  # Add this line for debugging
    else:
        winner = None
        print("Not enough winners to determine next winner")  # Add this line for debugging
    
    return {
        'left': left,
        'right': right,
        'winner': winner
    }

def convert_uuid_to_str(obj):
    if isinstance(obj, UUID):
        return str(obj)
    elif isinstance(obj, dict):
        return {key: convert_uuid_to_str(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_uuid_to_str(item) for item in obj]
    return obj


def generate_tournament_tree(players):
    print(f"Generating tree for players: {players}")
    if len(players) == 1:
        return {
            'id': players[0].player.id,
            'username': players[0].player.username
        }
    else:
        # calculate middle index
        middle = (len(players) + 1) // 2
        return convert_uuid_to_str({
            'left': generate_tournament_tree(players[:middle]),
            'right': generate_tournament_tree(players[middle:]),
            'winner': None,
        })



def check_for_winner(tournament):
    if isinstance(tournament.tree, dict) and tournament.tree.get('winner'):
        winner_id = tournament.tree['winner']['id']
        tournament.winner = Users.objects.get(id=winner_id)
        tournament.is_active = False
        tournament.save()
        print(f"Winner set: {tournament.winner.username}")  # Add this line for debugging
    else:
        print("No winner found in the tournament tree")  # Add this line for debugging


def get_winner(games, player1_id, player2_id):
    for game in games:
        if (str(game.player1.id) == player1_id and str(game.player2.id) == player2_id) or \
           (str(game.player1.id) == player2_id and str(game.player2.id) == player1_id):
            if game.player1_score > game.player2_score:
                return {'id': str(game.player1.id), 'username': game.player1.username}
            elif game.player2_score > game.player1_score:
                return {'id': str(game.player2.id), 'username': game.player2.username}
    return None

    

def find_next_match(tree, played_games):
    if isinstance(tree, dict) and 'id' in tree:
        return []

    if tree['winner'] is None:
        left_winner = tree['left']['winner'] if isinstance(tree['left'], dict) and 'winner' in tree['left'] else tree['left']
        right_winner = tree['right']['winner'] if isinstance(tree['right'], dict) and 'winner' in tree['right'] else tree['right']

        if left_winner and right_winner:
            game_played = played_games.filter(
                player1__id__in=[left_winner['id'], right_winner['id']],
                player2__id__in=[left_winner['id'], right_winner['id']]
            ).exists()

            if not game_played:
                return [{
                    'player1': left_winner,
                    'player2': right_winner
                }]

    left_matches = find_next_match(tree['left'], played_games)
    right_matches = find_next_match(tree['right'], played_games)
    return left_matches + right_matches



def notify_next_match(tournament):
    games = Games.objects.filter(tournament=tournament)
    tree = fill_winners(games, generate_tournament_tree(list(tournament.tournament_players.all())))
    next_games = find_next_match(tree, games)
    channel_layer = get_channel_layer()
    
    for game in next_games:
        player1 = game['player1']
        player2 = game['player2']
        message = f"You are scheduled to play the next match in the {tournament.name} tournament against {player2['username']}."
        
        async_to_sync(channel_layer.group_send)(
            "tournament_notifications",
            {
                "type": "tournament.notification",
                "message": message,
                "player_ids": [player1['id'], player2['id']],
                "match_id": game.get('id'),  # You might need to adjust this depending on your data structure
            }
        )

class ListAllGames(APIView):

    def get(self, request):
        games = Games.objects.all()
        serializer = GamesSerializer(games, many=True)
        return Response(serializer.data)


class PlayerDetail(APIView):

    def get(self, request):
        if not request.user:
            return JsonResponse({"error": "You are not connected"}, status=401)
        else:
            serializer = UsersSerializer(request.user)
            return Response(serializer.data)
        
class PlayerDetailGamesSettings(APIView):
    def get(self, request, format=None):
        games = Games.objects.all()
        serializer = GamesSerializer(games, many=True)
        # print('gamelist', serializer.data)
        return Response({'gamelist': serializer.data})


class ListAllUsers(APIView):

    # modified to use middleware user instead of decoding the token
    def get(self, request):
        if not request.user:
            return JsonResponse({"error": "You are not connected"}, status=401)
        else:
            users = Users.objects.all()  # todo retrieve only connected users
            serializer = UsersSerializer(users, many=True)
            response = {"users": serializer.data}
            response["current_username"] = request.user.username
            return JsonResponse(response)

    def post(self, request):
        print(request.body.decode('utf-8'))

class RemoteCreation(APIView):
    def get(self, request):
        if not request.user:
            return JsonResponse({"error": "You are not authenticated"}, status=401)


class CreateTournament(APIView):
    def get(self, request):
        if not request.user:
            return JsonResponse({"error": "You are not authenticated"}, status=401)
        
        # players = Users.objects.all()  # todo: retrieve only connected users
        # serializer = UsersSerializer(players, many=True)
        latest_tournament = Tournament.objects.filter(creator=request.user).order_by('-created_at').first()
        tournament_data = TournamentSerializer(latest_tournament).data if latest_tournament else None
        
        # print("players===================", players)
        response = {
            # "players": serializer.data,
            # "creator": {
            #     "id": request.user.id,
            #     "username": request.user.username
            # },
            "tournament": tournament_data # to get the newly created Tournament
            
        }
        
        print("Response data:", response)
        return JsonResponse(response)

    def post(self, request):
        if not request.user:
            return JsonResponse({"error": "You are not authenticated"}, status=401)
        
        tournament_name = request.data.get('name')
        player_ids = request.data.get('players')
        print("player_ids ===================", player_ids)
                
        if not tournament_name or not player_ids:
            return Response({"error": "Name and Players are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            tournament = Tournament.objects.create(name=tournament_name, creator=request.user)

            for player_id in player_ids:
                player = get_object_or_404(Users, id=player_id)
                TournamentPlayer.objects.create(tournament=tournament, player=player)
            
            tournament.refresh_from_db()  # Refresh to include related objects
            serializer = TournamentSerializer(tournament)
            # notify_next_match()
            # notify_next_match(tournament)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            logger.error("Error creating tournament: %s", str(e), exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class ListTournaments(APIView):
    def get(self, request):
        if not request.user:
            return JsonResponse({"error": "You are not authenticated"}, status=401)
        
        tournaments = Tournament.objects.all()
        serializer = TournamentSerializer(tournaments, many=True)
        return Response(serializer.data)



class StartTournament(APIView):
    def post(self, request, pk):
        tournament = get_object_or_404(Tournament, pk=pk)
        games = Games.objects.filter(tournament=tournament)

        # Get all players in the tournament
        players = list(tournament.tournament_players.all())
        print("playersinstart", players)
        
        if len(players) == 0:
            print("No players in the tournament")
            return Response({"error": "No players in the tournament"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate the tournament tree
        initial_tree = generate_tournament_tree(players)
        updated_tree = fill_winners(games, initial_tree)
        tournament.is_active = True
        tournament.tree = updated_tree
        tournament.save()
    
        print(f"Starting tournament {pk}, is_active: {tournament.is_active}")

        print(f"Number of players: {tournament.tournament_players.count()}")
        next_games = find_next_match(tournament.tree, games)

        check_for_winner(tournament)


        return JsonResponse({
            'id': tournament.id,
            'name': tournament.name,
            'creator': tournament.creator.username,
            'is_active': tournament.is_active,
            'winner': tournament.winner.username if tournament.winner else None,
            'players': [{'id': tp.player.id, 'username': tp.player.username} for tp in tournament.tournament_players.all()],
            'games': [  {'id': game.id, 'player1': game.player1.username, 'player2': game.player2.username,
                 'player1_score': game.player1_score, 'player2_score': game.player2_score}
                for game in games],
            'tree': tournament.tree,
            'next_games': next_games
        })


class PlayGame(APIView):
    def post(self, request):
        if not request.user:
            return Response({"error": "You are not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

        tournament_id = request.data.get('tournament')
        if not tournament_id:
            return Response({"error": "Tournament ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        tournament = get_object_or_404(Tournament, id=tournament_id)

        if not tournament.is_active:
            return Response({"error": "Tournament is not active"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TournamentGameSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        player1 = get_object_or_404(Users, id=serializer.validated_data['player1'].id)
        player2 = get_object_or_404(Users, id=serializer.validated_data['player2'].id)

        current_round = Games.objects.filter(tournament=tournament).aggregate(Max('round'))['round__max'] or 0
        current_round += 1

        settings_data = serializer.validated_data.get('settings', {})
        settings = Settings.objects.create(**settings_data)

        game = Games.objects.create(
            tournament=tournament,
            player1=player1,
            player2=player2,
            player1_score=serializer.validated_data['player1_score'],
            player2_score=serializer.validated_data['player2_score'],
            settings=settings,
            round=current_round
        )
      
        print("serializer.validated_data['player1_score']", serializer.validated_data['player1_score'])
        print("serializer.validated_data['player2_score']", serializer.validated_data['player2_score'])
        games = Games.objects.filter(tournament=tournament)

        updated_tree = fill_winners(games, tournament.tree)
        tournament.tree = updated_tree
        tournament.save()

        # Check for winner
        notify_next_match(tournament)
        check_for_winner(tournament)
        return Response({ 
            "message": "Game played successfully",
            "game_id": game.id,
            "tree": tournament.tree,
            "winner": tournament.winner.username if tournament.winner else None,
            "is_active": tournament.is_active,
            "round": current_round,
        }, status=status.HTTP_201_CREATED)
  


class GetTournamentState(APIView):
    def get(self, request, pk):
        tournament = get_object_or_404(Tournament, pk=pk)
        games = Games.objects.filter(tournament=tournament)

        if not tournament.is_active:
            return Response({"error": "Tournament has not been started"}, status=status.HTTP_400_BAD_REQUEST)

        updated_tree = fill_winners(games, tournament.tree)
        next_games = find_next_match(updated_tree, games)

        return JsonResponse({
            'id': tournament.id,
            'name': tournament.name,
            'creator': tournament.creator.username,
            'is_active': tournament.is_active,
            'winner': tournament.winner.username if tournament.winner else None,
            'players': [{'id': tp.player.id, 'username': tp.player.username} for tp in tournament.tournament_players.all()],
            'games': [
                {'id': game.id, 'player1': game.player1.username, 'player2': game.player2.username,
                 'player1_score': game.player1_score, 'player2_score': game.player2_score}
                for game in games
            ],
            'tree': updated_tree,
            'next_games': next_games
        })



class FriendListView(APIView):
    def get(self, request):
        user = request.user
     
        # Fetch the friends where the user is either the sender or receiver and the status is accepted
        sent_requests = Friendlist_Users.objects.filter(sender=user)
        received_requests = Friendlist_Users.objects.filter(receiver=user)

        # Combine the lists of friends from both sent and received requests
        friends_list = [friend.receiver for friend in sent_requests] + [friend.sender for friend in received_requests]

        # Serialize the friends list
        serializer = UsersSerializer(friends_list, many=True)
        return Response(serializer.data)

@method_decorator(csrf_exempt, name='dispatch')        
class AddFriendView(APIView):
    def post(self, request):
        sender = request.user
        data = request.data
        receiver_username = data.get('username')

        if not receiver_username:
            return JsonResponse({"error": "Receiver username is required"}, status=400)

        try:
            receiver = Users.objects.get(username=receiver_username)
        except Users.DoesNotExist:
            return JsonResponse({"error": "Receiver user does not exist"}, status=404)

        # Check if a friend request already exists
        if Friendlist_Users.objects.filter(sender=sender, receiver=receiver).exists():
            return JsonResponse({"error": "Friend request already sent"}, status=400)

        # Create and save a new friend request
        friend_request = Friendlist_Users(sender=sender, receiver=receiver)
        friend_request.save()

        return JsonResponse({"success": "Friend request sent successfully"}, status=201)



class BlockUserView(APIView):
    def post(self, request, username):
        try:
            blocked_user = Users.objects.get(username=username)
        except Users.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        blocker = request.user
        if Blocklist_Users.objects.filter(blocker=blocker, blocked=blocked_user).exists():
            return Response({'error': 'User already blocked'}, status=status.HTTP_400_BAD_REQUEST)

        Blocklist_Users.objects.create(blocker=blocker, blocked=blocked_user)
        return Response({'success': 'User blocked successfully'}, status=status.HTTP_201_CREATED)

class BlockedUsersListView(APIView):
    def get(self, request):
        blocker = request.user
        blocked_users = Blocklist_Users.objects.filter(blocker=blocker).values_list('blocked__username', flat=True)
        return Response({'blocked_users': list(blocked_users)})


# # profile update endpoint
class UpdateUserInfo(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        if not request.user:
            return JsonResponse({"error:" "You are not connected"}, status=401)
        data = request.data
        user = request.user
        #update username
        if 'username' in data and data['username']:
            user.username = data['username']

               # Update profile picture
        if 'picture' in data and data['picture']:
            user.picture = data['picture']
        
        # Update password
        if 'password' in data and data['password']:
            user.password = make_password(data['password'])


        user.save()
        serializer = UsersSerializer(user)
        return JsonResponse(serializer.data)
