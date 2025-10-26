from django.contrib import admin
from django.utils.html import format_html
from .models import Transaction, PaymentMethod, TransactionLog


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'transaction_type', 'amount', 'currency', 'status', 
        'payment_method', 'created_at', 'processed_at'
    ]
    list_filter = [
        'transaction_type', 'status', 'currency', 'payment_method', 'created_at', 'processed_at'
    ]
    search_fields = [
        'user__username', 'user__email', 'description', 'payment_reference'
    ]
    readonly_fields = [
        'id', 'created_at', 'processed_at', 'completed_at', 'ip_address', 'user_agent'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'transaction_type', 'amount', 'currency', 'status')
        }),
        ('Payment Details', {
            'fields': ('payment_method', 'payment_reference')
        }),
        ('Related Entities', {
            'fields': ('game_round', 'promo_code'),
            'classes': ('collapse',)
        }),
        ('Balance Tracking', {
            'fields': ('balance_before', 'balance_after', 'net_amount')
        }),
        ('Fees and Taxes', {
            'fields': ('fee_amount', 'tax_amount'),
            'classes': ('collapse',)
        }),
        ('Details', {
            'fields': ('description', 'admin_notes', 'metadata')
        }),
        ('Timing', {
            'fields': ('created_at', 'processed_at', 'completed_at'),
            'classes': ('collapse',)
        }),
        ('Technical Details', {
            'fields': ('ip_address', 'user_agent'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['process_selected', 'complete_selected', 'fail_selected']
    
    def process_selected(self, request, queryset):
        """Process selected transactions"""
        count = 0
        for transaction in queryset.filter(status='PENDING'):
            transaction.process_transaction()
            count += 1
        
        self.message_user(
            request, 
            f'Successfully processed {count} transaction(s).'
        )
    process_selected.short_description = "Process selected transactions"
    
    def complete_selected(self, request, queryset):
        """Complete selected transactions"""
        count = 0
        for transaction in queryset.filter(status__in=['PENDING', 'PROCESSING']):
            transaction.complete_transaction()
            count += 1
        
        self.message_user(
            request, 
            f'Successfully completed {count} transaction(s).'
        )
    complete_selected.short_description = "Complete selected transactions"
    
    def fail_selected(self, request, queryset):
        """Fail selected transactions"""
        count = 0
        for transaction in queryset.filter(status__in=['PENDING', 'PROCESSING']):
            transaction.fail_transaction("Bulk failure")
            count += 1
        
        self.message_user(
            request, 
            f'Successfully failed {count} transaction(s).'
        )
    fail_selected.short_description = "Fail selected transactions"
    
    ordering = ['-created_at']


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'payment_type', 'name', 'is_default', 'status', 'is_verified', 'created_at'
    ]
    list_filter = [
        'payment_type', 'status', 'is_verified', 'is_default', 'created_at'
    ]
    search_fields = [
        'user__username', 'user__email', 'name', 'payment_type'
    ]
    readonly_fields = [
        'id', 'created_at', 'verification_date', 'last_used'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'payment_type', 'name', 'is_default', 'status')
        }),
        ('Payment Details', {
            'fields': ('encrypted_data', 'last_four_digits', 'expiry_date')
        }),
        ('Verification', {
            'fields': ('is_verified', 'verification_date')
        }),
        ('Usage Statistics', {
            'fields': ('total_transactions', 'total_amount', 'last_used'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['verify_selected_methods', 'block_selected_methods']
    
    def verify_selected_methods(self, request, queryset):
        """Verify selected payment methods"""
        count = 0
        for method in queryset.filter(is_verified=False):
            method.verify_payment_method()
            count += 1
        
        self.message_user(
            request, 
            f'Successfully verified {count} payment method(s).'
        )
    verify_selected_methods.short_description = "Verify selected methods"
    
    def block_selected_methods(self, request, queryset):
        """Block selected payment methods"""
        count = 0
        for method in queryset.filter(status='ACTIVE'):
            method.block_payment_method("Bulk blocking")
            count += 1
        
        self.message_user(
            request, 
            f'Successfully blocked {count} payment method(s).'
        )
    block_selected_methods.short_description = "Block selected methods"
    
    ordering = ['-is_default', '-created_at']





@admin.register(TransactionLog)
class TransactionLogAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'transaction', 'action', 'performed_by', 'timestamp'
    ]
    list_filter = ['action', 'timestamp', 'performed_by']
    search_fields = [
        'transaction__user__username', 'transaction__user__email', 
        'performed_by__username', 'action'
    ]
    readonly_fields = [
        'id', 'timestamp', 'metadata_formatted'
    ]
    
    fieldsets = (
        ('Log Information', {
            'fields': ('transaction', 'action', 'performed_by', 'timestamp')
        }),
        ('Details', {
            'fields': ('details', 'metadata_formatted')
        })
    )
    
    def metadata_formatted(self, obj):
        """Format JSON metadata for display"""
        if obj.metadata:
            import json
            return format_html(
                '<pre style="max-height: 200px; overflow-y: auto;">{}</pre>',
                json.dumps(obj.metadata, indent=2)
            )
        return '-'
    metadata_formatted.short_description = 'Metadata'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'transaction__user', 'performed_by'
        )
    
    ordering = ['-timestamp']
