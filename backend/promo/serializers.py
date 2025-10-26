"""
Promo code serializers for NeonCasino.
"""

from rest_framework import serializers
from .models import PromoCode, PromoRedemption, PromoCampaign, PromoManager, PromoCodeRequest


class PromoCodeSerializer(serializers.ModelSerializer):
    """Serializer for PromoCode model."""
    
    class Meta:
        model = PromoCode
        fields = [
            'id', 'code', 'name', 'description', 'promo_type', 'status',
            'bonus_amount', 'bonus_percentage', 'max_bonus', 'min_deposit',
            'free_spins', 'max_uses', 'max_uses_per_user', 'current_uses',
            'valid_from', 'valid_until', 'created_at', 'updated_at',
            'is_valid', 'is_available'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_valid', 'is_available', 'current_uses']


class PromoRedemptionSerializer(serializers.ModelSerializer):
    """Serializer for PromoRedemption model."""
    
    promo_code_name = serializers.CharField(source='promo_code.name', read_only=True)
    promo_code_code = serializers.CharField(source='promo_code.code', read_only=True)
    
    class Meta:
        model = PromoRedemption
        fields = [
            'id', 'promo_code_name', 'promo_code_code', 'bonus_amount',
            'free_spins_awarded', 'free_spins_used', 'wagering_requirement',
            'wagering_completed', 'wagering_progress', 'status',
            'redeemed_at', 'expires_at', 'completed_at', 'is_active',
            'can_withdraw', 'wagering_remaining'
        ]
        read_only_fields = ['id', 'redeemed_at', 'completed_at', 'is_active', 'can_withdraw', 'wagering_remaining']


class PromoCampaignSerializer(serializers.ModelSerializer):
    """Serializer for PromoCampaign model."""
    
    class Meta:
        model = PromoCampaign
        fields = [
            'id', 'name', 'description', 'status', 'start_date', 'end_date',
            'target_audience', 'budget', 'spent_budget', 'total_redemptions',
            'total_bonus_awarded', 'conversion_rate', 'created_at', 'updated_at',
            'is_active', 'budget_remaining', 'budget_utilization'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'total_redemptions',
            'total_bonus_awarded', 'conversion_rate', 'is_active',
            'budget_remaining', 'budget_utilization'
        ]


class PromoManagerSerializer(serializers.ModelSerializer):
    """Serializer for PromoManager model"""
    
    user_email = serializers.ReadOnlyField(source='user.email')
    user_username = serializers.ReadOnlyField(source='user.username')
    is_active = serializers.ReadOnlyField()
    
    class Meta:
        model = PromoManager
        fields = [
            'id', 'user', 'user_email', 'user_username', 'telegram_username',
            'telegram_chat_id', 'experience_years', 'experience_description',
            'skills', 'status', 'approved_by', 'approved_at',
            'total_promos_created', 'total_users_referred', 'total_revenue_generated',
            'commission_rate', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'approved_by', 'approved_at', 'created_at']


class PromoCodeRequestSerializer(serializers.ModelSerializer):
    """Serializer for PromoCodeRequest model"""
    
    manager_info = PromoManagerSerializer(source='manager', read_only=True)
    reviewed_by_email = serializers.ReadOnlyField(source='reviewed_by.email')
    
    class Meta:
        model = PromoCodeRequest
        fields = [
            'id', 'manager', 'manager_info', 'promo_code', 'name', 'description',
            'discount_type', 'discount_value', 'max_discount', 'max_uses_per_user',
            'total_max_uses', 'valid_days', 'status', 'admin_notes',
            'reviewed_by', 'reviewed_by_email', 'reviewed_at', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'reviewed_by', 'reviewed_at', 'created_at']


class ManagerApplicationSerializer(serializers.Serializer):
    """Serializer for manager applications"""
    
    telegram_username = serializers.CharField(max_length=100)
    experience_years = serializers.IntegerField(min_value=0, max_value=50)
    experience_description = serializers.CharField(max_length=1000)
    skills = serializers.ListField(
        child=serializers.CharField(max_length=100),
        max_length=20
    )
    
    def validate_telegram_username(self, value):
        """Validate telegram username format"""
        if not value.startswith('@'):
            value = '@' + value
        
        if len(value) < 2:
            raise serializers.ValidationError("Invalid telegram username")
        
        return value