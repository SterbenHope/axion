"""
User serializers for NeonCasino.
"""

from rest_framework import serializers
from .models import User, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model."""
    
    class Meta:
        model = UserProfile
        fields = [
            'favorite_game', 'total_games_played', 'total_wins', 
            'total_losses', 'achievements', 'notifications_enabled',
            'email_marketing', 'created_at', 'updated_at'
        ]
        read_only_fields = ['total_games_played', 'total_wins', 'total_losses', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'balance_neon', 'kyc_status', 'is_email_verified',
            'avatar', 'phone_number', 'date_of_birth', 'created_at',
            'profile'
        ]
        read_only_fields = ['id', 'created_at', 'balance_neon', 'kyc_status', 'is_email_verified']
    
    def to_representation(self, instance):
        """Custom representation to include computed fields."""
        data = super().to_representation(instance)
        
        # Add computed properties
        data['is_kyc_verified'] = instance.is_kyc_verified
        data['can_withdraw'] = instance.can_withdraw
        
        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'first_name', 'last_name']
    
    def validate(self, attrs):
        """Validate registration data."""
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        """Create new user."""
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    username = serializers.CharField()
    password = serializers.CharField()


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone_number', 'date_of_birth']
    
    def update(self, instance, validated_data):
        """Update user profile."""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""
    
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    confirm_new_password = serializers.CharField(min_length=8)
    
    def validate(self, attrs):
        """Validate password change data."""
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs


class UserStatsSerializer(serializers.Serializer):
    """Serializer for user statistics."""
    
    total_games_played = serializers.IntegerField()
    total_wins = serializers.IntegerField()
    total_losses = serializers.IntegerField()
    win_rate = serializers.FloatField()
    total_wagered = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_won = serializers.DecimalField(max_digits=15, decimal_places=2)
    net_profit = serializers.DecimalField(max_digits=15, decimal_places=2)
    current_balance = serializers.DecimalField(max_digits=15, decimal_places=2)
    recent_games = serializers.ListField()
    recent_achievements = serializers.ListField()


