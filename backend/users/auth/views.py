from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import authenticate
from django.http import HttpResponseRedirect

from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView

from ..serializer import UsersSerializer

import os
import jwt
import requests

from ..models import Users 


class AuthFormLogin(APIView):
    def post(self, request):
        access_token = request.COOKIES.get('access_token')
        if access_token:
            return JsonResponse({"error": "You are already logged in"}, status=400)
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return JsonResponse({"error": "Login information not provided"}, status=400)

        # django built in authentication that handles password hashing
        user = authenticate(username=username, password=password)
        if user is not None:
            refresh = RefreshToken.for_user(user)
            serializer = UsersSerializer(user)
            response = JsonResponse(serializer.data, status=200)
            response.set_cookie(key="access_token", value=refresh.access_token, httponly=True, secure=True)
            response.set_cookie(key="refresh_token", value=refresh, httponly=True, secure=True)
            response.set_cookie(key="logged", value="1", samesite='None', secure=True)
            return response
        else:
            # If authentication fails
            return JsonResponse({"error": "Invalid credentials"}, status=401)

    def get_tokens_for_user(self, user : Users) -> set[str]:
        refresh = RefreshToken.for_user(user)
        return {
            str(refresh),
            str(refresh.access_token),
        }
    
class AuthFormSignup(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        picture = request.FILES.get('picture')

        if not username or not password:
            return JsonResponse({"error": "signup information not provided"}, status=400)

        if Users.objects.filter(username=username).exists():
            return JsonResponse({"error": "User already exists"}, status=409)

        user = Users.objects.create_user(username=username, password=password)
        if picture:
            user.picture = picture
            user.save()

        return JsonResponse({"message": "User created successfully"}, status=201)
    

class AuthIntraRequest(APIView):
    def get(self, request):
        access_token = request.COOKIES.get('access_token')
        if access_token:
            return HttpResponseRedirect('/')
        client_id = os.getenv('AUTH_CLIENT_ID')
        redirect_uri = os.getenv('REDIRECT_AUTH_URL')
        response_type = 'code'

        authorization_url = f"https://api.intra.42.fr/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type={response_type}"

        return HttpResponseRedirect(authorization_url)


class AuthIntraCallback(APIView):
    def get(self, request):
        code = request.GET.get('code')
        if not code:
            return JsonResponse({"error": "Authorization code not provided"}, status=400)
        intra_token = self.get_token_from_intra(code)
        if not intra_token:
            return JsonResponse({"error": "Could not get token from intra"}, status=400)
        user_data = self.get_data_from_intra(intra_token)
        if not user_data:
            return JsonResponse({"error": "Could not get user data from intra"}, status=400)

        id42 = user_data.get('id')
        user = Users.objects.filter(id42=id42).first()
        username = user_data['login']

        if user is None:
            user = Users.objects.filter(username=user_data['login']).first()
            if user is not None:
                index = 1
                user = Users.objects.filter(username=user_data['login'] + str(index)).first()
                while (user is not None):
                    user = Users.objects.filter(username=user_data['login'] + str(index)).first()
                    index += 1
                username = user_data['login'] + str(index)
            user_object, user_state = Users.objects.get_or_create(
                username=username,
                email=user_data.get('email'),
                picture=user_data.get('image', {}).get('link', '')
            )
            user_object.id42 = id42
            user_object.save()
            user = user_object

        refresh_token, access_token = self.get_tokens_for_user(user)

        response = JsonResponse({"message": "ok"})
        response.set_cookie(key="access_token", value=access_token, httponly=True)
        response.set_cookie(key="refresh_token", value=refresh_token, httponly=True)
        response.set_cookie(key="logged", value="1")
        return response

    def get_data_from_intra(self, token: str) -> dict:
        headers = {
            'Authorization': f'Bearer {token}'
        }
        response = requests.get('https://api.intra.42.fr/v2/me', headers=headers)
        return response.json()

    def get_token_from_intra(self, code: str) -> str:
        data = {
            'grant_type': 'authorization_code',
            'client_id': os.getenv('AUTH_CLIENT_ID'),
            'client_secret': os.getenv('AUTH_CLIENT_SECRET'),
            'code': code,
            'redirect_uri': os.getenv('REDIRECT_AUTH_URL')
        }
        print(data)
        response = requests.post('https://api.intra.42.fr/oauth/token', data=data)
        print("RESPONSE oauth/token")
        print(response.status_code)
        print(response.json())
        try:
            auth_token = response.json()['access_token']
        except KeyError:
            print("Error: intra 42 'access_token' not found in the response.")
            auth_token = None
        return auth_token

    def get_tokens_for_user(self, user : Users) -> set[str]:
        refresh = RefreshToken.for_user(user)
        return {
            str(refresh),
            str(refresh.access_token),
        }


class AuthLogout(APIView):
    def get(self, request):
        # Check if the 'access_token' cookie is present
        if 'access_token' in request.COOKIES:
            response = JsonResponse({"message": "You have been successfully logged out."})
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')
            response.delete_cookie("logged")

            return response
        else:
            return JsonResponse({"error": "You are not logged in."}, status=400)
