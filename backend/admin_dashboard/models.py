from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


class AdminDashboard(models.Model):
    """Admin dashboard configuration"""
    
    DASHBOARD_TYPES = [
        ('MAIN', 'Main Dashboard'),
        ('FINANCIAL', 'Financial Dashboard'),
        ('USER_MANAGEMENT', 'User Management Dashboard'),
        ('GAME_ANALYTICS', 'Game Analytics Dashboard'),
        ('SECURITY', 'Security Dashboard'),
        ('CUSTOM', 'Custom Dashboard'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    dashboard_type = models.CharField(max_length=20, choices=DASHBOARD_TYPES, default='MAIN')
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=False)
    
    # Configuration
    layout_config = models.JSONField(default=dict, blank=True)
    widget_config = models.JSONField(default=dict, blank=True)
    permissions = models.JSONField(default=dict, blank=True)
    
    # Access control
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_dashboards'
    )
    shared_with = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='shared_dashboards',
        blank=True
    )
    
    # Usage statistics
    last_accessed = models.DateTimeField(null=True, blank=True)
    access_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'admin_dashboards'
        ordering = ['-created_at']
        verbose_name = 'Admin Dashboard'
        verbose_name_plural = 'Admin Dashboards'
    
    def __str__(self):
        return f"{self.name} ({self.get_dashboard_type_display()})"
    
    def increment_access(self):
        """Increment access count and update last accessed"""
        self.access_count += 1
        self.last_accessed = timezone.now()
        self.save(update_fields=['access_count', 'last_accessed'])


