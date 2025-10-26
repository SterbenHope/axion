from django.contrib import admin
from .models import PromoCode, PromoCodeUsage, PromoManager, PromoCodeRequest

@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = [
        'code', 'name', 'discount_type', 'discount_value', 'status',
        'current_uses', 'total_max_uses', 'valid_from', 'valid_until'
    ]
    list_filter = ['status', 'discount_type', 'created_at']
    search_fields = ['code', 'name', 'description']
    readonly_fields = ['current_uses', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'name', 'description', 'status')
        }),
        ('Discount Settings', {
            'fields': ('discount_type', 'discount_value', 'max_discount')
        }),
        ('Usage Limits', {
            'fields': ('max_uses', 'total_max_uses', 'current_uses')
        }),
        ('Validity', {
            'fields': ('valid_from', 'valid_until')
        }),
        ('Requirements', {
            'fields': ('min_deposit', 'min_games_played')
        }),
        ('Restrictions', {
            'fields': ('restricted_to_new_users', 'restricted_to_existing_users', 'restricted_countries')
        }),
        ('Management', {
            'fields': ('created_by', 'created_at', 'updated_at')
        })
    )


@admin.register(PromoCodeUsage)
class PromoCodeUsageAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'promo_code', 'used_at', 'status', 'deposit_amount',
        'discount_amount', 'bonus_coins', 'assigned_manager'
    ]
    list_filter = ['status', 'used_at', 'promo_code']
    search_fields = ['user__email', 'promo_code__code']
    readonly_fields = ['used_at', 'ip_address', 'user_agent']
    
    fieldsets = (
        ('Usage Information', {
            'fields': ('promo_code', 'user', 'used_at', 'status')
        }),
        ('Financial Details', {
            'fields': ('deposit_amount', 'discount_amount', 'bonus_coins')
        }),
        ('Management', {
            'fields': ('assigned_manager', 'notes')
        }),
        ('Technical Details', {
            'fields': ('ip_address', 'user_agent')
        })
    )


@admin.register(PromoManager)
class PromoManagerAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'telegram_username', 'status', 'experience_years',
        'total_promos_created', 'total_users_referred', 'commission_rate'
    ]
    list_filter = ['status', 'experience_years', 'created_at']
    search_fields = ['user__email', 'telegram_username']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'telegram_username', 'telegram_chat_id')
        }),
        ('Experience & Skills', {
            'fields': ('experience_years', 'experience_description', 'skills')
        }),
        ('Status & Approval', {
            'fields': ('status', 'approved_by', 'approved_at')
        }),
        ('Performance Metrics', {
            'fields': ('total_promos_created', 'total_users_referred', 'total_revenue_generated')
        }),
        ('Commission', {
            'fields': ('commission_rate',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        })
    )


@admin.register(PromoCodeRequest)
class PromoCodeRequestAdmin(admin.ModelAdmin):
    list_display = [
        'promo_code', 'manager', 'discount_type', 'discount_value',
        'status', 'created_at', 'reviewed_at'
    ]
    list_filter = ['status', 'discount_type', 'created_at']
    search_fields = ['promo_code', 'manager__user__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Request Information', {
            'fields': ('manager', 'promo_code', 'name', 'description')
        }),
        ('Discount Details', {
            'fields': ('discount_type', 'discount_value', 'max_discount')
        }),
        ('Usage Settings', {
            'fields': ('max_uses_per_user', 'total_max_uses', 'valid_days')
        }),
        ('Status & Review', {
            'fields': ('status', 'admin_notes', 'reviewed_by', 'reviewed_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        })
    )
    
    actions = ['approve_requests', 'reject_requests']
    
    def approve_requests(self, request, queryset):
        """Approve selected promo code requests"""
        approved_count = 0
        for promo_request in queryset.filter(status='pending'):
            try:
                # Create promo code
                from .models import PromoCode
                from django.utils import timezone
                
                promo = PromoCode.objects.create(
                    code=promo_request.promo_code,
                    name=promo_request.name,
                    description=promo_request.description,
                    discount_type=promo_request.discount_type,
                    discount_value=promo_request.discount_value,
                    max_discount=promo_request.max_discount,
                    max_uses=promo_request.max_uses_per_user,
                    total_max_uses=promo_request.total_max_uses,
                    valid_from=timezone.now(),
                    valid_until=timezone.now() + timezone.timedelta(days=promo_request.valid_days),
                    created_by=promo_request.manager.user
                )
                
                # Update request status
                promo_request.status = 'approved'
                promo_request.reviewed_by = request.user
                promo_request.reviewed_at = timezone.now()
                promo_request.save()
                
                approved_count += 1
                
            except Exception as e:
                self.message_user(request, f"Error approving {promo_request.promo_code}: {e}")
        
        self.message_user(request, f"Successfully approved {approved_count} promo code requests")
    
    def reject_requests(self, request, queryset):
        """Reject selected promo code requests"""
        rejected_count = queryset.filter(status='pending').update(
            status='rejected',
            reviewed_by=request.user,
            reviewed_at=timezone.now()
        )
        self.message_user(request, f"Successfully rejected {rejected_count} promo code requests")
    
    approve_requests.short_description = "Approve selected promo code requests"
    reject_requests.short_description = "Reject selected promo code requests"








