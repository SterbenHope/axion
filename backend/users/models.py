"""
User models for NeonCasino.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    """Custom user model for NeonCasino."""
    
    KYC_STATUS_CHOICES = [
        ('NONE', 'Not Submitted'),
        ('PENDING', 'Under Review'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
    ]
    
    # Basic fields
    email = models.EmailField(_('email address'), unique=True)
    username = models.CharField(_('username'), max_length=150, unique=True)
    
    # KYC and verification
    is_email_verified = models.BooleanField(default=False)
    kyc_status = models.CharField(
        max_length=20,
        choices=KYC_STATUS_CHOICES,
        default='NONE'
    )
    
    # Financial
    balance_neon = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00  # No starting balance
    )
    
    # Referral system
    referrer = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='referrals'
    )
    ref_source_code = models.CharField(
        max_length=50,
        blank=True,
        help_text='Source code for tracking referrals'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional fields
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True
    )
    phone_number = models.CharField(
        max_length=20,
        blank=True
    )
    date_of_birth = models.DateField(
        null=True,
        blank=True
    )
    
    # Registration tracking
    registration_ip = models.GenericIPAddressField(
        null=True, 
        blank=True,
        help_text='IP address used during registration'
    )
    
    # Experience and leveling
    xp = models.PositiveIntegerField(
        default=0,
        help_text='User experience points'
    )
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        db_table = 'users'
        swappable = 'AUTH_USER_MODEL'
        
    def __str__(self):
        return self.username
    
    @property
    def is_kyc_verified(self):
        """Check if user has verified KYC."""
        return self.kyc_status == 'VERIFIED'
    
    @property
    def can_withdraw(self):
        """Check if user can withdraw funds."""
        return self.is_kyc_verified and self.is_email_verified
    
    def add_neoncoins(self, amount):
        """Add NeonCoins to user balance."""
        self.balance_neon += amount
        self.save(update_fields=['balance_neon'])
    
    def deduct_neoncoins(self, amount):
        """Deduct NeonCoins from user balance."""
        if self.balance_neon >= amount:
            self.balance_neon -= amount
            self.save(update_fields=['balance_neon'])
            return True
        return False

class UserProfile(models.Model):
    """Extended user profile information."""
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    
    # Gaming preferences
    favorite_game = models.CharField(
        max_length=50,
        blank=True,
        help_text='User\'s favorite game type'
    )
    
    # Statistics
    total_games_played = models.PositiveIntegerField(default=0)
    total_wins = models.PositiveIntegerField(default=0)
    total_losses = models.PositiveIntegerField(default=0)
    
    # Achievements
    achievements = models.JSONField(
        default=dict,
        help_text='User achievements and badges'
    )
    
    # Settings
    notifications_enabled = models.BooleanField(default=True)
    email_marketing = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
        
    def __str__(self):
        return f"{self.user.username}'s profile"
    
    @property
    def win_rate(self):
        """Calculate user's win rate."""
        if self.total_games_played == 0:
            return 0.0
        return (self.total_wins / self.total_games_played) * 100

class UserSession(models.Model):
    """Track user sessions and activity."""
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sessions'
    )
    
    session_key = models.CharField(max_length=40, unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_sessions'
        
    def __str__(self):
        return f"{self.user.username} - {self.session_key[:8]}..."






