from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import AdminDashboard, DashboardWidget, DashboardLayout, AdminNotification

User = get_user_model()


class AdminDashboardModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='adminuser',
            email='admin@example.com',
            password='adminpass123'
        )
    
    def test_dashboard_creation(self):
        """Test creating an admin dashboard"""
        dashboard = AdminDashboard.objects.create(
            name='Main Dashboard',
            description='Main administrative dashboard',
            dashboard_type='MAIN',
            created_by=self.user
        )
        
        self.assertEqual(dashboard.name, 'Main Dashboard')
        self.assertEqual(dashboard.dashboard_type, 'MAIN')
        self.assertEqual(dashboard.created_by, self.user)
        self.assertTrue(dashboard.is_active)


class DashboardWidgetModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='adminuser',
            email='admin@example.com',
            password='adminpass123'
        )
    
    def test_widget_creation(self):
        """Test creating a dashboard widget"""
        widget = DashboardWidget.objects.create(
            name='User Stats',
            description='User statistics widget',
            widget_type='CHART',
            data_source='users.stats',
            refresh_interval=300
        )
        
        self.assertEqual(widget.name, 'User Stats')
        self.assertEqual(widget.widget_type, 'CHART')
        self.assertEqual(widget.data_source, 'users.stats')
        self.assertEqual(widget.refresh_interval, 300)
        self.assertTrue(widget.is_active)


class DashboardLayoutModelTest(TestCase):
    def test_layout_creation(self):
        """Test creating a dashboard layout"""
        layout = DashboardLayout.objects.create(
            name='Default Layout',
            description='Default dashboard layout',
            layout_type='GRID',
            is_default=True
        )
        
        self.assertEqual(layout.name, 'Default Layout')
        self.assertEqual(layout.layout_type, 'GRID')
        self.assertTrue(layout.is_default)
        self.assertTrue(layout.is_active)


class AdminNotificationModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='adminuser',
            email='admin@example.com',
            password='adminpass123'
        )
    
    def test_notification_creation(self):
        """Test creating an admin notification"""
        notification = AdminNotification.objects.create(
            notification_type='SYSTEM_ALERT',
            title='System Maintenance',
            message='System will be down for maintenance',
            recipient=self.user,
            priority='HIGH'
        )
        
        self.assertEqual(notification.notification_type, 'SYSTEM_ALERT')
        self.assertEqual(notification.title, 'System Maintenance')
        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.priority, 'HIGH')
        self.assertFalse(notification.is_read)



















