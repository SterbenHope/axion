from rest_framework import serializers
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
from users.models import User, UserProfile
from games.models import Game, GameRound, GameSession
from transactions.models import Transaction, PaymentMethod
from kyc.models import KYCVerification
from promo.models import PromoCode, PromoRedemption


class DashboardOverviewSerializer(serializers.Serializer):
    """Serializer for dashboard overview statistics"""
    total_users = serializers.IntegerField()
    active_users_today = serializers.IntegerField()
    active_users_week = serializers.IntegerField()
    active_users_month = serializers.IntegerField()
    new_users_today = serializers.IntegerField()
    new_users_week = serializers.IntegerField()
    new_users_month = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    revenue_today = serializers.DecimalField(max_digits=15, decimal_places=2)
    revenue_week = serializers.DecimalField(max_digits=15, decimal_places=2)
    revenue_month = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_games_played = serializers.IntegerField()
    games_today = serializers.IntegerField()
    games_week = serializers.IntegerField()
    games_month = serializers.IntegerField()
    pending_kyc = serializers.IntegerField()
    pending_deposits = serializers.IntegerField()
    pending_withdrawals = serializers.IntegerField()
    active_promo_codes = serializers.IntegerField()


class UserStatsSerializer(serializers.Serializer):
    """Serializer for user statistics"""
    total_users = serializers.IntegerField()
    verified_users = serializers.IntegerField()
    unverified_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    inactive_users = serializers.IntegerField()
    premium_users = serializers.IntegerField()
    new_users_today = serializers.IntegerField()
    new_users_week = serializers.IntegerField()
    new_users_month = serializers.IntegerField()
    user_growth_rate = serializers.FloatField()
    average_user_age = serializers.FloatField()
    top_countries = serializers.ListField(child=serializers.DictField())
    user_activity_distribution = serializers.DictField()


class UserActivitySerializer(serializers.Serializer):
    """Serializer for user activity data"""
    user_id = serializers.UUIDField()
    username = serializers.CharField()
    email = serializers.CharField()
    last_login = serializers.DateTimeField()
    last_activity = serializers.DateTimeField()
    total_games_played = serializers.IntegerField()
    total_wins = serializers.IntegerField()
    total_losses = serializers.IntegerField()
    win_rate = serializers.FloatField()
    balance_neon = serializers.DecimalField(max_digits=15, decimal_places=2)
    kyc_status = serializers.CharField()
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField()


class UserSearchSerializer(serializers.Serializer):
    """Serializer for user search parameters"""
    query = serializers.CharField(max_length=100, required=False)
    kyc_status = serializers.ChoiceField(
        choices=User.KYC_STATUS_CHOICES,
        required=False
    )
    is_active = serializers.BooleanField(required=False)
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    min_balance = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    max_balance = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    country = serializers.CharField(max_length=100, required=False)
    
    def validate(self, data):
        """Validate search parameters"""
        date_from = data.get('date_from')
        date_to = data.get('date_to')
        
        if date_from and date_to and date_from > date_to:
            raise serializers.ValidationError("date_from cannot be after date_to")
        
        min_balance = data.get('min_balance')
        max_balance = data.get('max_balance')
        
        if min_balance and max_balance and min_balance > max_balance:
            raise serializers.ValidationError("min_balance cannot be greater than max_balance")
        
        return data


class GameStatsSerializer(serializers.Serializer):
    """Serializer for game statistics"""
    total_games = serializers.IntegerField()
    active_games = serializers.IntegerField()
    featured_games = serializers.IntegerField()
    total_games_played = serializers.IntegerField()
    games_today = serializers.IntegerField()
    games_week = serializers.IntegerField()
    games_month = serializers.IntegerField()
    total_bet_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_win_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_rtp = serializers.FloatField()
    most_popular_game = serializers.DictField()
    top_performing_games = serializers.ListField(child=serializers.DictField())
    game_type_distribution = serializers.DictField()


class GamePerformanceSerializer(serializers.Serializer):
    """Serializer for individual game performance"""
    game_id = serializers.UUIDField()
    game_title = serializers.CharField()
    game_type = serializers.CharField()
    total_rounds = serializers.IntegerField()
    total_bet_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_win_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    rtp = serializers.FloatField()
    average_bet = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_players = serializers.IntegerField()
    unique_players = serializers.IntegerField()
    is_active = serializers.BooleanField()
    is_featured = serializers.BooleanField()
    created_at = serializers.DateTimeField()


