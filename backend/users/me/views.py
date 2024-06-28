from django.http import JsonResponse
from django.conf import settings
from rest_framework.response import Response
from rest_framework.views import APIView
from ..serializer import UsersSerializer


class GetData(APIView):
    def get(self, request):
        if not request.user:
            return JsonResponse({"error": "You are not connected"}, status=401)
        else:
            serializer = UsersSerializer(request.user)
            print("serializerr", serializer)
            return JsonResponse(serializer.data)


class GetStatus(APIView):
    def get(self, request):
        if not request.user:
            return JsonResponse({"error": "You are not connected"}, status=401)
        else:
            return JsonResponse({"message": "You are connected"}, status=200)
