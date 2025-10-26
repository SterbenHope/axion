from django.contrib import admin
from .models import HealthCheck, HealthCheckLog


@admin.register(HealthCheck)
class HealthCheckAdmin(admin.ModelAdmin):
    list_display = [
        'service_name', 'status', 'last_check', 'response_time', 'is_critical'
    ]
    list_filter = [
        'status', 'is_critical', 'last_check'
    ]
    search_fields = [
        'service_name', 'endpoint_url'
    ]
    readonly_fields = [
        'id', 'last_check', 'response_time', 'last_error'
    ]
    
    fieldsets = (
        ('Service Information', {
            'fields': ('service_name', 'endpoint_url', 'is_critical')
        }),
        ('Configuration', {
            'fields': ('timeout', 'retry_count', 'check_interval')
        }),
        ('Status', {
            'fields': ('status', 'last_check', 'response_time', 'last_error')
        }),
        ('Notifications', {
            'fields': ('notify_on_failure', 'notify_recipients')
        })
    )
    
    ordering = ['service_name']


@admin.register(HealthCheckLog)
class HealthCheckLogAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'service_name', 'status', 'response_time', 'checked_at', 'error_message'
    ]
    list_filter = [
        'status', 'checked_at', 'service_name'
    ]
    search_fields = [
        'service_name', 'error_message'
    ]
    readonly_fields = [
        'id', 'checked_at', 'response_time'
    ]
    
    fieldsets = (
        ('Check Information', {
            'fields': ('service_name', 'status', 'checked_at')
        }),
        ('Performance', {
            'fields': ('response_time', 'response_size')
        }),
        ('Error Details', {
            'fields': ('error_message', 'error_code', 'stack_trace')
        }),
        ('Response Data', {
            'fields': ('response_headers', 'response_body'),
            'classes': ('collapse',)
        })
    )
    
    ordering = ['-checked_at']



















