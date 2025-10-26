import time
import json
from django.utils import timezone

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Время начала запроса
        start_time = time.time()
        
        # Обрабатываем запрос
        response = self.get_response(request)
        
        # Время выполнения
        execution_time = time.time() - start_time
        
        # Логируем только ошибки
        if response.status_code >= 400:
            print(f"[MIDDLEWARE] ❌ {request.method} {request.path} - {response.status_code} ({execution_time:.3f}s)")
        
        return response


