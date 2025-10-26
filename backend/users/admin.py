from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, UserProfile, UserSession


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for User model."""
    
    list_display = (
        'username', 'email', 'first_name', 'last_name', 
        'kyc_status', 'balance_neon', 'is_active', 'date_joined'
    )
    list_filter = (
        'kyc_status', 'is_active', 'is_staff', 'is_superuser',
        'is_email_verified', 'date_joined'
    )
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {
            'fields': ('first_name', 'last_name', 'email', 'avatar', 'phone_number', 'date_of_birth')
        }),
        (_('KYC & Verification'), {
            'fields': ('kyc_status', 'is_email_verified')
        }),
        (_('Financial'), {
            'fields': ('balance_neon',)
        }),
        (_('Referral'), {
            'fields': ('referrer', 'ref_source_code')
        }),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ('date_joined', 'last_login', 'balance_neon')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Admin interface for UserProfile model."""
    
    list_display = (
        'user', 'favorite_game', 'total_games_played', 
        'total_wins', 'total_losses', 'win_rate'
    )
    list_filter = ('favorite_game', 'notifications_enabled', 'email_marketing')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('win_rate', 'created_at', 'updated_at')
    
    fieldsets = (
        (None, {'fields': ('user',)}),
        (_('Gaming'), {
            'fields': ('favorite_game', 'total_games_played', 'total_wins', 'total_losses')
        }),
        (_('Achievements'), {
            'fields': ('achievements',)
        }),
        (_('Settings'), {
            'fields': ('notifications_enabled', 'email_marketing')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    """Admin interface for UserSession model."""
    
    list_display = (
        'user', 'session_key', 'ip_address', 'is_active', 
        'created_at', 'last_activity'
    )
    list_filter = ('is_active', 'created_at', 'last_activity')
    search_fields = ('user__username', 'session_key', 'ip_address')
    readonly_fields = ('created_at', 'last_activity')
    
    fieldsets = (
        (None, {'fields': ('user', 'session_key')}),
        (_('Connection'), {
            'fields': ('ip_address', 'user_agent')
        }),
        (_('Status'), {
            'fields': ('is_active',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'last_activity')
        }),
    )



















