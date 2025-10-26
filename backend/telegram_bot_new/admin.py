from django.contrib import admin
from .models import BotSettings, BotNotification, AdminCommand

@admin.register(BotSettings)
class BotSettingsAdmin(admin.ModelAdmin):
    list_display = ['bot_token', 'admin_chat_id', 'is_active', 'created_at', 'updated_at']
    list_editable = ['is_active']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Bot Configuration', {
            'fields': ('bot_token', 'admin_chat_id', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(BotNotification)
class BotNotificationAdmin(admin.ModelAdmin):
    list_display = ['notification_type', 'sent_to', 'sent_at', 'is_sent']
    list_filter = ['notification_type', 'is_sent', 'sent_at']
    search_fields = ['message', 'sent_to']
    readonly_fields = ['sent_at']

@admin.register(AdminCommand)
class AdminCommandAdmin(admin.ModelAdmin):
    list_display = ['command_type', 'target_id', 'admin_user', 'executed_at', 'is_executed']
    list_filter = ['command_type', 'is_executed', 'executed_at']
    search_fields = ['target_id', 'result_message']
    readonly_fields = ['executed_at']
