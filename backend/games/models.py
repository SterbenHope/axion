"""
Game models for NeonCasino.
"""

from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid


class GameCategory(models.Model):
    """Game categories for organization"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.ImageField(upload_to='game_categories/', blank=True, null=True)
    
    # Display settings
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'game_categories'
        ordering = ['display_order', 'name']
        verbose_name = 'Game Category'
        verbose_name_plural = 'Game Categories'
    
    def __str__(self):
        return self.name


class Game(models.Model):
    """Game model for casino games"""
    
    GAME_TYPES = [
        ('SLOT', 'Slot Machine'),
        ('TABLE', 'Table Game'),
        ('LIVE', 'Live Casino'),
        ('VIRTUAL', 'Virtual Game'),
        ('SCRATCH', 'Scratch Card'),
        ('BINGO', 'Bingo'),
        ('KENO', 'Keno'),
        ('LOTTERY', 'Lottery'),
        ('SPORTS', 'Sports Betting'),
        ('OTHER', 'Other'),
    ]
    
    PROVIDERS = [
        ('NETENT', 'NetEnt'),
        ('MICROGAMING', 'Microgaming'),
        ('PLAYTECH', 'Playtech'),
        ('EVOLUTION', 'Evolution Gaming'),
        ('PRAGMATIC', 'Pragmatic Play'),
        ('PLAYSTAR', 'PlayStar'),
        ('CUSTOM', 'Custom'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField()
    short_description = models.CharField(max_length=500, blank=True)
    
    # Game details
    game_type = models.CharField(max_length=20, choices=GAME_TYPES)
    provider = models.CharField(max_length=20, choices=PROVIDERS)
    category = models.ForeignKey(GameCategory, on_delete=models.CASCADE, related_name='games')
    
    # Game configuration
    min_bet = models.DecimalField(max_digits=15, decimal_places=2, default=0.01)
    max_bet = models.DecimalField(max_digits=15, decimal_places=2, default=1000.00)
    rtp_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=96.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    volatility = models.CharField(max_length=20, choices=[
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('VERY_HIGH', 'Very High'),
    ], default='MEDIUM')
    
    # Visual assets
    thumbnail = models.ImageField(upload_to='game_thumbnails/', blank=True, null=True)
    banner = models.ImageField(upload_to='game_banners/', blank=True, null=True)
    demo_url = models.URLField(blank=True)
    game_url = models.URLField(blank=True)
    
    # Game features
    has_demo = models.BooleanField(default=True)
    has_free_spins = models.BooleanField(default=False)
    has_bonus_rounds = models.BooleanField(default=False)
    has_progressive_jackpot = models.BooleanField(default=False)
    is_mobile_compatible = models.BooleanField(default=True)
    
    # Status and availability
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_new = models.BooleanField(default=False)
    is_hot = models.BooleanField(default=False)
    
    # Statistics
    total_plays = models.PositiveIntegerField(default=0)
    total_wagered = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    total_won = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    average_play_time = models.PositiveIntegerField(default=0, help_text="Average play time in seconds")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    released_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'games'
        ordering = ['-is_featured', '-is_new', '-total_plays', 'title']
        verbose_name = 'Game'
        verbose_name_plural = 'Games'
        indexes = [
            models.Index(fields=['game_type', 'is_active']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['provider', 'is_active']),
            models.Index(fields=['is_featured', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_game_type_display()})"
    
    @property
    def win_rate(self):
        """Calculate win rate percentage"""
        if self.total_wagered == 0:
            return 0
        return (self.total_won / self.total_wagered) * 100
    
    @property
    def is_popular(self):
        """Check if game is popular based on plays"""
        return self.total_plays > 1000
    
    def increment_plays(self):
        """Increment total plays counter"""
        self.total_plays += 1
        self.save(update_fields=['total_plays'])
    
    def update_statistics(self, wagered, won, play_time):
        """Update game statistics"""
        self.total_wagered += wagered
        self.total_won += won
        
        # Update average play time
        if self.total_plays > 0:
            current_avg = self.average_play_time
            new_avg = ((current_avg * (self.total_plays - 1)) + play_time) / self.total_plays
            self.average_play_time = int(new_avg)
        
        self.save(update_fields=['total_wagered', 'total_won', 'average_play_time'])


class GameRound(models.Model):
    """Individual game round/session"""
    
    ROUND_STATUS = [
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('PAUSED', 'Paused'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='rounds')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='game_rounds')
    
    # Round details
    round_id = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=ROUND_STATUS, default='ACTIVE')
    
    # Betting information
    bet_amount = models.DecimalField(max_digits=15, decimal_places=2)
    win_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_wagered = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Game state
    game_state = models.JSONField(default=dict, blank=True)
    result_data = models.JSONField(default=dict, blank=True)
    
    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration = models.PositiveIntegerField(default=0, help_text="Duration in seconds")
    
    # Metadata
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    device_info = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'game_rounds'
        ordering = ['-started_at']
        verbose_name = 'Game Round'
        verbose_name_plural = 'Game Rounds'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['game', 'status']),
            models.Index(fields=['started_at', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.game.title} ({self.round_id})"
    
    def complete_round(self, win_amount, result_data):
        """Complete the game round"""
        self.status = 'COMPLETED'
        self.win_amount = win_amount
        self.result_data = result_data
        self.completed_at = timezone.now()
        
        # Calculate duration
        duration = (self.completed_at - self.started_at).total_seconds()
        self.duration = int(duration)
        
        self.save()
        
        # Update game statistics
        self.game.update_statistics(self.total_wagered, win_amount, self.duration)
    
    def cancel_round(self):
        """Cancel the game round"""
        self.status = 'CANCELLED'
        self.completed_at = timezone.now()
        self.save()


class GameSession(models.Model):
    """Extended game session with multiple rounds"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='game_sessions')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='sessions')
    
    # Session details
    session_id = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    
    # Statistics
    total_rounds = models.PositiveIntegerField(default=0)
    total_wagered = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_won = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    net_result = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    # Session data
    session_data = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'game_sessions'
        ordering = ['-started_at']
        verbose_name = 'Game Session'
        verbose_name_plural = 'Game Sessions'
    
    def __str__(self):
        return f"{self.user.username} - {self.game.title} Session"
    
    def end_session(self):
        """End the game session"""
        self.is_active = False
        self.ended_at = timezone.now()
        self.save()
    
    def add_round(self, round_instance):
        """Add a round to the session"""
        self.total_rounds += 1
        self.total_wagered += round_instance.total_wagered
        self.total_won += round_instance.win_amount
        self.net_result = self.total_won - self.total_wagered
        self.save()
    
    @property
    def duration(self):
        """Calculate session duration"""
        if self.ended_at:
            return (self.ended_at - self.started_at).total_seconds()
        return (timezone.now() - self.started_at).total_seconds()


