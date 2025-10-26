from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator
import uuid

# Constants for crypto payments
CRYPTO_CURRENCIES = [
    ('BTC', 'Bitcoin'),
    ('ETH', 'Ethereum'),
    ('USDT', 'Tether'),
    ('BNB', 'Binance Coin')
]

PAYMENT_STATUS_CHOICES = [
    ('PENDING', 'Pending'),
    ('COMPLETED', 'Completed'),
    ('FAILED', 'Failed'),
    ('EXPIRED', 'Expired')
]


class Transaction(models.Model):
    """Financial transactions for users"""
    
    TYPE_CHOICES = [
        ('DEPOSIT', 'Deposit'),
        ('WITHDRAWAL', 'Withdrawal'),
        ('BET', 'Bet'),
        ('WIN', 'Win'),
        ('BONUS', 'Bonus'),
        ('REFUND', 'Refund'),
        ('ADJUSTMENT', 'Adjustment'),
        ('TRANSFER', 'Transfer'),
        ('FEE', 'Fee'),
        ('CASHBACK', 'Cashback'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
        ('REVERSED', 'Reversed'),
        ('ON_HOLD', 'On Hold'),
    ]
    
    PAYMENT_METHODS = [
        ('CREDIT_CARD', 'Credit Card'),
        ('DEBIT_CARD', 'Debit Card'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('E_WALLET', 'E-Wallet'),
        ('CRYPTO', 'Cryptocurrency'),
        ('CASH', 'Cash'),
        ('OTHER', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    
    # Transaction details
    transaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0.01)])
    currency = models.CharField(max_length=3, default='USD')
    
    # Payment method
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, blank=True)
    payment_reference = models.CharField(max_length=255, blank=True)
    
    # Related entities
    game_round = models.ForeignKey(
        'games.GameRound',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )
    promo_code = models.ForeignKey(
        'promo.PromoCode',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )
    
    # External references
    reference_id = models.CharField(max_length=100, blank=True)
    external_reference = models.CharField(max_length=255, blank=True)

    # Balance tracking
    balance_before = models.DecimalField(max_digits=15, decimal_places=2)
    balance_after = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Fees and taxes
    fee_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Metadata
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Audit fields
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    admin_notes = models.TextField(blank=True)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_transactions'
    )

    # Optional link to KYC verification
    kyc_submission = models.ForeignKey(
        'kyc.KYCVerification', on_delete=models.SET_NULL, null=True, blank=True, related_name='related_transactions'
    )
    
    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
        indexes = [
            models.Index(fields=['user', 'transaction_type']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['transaction_type', 'status']),
            models.Index(fields=['payment_method', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.get_transaction_type_display()} ({self.amount} {self.currency})"
    
    def save(self, *args, **kwargs):
        """Calculate net amount and balance after"""
        if not self.net_amount:
            self.net_amount = self.amount - self.fee_amount - self.tax_amount
        
        if not self.balance_after:
            if self.transaction_type in ['DEPOSIT', 'WIN', 'BONUS', 'REFUND', 'CASHBACK']:
                self.balance_after = self.balance_before + self.net_amount
            else:
                self.balance_after = self.balance_before - self.net_amount
        
        super().save(*args, **kwargs)
    
    @property
    def is_credit(self):
        """Check if transaction increases balance"""
        return self.transaction_type in ['DEPOSIT', 'WIN', 'BONUS', 'REFUND', 'CASHBACK']
    
    @property
    def is_debit(self):
        """Check if transaction decreases balance"""
        return self.transaction_type in ['WITHDRAWAL', 'BET', 'FEE']

    @property
    def is_pending(self):
        return self.status == 'PENDING'

    @property
    def is_completed(self):
        return self.status == 'COMPLETED'

    @property
    def is_failed(self):
        return self.status == 'FAILED'
    
    def process_transaction(self):
        """Process the transaction"""
        if self.status == 'PENDING':
            self.status = 'PROCESSING'
            self.processed_at = timezone.now()
            self.save(update_fields=['status', 'processed_at'])
    
    def complete_transaction(self):
        """Complete the transaction"""
        if self.status in ['PENDING', 'PROCESSING']:
            self.status = 'COMPLETED'
            self.completed_at = timezone.now()
            self.save(update_fields=['status', 'completed_at'])
            
            # Update user balance
            self.user.balance_neon = self.balance_after
            self.user.save(update_fields=['balance_neon'])
    
    def fail_transaction(self, reason=""):
        """Mark transaction as failed"""
        self.status = 'FAILED'
        self.admin_notes = reason
        self.save(update_fields=['status', 'admin_notes'])
    
    def reverse_transaction(self, reason=""):
        """Reverse the transaction"""
        if self.status == 'COMPLETED':
            self.status = 'REVERSED'
            self.admin_notes = reason
            self.save(update_fields=['status', 'admin_notes'])
            
            # Reverse user balance
            if self.is_credit:
                self.user.balance_neon -= self.net_amount
            else:
                self.user.balance_neon += self.net_amount
            self.user.save(update_fields=['balance_neon'])


class PaymentMethod(models.Model):
    """User payment methods"""
    
    PAYMENT_TYPES = [
        ('CREDIT_CARD', 'Credit Card'),
        ('DEBIT_CARD', 'Debit Card'),
        ('BANK_ACCOUNT', 'Bank Account'),
        ('E_WALLET', 'E-Wallet'),
        ('CRYPTO', 'Cryptocurrency'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('VERIFICATION_REQUIRED', 'Verification Required'),
        ('BLOCKED', 'Blocked'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payment_methods')
    
    # Payment method details
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES)
    name = models.CharField(max_length=255)
    is_default = models.BooleanField(default=False)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='ACTIVE')
    
    # Encrypted payment details
    encrypted_data = models.TextField()  # Encrypted payment information
    last_four_digits = models.CharField(max_length=4, blank=True)  # For cards
    expiry_date = models.CharField(max_length=7, blank=True)  # MM/YYYY format
    
    # Verification
    is_verified = models.BooleanField(default=False)
    verification_date = models.DateTimeField(null=True, blank=True)
    
    # Usage statistics
    total_transactions = models.PositiveIntegerField(default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    last_used = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_methods'
        ordering = ['-is_default', '-created_at']
        verbose_name = 'Payment Method'
        verbose_name_plural = 'Payment Methods'
    
    def __str__(self):
        return f"{self.user.username} - {self.name} ({self.get_payment_type_display()})"
    
    def save(self, *args, **kwargs):
        """Ensure only one default payment method per user"""
        if self.is_default:
            PaymentMethod.objects.filter(
                user=self.user,
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)
    
    def verify_payment_method(self):
        """Mark payment method as verified"""
        self.is_verified = True
        self.verification_date = timezone.now()
        self.status = 'ACTIVE'
        self.save(update_fields=['is_verified', 'verification_date', 'status'])
    
    def block_payment_method(self, reason=""):
        """Block payment method"""
        self.status = 'BLOCKED'
        self.save(update_fields=['status'])


class TransactionLog(models.Model):
    """Detailed transaction log for auditing"""
    ACTION_CHOICES = [
        ('TRANSACTION_CREATED', 'Transaction Created'),
        ('TRANSACTION_STATUS_CHANGED', 'Transaction Status Changed'),
        ('DEPOSIT_REQUESTED', 'Deposit Requested'),
        ('DEPOSIT_STATUS_CHANGED', 'Deposit Status Changed'),
        ('WITHDRAWAL_REQUESTED', 'Withdrawal Requested'),
        ('WITHDRAWAL_STATUS_CHANGED', 'Withdrawal Status Changed'),
        ('ADMIN_NOTIFICATION_SENT', 'Admin Notification Sent'),
        ('ADMIN_NOTIFICATION_FAILED', 'Admin Notification Failed'),
        ('TRANSACTION_DELETED', 'Transaction Deleted'),
        ('OTHER', 'Other')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, null=True, blank=True, related_name='logs')
    deposit_request = models.ForeignKey('DepositRequest', on_delete=models.CASCADE, null=True, blank=True, related_name='logs')
    withdrawal_request = models.ForeignKey('WithdrawalRequest', on_delete=models.CASCADE, null=True, blank=True, related_name='logs')

    # Log details
    action = models.CharField(max_length=100, choices=ACTION_CHOICES)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transaction_actions'
    )
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'transaction_logs'
        ordering = ['-timestamp']
        verbose_name = 'Transaction Log'
        verbose_name_plural = 'Transaction Logs'

    def __str__(self):
        return f"{self.action}"

    @classmethod
    def log_action(cls, transaction=None, action='OTHER', description='', performed_by=None, metadata=None, deposit_request=None, withdrawal_request=None, ip_address=None):
        """Create a transaction log entry"""
        data = metadata or {}
        if description:
            data['description'] = description
        return cls.objects.create(
            transaction=transaction,
            deposit_request=deposit_request,
            withdrawal_request=withdrawal_request,
            action=action,
            performed_by=performed_by,
            details=data,
            ip_address=ip_address
        )


class DepositRequest(models.Model):
    """Модель для запросов на депозит"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('REQUIRES_3DS', 'Requires 3DS'),
        ('NEEDS_NEW_CARD', 'Needs New Card'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed')
    ]
    PAYMENT_METHOD_CHOICES = Transaction.PAYMENT_METHODS

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='deposit_requests')
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0.01)])
    currency = models.CharField(max_length=3, default='USD')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payment_reference = models.CharField(max_length=255, blank=True)
    payment_proof = models.FileField(upload_to='payments/deposits/', blank=True, null=True)
    payment_notes = models.TextField(blank=True)
    # 3DS / manual review fields
    requires_3ds = models.BooleanField(default=False)
    three_ds_status = models.CharField(max_length=20, default='NONE')  # NONE/PENDING/VERIFIED/REJECTED
    three_ds_attempts = models.PositiveIntegerField(default=0)
    last_3ds_hash = models.CharField(max_length=128, blank=True)
    review_comment = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_deposits')
    admin_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        db_table = 'deposit_requests'
        ordering = ['-requested_at']

    @property
    def is_pending(self):
        return self.status == 'PENDING'

    @property
    def is_approved(self):
        return self.status == 'APPROVED'

    @property
    def is_rejected(self):
        return self.status == 'REJECTED'


class WithdrawalRequest(models.Model):
    """User withdrawal requests"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]
    PAYMENT_METHOD_CHOICES = Transaction.PAYMENT_METHODS

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='withdrawal_requests')
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0.01)])
    currency = models.CharField(max_length=3, default='USD')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    withdrawal_address = models.CharField(max_length=255, blank=True)
    withdrawal_notes = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_withdrawals')
    admin_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        db_table = 'withdrawal_requests'
        ordering = ['-requested_at']

    @property
    def is_pending(self):
        return self.status == 'PENDING'

    @property
    def is_approved(self):
        return self.status == 'APPROVED'

    @property
    def is_rejected(self):
        return self.status == 'REJECTED'


class CryptoPayment(models.Model):
    """Модель для крипто-платежей"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='crypto_payments')
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    currency = models.CharField(max_length=10, choices=CRYPTO_CURRENCIES)
    network = models.CharField(max_length=20)  # BTC, ETH, BSC, etc.
    wallet_address = models.CharField(max_length=255)
    transaction_hash = models.CharField(max_length=255, blank=True, null=True)
    confirmations = models.IntegerField(default=0)
    required_confirmations = models.IntegerField(default=3)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.currency} {self.amount} - {self.user.username}"
    
    @property
    def is_confirmed(self):
        return self.confirmations >= self.required_confirmations
    
    @property
    def is_expired(self):
        return (timezone.now() - self.created_at).days > 1


