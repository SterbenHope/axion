from django.contrib import admin
from django.utils.html import format_html
from .models import PromoCode, PromoRedemption, PromoCampaign, PromoReward, PromoRule, PromoManager, PromoCodeRequest


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = [
        'code', 'name', 'promo_type', 'status', 'bonus_amount', 'bonus_percentage',
        'max_uses', 'current_uses', 'created_at', 'valid_until'
    ]
    list_filter = [
        'promo_type', 'status', 'created_at', 'valid_until'
    ]
    search_fields = [
        'code', 'name', 'description'
    ]
    readonly_fields = [
        'id', 'created_at', 'current_uses', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'name', 'description', 'promo_type', 'status')
        }),
        ('Bonus Configuration', {
            'fields': ('bonus_amount', 'bonus_percentage', 'max_bonus', 'min_deposit')
        }),
        ('Free Spins', {
            'fields': ('free_spins', 'free_spins_game')
        }),
        ('Usage Limits', {
            'fields': ('max_uses', 'max_uses_per_user', 'current_uses')
        }),
        ('Timing', {
            'fields': ('valid_from', 'valid_until', 'created_at')
        }),
        ('Targeting', {
            'fields': ('target_countries', 'target_user_groups', 'min_user_level')
        }),
        ('Wagering', {
            'fields': ('wagering_multiplier', 'max_wagering_amount')
        }),
        ('Terms', {
            'fields': ('terms_conditions', 'is_first_deposit_only', 'is_new_users_only')
        })
    )
    
    actions = ['activate_selected', 'deactivate_selected', 'extend_expiry']
    
    def activate_selected(self, request, queryset):
        """Activate selected promo codes"""
        count = queryset.update(status='ACTIVE')
        self.message_user(
            request, 
            f'Successfully activated {count} promo code(s).'
        )
    activate_selected.short_description = "Activate selected codes"
    
    def deactivate_selected(self, request, queryset):
        """Deactivate selected promo codes"""
        count = queryset.update(status='INACTIVE')
        self.message_user(
            request, 
            f'Successfully deactivated {count} promo code(s).'
        )
    deactivate_selected.short_description = "Deactivate selected codes"
    
    def extend_expiry(self, request, queryset):
        """Extend expiry date by 30 days"""
        from django.utils import timezone
        from datetime import timedelta
        
        count = 0
        for promo in queryset:
            if promo.valid_until:
                promo.valid_until += timedelta(days=30)
                promo.save()
                count += 1
        
        self.message_user(
            request, 
            f'Successfully extended expiry for {count} promo code(s).'
        )
    extend_expiry.short_description = "Extend expiry by 30 days"
    
    ordering = ['-created_at']


@admin.register(PromoRedemption)
class PromoRedemptionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'promo_code', 'bonus_amount', 'free_spins_awarded', 'redeemed_at', 
        'status', 'wagering_progress'
    ]
    list_filter = [
        'status', 'redeemed_at', 'promo_code__promo_type'
    ]
    search_fields = [
        'user__username', 'user__email', 'promo_code__code'
    ]
    readonly_fields = [
        'id', 'redeemed_at', 'ip_address', 'user_agent', 'wagering_progress'
    ]
    
    fieldsets = (
        ('Redemption Information', {
            'fields': ('user', 'promo_code', 'status')
        }),
        ('Bonus Details', {
            'fields': ('bonus_amount', 'free_spins_awarded', 'free_spins_used')
        }),
        ('Wagering Requirements', {
            'fields': ('wagering_requirement', 'wagering_completed', 'wagering_progress')
        }),
        ('Timing', {
            'fields': ('redeemed_at', 'expires_at', 'completed_at')
        }),
        ('Technical Details', {
            'fields': ('ip_address', 'user_agent'),
            'classes': ('collapse',)
        })
    )
    
    ordering = ['-redeemed_at']


@admin.register(PromoCampaign)
class PromoCampaignAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'status', 'start_date', 'end_date', 
        'total_redemptions', 'total_bonus_awarded', 'budget_utilization'
    ]
    list_filter = [
        'status', 'start_date', 'end_date'
    ]
    search_fields = [
        'name', 'description'
    ]
    readonly_fields = [
        'id', 'created_at', 'total_redemptions', 'total_bonus_awarded', 'conversion_rate'
    ]
    
    fieldsets = (
        ('Campaign Information', {
            'fields': ('name', 'description', 'status')
        }),
        ('Timing', {
            'fields': ('start_date', 'end_date')
        }),
        ('Budget', {
            'fields': ('budget', 'spent_budget')
        }),
        ('Targeting', {
            'fields': ('target_audience',)
        }),
        ('Statistics', {
            'fields': ('total_redemptions', 'total_bonus_awarded', 'conversion_rate'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    ordering = ['-start_date']




@admin.register(PromoRule)
class PromoRuleAdmin(admin.ModelAdmin):
    list_display = ['promo_code', 'rule_type', 'rule_value', 'is_active', 'created_at']
    list_filter = ['rule_type', 'is_active', 'created_at']
    search_fields = ['promo_code__code', 'rule_type']
    list_editable = ['is_active']
    
    fieldsets = (
        ('Rule Information', {
            'fields': ('promo_code', 'rule_type', 'rule_value', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['promo_code', 'rule_type']


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
