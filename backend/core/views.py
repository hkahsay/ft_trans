from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.http import require_GET
from rest_framework.views import APIView

class ServerInfo(APIView):
    def get(self, request):
        response = JsonResponse({
            "hostname": request.get_host(),
            "version": 1,
            "available": True,
        })
        get_token(request)
        return response