# Optional achievements model used by events
class GameAchievement(models.Model):
    """User achievements related to games"""
    ACHIEVEMENT_TYPES = [
        ('FIRST_WIN', 'First Win'),
        ('BIG_WIN', 'Big Win'),
        ('WIN_STREAK', 'Win Streak'),
        ('HIGH_ROLLER', 'High Roller'),
        ('LUCKY_ONE', 'Lucky One'),
        ('MASTER_PLAYER', 'Master Player')
    ]
    
    ACHIEVEMENT_RARITY = [
        ('COMMON', 'Common'),
        ('RARE', 'Rare'),
        ('EPIC', 'Epic'),
        ('LEGENDARY', 'Legendary')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='game_achievements')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='achievements')
    achievement_type = models.CharField(max_length=50, choices=ACHIEVEMENT_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    rarity = models.CharField(max_length=20, choices=ACHIEVEMENT_RARITY, default='COMMON')
    neoncoins_reward = models.PositiveIntegerField(default=0)
    badge_icon = models.CharField(max_length=50, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'game_achievements'
        ordering = ['-created_at']
        verbose_name = 'Game Achievement'
        verbose_name_plural = 'Game Achievements'
        unique_together = ['user', 'game', 'achievement_type']

    def __str__(self):
        return f"{self.user.username} - {self.title}"


class GameLeaderboard(models.Model):
    """Game leaderboards and rankings."""
    
    PERIOD_CHOICES = [
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
        ('ALL_TIME', 'All Time'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='leaderboards')
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    
    # Leaderboard data
    rankings = models.JSONField(default=list, help_text='List of user rankings')
    
    # Metadata
    total_players = models.PositiveIntegerField(default=0)
    total_volume = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'game_leaderboards'
        unique_together = ['game', 'period', 'period_start']
        ordering = ['-period_start']
        
    def __str__(self):
        return f"{self.game.title} - {self.period} Leaderboard"


