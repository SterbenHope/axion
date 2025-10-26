# NeonCasino Telegram Bot - Optimized Version
import os
import sys
import django
import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from telegram import Bot, Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler
from telegram.error import TelegramError, BadRequest, Forbidden, TimedOut

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neoncasino.settings')
django.setup()

from telegram_bot_new.models import BotSettings, BotNotification, BotUser, AdminCommand
from users.models import User
from kyc.models import KYCVerification
from payments_new.models import Payment
from promo.models import PromoCode, PromoManager, PromoCodeRequest
from django.utils import timezone
from asgiref.sync import sync_to_async
from django.core.cache import cache

# Setup optimized logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO,
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('telegram_bot.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

# Cache settings
CACHE_TIMEOUT = 300  # 5 minutes
USER_CACHE_TIMEOUT = 600  # 10 minutes

class NeonCasinoBot:
    def __init__(self):
        self.bot_settings = BotSettings.objects.first()
        if not self.bot_settings or not self.bot_settings.bot_token:
            logger.error("Bot token not configured!")
            sys.exit(1)
        
        self.bot = Bot(token=self.bot_settings.bot_token)
        self.application = Application.builder().token(self.bot_settings.bot_token).build()
        
        # Initialize cache
        self._init_cache()
        
        # Add handlers with error handling
        self._setup_handlers()
        
        logger.info("NeonCasino Bot initialized successfully")
    
    def _init_cache(self):
        """Initialize cache with default values"""
        cache.set('bot_stats', {}, CACHE_TIMEOUT)
        cache.set('user_permissions', {}, USER_CACHE_TIMEOUT)
    
    def _setup_handlers(self):
        """Setup all command handlers with error handling"""
        handlers = [
            CommandHandler("start", self._handle_with_error(self.start_command)),
            CommandHandler("help", self._handle_with_error(self.help_command)),
            CommandHandler("status", self._handle_with_error(self.status_command)),
            CommandHandler("users", self._handle_with_error(self.users_command)),
            CommandHandler("payments", self._handle_with_error(self.payments_command)),
            CommandHandler("kyc", self._handle_with_error(self.kyc_command)),
            CommandHandler("create_promo", self._handle_with_error(self.create_promo_command)),
            CommandHandler("list_promos", self._handle_with_error(self.list_promos_command)),
            CommandHandler("promo_stats", self._handle_with_error(self.promo_stats_command)),
            CommandHandler("promote_user", self._handle_with_error(self.promote_user_command)),
            CommandHandler("demote_user", self._handle_with_error(self.demote_user_command)),
            CommandHandler("ban_user", self._handle_with_error(self.ban_user_command)),
            CommandHandler("unban_user", self._handle_with_error(self.unban_user_command)),
            CommandHandler("set_manager_chat", self._handle_with_error(self.set_manager_chat_command)),
            CommandHandler("show_settings", self._handle_with_error(self.show_settings_command)),
            CommandHandler("test_notifications", self._handle_with_error(self.test_notifications_command)),
            CommandHandler("get_user_id", self._handle_with_error(self.get_user_id_command)),
            CommandHandler("list_bot_users", self._handle_with_error(self.list_bot_users_command)),
            CommandHandler("user_detail", self._handle_with_error(self.user_detail_command)),
            CommandHandler("delete_promo", self._handle_with_error(self.delete_promo_command)),
            CommandHandler("view_promo", self._handle_with_error(self.view_promo_command)),
            MessageHandler(filters.TEXT & ~filters.COMMAND, self._handle_with_error(self.handle_text_message)),
            CallbackQueryHandler(self._handle_with_error(self.button_callback)),
            MessageHandler(filters.ChatType.GROUPS & filters.COMMAND, self._handle_with_error(self.handle_group_command))
        ]
        
        for handler in handlers:
            self.application.add_handler(handler)
    
    async def _handle_with_error(self, func):
        """Decorator for error handling in handlers"""
        async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
            try:
                await func(update, context)
            except BadRequest as e:
                logger.error(f"BadRequest error in {func.__name__}: {e}")
                if update.effective_message:
                    await update.effective_message.reply_text("❌ Ошибка запроса. Проверьте параметры команды.")
            except Forbidden as e:
                logger.error(f"Forbidden error in {func.__name__}: {e}")
                if update.effective_message:
                    await update.effective_message.reply_text("❌ У вас нет прав для выполнения этой команды.")
            except TimedOut as e:
                logger.error(f"Timeout error in {func.__name__}: {e}")
                if update.effective_message:
                    await update.effective_message.reply_text("⏰ Превышено время ожидания. Попробуйте позже.")
            except Exception as e:
                logger.error(f"Unexpected error in {func.__name__}: {e}")
                if update.effective_message:
                    await update.effective_message.reply_text("❌ Произошла неожиданная ошибка. Попробуйте позже.")
        return wrapper
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Отправляет сообщение при команде /start."""
        user = update.effective_user
        
        # Создаем или получаем пользователя бота
        bot_user = await self.get_or_create_bot_user(
            user_id=user.id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name
        )
        
        # Проверяем, является ли пользователь админом или менеджером
        is_admin = await self.check_admin_permissions(user.id)
        is_manager = await self.check_manager_permissions(user.id)
        is_main_admin = await self.check_main_admin_permissions(user.id)
        
        if is_main_admin:
            await update.message.reply_html(
                f"👋 Привет, {user.mention_html()}!\n\n"
                "🤖 Я бот для управления NeonCasino.\n"
                "👑 Вы - Главный Администратор\n\n"
                "📋 Доступные команды:\n"
                "/status - Статус системы\n"
                "/users - Список пользователей\n"
                "/payments - Платежи\n"
                "/kyc - KYC заявки\n"
                "/create_promo - Создать промокод\n"
                "/list_promos - Список промокодов\n"
                "/promo_stats - Статистика промокодов\n"
                "/promote_user - Повысить пользователя\n"
                "/demote_user - Понизить пользователя\n"
                "/ban_user - Заблокировать пользователя\n"
                "/unban_user - Разблокировать пользователя\n"
                "/set_manager_chat - Настроить чат менеджеров\n"
                "/show_settings - Показать настройки\n"
                "/test_notifications - Тест уведомлений\n"
                "/help - Помощь"
            )
        elif is_admin:
            await update.message.reply_html(
                f"👋 Привет, {user.mention_html()}!\n\n"
                "🤖 Я бот для управления NeonCasino.\n"
                "👨‍💼 Вы - Администратор\n\n"
                "📋 Доступные команды:\n"
                "/status - Статус системы\n"
                "/users - Список пользователей\n"
                "/payments - Платежи\n"
                "/kyc - KYC заявки\n"
                "/create_promo - Создать промокод\n"
                "/list_promos - Список промокодов\n"
                "/promo_stats - Статистика промокодов\n"
                "/ban_user - Заблокировать пользователя\n"
                "/unban_user - Разблокировать пользователя\n"
                "/help - Помощь"
            )
        elif is_manager:
            await update.message.reply_html(
                f"👋 Привет, {user.mention_html()}!\n\n"
                "🤖 Я бот для управления промокодами NeonCasino.\n\n"
                "📋 Доступные команды:\n"
                "/create_promo - Создать промокод\n"
                "/list_promos - Список ваших промокодов\n"
                "/promo_stats - Ваша статистика\n"
                "/help - Помощь"
            )
        else:
            await update.message.reply_text(
                "👋 Привет! Этот бот предназначен только для администраторов и менеджеров NeonCasino."
            )
    
    async def create_promo_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Start promo code creation process"""
        user = update.effective_user
        
        # Check permissions (managers can create promos)
        is_manager = await self.check_manager_permissions(user.id)
        
        if not is_manager:
            await update.message.reply_text("❌ У вас нет прав для создания промокодов.")
            return
        
        # Store user state for promo creation
        context.user_data['creating_promo'] = True
        context.user_data['promo_data'] = {}
        
        await update.message.reply_text(
            "🎯 Создание нового промокода\n\n"
            "Отправьте мне данные промокода в следующем формате:\n\n"
            "Код: PROMO123\n"
            "Название: Приветственный бонус\n"
            "Описание: Бонус для новых пользователей\n"
            "Тип: WELCOME\n"
            "Бонус: 1000\n"
            "Макс. использований: 100\n"
            "Действителен дней: 30\n\n"
            "Или отправьте 'отмена' для отмены."
        )
    
    async def handle_text_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle text messages for promo creation"""
        if not context.user_data.get('creating_promo'):
            return
        
        text = update.message.text.strip()
        
        if text.lower() in ['отмена', 'cancel', 'стоп']:
            context.user_data['creating_promo'] = False
            context.user_data['promo_data'] = {}
            await update.message.reply_text("❌ Создание промокода отменено.")
            return
        
        try:
            # Parse promo data
            promo_data = self.parse_promo_text(text)
            
            if promo_data:
                # Create promo code
                promo_code = await self.create_promo_code(update.effective_user, promo_data)
                
                if promo_code:
                    # Notify admin chat
                    await self.notify_admin_promo_created(promo_code, update.effective_user)
                    
                    # Notify manager chat
                    await self.notify_manager_promo_created(promo_code, update.effective_user)
                    
                    await update.message.reply_text(
                        f"✅ Промокод {promo_code.code} успешно создан!\n\n"
                        f"Название: {promo_code.name}\n"
                        f"Бонус: {promo_code.bonus_amount} NC\n"
                        f"Статус: {promo_code.status}"
                    )
                else:
                    await update.message.reply_text("❌ Ошибка при создании промокода.")
                
                # Reset state
                context.user_data['creating_promo'] = False
                context.user_data['promo_data'] = {}
            else:
                await update.message.reply_text(
                    "❌ Не удалось распарсить данные промокода.\n"
                    "Пожалуйста, используйте правильный формат."
                )
                
        except Exception as e:
            logger.error(f"Error creating promo code: {e}")
            await update.message.reply_text(f"❌ Ошибка: {str(e)}")
            context.user_data['creating_promo'] = False
            context.user_data['promo_data'] = {}
    
    def parse_promo_text(self, text):
        """Parse promo code data from text"""
        try:
            lines = text.split('\n')
            promo_data = {}
            
            for line in lines:
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip().lower()
                    value = value.strip()
                    
                    if key == 'код':
                        promo_data['code'] = value.upper()
                    elif key == 'название':
                        promo_data['name'] = value
                    elif key == 'описание':
                        promo_data['description'] = value
                    elif key == 'тип':
                        promo_data['promo_type'] = value.upper()
                    elif key == 'бонус':
                        promo_data['bonus_amount'] = float(value)
                    elif key == 'макс. использований':
                        promo_data['max_uses'] = int(value)
                    elif key == 'действителен дней':
                        promo_data['valid_days'] = int(value)
            
            # Validate required fields
            required_fields = ['code', 'name', 'description', 'promo_type', 'bonus_amount']
            if all(field in promo_data for field in required_fields):
                return promo_data
            
            return None
            
        except Exception as e:
            logger.error(f"Error parsing promo text: {e}")
            return None
    
    async def create_promo_code(self, user, promo_data):
        """Create promo code in database"""
        try:
            from django.utils import timezone
            from datetime import timedelta
            
            # Get user object
            user_obj = await sync_to_async(User.objects.get)(telegram_id=user.id)
            
            promo_code = PromoCode.objects.create(
                code=promo_data['code'],
                name=promo_data['name'],
                description=promo_data['description'],
                promo_type=promo_data['promo_type'],
                bonus_amount=promo_data['bonus_amount'],
                max_uses=promo_data.get('max_uses', 1),
                valid_from=timezone.now(),
                valid_until=timezone.now() + timedelta(days=promo_data.get('valid_days', 30)),
                status='ACTIVE',
                is_active=True,
                created_by=user_obj
            )
            
            # Update manager stats if user is a manager
            try:
                manager = await sync_to_async(PromoManager.objects.get)(user=user_obj)
                manager.total_promos_created += 1
                await sync_to_async(manager.save)()
            except PromoManager.DoesNotExist:
                pass  # User is not a manager
            
            return promo_code
            
        except Exception as e:
            logger.error(f"Error creating promo code: {e}")
            return None
    
    async def notify_admin_promo_created(self, promo_code, creator):
        """Notify admin chat about new promo code"""
        try:
            admin_chat_id = self.bot_settings.admin_chat_id
            if admin_chat_id:
                message = (
                    f"🎯 Новый промокод создан!\n\n"
                    f"Код: {promo_code.code}\n"
                    f"Название: {promo_code.name}\n"
                    f"Создатель: {creator.username or creator.first_name}\n"
                    f"Бонус: {promo_code.bonus_amount} NC\n"
                    f"Макс. использований: {promo_code.max_uses}\n"
                    f"Действителен до: {promo_code.valid_until.strftime('%d.%m.%Y')}"
                )
                
                await self.bot.send_message(chat_id=admin_chat_id, text=message)
                
        except Exception as e:
            logger.error(f"Error notifying admin: {e}")
    
    async def notify_manager_promo_created(self, promo_code, creator):
        """Notify manager chat about new promo code"""
        try:
            manager_chat_id = self.bot_settings.managers_chat_id
            if manager_chat_id:
                message = (
                    f"🎯 Промокод успешно создан!\n\n"
                    f"Код: {promo_code.code}\n"
                    f"Название: {promo_code.name}\n"
                    f"Бонус: {promo_code.bonus_amount} NC\n"
                    f"Макс. использований: {promo_code.max_uses}\n"
                    f"Действителен до: {promo_code.valid_until.strftime('%d.%m.%Y')}"
                )
                
                await self.bot.send_message(chat_id=manager_chat_id, text=message)
                
        except Exception as e:
            logger.error(f"Error notifying manager: {e}")
    
    async def get_or_create_bot_user(self, user_id: int, username: str = None, first_name: str = None, last_name: str = None) -> BotUser:
        """Получает или создает пользователя бота с кэшированием"""
        cache_key = f"bot_user_{user_id}"
        cached_user = cache.get(cache_key)
        
        if cached_user:
            # Обновляем информацию о пользователе если нужно
            if (cached_user.get('username') != username or 
                cached_user.get('first_name') != first_name or 
                cached_user.get('last_name') != last_name):
                
                try:
                    bot_user = await sync_to_async(BotUser.objects.get)(user_id=user_id)
                    bot_user.username = username
                    bot_user.first_name = first_name
                    bot_user.last_name = last_name
                    await sync_to_async(bot_user.save)()
                    
                    # Обновляем кэш
                    cache.set(cache_key, {
                        'id': bot_user.id,
                        'user_id': bot_user.user_id,
                        'username': bot_user.username,
                        'first_name': bot_user.first_name,
                        'last_name': bot_user.last_name,
                        'level': bot_user.level,
                        'is_active': bot_user.is_active,
                        'is_banned': bot_user.is_banned
                    }, USER_CACHE_TIMEOUT)
                    
                    return bot_user
                except BotUser.DoesNotExist:
                    pass
        
        try:
            bot_user = await sync_to_async(BotUser.objects.get)(user_id=user_id)
            # Обновляем информацию о пользователе
            bot_user.username = username
            bot_user.first_name = first_name
            bot_user.last_name = last_name
            await sync_to_async(bot_user.save)()
            
            # Кэшируем пользователя
            cache.set(cache_key, {
                'id': bot_user.id,
                'user_id': bot_user.user_id,
                'username': bot_user.username,
                'first_name': bot_user.first_name,
                'last_name': bot_user.last_name,
                'level': bot_user.level,
                'is_active': bot_user.is_active,
                'is_banned': bot_user.is_banned
            }, USER_CACHE_TIMEOUT)
            
            return bot_user
        except BotUser.DoesNotExist:
            bot_user = await sync_to_async(BotUser.objects.create)(
                user_id=user_id,
                username=username,
                first_name=first_name,
                last_name=last_name,
                level='user'
            )
            
            # Кэшируем нового пользователя
            cache.set(cache_key, {
                'id': bot_user.id,
                'user_id': bot_user.user_id,
                'username': bot_user.username,
                'first_name': bot_user.first_name,
                'last_name': bot_user.last_name,
                'level': bot_user.level,
                'is_active': bot_user.is_active,
                'is_banned': bot_user.is_banned
            }, USER_CACHE_TIMEOUT)
            
            return bot_user

    async def check_admin_permissions(self, user_id: int) -> bool:
        """Проверяет, является ли пользователь админом с кэшированием"""
        cache_key = f"admin_permissions_{user_id}"
        cached_permission = cache.get(cache_key)
        
        if cached_permission is not None:
            return cached_permission
        
        try:
            bot_user = await sync_to_async(BotUser.objects.get)(user_id=user_id)
            is_admin = bot_user.level in ['main_admin', 'admin'] and bot_user.is_active and not bot_user.is_banned
            
            # Кэшируем результат
            cache.set(cache_key, is_admin, USER_CACHE_TIMEOUT)
            return is_admin
        except BotUser.DoesNotExist:
            cache.set(cache_key, False, USER_CACHE_TIMEOUT)
            return False

    async def check_main_admin_permissions(self, user_id: int) -> bool:
        """Проверяет, является ли пользователь главным админом с кэшированием"""
        cache_key = f"main_admin_permissions_{user_id}"
        cached_permission = cache.get(cache_key)
        
        if cached_permission is not None:
            return cached_permission
        
        try:
            bot_user = await sync_to_async(BotUser.objects.get)(user_id=user_id)
            is_main_admin = bot_user.level == 'main_admin' and bot_user.is_active and not bot_user.is_banned
            
            # Кэшируем результат
            cache.set(cache_key, is_main_admin, USER_CACHE_TIMEOUT)
            return is_main_admin
        except BotUser.DoesNotExist:
            cache.set(cache_key, False, USER_CACHE_TIMEOUT)
            return False

    async def check_manager_permissions(self, user_id: int) -> bool:
        """Проверяет, является ли пользователь менеджером или выше с кэшированием"""
        cache_key = f"manager_permissions_{user_id}"
        cached_permission = cache.get(cache_key)
        
        if cached_permission is not None:
            return cached_permission
        
        try:
            bot_user = await sync_to_async(BotUser.objects.get)(user_id=user_id)
            is_manager = bot_user.level in ['main_admin', 'admin', 'manager'] and bot_user.is_active and not bot_user.is_banned
            
            # Кэшируем результат
            cache.set(cache_key, is_manager, USER_CACHE_TIMEOUT)
            return is_manager
        except BotUser.DoesNotExist:
            cache.set(cache_key, False, USER_CACHE_TIMEOUT)
            return False
    
    def _clear_user_cache(self, user_id: int):
        """Очищает кэш пользователя при изменении прав"""
        cache_keys = [
            f"bot_user_{user_id}",
            f"admin_permissions_{user_id}",
            f"main_admin_permissions_{user_id}",
            f"manager_permissions_{user_id}"
        ]
        for key in cache_keys:
            cache.delete(key)
    
    async def list_promos_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """List promo codes for user"""
        user = update.effective_user
        
        # Check permissions
        is_admin = await self.check_admin_permissions(user.id)
        is_manager = await self.check_manager_permissions(user.id)
        
        if not (is_admin or is_manager):
            await update.message.reply_text("❌ У вас нет прав для просмотра промокодов.")
            return
        
        try:
            if is_admin:
                # Admin sees all promo codes
                promo_codes = await sync_to_async(PromoCode.objects.all)()
                message = "📋 Все промокоды:\n\n"
            else:
                # Manager sees only their promo codes
                user_obj = await sync_to_async(User.objects.get)(telegram_id=user.id)
                promo_codes = await sync_to_async(PromoCode.objects.filter)(created_by=user_obj)
                message = "📋 Ваши промокоды:\n\n"
            
            if not promo_codes:
                message += "Промокоды не найдены."
            else:
                for promo in promo_codes[:10]:  # Limit to 10 for readability
                    message += f"🎯 {promo.code} - {promo.name}\n"
                    message += f"   Статус: {promo.status}\n"
                    message += f"   Бонус: {promo.bonus_amount} NC\n"
                    message += f"   Использований: {promo.current_uses}/{promo.max_uses}\n\n"
                
                if len(promo_codes) > 10:
                    message += f"... и еще {len(promo_codes) - 10} промокодов"
            
            await update.message.reply_text(message)
            
        except Exception as e:
            logger.error(f"Error listing promos: {e}")
            await update.message.reply_text("❌ Ошибка при получении списка промокодов.")
    
    async def promo_stats_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Show promo code statistics"""
        user = update.effective_user
        
        # Check permissions
        is_admin = await self.check_admin_permissions(user.id)
        is_manager = await self.check_manager_permissions(user.id)
        
        if not (is_admin or is_manager):
            await update.message.reply_text("❌ У вас нет прав для просмотра статистики.")
            return
        
        try:
            if is_admin:
                # Admin sees global stats
                total_promos = await sync_to_async(PromoCode.objects.count)()
                active_promos = await sync_to_async(PromoCode.objects.filter(status='ACTIVE').count)()
                total_redemptions = await sync_to_async(PromoRedemption.objects.count)()
                
                message = "📊 Общая статистика промокодов:\n\n"
                message += f"Всего промокодов: {total_promos}\n"
                message += f"Активных: {active_promos}\n"
                message += f"Всего активаций: {total_redemptions}\n"
            else:
                # Manager sees their stats
                user_obj = await sync_to_async(User.objects.get)(telegram_id=user.id)
                manager = await sync_to_async(PromoManager.objects.get)(user=user_obj)
                
                message = f"📊 Ваша статистика:\n\n"
                message += f"Создано промокодов: {manager.total_promos_created}\n"
                message += f"Привлечено пользователей: {manager.total_users_referred}\n"
                message += f"Сгенерировано доходов: {manager.total_revenue_generated} NC\n"
                message += f"Комиссия: {manager.commission_rate}%\n"
            
            await update.message.reply_text(message)
            
        except Exception as e:
            logger.error(f"Error getting promo stats: {e}")
            await update.message.reply_text("❌ Ошибка при получении статистики.")
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Show help information"""
        user = update.effective_user
        
        # Check if user is admin or manager
        is_admin = await self.check_admin_permissions(user.id)
        is_manager = await self.check_manager_permissions(user.id)
        
        if is_admin:
            help_text = (
                "🤖 **Помощь по командам NeonCasino Bot**\n\n"
                "**📊 Системные команды:**\n"
                "/start - Главное меню\n"
                "/help - Эта справка\n"
                "/status - Статус системы\n"
                "/show_settings - Настройки бота\n\n"
                "**👥 Управление пользователями:**\n"
                "/users - Список пользователей\n"
                "/list_bot_users - Список пользователей бота (админы/менеджеры)\n"
                "/user_detail <user_id> - Детальная информация о пользователе\n"
                "/get_user_id @username - Получить ID пользователя\n"
                "/payments - Платежи\n"
                "/kyc - KYC заявки\n\n"
                "**🎯 Управление промокодами:**\n"
                "/create_promo - Создать промокод\n"
                "/list_promos - Список промокодов\n"
                "/view_promo <код> - Информация о промокоде\n"
                "/delete_promo <код> - Удалить промокод\n"
                "/promo_stats - Статистика промокодов\n"
                "/set_manager_chat - Настроить чат менеджеров\n"
                "/test_notifications - Тест уведомлений\n\n"
                "**📝 Создание промокода (ШАГ ЗА ШАГОМ):**\n\n"
                "**Шаг 1:** Отправьте команду /create_promo\n\n"
                "**Шаг 2:** Скопируйте и отправьте данные в формате:\n"
                "```\n"
                "Код: WELCOME2024\n"
                "Название: Приветственный бонус 2024\n"
                "Описание: Получите 1000 NC при регистрации\n"
                "Тип: WELCOME\n"
                "Бонус: 1000\n"
                "Макс. использований: 1000\n"
                "Действителен дней: 30\n"
                "```\n\n"
                "**📌 Доступные типы промокодов:**\n"
                "• WELCOME - Приветственный бонус\n"
                "• DEPOSIT - Бонус на депозит\n"
                "• RELOAD - Бонус на повторный депозит\n"
                "• FREE_SPINS - Бесплатные вращения\n"
                "• CASHBACK - Кэшбэк\n\n"
                "**💡 Важно:**\n"
                "• Промокод будет активен сразу\n"
                "• Все админы и менеджеры могут создавать промокоды\n"
                "• Уведомления отправляются в админ и менеджер чаты"
            )
        elif is_manager:
            help_text = (
                "🤖 **Помощь по командам для менеджеров**\n\n"
                "**📊 Основные команды:**\n"
                "/start - Главное меню\n"
                "/help - Эта справка\n\n"
                "**🎯 Управление промокодами:**\n"
                "/create_promo - Создать промокод\n"
                "/list_promos - Список ваших промокодов\n"
                "/promo_stats - Ваша статистика\n\n"
                "**🔍 Поиск:**\n"
                "/get_user_id @username - Получить ID пользователя\n\n"
                "**📝 Создание промокода (ШАГ ЗА ШАГОМ):**\n\n"
                "**Шаг 1:** Отправьте команду /create_promo\n\n"
                "**Шаг 2:** Скопируйте и отправьте данные в формате:\n"
                "```\n"
                "Код: SUMMER2024\n"
                "Название: Летний бонус\n"
                "Описание: Получите 500 NC при регистрации\n"
                "Тип: WELCOME\n"
                "Бонус: 500\n"
                "Макс. использований: 500\n"
                "Действителен дней: 60\n"
                "```\n\n"
                "**📌 Доступные типы промокодов:**\n"
                "• WELCOME - Приветственный бонус\n"
                "• DEPOSIT - Бонус на депозит\n"
                "• RELOAD - Бонус на повторный депозит\n\n"
                "**💡 Советы:**\n"
                "• Используйте уникальные коды\n"
                "• Устанавливайте разумные лимиты\n"
                "• Описывайте условия четко\n"
                "• Промокод будет активен сразу после создания"
            )
        else:
            help_text = (
                "🤖 **NeonCasino Bot**\n\n"
                "Этот бот предназначен только для администраторов и менеджеров NeonCasino.\n\n"
                "Для получения доступа обратитесь к администратору системы."
            )
        
        await update.message.reply_text(help_text, parse_mode='Markdown')
    
    async def status_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Show system status"""
        user = update.effective_user
        
        # Check permissions
        is_admin = await self.check_admin_permissions(user.id)
        if not is_admin:
            await update.message.reply_text("❌ Только администраторы могут просматривать статус системы.")
            return
        
        try:
            # Get basic system stats
            total_users = await sync_to_async(User.objects.count)()
            total_payments = await sync_to_async(Payment.objects.count)()
            total_promos = await sync_to_async(PromoCode.objects.count)()
            
            message = "📊 **Статус системы NeonCasino**\n\n"
            message += f"👥 Пользователей: {total_users}\n"
            message += f"💳 Платежей: {total_payments}\n"
            message += f"🎯 Промокодов: {total_promos}\n"
            message += f"🤖 Бот: {'🟢 Активен' if self.bot_settings.is_active else '🔴 Неактивен'}\n"
            message += f"👑 Админ чат: {'🟢 Настроен' if self.bot_settings.admin_chat_id else '🔴 Не настроен'}\n"
            message += f"👥 Чат менеджеров: {'🟢 Настроен' if self.bot_settings.managers_chat_id else '🔴 Не настроен'}\n\n"
            message += "✅ Система работает нормально"
            
            await update.message.reply_text(message, parse_mode='Markdown')
            
        except Exception as e:
            logger.error(f"Error getting system status: {e}")
            await update.message.reply_text(f"❌ Ошибка при получении статуса: {str(e)}")
    
    async def users_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Show users list"""
        user = update.effective_user
        
        # Check permissions
        is_admin = await self.check_admin_permissions(user.id)
        if not is_admin:
            await update.message.reply_text("❌ Только администраторы могут просматривать список пользователей.")
            return
        
        try:
            # Get recent users
            recent_users = await sync_to_async(User.objects.order_by('-date_joined')[:5])
            
            message = "👥 **Последние пользователи:**\n\n"
            
            if recent_users:
                for user_obj in recent_users:
                    message += f"👤 **{user_obj.username or user_obj.email}**\n"
                    message += f"   📧 {user_obj.email}\n"
                    message += f"   📅 {user_obj.date_joined.strftime('%d.%m.%Y')}\n"
                    message += f"   ✅ {'Активен' if user_obj.is_active else 'Неактивен'}\n\n"
            else:
                message += "Пользователи не найдены"
            
            await update.message.reply_text(message, parse_mode='Markdown')
            
        except Exception as e:
            logger.error(f"Error getting users: {e}")
            await update.message.reply_text(f"❌ Ошибка при получении списка пользователей: {str(e)}")
    
    async def payments_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Show recent payments"""
        user = update.effective_user
        
        # Check permissions
        is_admin = await self.check_admin_permissions(user.id)
        if not is_admin:
            await update.message.reply_text("❌ Только администраторы могут просматривать платежи.")
            return
        
        try:
            # Get recent payments
            recent_payments = await sync_to_async(Payment.objects.order_by('-created_at')[:5])
            
            message = "💳 **Последние платежи:**\n\n"
            
            if recent_payments:
                for payment in recent_payments:
                    message += f"💰 **{payment.amount} {payment.currency}**\n"
                    message += f"   👤 {payment.user.username or payment.user.email}\n"
                    message += f"   📊 {payment.get_status_display()}\n"
                    message += f"   📅 {payment.created_at.strftime('%d.%m.%Y %H:%M')}\n\n"
            else:
                message += "Платежи не найдены"
            
            await update.message.reply_text(message, parse_mode='Markdown')
            
        except Exception as e:
            logger.error(f"Error getting payments: {e}")
            await update.message.reply_text(f"❌ Ошибка при получении платежей: {str(e)}")
    
    async def kyc_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Show KYC verifications"""
        user = update.effective_user
        
        # Check permissions
        is_admin = await self.check_admin_permissions(user.id)
        if not is_admin:
            await update.message.reply_text("❌ Только администраторы могут просматривать KYC заявки.")
            return
        
        try:
            # Get recent KYC verifications
            recent_kyc = await sync_to_async(KYCVerification.objects.order_by('-created_at')[:5])
            
            message = "🆔 **Последние KYC заявки:**\n\n"
            
            if recent_kyc:
                for kyc in recent_kyc:
                    message += f"👤 **{kyc.user.username or kyc.user.email}**\n"
                    message += f"   📊 Статус: {kyc.get_status_display()}\n"
                    message += f"   📅 {kyc.created_at.strftime('%d.%m.%Y %H:%M')}\n\n"
            else:
                message += "KYC заявки не найдены"
            
            await update.message.reply_text(message, parse_mode='Markdown')
            
        except Exception as e:
            logger.error(f"Error getting KYC: {e}")
            await update.message.reply_text(f"❌ Ошибка при получении KYC заявок: {str(e)}")
    
    async def set_manager_chat_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Set manager chat ID for notifications"""
        user = update.effective_user
        
        # Only admins can set manager chat
        is_admin = await self.check_admin_permissions(user.id)
        if not is_admin:
            await update.message.reply_text("❌ Только администраторы могут настраивать чат менеджеров.")
            return
        
        # Check if chat ID is provided
        if not context.args:
            await update.message.reply_text(
                "📝 Использование: /set_manager_chat <chat_id>\n\n"
                "Чтобы получить chat_id:\n"
                "1. Добавьте бота в группу менеджеров\n"
                "2. Отправьте любое сообщение в группу\n"
                "3. Используйте /set_manager_chat с полученным chat_id"
            )
            return
        
        try:
            chat_id = context.args[0]
            
            # Validate chat_id format (should be a number or start with -)
            if not (chat_id.isdigit() or (chat_id.startswith('-') and chat_id[1:].isdigit())):
                await update.message.reply_text("❌ Неверный формат chat_id. Должен быть числом.")
                return
            
            # Update bot settings
            self.bot_settings.managers_chat_id = chat_id
            await sync_to_async(self.bot_settings.save)()
            
            await update.message.reply_text(
                f"✅ Чат менеджеров успешно настроен!\n\n"
                f"Chat ID: {chat_id}\n\n"
                f"Теперь все уведомления о промокодах будут отправляться в этот чат."
            )
            
            # Test message to manager chat
            try:
                test_message = (
                    "🎯 Тестовое уведомление\n\n"
                    "Чат менеджеров успешно настроен!\n"
                    "Теперь вы будете получать уведомления о созданных промокодах."
                )
                await self.bot.send_message(chat_id=chat_id, text=test_message)
                await update.message.reply_text("✅ Тестовое сообщение отправлено в чат менеджеров.")
            except Exception as e:
                await update.message.reply_text(
                    f"⚠️ Чат настроен, но не удалось отправить тестовое сообщение: {str(e)}\n"
                    "Проверьте, что бот добавлен в группу и имеет права на отправку сообщений."
                )
                
        except Exception as e:
            logger.error(f"Error setting manager chat: {e}")
            await update.message.reply_text(f"❌ Ошибка при настройке чата менеджеров: {str(e)}")
    
    async def button_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle button callbacks"""
        query = update.callback_query
        await query.answer()
        
        # Handle different button types
        if query.data.startswith('promo_'):
            await self.handle_promo_callback(query, context)
        else:
            await query.edit_message_text("❌ Неизвестная команда")
    
    async def handle_promo_callback(self, query, context):
        """Handle promo-related button callbacks"""
        try:
            if query.data == 'promo_create':
                await self.create_promo_command(update=query, context=context)
            elif query.data == 'promo_list':
                await self.list_promos_command(update=query, context=context)
            elif query.data == 'promo_stats':
                await self.promo_stats_command(update=query, context=context)
            else:
                await query.edit_message_text("❌ Неизвестная команда промокода")
        except Exception as e:
            logger.error(f"Error handling promo callback: {e}")
            await query.edit_message_text("❌ Ошибка при обработке команды")
    
    async def show_settings_command(self, update: Update, context:ContextTypes.DEFAULT_TYPE):
        """Show current bot settings"""
        user = update.effective_user
        
        # Only admins can view settings
        is_admin = await self.check_admin_permissions(user.id)
        if not is_admin:
            await update.message.reply_text("❌ Только администраторы могут просматривать настройки бота.")
            return
        
        try:
            settings = self.bot_settings
            
            message = "⚙️ Настройки бота:\n\n"
            message += f"🤖 Бот активен: {'Да' if settings.is_active else 'Нет'}\n"
            message += f"👑 Админ чат: {settings.admin_chat_id}\n"
            message += f"👥 Чат менеджеров: {settings.managers_chat_id or 'Не настроен'}\n"
            message += f"📅 Создан: {settings.created_at.strftime('%d.%m.%Y %H:%M')}\n"
            message += f"🔄 Обновлен: {settings.updated_at.strftime('%d.%m.%Y %H:%M')}\n\n"
            
            if settings.managers_chat_id:
                message += "✅ Чат менеджеров настроен - уведомления будут отправляться"
            else:
                message += "⚠️ Чат менеджеров не настроен - используйте /set_manager_chat"
            
            await update.message.reply_text(message)
            
        except Exception as e:
            logger.error(f"Error showing settings: {e}")
            await update.message.reply_text(f"❌ Ошибка при получении настроек: {str(e)}")
    
    async def test_notifications_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Test notifications for admins"""
        user = update.effective_user
        
        # Only admins can test notifications
        is_admin = await self.check_admin_permissions(user.id)
        if not is_admin:
            await update.message.reply_text("❌ Только администраторы могут тестировать уведомления.")
            return
        
        try:
            # Test admin notification
            await self.notify_admin_user_registered(
                username="test_user",
                email="test@example.com",
                promo_code="TEST123",
                manager_name="Test Manager"
            )
            
            await update.message.reply_text("✅ Тестовые уведомления отправлены!")
            
        except Exception as e:
            logger.error(f"Error testing notifications: {e}")
            await update.message.reply_text(f"❌ Ошибка при тестировании: {str(e)}")
    
    async def notify_admin_user_registered(self, username, email, promo_code=None, manager_name=None):
        """Notify admin chat about new user registration"""
        try:
            admin_chat_id = self.bot_settings.admin_chat_id
            if admin_chat_id:
                message = (
                    f"👤 <b>Новый пользователь зарегистрирован!</b>\n\n"
                    f"<b>👤 Пользователь:</b> {username}\n"
                    f"<b>📧 Email:</b> {email}\n"
                    f"<b>📅 Время:</b> {timezone.now().strftime('%d.%m.%Y %H:%M')}\n"
                )
                
                if promo_code:
                    message += f"<b>🎯 Промокод:</b> {promo_code}\n"
                    if manager_name:
                        message += f"<b>👨‍💼 Менеджер:</b> {manager_name if manager_name.startswith('@') else f'@{manager_name}'}\n"
                
                await self.bot.send_message(chat_id=admin_chat_id, text=message, parse_mode='HTML')
                
        except Exception as e:
            logger.error(f"Error notifying admin about user registration: {e}")
    
    async def notify_manager_user_registered(self, username, email, promo_code, manager_name):
        """Notify manager chat about new user with their promo code"""
        try:
            manager_chat_id = self.bot_settings.managers_chat_id
            if manager_chat_id:
                message = (
                    f"🎯 <b>Пользователь активировал ваш промокод!</b>\n\n"
                    f"<b>👤 Пользователь:</b> {username}\n"
                    f"<b>📧 Email:</b> {email}\n"
                    f"<b>🎯 Промокод:</b> {promo_code}\n"
                    f"<b>👨‍💼 Менеджер:</b> {manager_name if manager_name.startswith('@') else f'@{manager_name}'}\n"
                    f"<b>📅 Время:</b> {timezone.now().strftime('%d.%m.%Y %H:%M')}\n\n"
                    f"✅ Отличная работа! Пользователь присоединился к платформе."
                )
                
                await self.bot.send_message(chat_id=manager_chat_id, text=message, parse_mode='HTML')
                
        except Exception as e:
            logger.error(f"Error notifying manager about user registration: {e}")
    
    async def notify_admin_promo_activated(self, username, email, promo_code, manager_name):
        """Notify admin chat about promo code activation by existing user"""
        try:
            admin_chat_id = self.bot_settings.admin_chat_id
            if admin_chat_id:
                message = (
                    f"🎯 <b>Существующий пользователь активировал промокод!</b>\n\n"
                    f"<b>👤 Пользователь:</b> {username}\n"
                    f"<b>📧 Email:</b> {email}\n"
                    f"<b>🎯 Промокод:</b> {promo_code}\n"
                    f"<b>👨‍💼 Менеджер:</b> {manager_name if manager_name.startswith('@') else f'@{manager_name}'}\n"
                    f"<b>📅 Время:</b> {timezone.now().strftime('%d.%m.%Y %H:%M')}\n"
                )
                
                await self.bot.send_message(chat_id=admin_chat_id, text=message, parse_mode='HTML')
                
        except Exception as e:
            logger.error(f"Error notifying admin about promo activation: {e}")
    
    async def notify_manager_promo_activated(self, username, email, promo_code, manager_name):
        """Notify manager chat about promo code activation by existing user"""
        try:
            manager_chat_id = self.bot_settings.managers_chat_id
            if manager_chat_id:
                message = (
                    f"🎯 <b>Существующий пользователь активировал ваш промокод!</b>\n\n"
                    f"<b>👤 Пользователь:</b> {username}\n"
                    f"<b>📧 Email:</b> {email}\n"
                    f"<b>🎯 Промокод:</b> {promo_code}\n"
                    f"<b>👨‍💼 Менеджер:</b> {manager_name if manager_name.startswith('@') else f'@{manager_name}'}\n"
                    f"<b>📅 Время:</b> {timezone.now().strftime('%d.%m.%Y %H:%M')}\n\n"
                    f"✅ Пользователь уже был на платформе, но активировал ваш промокод!"
                )
                
                await self.bot.send_message(chat_id=manager_chat_id, text=message, parse_mode='HTML')
                
        except Exception as e:
            logger.error(f"Error notifying manager about promo activation: {e}")
    
    async def promote_user_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда для повышения пользователя (только главный админ)"""
        user = update.effective_user
        
        if not await self.check_main_admin_permissions(user.id):
            await update.message.reply_text("❌ У вас нет прав для выполнения этой команды.")
            return
        
        if not context.args:
            await update.message.reply_text(
                "📝 Использование: /promote_user <user_id> <level>\n"
                "Уровни: main_admin, admin, manager\n"
                "Пример: /promote_user 123456789 admin"
            )
            return
        
        try:
            target_user_id = int(context.args[0])
            new_level = context.args[1]
            
            if new_level not in ['main_admin', 'admin', 'manager']:
                await update.message.reply_text("❌ Неверный уровень. Доступные: main_admin, admin, manager")
                return
            
            target_user = await sync_to_async(BotUser.objects.get)(user_id=target_user_id)
            old_level = target_user.level
            target_user.level = new_level
            target_user.promoted_by = await sync_to_async(BotUser.objects.get)(user_id=user.id)
            await sync_to_async(target_user.save)()
            
            # Очищаем кэш пользователя
            self._clear_user_cache(target_user_id)
            
            await update.message.reply_text(
                f"✅ Пользователь {target_user.first_name or target_user.username} повышен!\n"
                f"Старый уровень: {old_level}\n"
                f"Новый уровень: {new_level}"
            )
            
        except BotUser.DoesNotExist:
            await update.message.reply_text("❌ Пользователь не найден.")
        except ValueError:
            await update.message.reply_text("❌ Неверный ID пользователя.")
        except Exception as e:
            await update.message.reply_text(f"❌ Ошибка: {str(e)}")
    
    async def demote_user_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда для понижения пользователя (только главный админ)"""
        user = update.effective_user
        
        if not await self.check_main_admin_permissions(user.id):
            await update.message.reply_text("❌ У вас нет прав для выполнения этой команды.")
            return
        
        if not context.args:
            await update.message.reply_text(
                "📝 Использование: /demote_user <user_id> <level>\n"
                "Уровни: admin, manager, user\n"
                "Пример: /demote_user 123456789 manager"
            )
            return
        
        try:
            target_user_id = int(context.args[0])
            new_level = context.args[1]
            
            if new_level not in ['admin', 'manager', 'user']:
                await update.message.reply_text("❌ Неверный уровень. Доступные: admin, manager, user")
                return
            
            target_user = await sync_to_async(BotUser.objects.get)(user_id=target_user_id)
            
            # Главный админ не может быть понижен
            if target_user.level == 'main_admin':
                await update.message.reply_text("❌ Главного админа нельзя понизить.")
                return
            
            old_level = target_user.level
            target_user.level = new_level
            target_user.promoted_by = await sync_to_async(BotUser.objects.get)(user_id=user.id)
            await sync_to_async(target_user.save)()
            
            # Очищаем кэш пользователя
            self._clear_user_cache(target_user_id)
            
            await update.message.reply_text(
                f"✅ Пользователь {target_user.first_name or target_user.username} понижен!\n"
                f"Старый уровень: {old_level}\n"
                f"Новый уровень: {new_level}"
            )
            
        except BotUser.DoesNotExist:
            await update.message.reply_text("❌ Пользователь не найден.")
        except ValueError:
            await update.message.reply_text("❌ Неверный ID пользователя.")
        except Exception as e:
            await update.message.reply_text(f"❌ Ошибка: {str(e)}")
    
    async def ban_user_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда для блокировки пользователя (админы и выше)"""
        user = update.effective_user
        
        if not await self.check_admin_permissions(user.id):
            await update.message.reply_text("❌ У вас нет прав для выполнения этой команды.")
            return
        
        if not context.args:
            await update.message.reply_text(
                "📝 Использование: /ban_user <user_id> [причина]\n"
                "Пример: /ban_user 123456789 Нарушение правил"
            )
            return
        
        try:
            target_user_id = int(context.args[0])
            reason = " ".join(context.args[1:]) if len(context.args) > 1 else "Не указана"
            
            target_user = await sync_to_async(BotUser.objects.get)(user_id=target_user_id)
            
            # Проверяем, можно ли заблокировать этого пользователя
            admin_user = await sync_to_async(BotUser.objects.get)(user_id=user.id)
            if target_user.level == 'main_admin' and admin_user.level != 'main_admin':
                await update.message.reply_text("❌ Нельзя заблокировать главного админа.")
                return
            
            if target_user.level == 'admin' and admin_user.level != 'main_admin':
                await update.message.reply_text("❌ Только главный админ может заблокировать админа.")
                return
            
            target_user.is_banned = True
            await sync_to_async(target_user.save)()
            
            # Очищаем кэш пользователя
            self._clear_user_cache(target_user_id)
            
            await update.message.reply_text(
                f"✅ Пользователь {target_user.first_name or target_user.username} заблокирован!\n"
                f"Причина: {reason}"
            )
            
        except BotUser.DoesNotExist:
            await update.message.reply_text("❌ Пользователь не найден.")
        except ValueError:
            await update.message.reply_text("❌ Неверный ID пользователя.")
        except Exception as e:
            await update.message.reply_text(f"❌ Ошибка: {str(e)}")
    
    async def unban_user_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда для разблокировки пользователя (админы и выше)"""
        user = update.effective_user
        
        if not await self.check_admin_permissions(user.id):
            await update.message.reply_text("❌ У вас нет прав для выполнения этой команды.")
            return
        
        if not context.args:
            await update.message.reply_text(
                "📝 Использование: /unban_user <user_id>\n"
                "Пример: /unban_user 123456789"
            )
            return
        
        try:
            target_user_id = int(context.args[0])
            
            target_user = await sync_to_async(BotUser.objects.get)(user_id=target_user_id)
            target_user.is_banned = False
            await sync_to_async(target_user.save)()
            
            # Очищаем кэш пользователя
            self._clear_user_cache(target_user_id)
            
            await update.message.reply_text(
                f"✅ Пользователь {target_user.first_name or target_user.username} разблокирован!"
            )
            
        except BotUser.DoesNotExist:
            await update.message.reply_text("❌ Пользователь не найден.")
        except ValueError:
            await update.message.reply_text("❌ Неверный ID пользователя.")
        except Exception as e:
            await update.message.reply_text(f"❌ Ошибка: {str(e)}")
    
    async def handle_group_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команд в группах"""
        user = update.effective_user
        chat = update.effective_chat
        
        logger.info(f"Group command handler triggered. Chat ID: {chat.id}, Admin chat ID: {self.bot_settings.admin_chat_id}")
        
        # Проверяем, является ли это админ чатом
        if str(chat.id) != self.bot_settings.admin_chat_id:
            logger.info(f"Chat {chat.id} is not admin chat. Skipping.")
            return
        
        # Создаем или получаем пользователя бота
        bot_user = await self.get_or_create_bot_user(
            user_id=user.id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name
        )
        
        # Проверяем права доступа
        is_admin = await self.check_admin_permissions(user.id)
        is_manager = await self.check_manager_permissions(user.id)
        is_main_admin = await self.check_main_admin_permissions(user.id)
        
        if not (is_admin or is_manager):
            await update.message.reply_text("❌ У вас нет прав для выполнения команд в админ чате.")
            return
        
        # Перенаправляем команду на соответствующий обработчик
        command = update.message.text.split()[0][1:]  # Убираем / из команды
        
        logger.info(f"Processing command: /{command} from user {user.id}")
        
        if command == "start":
            await self.start_command(update, context)
        elif command == "status":
            await self.status_command(update, context)
        elif command == "users":
            await self.users_command(update, context)
        elif command == "payments":
            await self.payments_command(update, context)
        elif command == "kyc":
            await self.kyc_command(update, context)
        elif command == "create_promo":
            await self.create_promo_command(update, context)
        elif command == "list_promos":
            await self.list_promos_command(update, context)
        elif command == "promo_stats":
            await self.promo_stats_command(update, context)
        elif command == "promote_user" and is_main_admin:
            await self.promote_user_command(update, context)
        elif command == "demote_user" and is_main_admin:
            await self.demote_user_command(update, context)
        elif command == "ban_user" and is_admin:
            await self.ban_user_command(update, context)
        elif command == "unban_user" and is_admin:
            await self.unban_user_command(update, context)
        elif command == "set_manager_chat":
            await self.set_manager_chat_command(update, context)
        elif command == "show_settings":
            await self.show_settings_command(update, context)
        elif command == "test_notifications":
            await self.test_notifications_command(update, context)
        elif command == "get_user_id":
            await self.get_user_id_command(update, context)
        elif command == "list_bot_users":
            await self.list_bot_users_command(update, context)
        elif command == "user_detail":
            await self.user_detail_command(update, context)
        elif command == "delete_promo":
            await self.delete_promo_command(update, context)
        elif command == "view_promo":
            await self.view_promo_command(update, context)
        elif command == "help":
            await self.help_command(update, context)
        else:
            logger.warning(f"Unknown command: /{command} from user {user.id} in chat {chat.id}")
            await update.message.reply_text(f"❌ Команда /{command} не найдена или у вас нет прав для её выполнения.")
    
    async def get_user_id_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Get user ID by username"""
        user = update.effective_user
        
        # Check permissions - only admins and managers
        is_manager = await self.check_manager_permissions(user.id)
        
        if not is_manager:
            await update.message.reply_text("❌ У вас нет прав для использования этой команды.")
            return
        
        if not context.args:
            await update.message.reply_text(
                "📋 **Получить ID пользователя Telegram**\n\n"
                "Использование: /get_user_id @username\n\n"
                "Пример: /get_user_id @example_user"
            )
            return
        
        username = context.args[0].lstrip('@')
        
        try:
            # Try to get user by username
            target_user = await self.bot.get_chat(f'@{username}')
            
            message = "📋 **Информация о пользователе**\n\n"
            message += f"👤 Имя: {target_user.first_name or 'Не указано'}\n"
            if target_user.last_name:
                message += f"👤 Фамилия: {target_user.last_name}\n"
            message += f"🆔 Telegram ID: `{target_user.id}`\n"
            if target_user.username:
                message += f"👤 Username: @{target_user.username}\n"
            
            # Check if user is in database
            try:
                bot_user = await sync_to_async(BotUser.objects.get)(user_id=target_user.id)
                message += f"\n📊 **Статус в системе:**\n"
                message += f"• Уровень: {bot_user.get_level_display()}\n"
                message += f"• Активен: {'✅ Да' if bot_user.is_active else '❌ Нет'}\n"
                message += f"• Забанен: {'❌ Да' if bot_user.is_banned else '✅ Нет'}\n"
                
                # Get linked user account
                if bot_user.linked_user_id:
                    linked_user = await sync_to_async(User.objects.get)(id=bot_user.linked_user_id)
                    message += f"\n🔗 **Привязанный аккаунт:**\n"
                    message += f"• Email: {linked_user.email}\n"
                    message += f"• Баланс: {linked_user.balance_neon} NC\n"
            except BotUser.DoesNotExist:
                message += f"\n⚠️ Пользователь не найден в базе данных бота."
            
            await update.message.reply_text(message, parse_mode='Markdown')
            
        except Exception as e:
            await update.message.reply_text(f"❌ Ошибка: {str(e)}\n\nПроверьте правильность username.")
    
    async def list_bot_users_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """List all bot users (admins and managers)"""
        user = update.effective_user
        
        # Check if admin chat - no permissions needed
        if str(update.message.chat.id) == str(self.bot_settings.admin_chat_id):
            pass  # Allow in admin chat
        elif not await self.check_admin_permissions(user.id):
            await update.message.reply_text("❌ Только администраторы могут просматривать список пользователей бота.")
            return
        
        try:
            # Get all bot users
            bot_users = await sync_to_async(list)(BotUser.objects.order_by('-created_at'))
            
            message = "👥 **Список пользователей бота:**\n\n"
            
            if bot_users:
                for bot_user in bot_users:
                    status = "✅" if bot_user.is_active else "❌"
                    banned = "🚫" if bot_user.is_banned else ""
                    message += f"{status} **{bot_user.first_name}** (@{bot_user.username})\n"
                    message += f"   🆔 ID: `{bot_user.user_id}`\n"
                    message += f"   📊 Уровень: {bot_user.get_level_display()}\n"
                    message += f"   🚫 Забанен: {'Да' if bot_user.is_banned else 'Нет'}\n\n"
            else:
                message += "Пользователи не найдены"
            
            await update.message.reply_text(message, parse_mode='Markdown')
            
        except Exception as e:
            logger.error(f"Error listing bot users: {e}")
            await update.message.reply_text(f"❌ Ошибка: {str(e)}")
    
    async def user_detail_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Get detailed information about a user"""
        user = update.effective_user
        
        # Check if admin chat
        if str(update.message.chat.id) != str(self.bot_settings.admin_chat_id):
            if not await self.check_admin_permissions(user.id):
                await update.message.reply_text("❌ Только администраторы могут просматривать детали пользователя.")
                return
        
        if not context.args:
            await update.message.reply_text(
                "📋 **Информация о пользователе**\n\n"
                "Использование: /user_detail <user_id>\n\n"
                "Пример: /user_detail 123456789"
            )
            return
        
        try:
            user_id = context.args[0]
            
            # Get site user
            site_user = await sync_to_async(User.objects.get)(id=user_id)
            
            # Get bot user if exists
            try:
                bot_user = await sync_to_async(BotUser.objects.get)(user_id=site_user.telegram_id)
                bot_status = f"📱 Telegram: @{bot_user.username}\nУровень: {bot_user.get_level_display()}\nАктивен: {'Да' if bot_user.is_active else 'Нет'}"
            except BotUser.DoesNotExist:
                bot_status = "📱 Telegram: не привязан"
            
            # Get user stats
            from payments_new.models import Payment
            from django.db.models import Sum, Count
            
            total_deposits = await sync_to_async(
                Payment.objects.filter(user=site_user, type='DEPOSIT', status='COMPLETED').aggregate(total=Sum('amount'))
            )()
            total_withdrawals = await sync_to_async(
                Payment.objects.filter(user=site_user, type='WITHDRAWAL', status='COMPLETED').aggregate(total=Sum('amount'))
            )()
            
            deposit_count = await sync_to_async(Payment.objects.filter(user=site_user, type='DEPOSIT').count)()
            withdrawal_count = await sync_to_async(Payment.objects.filter(user=site_user, type='WITHDRAWAL').count)()
            
            message = f"""
📊 **Детальная информация о пользователе**

**👤 Основная информация:**
• Имя: {site_user.username or 'Не указано'}
• Email: {site_user.email}
• ID: {site_user.id}
• Регистрация: {site_user.date_joined.strftime('%d.%m.%Y %H:%M')}

**💰 Финансы:**
• Баланс: {site_user.balance_neon} NC
• Всего пополнено: {total_deposits.get('total', 0) or 0:.2f} NC
• Всего выведено: {total_withdrawals.get('total', 0) or 0:.2f} NC

**💳 Сделки:**
• Пополнений: {deposit_count}
• Выводов: {withdrawal_count}

**📱 {bot_status}**

**🔐 Статус:**
• KYC: {site_user.kyc_status if hasattr(site_user, 'kyc_status') else 'N/A'}
• Активен: {'Да' if site_user.is_active else 'Нет'}
"""
            
            await update.message.reply_text(message, parse_mode='Markdown')
            
        except User.DoesNotExist:
            await update.message.reply_text(f"❌ Пользователь с ID {context.args[0]} не найден.")
        except Exception as e:
            logger.error(f"Error getting user detail: {e}")
            await update.message.reply_text(f"❌ Ошибка: {str(e)}")
    
    async def delete_promo_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Delete a promo code"""
        user = update.effective_user
        
        # Check if admin chat
        if str(update.message.chat.id) != str(self.bot_settings.admin_chat_id):
            if not await self.check_admin_permissions(user.id):
                await update.message.reply_text("❌ Только администраторы могут удалять промокоды.")
                return
        
        if not context.args:
            await update.message.reply_text(
                "🗑️ **Удаление промокода**\n\n"
                "Использование: /delete_promo <код>\n\n"
                "Пример: /delete_promo WELCOME2024"
            )
            return
        
        try:
            promo_code = context.args[0].upper()
            
            # Get and delete promo code
            promo = await sync_to_async(PromoCode.objects.get)(code=promo_code)
            promo.delete()
            
            await update.message.reply_text(f"✅ Промокод '{promo_code}' успешно удален!")
            
        except PromoCode.DoesNotExist:
            await update.message.reply_text(f"❌ Промокод '{context.args[0]}' не найден.")
        except Exception as e:
            logger.error(f"Error deleting promo: {e}")
            await update.message.reply_text(f"❌ Ошибка: {str(e)}")
    
    async def view_promo_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """View detailed information about a promo code"""
        user = update.effective_user
        
        # Check if admin chat
        if str(update.message.chat.id) != str(self.bot_settings.admin_chat_id):
            if not await self.check_admin_permissions(user.id):
                await update.message.reply_text("❌ Только администраторы могут просматривать промокоды.")
                return
        
        if not context.args:
            await update.message.reply_text(
                "🔍 **Информация о промокоде**\n\n"
                "Использование: /view_promo <код>\n\n"
                "Пример: /view_promo WELCOME2024"
            )
            return
        
        try:
            promo_code = context.args[0].upper()
            
            # Get promo code
            promo = await sync_to_async(PromoCode.objects.get)(code=promo_code)
            
            # Get redemption stats
            from promo.models import PromoRedemption
            redemption_count = await sync_to_async(PromoRedemption.objects.filter(promo_code=promo).count)()
            
            message = f"""
🔍 **Информация о промокоде**

**📝 Основная информация:**
• Код: {promo.code}
• Название: {promo.name}
• Описание: {promo.description}
• Тип: {promo.get_promo_type_display()}

**💰 Финансы:**
• Бонус: {promo.bonus_amount} NC
• Всего использований: {redemption_count}/{promo.max_uses or '∞'}

**📊 Статус:**
• Статус: {promo.get_status_display()}
• Действителен до: {promo.expires_at.strftime('%d.%m.%Y %H:%M') if promo.expires_at else 'Бессрочно'}

**👤 Создатель:**
• {promo.created_by.username if promo.created_by else 'Система'}
• {promo.created_at.strftime('%d.%m.%Y %H:%M')}
"""
            
            await update.message.reply_text(message, parse_mode='Markdown')
            
        except PromoCode.DoesNotExist:
            await update.message.reply_text(f"❌ Промокод '{context.args[0]}' не найден.")
        except Exception as e:
            logger.error(f"Error viewing promo: {e}")
            await update.message.reply_text(f"❌ Ошибка: {str(e)}")
    
    def run(self):
        """Run the bot with optimized settings"""
        logger.info("🚀 Starting NeonCasino Telegram Bot...")
        logger.info(f"📱 Admin Chat ID: {self.bot_settings.admin_chat_id}")
        logger.info(f"🔑 Bot Token: {self.bot_settings.bot_token[:10]}...")
        logger.info(f"⚡ Cache enabled with timeout: {CACHE_TIMEOUT}s")
        logger.info(f"👥 User cache timeout: {USER_CACHE_TIMEOUT}s")
        
        try:
            self.application.run_polling(
                poll_interval=1.0,  # Оптимизированный интервал опроса
                timeout=30,  # Таймаут для запросов
                drop_pending_updates=True,  # Игнорируем старые обновления
                allowed_updates=['message', 'callback_query']  # Только нужные типы обновлений
            )
        except KeyboardInterrupt:
            logger.info("🛑 Bot stopped by user")
        except Exception as e:
            logger.error(f"❌ Bot crashed: {e}")
            raise

if __name__ == "__main__":
    bot = NeonCasinoBot()
    bot.run()