class FinancialStatsSerializer(serializers.Serializer):
    """Serializer for financial statistics"""
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_deposits = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_withdrawals = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_bonuses = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_fees = serializers.DecimalField(max_digits=15, decimal_places=2)
    net_profit = serializers.DecimalField(max_digits=15, decimal_places=2)
    revenue_today = serializers.DecimalField(max_digits=15, decimal_places=2)
    revenue_week = serializers.DecimalField(max_digits=15, decimal_places=2)
    revenue_month = serializers.DecimalField(max_digits=15, decimal_places=2)
    pending_deposits = serializers.DecimalField(max_digits=15, decimal_places=2)
    pending_withdrawals = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_deposit = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_withdrawal = serializers.DecimalField(max_digits=15, decimal_places=2)
    conversion_rate = serializers.FloatField()


class TransactionStatsSerializer(serializers.Serializer):
    """Serializer for transaction statistics"""
    total_transactions = serializers.IntegerField()
    successful_transactions = serializers.IntegerField()
    failed_transactions = serializers.IntegerField()
    pending_transactions = serializers.IntegerField()
    total_volume = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_transaction_value = serializers.DecimalField(max_digits=15, decimal_places=2)
    transactions_today = serializers.IntegerField()
    transactions_week = serializers.IntegerField()
    transactions_month = serializers.IntegerField()
    top_transaction_types = serializers.ListField(child=serializers.DictField())
    transaction_status_distribution = serializers.DictField()


class KYCStatsSerializer(serializers.Serializer):
    """Serializer for KYC statistics"""
    total_submissions = serializers.IntegerField()
    pending_submissions = serializers.IntegerField()
    approved_submissions = serializers.IntegerField()
    rejected_submissions = serializers.IntegerField()
    additional_info_requested = serializers.IntegerField()
    approval_rate = serializers.FloatField()
    average_processing_time = serializers.FloatField()
    submissions_today = serializers.IntegerField()
    submissions_week = serializers.IntegerField()
    submissions_month = serializers.IntegerField()
    top_countries = serializers.ListField(child=serializers.DictField())
    document_type_distribution = serializers.DictField()


class PromoStatsSerializer(serializers.Serializer):
    """Serializer for promotional statistics"""
    total_promo_codes = serializers.IntegerField()
    active_promo_codes = serializers.IntegerField()
    expired_promo_codes = serializers.IntegerField()
    total_redemptions = serializers.IntegerField()
    total_rewards_given = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_reward_value = serializers.DecimalField(max_digits=15, decimal_places=2)
    conversion_rate = serializers.FloatField()
    top_performing_codes = serializers.ListField(child=serializers.DictField())
    campaign_performance = serializers.ListField(child=serializers.DictField())
    redemption_trends = serializers.DictField()


class SystemHealthSerializer(serializers.Serializer):
    """Serializer for system health information"""
    database_status = serializers.CharField()
    redis_status = serializers.CharField()
    celery_status = serializers.CharField()
    storage_status = serializers.CharField()
    api_response_time = serializers.FloatField()
    active_connections = serializers.IntegerField()
    memory_usage = serializers.FloatField()
    cpu_usage = serializers.FloatField()
    disk_usage = serializers.FloatField()
    error_rate = serializers.FloatField()
    uptime = serializers.DurationField()
    last_backup = serializers.DateTimeField()
    system_alerts = serializers.ListField(child=serializers.DictField())


class AuditLogSerializer(serializers.Serializer):
    """Serializer for audit log entries"""
    id = serializers.UUIDField()
    user = serializers.CharField()
    action = serializers.CharField()
    resource_type = serializers.CharField()
    resource_id = serializers.CharField()
    details = serializers.DictField()
    ip_address = serializers.CharField()
    user_agent = serializers.CharField()
    timestamp = serializers.DateTimeField()


class AuditLogFilterSerializer(serializers.Serializer):
    """Serializer for filtering audit logs"""
    user = serializers.CharField(required=False)
    action = serializers.CharField(required=False)
    resource_type = serializers.CharField(required=False)
    date_from = serializers.DateTimeField(required=False)
    date_to = serializers.DateTimeField(required=False)
    ip_address = serializers.CharField(required=False)
    
    def validate(self, data):
        """Validate filter parameters"""
        date_from = data.get('date_from')
        date_to = data.get('date_to')
        
        if date_from and date_to and date_from > date_to:
            raise serializers.ValidationError("date_from cannot be after date_to")
        
        return data


