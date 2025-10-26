from django.db import models
from django.conf import settings
from django.contrib.auth.models import User

class BotSettings(models.Model):
    """Telegram bot settings"""
    bot_token = models.CharField(max_length=100, unique=True)
    admin_chat_id = models.CharField(max_length=100, default="-1002802840685")
    managers_chat_id = models.CharField(max_length=100, null=True, blank=True, help_text='Chat ID for managers notifications')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Bot Settings (Active: {self.is_active})"
    
    class Meta:
        verbose_name = 'Bot Settings'
        verbose_name_plural = 'Bot Settings'

class BotNotification(models.Model):
    """Telegram bot notifications"""
    NOTIFICATION_TYPES = [
        ('user_registration', 'User Registration'),
        ('payment_created', 'Payment Created'),
        ('payment_status_changed', 'Payment Status Changed'),
        ('kyc_submitted', 'KYC Submitted'),
        ('kyc_approved', 'KYC Approved'),
        ('kyc_rejected', 'KYC Rejected'),
        ('admin_alert', 'Admin Alert'),
        ('system_alert', 'System Alert'),
    ]
    
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    message = models.TextField()
    sent_to = models.CharField(max_length=100)  # chat_id
    sent_at = models.DateTimeField(auto_now_add=True)
    is_sent = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.notification_type} - {self.sent_to}"
    
    class Meta:
        ordering = ['-sent_at']
        verbose_name = 'Bot Notification'
        verbose_name_plural = 'Bot Notifications'

class BotUser(models.Model):
    """Telegram bot users with access levels"""
    USER_LEVELS = [
        ('main_admin', 'Главный Администратор'),
        ('admin', 'Администратор'),
        ('manager', 'Менеджер'),
        ('user', 'Пользователь'),
    ]
    
    user_id = models.BigIntegerField(unique=True, help_text='Telegram User ID')
    username = models.CharField(max_length=100, blank=True, null=True)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    level = models.CharField(max_length=20, choices=USER_LEVELS, default='user')
    is_active = models.BooleanField(default=True)
    is_banned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    promoted_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='promoted_users')
    
    def __str__(self):
        return f"{self.first_name} (@{self.username}) - {self.get_level_display()}"
    
    def can_manage_users(self):
        """Can manage other users"""
        return self.level in ['main_admin', 'admin']
    
    def can_manage_admins(self):
        """Can manage administrators (only main admin)"""
        return self.level == 'main_admin'
    
    def can_manage_managers(self):
        """Can manage managers"""
        return self.level in ['main_admin', 'admin']
    
    def can_manage_promocodes(self):
        """Can manage promo codes"""
        return self.level in ['main_admin', 'admin', 'manager']
    
    def can_manage_payments(self):
        """Can manage payments"""
        return self.level in ['main_admin', 'admin']
    
    def can_manage_kyc(self):
        """Can manage KYC"""
        return self.level in ['main_admin', 'admin']
    
    class Meta:
        verbose_name = 'Bot User'
        verbose_name_plural = 'Bot Users'
        ordering = ['-created_at']

class AdminCommand(models.Model):
    """Admin commands for Telegram bot"""
    COMMAND_TYPES = [
        ('approve_payment', 'Approve Payment'),
        ('reject_payment', 'Reject Payment'),
        ('approve_kyc', 'Approve KYC'),
        ('reject_kyc', 'Reject KYC'),
        ('ban_user', 'Ban User'),
        ('unban_user', 'Unban User'),
        ('promote_user', 'Promote User'),
        ('demote_user', 'Demote User'),
        ('system_status', 'System Status'),
        ('user_stats', 'User Stats'),
        ('payment_stats', 'Payment Stats'),
        ('create_promo', 'Create Promo Code'),
        ('list_promos', 'List Promo Codes'),
        ('promo_stats', 'Promo Statistics'),
    ]
    
    command_type = models.CharField(max_length=50, choices=COMMAND_TYPES)
    target_id = models.CharField(max_length=100, blank=True, null=True)  # payment_id, user_id, etc.
    admin_user = models.ForeignKey(BotUser, on_delete=models.SET_NULL, null=True, blank=True)
    executed_at = models.DateTimeField(auto_now_add=True)
    is_executed = models.BooleanField(default=False)
    result_message = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.command_type} - {self.target_id} by {self.admin_user}"
    
    class Meta:
        ordering = ['-executed_at']
        verbose_name = 'Admin Command'
        verbose_name_plural = 'Admin Commands'
