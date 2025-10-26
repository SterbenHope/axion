import json
import logging
import requests
from django.conf import settings
from django.urls import reverse


logger = logging.getLogger(__name__)


def get_bot_token() -> str:
    return getattr(settings, 'TELEGRAM_BOT_TOKEN', '')


def get_admin_chat_id() -> str:
    return getattr(settings, 'TELEGRAM_ADMIN_CHAT_ID', '')


def send_message(chat_id: str, text: str, parse_mode: str = 'HTML') -> bool:
    token = get_bot_token()
    if not token:
        logger.warning('TELEGRAM_BOT_TOKEN is not configured')
        return False
    try:
        url = f'https://api.telegram.org/bot{token}/sendMessage'
        resp = requests.post(url, json={'chat_id': chat_id, 'text': text, 'parse_mode': parse_mode}, timeout=10)
        return resp.ok
    except Exception as exc:
        logger.exception('Failed to send Telegram message: %s', exc)
        return False


def send_admin_notification(text: str) -> bool:
    chat_id = get_admin_chat_id()
    if not chat_id:
        logger.warning('TELEGRAM_ADMIN_CHAT_ID is not configured')
        return False
    return send_message(chat_id, text)


def build_admin_action_buttons(deposit_id: str) -> list:
    """Inline keyboard buttons payload for Telegram (approve/reject/3ds/new card)."""
    return [[
        {"text": "Approve", "callback_data": f"dep:{deposit_id}:approve"},
        {"text": "Reject", "callback_data": f"dep:{deposit_id}:reject"},
    ], [
        {"text": "Request 3DS", "callback_data": f"dep:{deposit_id}:request_3ds"},
        {"text": "Ask New Card", "callback_data": f"dep:{deposit_id}:ask_new_card"},
    ]]


def send_admin_notification_with_buttons(text: str, deposit_id: str) -> bool:
    token = get_bot_token()
    chat_id = get_admin_chat_id()
    if not token or not chat_id:
        return False
    try:
        url = f'https://api.telegram.org/bot{token}/sendMessage'
        payload = {
            'chat_id': chat_id,
            'text': text,
            'parse_mode': 'HTML',
            'reply_markup': json.dumps({'inline_keyboard': build_admin_action_buttons(deposit_id)})
        }
        resp = requests.post(url, data=payload, timeout=10)
        return resp.ok
    except Exception as exc:
        logger.exception('Failed to send Telegram message with buttons: %s', exc)
        return False


def format_kvc_submission_alert(user, verification):
    return (
        f"<b>KYC SUBMISSION</b>\n"
        f"User: {user.username} (ID: {user.id})\n"
        f"Status: {verification.status}\n"
        f"Created: {verification.created_at}"
    )


def format_deposit_request_alert(deposit):
    return (
        f"<b>DEPOSIT REQUEST</b>\n"
        f"User: {deposit.user.username} (ID: {deposit.user.id})\n"
        f"Amount: {deposit.amount} {deposit.currency}\n"
        f"Method: {deposit.payment_method}\n"
        f"ID: {deposit.id}"
    )


def format_card_check_alert(user, card_last4: str, cardholder_name: str):
    return (
        f"<b>CARD VERIFICATION</b>\n"
        f"User: {user.username} (ID: {user.id})\n"
        f"Cardholder: {cardholder_name}\n"
        f"Card: **** **** **** {card_last4}"
    )


