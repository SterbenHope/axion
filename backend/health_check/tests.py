from django.test import TestCase
from .models import HealthCheck, HealthCheckLog


class HealthCheckModelTest(TestCase):
    def test_health_check_creation(self):
        """Test creating a health check"""
        health_check = HealthCheck.objects.create(
            service_name='database',
            endpoint_url='http://localhost:5432/health',
            timeout=5,
            retry_count=3,
            check_interval=60
        )
        
        self.assertEqual(health_check.service_name, 'database')
        self.assertEqual(health_check.endpoint_url, 'http://localhost:5432/health')
        self.assertEqual(health_check.timeout, 5)
        self.assertEqual(health_check.retry_count, 3)
        self.assertEqual(health_check.check_interval, 60)
        self.assertTrue(health_check.is_active)
    
    def test_health_check_status_choices(self):
        """Test health check status choices"""
        health_check = HealthCheck.objects.create(
            service_name='redis',
            endpoint_url='http://localhost:6379/health',
            status='HEALTHY'
        )
        
        self.assertIn(health_check.status, ['HEALTHY', 'UNHEALTHY', 'UNKNOWN', 'ERROR'])


class HealthCheckLogModelTest(TestCase):
    def test_health_check_log_creation(self):
        """Test creating a health check log"""
        log = HealthCheckLog.objects.create(
            service_name='database',
            status='HEALTHY',
            response_time=0.05,
            response_size=1024
        )
        
        self.assertEqual(log.service_name, 'database')
        self.assertEqual(log.status, 'HEALTHY')
        self.assertEqual(log.response_time, 0.05)
        self.assertEqual(log.response_size, 1024)
    
    def test_health_check_log_with_error(self):
        """Test creating a health check log with error"""
        log = HealthCheckLog.objects.create(
            service_name='redis',
            status='ERROR',
            response_time=5.0,
            error_message='Connection timeout',
            error_code='TIMEOUT'
        )
        
        self.assertEqual(log.status, 'ERROR')
        self.assertEqual(log.error_message, 'Connection timeout')
        self.assertEqual(log.error_code, 'TIMEOUT')



















