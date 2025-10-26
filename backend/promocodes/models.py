from django.db import models
from django.conf import settings
from django.utils import timezone
from decimal import Decimal

class PromoCode(models.Model):
    """Model for promo codes"""
    
    DISCOUNT_TYPES = [
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
        ('bonus', 'Bonus Coins'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('expired', 'Expired'),
        ('depleted', 'Depleted'),
    ]
    
    # Basic info
    code = models.CharField(max_length=50, unique=True, help_text='Promo code (e.g., WELCOME2024)')
    name = models.CharField(max_length=100, help_text='Human readable name')
    description = models.TextField(blank=True, help_text='Description of the promo')
    
    # Discount settings
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES, default='percentage')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, help_text='Discount value (percentage or fixed amount)')
    max_discount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text='Maximum discount amount')
    
    # Usage limits
    max_uses = models.PositiveIntegerField(default=1, help_text='Maximum number of uses per user')
    total_max_uses = models.PositiveIntegerField(null=True, blank=True, help_text='Total maximum uses across all users')
    current_uses = models.PositiveIntegerField(default=0, help_text='Current number of total uses')
    
    # Validity
    valid_from = models.DateTimeField(default=timezone.now, help_text='Start date of validity')
    valid_until = models.DateTimeField(null=True, blank=True, help_text='End date of validity')
    
    # Status and management
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_promocodes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Minimum requirements
    min_deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text='Minimum deposit amount required')
    min_games_played = models.PositiveIntegerField(default=0, help_text='Minimum games played to use promo')
    
    # Restrictions
    restricted_to_new_users = models.BooleanField(default=False, help_text='Only for new users')
    restricted_to_existing_users = models.BooleanField(default=False, help_text='Only for existing users')
    restricted_countries = models.JSONField(default=list, blank=True, help_text='List of allowed countries')
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    def is_valid(self):
        """Check if promo code is valid"""
        now = timezone.now()
        
        # Check status
        if self.status != 'active':
            return False
        
        # Check validity period
        if self.valid_from and now < self.valid_from:
            return False
        
        if self.valid_until and now > self.valid_until:
            return False
        
        # Check total usage limit
        if self.total_max_uses and self.current_uses >= self.total_max_uses:
            return False
        
        return True
    
    def can_be_used_by_user(self, user):
        """Check if user can use this promo code"""
        if not self.is_valid():
            return False
        
        # Check if user has already used this code
        user_usage = PromoCodeUsage.objects.filter(promo_code=self, user=user).count()
        if user_usage >= self.max_uses:
            return False
        
        # Check user restrictions
        if self.restricted_to_new_users and user.date_joined < (timezone.now() - timezone.timedelta(days=7)):
            return False
        
        if self.restricted_to_existing_users and user.date_joined > (timezone.now() - timezone.timedelta(days=7)):
            return False
        
        return True
    
    def calculate_discount(self, amount):
        """Calculate discount amount"""
        if self.discount_type == 'percentage':
            discount = (amount * self.discount_value) / 100
        elif self.discount_type == 'fixed':
            discount = self.discount_value
        elif self.discount_type == 'bonus':
            discount = self.discount_value
        else:
            discount = 0
        
        # Apply maximum discount limit
        if self.max_discount:
            discount = min(discount, self.max_discount)
        
        return discount
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Promo Code'
        verbose_name_plural = 'Promo Codes'


class PromoCodeUsage(models.Model):
    """Model for tracking promo code usage"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    
    promo_code = models.ForeignKey(PromoCode, on_delete=models.CASCADE, related_name='usages')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='promo_usages')
    
    # Usage details
    used_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Transaction details
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text='Amount deposited when promo was used')
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text='Discount amount applied')
    bonus_coins = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text='Bonus coins given')
    
    # Manager info
    assigned_manager = models.ForeignKey('PromoManager', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_usages')
    
    # Additional info
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.user.email} used {self.promo_code.code} on {self.used_at}"
    
    class Meta:
        ordering = ['-used_at']
        verbose_name = 'Promo Code Usage'
        verbose_name_plural = 'Promo Code Usages'


class PromoManager(models.Model):
    """Model for promo code managers"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('inactive', 'Inactive'),
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='promo_manager_profile')
    
    # Manager info
    telegram_username = models.CharField(max_length=100, blank=True, help_text='Telegram username')
    telegram_chat_id = models.CharField(max_length=100, blank=True, help_text='Telegram chat ID')
    
    # Experience and skills
    experience_years = models.PositiveIntegerField(default=0, help_text='Years of experience')
    experience_description = models.TextField(blank=True, help_text='Description of experience')
    skills = models.JSONField(default=list, blank=True, help_text='List of skills')
    
    # Manager status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_managers')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Performance metrics
    total_promos_created = models.PositiveIntegerField(default=0)
    total_users_referred = models.PositiveIntegerField(default=0)
    total_revenue_generated = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Commission settings
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Commission rate in percentage')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Manager: {self.user.email}"
    
    def is_active(self):
        """Check if manager is active"""
        return self.status == 'active'
    
    def can_create_promos(self):
        """Check if manager can create new promo codes"""
        return self.is_active() and self.status == 'active'
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Promo Manager'
        verbose_name_plural = 'Promo Managers'


class PromoCodeRequest(models.Model):
    """Model for promo code requests from managers"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]
    
    manager = models.ForeignKey(PromoManager, on_delete=models.CASCADE, related_name='promo_requests')
    
    # Request details
    promo_code = models.CharField(max_length=50, help_text='Requested promo code')
    name = models.CharField(max_length=100, help_text='Promo name')
    description = models.TextField(help_text='Promo description')
    
    # Discount details
    discount_type = models.CharField(max_length=20, choices=PromoCode.DISCOUNT_TYPES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    max_discount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Usage limits
    max_uses_per_user = models.PositiveIntegerField(default=1)
    total_max_uses = models.PositiveIntegerField(null=True, blank=True)
    
    # Validity
    valid_days = models.PositiveIntegerField(default=30, help_text='Number of days promo will be valid')
    
    # Status and admin
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True, help_text='Admin notes about the request')
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_promo_requests')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.promo_code} by {self.manager.user.email}"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Promo Code Request'
        verbose_name_plural = 'Promo Code Requests'