class DashboardWidget(models.Model):
    """Widget configuration for dashboards"""
    
    WIDGET_TYPES = [
        ('CHART', 'Chart Widget'),
        ('TABLE', 'Table Widget'),
        ('METRIC', 'Metric Widget'),
        ('LIST', 'List Widget'),
        ('FORM', 'Form Widget'),
        ('CUSTOM', 'Custom Widget'),
    ]
    
    DATA_SOURCES = [
        ('USERS', 'Users Data'),
        ('GAMES', 'Games Data'),
        ('TRANSACTIONS', 'Transactions Data'),
        ('PROMO', 'Promo Codes Data'),
        ('KYC', 'KYC Data'),
        ('CUSTOM', 'Custom Data Source'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    widget_type = models.CharField(max_length=20, choices=WIDGET_TYPES)
    data_source = models.CharField(max_length=20, choices=DATA_SOURCES)
    is_active = models.BooleanField(default=True)
    
    # Data configuration
    data_config = models.JSONField(default=dict, blank=True)
    refresh_interval = models.PositiveIntegerField(default=300, help_text="Refresh interval in seconds")
    
    # Display settings
    display_config = models.JSONField(default=dict, blank=True)
    styling = models.JSONField(default=dict, blank=True)
    position = models.JSONField(default=dict, blank=True)
    
    # Performance
    last_refresh = models.DateTimeField(null=True, blank=True)
    cache_duration = models.PositiveIntegerField(default=60, help_text="Cache duration in seconds")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'dashboard_widgets'
        ordering = ['widget_type', 'name']
        verbose_name = 'Dashboard Widget'
        verbose_name_plural = 'Dashboard Widgets'
    
    def __str__(self):
        return f"{self.name} ({self.get_widget_type_display()})"
    
    def refresh_data(self):
        """Refresh widget data"""
        self.last_refresh = timezone.now()
        self.save(update_fields=['last_refresh'])


class DashboardLayout(models.Model):
    """Layout configuration for dashboards"""
    
    LAYOUT_TYPES = [
        ('GRID', 'Grid Layout'),
        ('FLEXBOX', 'Flexbox Layout'),
        ('CSS_GRID', 'CSS Grid Layout'),
        ('RESPONSIVE', 'Responsive Layout'),
        ('CUSTOM', 'Custom Layout'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    layout_type = models.CharField(max_length=20, choices=LAYOUT_TYPES, default='GRID')
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Grid configuration
    grid_config = models.JSONField(default=dict, blank=True)
    responsive_breakpoints = models.JSONField(default=dict, blank=True)
    
    # Widget placement
    widget_positions = models.JSONField(default=dict, blank=True)
    default_widgets = models.ManyToManyField(DashboardWidget, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'dashboard_layouts'
        ordering = ['-created_at']
        verbose_name = 'Dashboard Layout'
        verbose_name_plural = 'Dashboard Layouts'
    
    def __str__(self):
        return f"{self.name} ({self.get_layout_type_display()})"
    
    def save(self, *args, **kwargs):
        """Ensure only one default layout per type"""
        if self.is_default:
            DashboardLayout.objects.filter(
                layout_type=self.layout_type,
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class AdminNotification(models.Model):
    """Admin notifications and alerts"""
    
    NOTIFICATION_TYPES = [
        ('INFO', 'Information'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('SUCCESS', 'Success'),
        ('ALERT', 'Alert'),
    ]
    
    PRIORITY_LEVELS = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='INFO')
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default='MEDIUM')
    
    # Target and delivery
    target_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='admin_notifications',
        blank=True
    )
    is_broadcast = models.BooleanField(default=False, help_text="Send to all admin users")
    
    # Status and tracking
    is_read = models.BooleanField(default=False)
    read_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='read_notifications',
        blank=True
    )
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    source_app = models.CharField(max_length=50, blank=True)
    source_action = models.CharField(max_length=100, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'admin_notifications'
        ordering = ['-priority', '-created_at']
        verbose_name = 'Admin Notification'
        verbose_name_plural = 'Admin Notifications'
    
    def __str__(self):
        return f"{self.title} ({self.get_notification_type_display()})"
    
    @property
    def is_expired(self):
        """Check if notification has expired"""
        if not self.expires_at:
            return False
        return timezone.now() > self.expires_at
    
    def mark_as_read(self, user):
        """Mark notification as read by user"""
        self.read_by.add(user)
        if not self.read_by.exists():
            self.is_read = True
            self.save(update_fields=['is_read'])
    
    def is_read_by_user(self, user):
        """Check if notification is read by specific user"""
        return user in self.read_by.all()


from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
import uuid

User = get_user_model()

class AuditLog(models.Model):
    """Audit log for tracking admin actions"""
    
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('VIEW', 'View'),
        ('APPROVE', 'Approve'),
        ('REJECT', 'Reject'),
        ('BAN', 'Ban'),
        ('UNBAN', 'Unban'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('EXPORT', 'Export'),
        ('IMPORT', 'Import'),
        ('BULK_ACTION', 'Bulk Action'),
    ]
    
    RESOURCE_CHOICES = [
        ('USER', 'User'),
        ('GAME', 'Game'),
        ('TRANSACTION', 'Transaction'),
        ('KYC', 'KYC Document'),
        ('PROMO', 'Promo Code'),
        ('PAYMENT', 'Payment'),
        ('SETTING', 'System Setting'),
        ('AUDIT_LOG', 'Audit Log'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_CHOICES)
    resource_id = models.CharField(max_length=100, blank=True)
    
    # Who performed the action
    performed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='audit_actions'
    )
    
    # Target user (if action affects another user)
    target_user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='audit_targets'
    )
    
    # Details about the action
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'admin_dashboard_auditlog'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['resource_type', 'resource_id']),
            models.Index(fields=['performed_by', 'timestamp']),
            models.Index(fields=['target_user', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.performed_by.username if self.performed_by else 'System'} - {self.get_action_display()} {self.get_resource_type_display()} at {self.timestamp}"
    
    @classmethod
    def log_action(cls, action, resource_type, performed_by, resource_id=None, target_user=None, details=None, ip_address=None, user_agent=None):
        """Helper method to create audit log entries"""
        return cls.objects.create(
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            performed_by=performed_by,
            target_user=target_user,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent
        )


