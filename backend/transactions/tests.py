from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from .models import Transaction, DepositRequest, WithdrawalRequest, TransactionLog

User = get_user_model()


class TransactionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_transaction_creation(self):
        """Test creating a transaction"""
        transaction = Transaction.objects.create(
            user=self.user,
            transaction_type='DEPOSIT',
            amount=Decimal('100.00'),
            currency='USD',
            status='PENDING',
            description='Test deposit'
        )
        
        self.assertEqual(transaction.user, self.user)
        self.assertEqual(transaction.transaction_type, 'DEPOSIT')
        self.assertEqual(transaction.amount, Decimal('100.00'))
        self.assertEqual(transaction.status, 'PENDING')
        self.assertIsNotNone(transaction.transaction_id)
    
    def test_transaction_status_choices(self):
        """Test transaction status choices"""
        transaction = Transaction.objects.create(
            user=self.user,
            transaction_type='WITHDRAWAL',
            amount=Decimal('50.00'),
            currency='USD',
            status='COMPLETED'
        )
        
        self.assertIn(transaction.status, ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'])


class DepositRequestModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_deposit_request_creation(self):
        """Test creating a deposit request"""
        deposit = DepositRequest.objects.create(
            user=self.user,
            amount=Decimal('200.00'),
            currency='USD',
            payment_method='BANK_TRANSFER',
            status='PENDING'
        )
        
        self.assertEqual(deposit.user, self.user)
        self.assertEqual(deposit.amount, Decimal('200.00'))
        self.assertEqual(deposit.payment_method, 'BANK_TRANSFER')
        self.assertIsNotNone(deposit.reference_id)


class WithdrawalRequestModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_withdrawal_request_creation(self):
        """Test creating a withdrawal request"""
        withdrawal = WithdrawalRequest.objects.create(
            user=self.user,
            amount=Decimal('150.00'),
            currency='USD',
            payment_method='CRYPTO',
            status='PENDING'
        )
        
        self.assertEqual(withdrawal.user, self.user)
        self.assertEqual(withdrawal.amount, Decimal('150.00'))
        self.assertEqual(withdrawal.payment_method, 'CRYPTO')
        self.assertIsNotNone(withdrawal.reference_id)


class TransactionLogModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_transaction_log_creation(self):
        """Test creating a transaction log"""
        log = TransactionLog.objects.create(
            action='TEST_ACTION',
            performed_by=self.user,
            resource_type='TRANSACTION',
            resource_id='test123',
            details={'test': 'data'}
        )
        
        self.assertEqual(log.action, 'TEST_ACTION')
        self.assertEqual(log.performed_by, self.user)
        self.assertEqual(log.resource_type, 'TRANSACTION')
        self.assertEqual(log.resource_id, 'test123')
        self.assertEqual(log.details, {'test': 'data'})



















