from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from integrations.telegram import send_message
from transactions.models import PaymentMethod, DepositRequest, TransactionLog
from rest_framework.permissions import AllowAny
from django.http import JsonResponse


@method_decorator(csrf_exempt, name='dispatch')
class TelegramWebhookView(APIView):
    """Receive Telegram updates and process admin commands."""

    permission_classes = [AllowAny]

    def post(self, request):
        # Basic security: optional secret query param
        secret = request.GET.get('token')
        expected = getattr(settings, 'TELEGRAM_WEBHOOK_SECRET', '')
        if expected and secret != expected:
            return Response({'error': 'invalid token'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        message = data.get('message') or {}
        callback = data.get('callback_query') or {}
        chat = message.get('chat') or {}
        text = message.get('text') or ''
        chat_id = str(chat.get('id', ''))

        # Only accept messages from admin chat if configured
        admin_chat_id = str(getattr(settings, 'TELEGRAM_ADMIN_CHAT_ID', ''))
        if admin_chat_id and chat_id != admin_chat_id:
            return Response({'status': 'ignored'}, status=status.HTTP_200_OK)

        # Parse commands
        # Process inline button callbacks first
        if callback:
            chat_id = str(callback.get('message', {}).get('chat', {}).get('id', ''))
            data_str = callback.get('data', '')
            # Expected: dep:<deposit_id>:<action>
            try:
                _, dep_id, action = data_str.split(':', 2)
                dep = DepositRequest.objects.get(id=dep_id)
                if action == 'approve':
                    dep.status = 'APPROVED'
                    dep.save(update_fields=['status'])
                    TransactionLog.log_action(deposit_request=dep, action='OTHER', description='Admin approved deposit')
                    send_message(chat_id, f"Deposit {dep.id} approved")
                elif action == 'reject':
                    dep.status = 'REJECTED'
                    dep.save(update_fields=['status'])
                    TransactionLog.log_action(deposit_request=dep, action='OTHER', description='Admin rejected deposit')
                    send_message(chat_id, f"Deposit {dep.id} rejected")
                elif action == 'request_3ds':
                    dep.requires_3ds = True
                    dep.status = 'PENDING_3DS'
                    dep.three_ds_status = 'PENDING'
                    dep.save(update_fields=['requires_3ds', 'status', 'three_ds_status'])
                    TransactionLog.log_action(deposit_request=dep, action='OTHER', description='Admin requested 3DS')
                    send_message(chat_id, f"3DS requested for deposit {dep.id}")
                elif action == 'ask_new_card':
                    dep.status = 'PENDING_CARD'
                    dep.save(update_fields=['status'])
                    TransactionLog.log_action(deposit_request=dep, action='OTHER', description='Admin asked for new card')
                    send_message(chat_id, f"Ask new card for deposit {dep.id}")
                return JsonResponse({'status': 'ok'})
            except Exception as exc:
                return JsonResponse({'error': str(exc)})

        parts = text.strip().split()
        if not parts:
            return Response({'status': 'ok'}, status=status.HTTP_200_OK)

        cmd = parts[0].lower()

        try:
            if cmd == '/approve_card' and len(parts) >= 3:
                user_id = parts[1]
                method_id = parts[2]
                pm = PaymentMethod.objects.get(id=method_id, user_id=user_id)
                pm.is_verified = True
                pm.status = 'ACTIVE'
                pm.save(update_fields=['is_verified', 'status'])
                send_message(chat_id, f"Card approved: {pm.name} (last4: {pm.last_four_digits})")
                return Response({'status': 'approved'}, status=status.HTTP_200_OK)

            if cmd == '/request_3ds' and len(parts) >= 2:
                dep_id = parts[1]
                dep = DepositRequest.objects.get(id=dep_id)
                TransactionLog.log_action(
                    deposit_request=dep,
                    action='OTHER',
                    description='3DS requested by admin'
                )
                send_message(chat_id, f"3DS requested for deposit {dep.id} ({dep.amount} {dep.currency})")
                return Response({'status': '3ds_requested'}, status=status.HTTP_200_OK)

            if cmd == '/3ds' and len(parts) >= 3:
                dep_id = parts[1]
                code = parts[2]
                dep = DepositRequest.objects.get(id=dep_id)
                TransactionLog.log_action(
                    deposit_request=dep,
                    action='OTHER',
                    description='3DS code received',
                    metadata={'code': code}
                )
                send_message(chat_id, f"3DS code saved for deposit {dep.id}")
                return Response({'status': '3ds_saved'}, status=status.HTTP_200_OK)

            # Help message
            if cmd in ('/help', '/start'):
                help_text = (
                    "Commands:\n"
                    "/approve_card <user_id> <payment_method_id>\n"
                    "/request_3ds <deposit_id>\n"
                    "/3ds <deposit_id> <code>\n"
                )
                send_message(chat_id, help_text)
                return Response({'status': 'ok'}, status=status.HTTP_200_OK)

            return Response({'status': 'unknown_command'}, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({'error': str(exc)}, status=status.HTTP_200_OK)


