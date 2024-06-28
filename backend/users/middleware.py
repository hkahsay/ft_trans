import jwt
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Users


class JWTAuthenticationMiddleware(MiddlewareMixin):
    def process_request(self, request):
        excluded_paths = [
            '/users/auth/authorize/',
            '/users/auth/callback/',
            '/users/auth/login/',
            '/users/auth/signup/',
            '/users/auth/logout/',
            '/admin/',
            '/media/',
            '/server-info',
        ]
        

        if any(request.path.startswith(excluded_path) for excluded_path in excluded_paths):
            return None


        access_token = request.COOKIES.get('access_token')
        refresh_token = request.COOKIES.get('refresh_token')
        secret = settings.JWT_SECRET_KEY

        if access_token is None:
            return JsonResponse({"error": "Unauthorized"}, status=401)
        
        try:
            payload = jwt.decode(access_token, secret, algorithms=["HS256"])
            user_id = payload['user_id']
            user = Users.objects.get(id=user_id)
            request.user = user
        except jwt.ExpiredSignatureError:
            try:
                payload = jwt.decode(refresh_token, secret, algorithms=["HS256"])
                user_id = payload['user_id']
                user = Users.objects.get(id=user_id)
                refresh_token = RefreshToken.for_user(user)
                access_token = str(refresh_token.access_token)
                refresh_token = str(refresh_token)
                response = JsonResponse({"message": "ok"})
                response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True)
                response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True)

                return response
            except Exception as e:
                print("Error: ", e)
                response = JsonResponse({"error": "Token expired"}, status=401)
                response.delete_cookie("access_token")
                response.delete_cookie("refresh_token")
                return response
        except jwt.InvalidTokenError:
            return JsonResponse({"error": "Invalid token"}, status=401)

           