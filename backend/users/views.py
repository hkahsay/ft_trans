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
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.utils.decorators import method_decorator
from .models import Users, Games, Friendlist_Users, Blocklist_Users
from .serializer import UsersSerializer, GamesSerializer, PublicUsersGamesSettingsSerializer, UsersGamesSettingsSerializer 

from django.shortcuts import get_object_or_404
from dotenv import load_dotenv
import requests
import jwt
import os


load_dotenv()



def index(request):
    return render(request, "chat/index.html")

def room(request, room_name):
    return render(request, "users/chat/", {"room_name": room_name})

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

class PlayerDetailGamesSettingsT(APIView):

    # modified it to use middleware user instead of decoding the token
    def get(self, request, format=None):
        if not request.user:
            print('request.user', request.user)
            return JsonResponse({"error": "You are not connected"}, status=401)
        else:
            # serializer = UsersGamesSettingsSerializer(request.user)
            games = Games.objects.all()
            serializer = GamesSerializer(games, many=True)
            print('request.user2', request.user)
            print('serializer.data', serializer.data)

            return Response(serializer.data)

class PublicPlayerDetailGamesSettings(APIView):

    def get(self, request, requestedPlayer):
        if not request.user:
            return JsonResponse({"error": "You are not connected"}, status=401)
        
        print("requestedPlayer = ", requestedPlayer)
        try:
            user = Users.objects.get(username=requestedPlayer)
        except Users.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)

        serializer = PublicUsersGamesSettingsSerializer(user)
        return Response(serializer.data)
    def post(self, request):
        # Parse the incoming data
        selected_players = request.data.getlist('players')
        if not selected_players:
            return JsonResponse({"error": "No players selected"}, status=400)


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
    def post(self, request):
        if not request.user:
            return JsonResponse({"error:" "You are not connected"}, status=401)
        data = request.data
        user = request.user
        print("usersss", user);
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
        print('sserializer',serializer)
        return JsonResponse(serializer.data)







