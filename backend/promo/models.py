from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid


class PromoCode(models.Model):
    """Promo code model for bonuses and rewards"""
    
    TYPE_CHOICES = [
        ('WELCOME', 'Welcome Bonus'),
        ('DEPOSIT', 'Deposit Bonus'),
        ('RELOAD', 'Reload Bonus'),
        ('FREE_SPINS', 'Free Spins'),
        ('CASHBACK', 'Cashback'),
        ('TOURNAMENT', 'Tournament Bonus'),
        ('VIP', 'VIP Bonus'),
        ('SEASONAL', 'Seasonal Bonus'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('EXPIRED', 'Expired'),
        ('SUSPENDED', 'Suspended'),
    ]
    DISCOUNT_CHOICES = [
        ('FIXED', 'Fixed'),
        ('PERCENTAGE', 'Percentage'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    promo_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    is_active = models.BooleanField(default=True)
    
    # Bonus configuration
    bonus_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    bonus_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(1000)]
    )
    max_bonus = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    min_deposit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Legacy discount style support (for compatibility with serializers/views)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_CHOICES, default='FIXED')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    max_discount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    usage_count = models.PositiveIntegerField(default=0)

    # Free spins configuration
    free_spins = models.PositiveIntegerField(default=0)
    free_spins_game = models.ForeignKey(
        'games.Game',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='promo_codes'
    )
    
    # Usage limits
    max_uses = models.PositiveIntegerField(default=1)
    max_uses_per_user = models.PositiveIntegerField(default=1)
    current_uses = models.PositiveIntegerField(default=0)
    
    # Time restrictions
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Creator tracking
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_promo_codes',
        help_text='User who created this promo code'
    )
    
    # Target users
    target_countries = models.JSONField(default=list, blank=True)
    target_user_groups = models.JSONField(default=list, blank=True)
    min_user_level = models.PositiveIntegerField(default=0)
    
    # Wagering requirements
    wagering_multiplier = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text="Amount user must wager to withdraw bonus (e.g., 20x means wager 20x bonus amount)"
    )
    max_wagering_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Terms and conditions
    terms_conditions = models.TextField(blank=True)
    is_first_deposit_only = models.BooleanField(default=False)
    is_new_users_only = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'promo_codes'
        ordering = ['-created_at']
        verbose_name = 'Promo Code'
        verbose_name_plural = 'Promo Codes'
        indexes = [
            models.Index(fields=['code', 'status']),
            models.Index(fields=['promo_type', 'status']),
            models.Index(fields=['valid_from', 'valid_until']),
            models.Index(fields=['status', 'valid_until']),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    @property
    def is_valid(self):
        """Check if promo code is currently valid"""
        now = timezone.now()
        date_window_ok = True
        if self.valid_from and self.valid_until:
            date_window_ok = self.valid_from <= now <= self.valid_until
        elif self.start_date and self.end_date:
            today = now.date()
            date_window_ok = self.start_date <= today <= self.end_date
        return (
            self.is_active and self.status == 'ACTIVE' and
            date_window_ok and self.current_uses < self.max_uses
        )
    
    @property
    def is_expired(self):
        """Check if promo code has expired"""
        now = timezone.now()
        if self.valid_until:
            return now > self.valid_until
        if self.end_date:
            return now.date() > self.end_date
        return False
    
    @property
    def is_available(self):
        """Check if promo code is available for use"""
        return self.is_valid and self.current_uses < self.max_uses
    
    def can_be_used_by_user(self, user):
        """Check if user can use this promo code"""
        if not self.is_available:
            return False, "Promo code is not available"
        
        # Check if user has already used this code
        user_uses = PromoRedemption.objects.filter(
            promo_code=self, 
            user=user
        ).count()
        
        if user_uses >= self.max_uses_per_user:
            return False, "You have already used this promo code"
        
        # Check if user meets requirements
        if self.is_new_users_only and user.date_joined < timezone.now() - timezone.timedelta(days=1):
            return False, "This promo code is for new users only"
        
        if self.min_user_level > 0:
            # Assuming user level is based on some criteria
            user_level = self._calculate_user_level(user)
            if user_level < self.min_user_level:
                return False, f"Minimum user level {self.min_user_level} required"
        
        # Check country restrictions
        if self.target_countries and user.country not in self.target_countries:
            return False, "This promo code is not available in your country"
        
        return True, "Promo code can be used"
    
    def _calculate_user_level(self, user):
        """Calculate user level based on activity and spending"""
        # This is a simplified calculation - you might want to implement
        # a more sophisticated leveling system
        total_deposits = user.transactions.filter(
            transaction_type='DEPOSIT',
            status='COMPLETED'
        ).aggregate(total=models.Sum('amount'))['total'] or 0
        
        if total_deposits >= 10000:
            return 5
        elif total_deposits >= 5000:
            return 4
        elif total_deposits >= 2000:
            return 3
        elif total_deposits >= 500:
            return 2
        else:
            return 1
    
    def apply_bonus(self, user, deposit_amount=0):
        """Apply bonus to user account"""
        if not self.can_be_used_by_user(user)[0]:
            raise ValueError("User cannot use this promo code")
        
        # Calculate bonus amount
        if self.bonus_percentage > 0:
            bonus = (deposit_amount * self.bonus_percentage) / 100
            if self.max_bonus > 0:
                bonus = min(bonus, self.max_bonus)
        else:
            bonus = self.bonus_amount
        
        # Add bonus to user account
        user.add_neoncoins(bonus)
        
        # Create redemption record
        redemption = PromoRedemption.objects.create(
            promo_code=self,
            user=user,
            bonus_amount=bonus,
            free_spins_awarded=self.free_spins,
            wagering_requirement=bonus * self.wagering_multiplier
        )
        
        # Increment usage counter
        self.current_uses += 1
        self.save()
        
        return redemption


class PromoRedemption(models.Model):
    """Record of promo code redemptions"""
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('EXPIRED', 'Expired'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    promo_code = models.ForeignKey(PromoCode, on_delete=models.CASCADE, related_name='redemptions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='promo_redemptions')
    
    # Redemption details
    redeemed_at = models.DateTimeField(auto_now_add=True)
    bonus_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    free_spins_awarded = models.PositiveIntegerField(default=0)
    free_spins_used = models.PositiveIntegerField(default=0)
    
    # Wagering requirements
    wagering_requirement = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    wagering_completed = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    wagering_progress = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0,
        help_text="Percentage of wagering requirement completed"
    )
    
    # Status and tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    expires_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    
    class Meta:
        db_table = 'promo_redemptions'
        ordering = ['-redeemed_at']
        verbose_name = 'Promo Code Redemption'
        verbose_name_plural = 'Promo Code Redemptions'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['promo_code', 'status']),
            models.Index(fields=['status', 'expires_at']),
            models.Index(fields=['redeemed_at', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.promo_code.code} ({self.status})"
    
    @property
    def is_active(self):
        """Check if redemption is still active"""
        return self.status == 'ACTIVE' and timezone.now() <= self.expires_at
    
    @property
    def is_expired(self):
        """Check if redemption has expired"""
        return timezone.now() > self.expires_at
    
    @property
    def wagering_remaining(self):
        """Calculate remaining wagering requirement"""
        return max(0, self.wagering_requirement - self.wagering_completed)
    
    @property
    def can_withdraw(self):
        """Check if user can withdraw bonus funds"""
        return (
            self.status == 'COMPLETED' and
            self.wagering_completed >= self.wagering_requirement
        )
    
    def update_wagering_progress(self, wagering_amount):
        """Update wagering progress"""
        if self.status != 'ACTIVE':
            return
        
        self.wagering_completed += wagering_amount
        self.wagering_progress = min(
            100, 
            (self.wagering_completed / self.wagering_requirement) * 100
        )
        
        # Check if wagering requirement is met
        if self.wagering_completed >= self.wagering_requirement:
            self.status = 'COMPLETED'
            self.completed_at = timezone.now()
        
        self.save()
    
    def use_free_spin(self, game):
        """Use a free spin"""
        if self.free_spins_used >= self.free_spins_awarded:
            raise ValueError("No free spins remaining")
        
        self.free_spins_used += 1
        self.save()
        
        # Create free spin record
        FreeSpinUsage.objects.create(
            redemption=self,
            game=game,
            used_at=timezone.now()
        )
    
    def cancel(self):
        """Cancel the redemption"""
        if self.status != 'ACTIVE':
            raise ValueError("Can only cancel active redemptions")
        
        # Remove bonus from user account
        self.user.deduct_neoncoins(self.bonus_amount)
        
        self.status = 'CANCELLED'
        self.save()


class FreeSpinUsage(models.Model):
    """Track usage of free spins from promo codes"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    redemption = models.ForeignKey(PromoRedemption, on_delete=models.CASCADE, related_name='free_spin_usage')
    game = models.ForeignKey('games.Game', on_delete=models.CASCADE, related_name='free_spin_usage')
    used_at = models.DateTimeField(auto_now_add=True)
    
    # Game result
    bet_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    win_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    game_round = models.ForeignKey('games.GameRound', on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'free_spin_usage'
        ordering = ['-used_at']
        verbose_name = 'Free Spin Usage'
        verbose_name_plural = 'Free Spin Usage'
    
    def __str__(self):
        return f"Free spin on {self.game.title} - {self.redemption.user.username}"


class PromoCampaign(models.Model):
    """Campaign to group multiple promo codes"""
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('ACTIVE', 'Active'),
        ('PAUSED', 'Paused'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    # Campaign details
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    target_audience = models.TextField(blank=True)
    budget = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    spent_budget = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Promo codes in campaign
    promo_codes = models.ManyToManyField(PromoCode, related_name='campaigns', blank=True)
    
    # Performance metrics
    total_redemptions = models.PositiveIntegerField(default=0)
    total_bonus_awarded = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    conversion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'promo_campaigns'
        ordering = ['-created_at']
        verbose_name = 'Promo Campaign'
        verbose_name_plural = 'Promo Campaigns'
    
    def __str__(self):
        return self.name
    
    @property
    def is_active(self):
        """Check if campaign is currently active"""
        now = timezone.now()
        return (
            self.status == 'ACTIVE' and
            self.start_date <= now <= self.end_date
        )
    
    @property
    def budget_remaining(self):
        """Calculate remaining budget"""
        return max(0, self.budget - self.spent_budget)
    
    @property
    def budget_utilization(self):
        """Calculate budget utilization percentage"""
        if self.budget == 0:
            return 0
        return (self.spent_budget / self.budget) * 100
    
    def update_metrics(self):
        """Update campaign performance metrics"""
        redemptions = PromoRedemption.objects.filter(
            promo_code__in=self.promo_codes.all()
        )
        
        self.total_redemptions = redemptions.count()
        self.total_bonus_awarded = redemptions.aggregate(
            total=models.Sum('bonus_amount')
        )['total'] or 0
        
        # Calculate conversion rate (simplified)
        if self.total_redemptions > 0:
            self.conversion_rate = (self.total_redemptions / 100) * 100  # Placeholder calculation
        
        self.save()


class PromoReward(models.Model):
    """Rewards linked to campaigns or promo codes"""
    REWARD_TYPES = [
        ('BONUS', 'Bonus'),
        ('FREE_SPINS', 'Free Spins'),
        ('CASHBACK', 'Cashback'),
        ('OTHER', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(PromoCampaign, on_delete=models.CASCADE, related_name='rewards', null=True, blank=True)
    promo_code = models.ForeignKey(PromoCode, on_delete=models.CASCADE, related_name='rewards', null=True, blank=True)
    reward_type = models.CharField(max_length=20, choices=REWARD_TYPES)
    reward_value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    reward_description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'promo_rewards'
        ordering = ['-created_at']
        verbose_name = 'Promo Reward'
        verbose_name_plural = 'Promo Rewards'

    def __str__(self):
        return f"{self.get_reward_type_display()} - {self.reward_value}"

    @property
    def is_expired(self):
        now = timezone.now()
        if self.end_date:
            return now > self.end_date
        return False


class PromoRule(models.Model):
    """Rules for promo code validation and application"""
    RULE_TYPES = [
        ('MIN_AMOUNT', 'Minimum Amount'),
        ('MAX_AMOUNT', 'Maximum Amount'),
        ('USER_LIMIT', 'User Limit'),
        ('TIME_LIMIT', 'Time Limit'),
        ('GAME_RESTRICTION', 'Game Restriction'),
        ('PAYMENT_METHOD', 'Payment Method Restriction')
    ]
    
    promo_code = models.ForeignKey(PromoCode, on_delete=models.CASCADE, related_name='rules')
    rule_type = models.CharField(max_length=30, choices=RULE_TYPES)
    rule_value = models.JSONField(help_text='Rule-specific value (e.g., amount, game list, etc.)')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Promo Rule'
        verbose_name_plural = 'Promo Rules'
        ordering = ['rule_type']
    
    def __str__(self):
        return f"{self.promo_code.code} - {self.get_rule_type_display()}"
    
    def validate_rule(self, user, amount=None, game=None, payment_method=None):
        """Validate if rule applies to current context"""
        if not self.is_active:
            return True
            
        if self.rule_type == 'MIN_AMOUNT':
            return amount >= self.rule_value.get('amount', 0)
        elif self.rule_type == 'MAX_AMOUNT':
            return amount <= self.rule_value.get('amount', float('inf'))
        elif self.rule_type == 'USER_LIMIT':
            return user.promo_redemptions.filter(promo_code=self.promo_code).count() < self.rule_value.get('limit', 1)
        elif self.rule_type == 'TIME_LIMIT':
            from django.utils import timezone
            now = timezone.now()
            start_time = self.rule_value.get('start_time')
            end_time = self.rule_value.get('end_time')
            if start_time and now < start_time:
                return False
            if end_time and now > end_time:
                return False
            return True
        elif self.rule_type == 'GAME_RESTRICTION':
            if not game:
                return True
            allowed_games = self.rule_value.get('games', [])
            return game.slug in allowed_games
        elif self.rule_type == 'PAYMENT_METHOD':
            if not payment_method:
                return True
            allowed_methods = self.rule_value.get('methods', [])
            return payment_method in allowed_methods
        
        return True


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
    discount_type = models.CharField(max_length=20, choices=[('FIXED', 'Fixed'), ('PERCENTAGE', 'Percentage')])
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

