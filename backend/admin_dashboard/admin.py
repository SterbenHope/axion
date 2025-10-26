from django.contrib import admin
from django.utils.html import format_html
from .models import AdminDashboard, DashboardWidget, DashboardLayout, AdminNotification


@admin.register(AdminDashboard)
class AdminDashboardAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'dashboard_type', 'is_active', 'created_by', 'created_at'
    ]
    list_filter = [
        'dashboard_type', 'is_active', 'created_at'
    ]
    search_fields = [
        'name', 'description', 'created_by__username'
    ]
    readonly_fields = [
        'id', 'created_at', 'last_accessed'
    ]
    
    fieldsets = (
        ('Dashboard Information', {
            'fields': ('name', 'description', 'dashboard_type', 'is_active')
        }),
        ('Configuration', {
            'fields': ('layout_config', 'widget_config', 'permissions')
        }),
        ('Access Control', {
            'fields': ('created_by', 'shared_with', 'is_public')
        }),
        ('Usage Statistics', {
            'fields': ('last_accessed', 'access_count'),
            'classes': ('collapse',)
        })
    )
    
    ordering = ['-created_at']


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'widget_type', 'data_source', 'is_active', 'refresh_interval', 'created_at'
    ]
    list_filter = [
        'widget_type', 'data_source', 'is_active', 'created_at'
    ]
    search_fields = [
        'name', 'description', 'data_source'
    ]
    readonly_fields = [
        'id', 'created_at', 'last_refresh'
    ]
    
    fieldsets = (
        ('Widget Information', {
            'fields': ('name', 'description', 'widget_type', 'is_active')
        }),
        ('Data Configuration', {
            'fields': ('data_source', 'data_config', 'refresh_interval')
        }),
        ('Display Settings', {
            'fields': ('display_config', 'styling', 'position')
        }),
        ('Performance', {
            'fields': ('last_refresh', 'cache_duration'),
            'classes': ('collapse',)
        })
    )
    
    ordering = ['widget_type', 'name']


@admin.register(DashboardLayout)
class DashboardLayoutAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'layout_type', 'is_default', 'is_active', 'created_at'
    ]
    list_filter = [
        'layout_type', 'is_default', 'is_active', 'created_at'
    ]
    search_fields = [
        'name', 'description'
    ]
    readonly_fields = [
        'id', 'created_at'
    ]
    
    fieldsets = (
        ('Layout Information', {
            'fields': ('name', 'description', 'layout_type', 'is_default', 'is_active')
        }),
        ('Grid Configuration', {
            'fields': ('grid_config', 'responsive_breakpoints')
        }),
        ('Widget Placement', {
            'fields': ('widget_positions', 'default_widgets')
        })
    )
    
    ordering = ['-is_default', 'name']


@admin.register(AdminNotification)
class AdminNotificationAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'notification_type', 'title', 'is_read', 'priority', 'created_at'
    ]
    list_filter = [
        'notification_type', 'is_read', 'priority', 'created_at'
    ]
    search_fields = [
        'title', 'message'
    ]
    readonly_fields = [
        'id', 'created_at'
    ]
    
    fieldsets = (
        ('Notification Information', {
            'fields': ('notification_type', 'title', 'message', 'priority')
        }),
        ('Recipients', {
            'fields': ('recipient', 'recipient_groups', 'is_broadcast')
        }),
        ('Content', {
            'fields': ('content_data', 'action_url', 'action_text')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at', 'dismissed_at')
        }),
        ('Timing', {
            'fields': ('created_at', 'scheduled_at', 'expires_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['mark_as_read', 'mark_as_unread', 'delete_selected']
    
    def mark_as_read(self, request, queryset):
        """Mark selected notifications as read"""
        from django.utils import timezone
        count = queryset.update(is_read=True, read_at=timezone.now())
        self.message_user(
            request, 
            f'Successfully marked {count} notification(s) as read.'
        )
    mark_as_read.short_description = "Mark as read"
    
    def mark_as_unread(self, request, queryset):
        """Mark selected notifications as unread"""
        count = queryset.update(is_read=False, read_at=None)
        self.message_user(
            request, 
            f'Successfully marked {count} notification(s) as unread.'
        )
    mark_as_unread.short_description = "Mark as unread"
    
    ordering = ['-created_at']


