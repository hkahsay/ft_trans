import json
import jwt
import base64
from django.conf import settings
from .models import Users
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class ChatConsumer(AsyncWebsocketConsumer):
    connected_users = {}
    async def connect(self):
        try:
            user = self.scope["user"]
            self.user_id = str(user.id)
            self.connected_users[str(self.user_id)] = self
            # Notify friends of the user that they are online
            await self.notify_friends_status_change(self.user_id, True)
            await self.accept()
                
        except :
            print('Error: User not found')
            await self.close()

    async def disconnect(self, close_code):
        if self.user_id in self.connected_users:
            del self.connected_users[self.user_id]
            # Notify friends of the user that they are offline
            await self.notify_friends_status_change(self.user_id, False)
        await self.close()

    @database_sync_to_async
    def get_user_friends(self, user_id):
        """
        Asynchronously retrieves friends of the user.
        """
        user = Users.objects.get(id=user_id)
        return list(user.friendlist.all())

    async def notify_friends_status_change(self, user_id, is_online):
        friends = await self.get_user_friends(user_id)
        for friend in friends:
            friend_id = friend.id
            if friend_id in self.connected_users:
                friend_connection = self.connected_users[friend_id]
                await friend_connection.send(json.dumps({
                    "action": "status_change",
                    "data": {
                        'user_id': user_id,
                        'is_online': is_online
                    }
                }))

    @database_sync_to_async
    def get_user(self, username):
        """
        Asynchronously retrieves a user by username.
        """
        try:
            return Users.objects.get(username=username)
        except Users.DoesNotExist:
            return None

    @database_sync_to_async
    def get_user_by_id(self, user_id):
        """
        Asynchronously retrieves a user by ID.
        """
        try:
            print(Users.objects.get(id=user_id))
            return Users.objects.get(id=user_id)
        except Users.DoesNotExist:
            return None

    async def receive(self, text_data):
        print(f"Raw text data received: {text_data}")
        try:
            text_data_json = json.loads(text_data)
            action = text_data_json.get('action')
           
            if action == 'message':
                await self.handle_message(text_data_json)
            elif action == 'status_query':
                await self.handle_status_query(text_data_json)
            else:
                print(f"Unhandled action: {action}")
        except json.JSONDecodeError as e:
            print(f"Failed to decode JSON: {e}")
        except Exception as e:
            print(f"Unexpected error: {e}")

    async def handle_message(self, text_data_json):
        message = text_data_json['message']
        sender_id = text_data_json['sender']
        receiver_id = text_data_json['receiver']

        if str(receiver_id) in self.connected_users:
            receiver_connection = self.connected_users[str(receiver_id)]
            await receiver_connection.send(json.dumps({
                "action": "message",
                "data": {
                    'sender': sender_id,
                    'message': message,
                    'receiver': receiver_id
                }
            }))
        else:
            print(f'User with id {receiver_id} is not connected.')

        if str(sender_id) in self.connected_users:
            sender_connection = self.connected_users[str(sender_id)]
            await sender_connection.send(json.dumps({
                "action": "message",
                "data": {
                    'sender': sender_id,
                    'message': message,
                    'receiver': receiver_id
                }
            }))
        else:
            print(f'User with id {sender_id} is not connected.')


    async def handle_status_query(self, text_data_json):
        requester_id = text_data_json['requester']
        friend_ids = text_data_json['friend_ids']

        statuses = {}
        for friend_id in friend_ids:
            statuses[friend_id] = friend_id in self.connected_users

        if str(requester_id) in self.connected_users:
            requester_connection = self.connected_users[str(requester_id)]
            await requester_connection.send(json.dumps({
                "action": "status_query_response",
                "data": {
                    'requester': requester_id,
                    'statuses': statuses
                }
            }))