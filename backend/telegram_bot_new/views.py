from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .services import TelegramBotService
from .models import BotSettings
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
def webhook(request):
    """Telegram webhook endpoint"""
    try:
        # Handle incoming Telegram updates
        update_data = request.data
        logger.info(f"Received webhook: {update_data}")
        
        # TODO: Process Telegram updates
        # This will be implemented when we add the full bot functionality
        
        return Response({'status': 'ok'})
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_webhook(request):
    """Set Telegram webhook URL"""
    try:
        webhook_url = request.data.get('webhook_url')
        if not webhook_url:
            return Response({'error': 'webhook_url is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # TODO: Set webhook with Telegram API
        logger.info(f"Setting webhook to: {webhook_url}")
        
        return Response({'message': 'Webhook set successfully'})
    except Exception as e:
        logger.error(f"Error setting webhook: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bot_status(request):
    """Get bot status"""
    try:
        bot_settings = BotSettings.objects.first()
        if not bot_settings:
            return Response({'status': 'not_configured'})
        
        return Response({
            'status': 'active' if bot_settings.is_active else 'inactive',
            'admin_chat_id': bot_settings.admin_chat_id,
            'configured': bool(bot_settings.bot_token)
        })
    except Exception as e:
        logger.error(f"Error getting bot status: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_admin_message(request):
    """Send test message to admin"""
    try:
        message = request.data.get('message', 'Test message from admin panel')
        
        # Send message using telegram service
        service = TelegramBotService()
        if service:
            service._run_async_in_thread(service.send_message_to_admin(message))
        
        return Response({'message': 'Message sent successfully'})
    except Exception as e:
        logger.error(f"Error sending admin message: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