class DashboardWidgetSerializer(serializers.Serializer):
    """Serializer for dashboard widget configuration"""
    widget_id = serializers.CharField()
    widget_type = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    position = serializers.DictField()
    size = serializers.DictField()
    config = serializers.DictField()
    is_visible = serializers.BooleanField()
    refresh_interval = serializers.IntegerField()
    last_updated = serializers.DateTimeField()


class DashboardLayoutSerializer(serializers.Serializer):
    """Serializer for dashboard layout configuration"""
    user_id = serializers.UUIDField()
    layout_name = serializers.CharField()
    widgets = serializers.ListField(child=DashboardWidgetSerializer())
    grid_config = serializers.DictField()
    theme = serializers.CharField()
    is_default = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


class ExportDataSerializer(serializers.Serializer):
    """Serializer for data export requests"""
    data_type = serializers.ChoiceField(choices=[
        'users', 'games', 'transactions', 'kyc', 'promo', 'audit_logs'
    ])
    format = serializers.ChoiceField(choices=['csv', 'json', 'xlsx'])
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    filters = serializers.DictField(required=False)
    include_headers = serializers.BooleanField(default=True)
    
    def validate(self, data):
        """Validate export parameters"""
        date_from = data.get('date_from')
        date_to = data.get('date_to')
        
        if date_from and date_to and date_from > date_to:
            raise serializers.ValidationError("date_from cannot be after date_to")
        
        return data


class BulkActionSerializer(serializers.Serializer):
    """Serializer for bulk actions"""
    action = serializers.CharField()
    resource_type = serializers.CharField()
    resource_ids = serializers.ListField(child=serializers.UUIDField())
    parameters = serializers.DictField(required=False)
    
    def validate_resource_ids(self, value):
        """Validate resource IDs"""
        if not value:
            raise serializers.ValidationError("At least one resource ID is required")
        return value


class NotificationSerializer(serializers.Serializer):
    """Serializer for system notifications"""
    id = serializers.UUIDField()
    title = serializers.CharField()
    message = serializers.CharField()
    notification_type = serializers.CharField()
    priority = serializers.CharField()
    is_read = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    read_at = serializers.DateTimeField()
    action_url = serializers.URLField(required=False)
    metadata = serializers.DictField()


class NotificationCreateSerializer(serializers.Serializer):
    """Serializer for creating notifications"""
    title = serializers.CharField(max_length=200)
    message = serializers.CharField()
    notification_type = serializers.ChoiceField(choices=[
        'info', 'warning', 'error', 'success', 'system'
    ])
    priority = serializers.ChoiceField(choices=[
        'low', 'normal', 'high', 'urgent'
    ])
    recipients = serializers.ListField(child=serializers.UUIDField(), required=False)
    action_url = serializers.URLField(required=False)
    metadata = serializers.DictField(required=False)


class ReportGeneratorSerializer(serializers.Serializer):
    """Serializer for report generation"""
    report_type = serializers.ChoiceField(choices=[
        'user_activity', 'financial_summary', 'game_performance', 
        'kyc_summary', 'promo_effectiveness', 'system_health'
    ])
    date_range = serializers.ChoiceField(choices=[
        'today', 'yesterday', 'last_7_days', 'last_30_days', 
        'last_90_days', 'this_month', 'last_month', 'custom'
    ])
    custom_start_date = serializers.DateField(required=False)
    custom_end_date = serializers.DateField(required=False)
    format = serializers.ChoiceField(choices=['pdf', 'html', 'csv', 'xlsx'])
    include_charts = serializers.BooleanField(default=True)
    include_details = serializers.BooleanField(default=False)
    
    def validate(self, data):
        """Validate report parameters"""
        date_range = data.get('date_range')
        custom_start_date = data.get('custom_start_date')
        custom_end_date = data.get('custom_end_date')
        
        if date_range == 'custom':
            if not custom_start_date or not custom_end_date:
                raise serializers.ValidationError("Custom dates are required for custom date range")
            
            if custom_start_date > custom_end_date:
                raise serializers.ValidationError("Start date cannot be after end date")
        
        return data


