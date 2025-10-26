from rest_framework import serializers
from .models import PromoCode, PromoCodeUsage, PromoManager, PromoCodeRequest

class PromoCodeSerializer(serializers.ModelSerializer):
    """Serializer for PromoCode model"""
    
    is_valid = serializers.ReadOnlyField()
    can_be_used = serializers.SerializerMethodField()
    
    class Meta:
        model = PromoCode
        fields = [
            'id', 'code', 'name', 'description', 'discount_type', 'discount_value',
            'max_discount', 'max_uses', 'total_max_uses', 'current_uses',
            'valid_from', 'valid_until', 'status', 'min_deposit', 'min_games_played',
            'restricted_to_new_users', 'restricted_to_existing_users',
            'restricted_countries', 'is_valid', 'can_be_used', 'created_at'
        ]
        read_only_fields = ['id', 'current_uses', 'created_at', 'updated_at']
    
    def get_can_be_used(self, obj):
        """Check if current user can use this promo code"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.can_be_used_by_user(request.user)
        return False


class PromoCodeUsageSerializer(serializers.ModelSerializer):
    """Serializer for PromoCodeUsage model"""
    
    promo_code_info = PromoCodeSerializer(source='promo_code', read_only=True)
    user_email = serializers.ReadOnlyField(source='user.email')
    manager_info = serializers.SerializerMethodField()
    
    class Meta:
        model = PromoCodeUsage
        fields = [
            'id', 'promo_code', 'promo_code_info', 'user', 'user_email',
            'used_at', 'status', 'deposit_amount', 'discount_amount',
            'bonus_coins', 'assigned_manager', 'manager_info', 'notes'
        ]
        read_only_fields = ['id', 'used_at', 'promo_code_info', 'user_email']
    
    def get_manager_info(self, obj):
        """Get manager information if assigned"""
        if obj.assigned_manager:
            return {
                'id': obj.assigned_manager.id,
                'email': obj.assigned_manager.user.email,
                'telegram_username': obj.assigned_manager.telegram_username
            }
        return None


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


class CreatePromoCodeSerializer(serializers.ModelSerializer):
    """Serializer for creating new promo codes"""
    
    class Meta:
        model = PromoCode
        fields = [
            'code', 'name', 'description', 'discount_type', 'discount_value',
            'max_discount', 'max_uses', 'total_max_uses', 'valid_from',
            'valid_until', 'min_deposit', 'min_games_played',
            'restricted_to_new_users', 'restricted_to_existing_users',
            'restricted_countries'
        ]
    
    def validate_code(self, value):
        """Validate promo code format"""
        if not value.isalnum():
            raise serializers.ValidationError("Promo code must contain only letters and numbers")
        if len(value) < 3:
            raise serializers.ValidationError("Promo code must be at least 3 characters long")
        return value.upper()
    
    def validate(self, data):
        """Validate promo code data"""
        # Check if valid_until is after valid_from
        if data.get('valid_until') and data.get('valid_from'):
            if data['valid_until'] <= data['valid_from']:
                raise serializers.ValidationError("Valid until date must be after valid from date")
        
        # Check discount value
        if data['discount_value'] <= 0:
            raise serializers.ValidationError("Discount value must be positive")
        
        # Check max discount for percentage discounts
        if data['discount_type'] == 'percentage' and data.get('max_discount'):
            if data['max_discount'] <= 0:
                raise serializers.ValidationError("Maximum discount must be positive")
        
        return data


class UsePromoCodeSerializer(serializers.Serializer):
    """Serializer for using a promo code"""
    
    promo_code = serializers.CharField(max_length=50)
    deposit_amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    
    def validate_promo_code(self, value):
        """Validate promo code exists and is active"""
        try:
            promo = PromoCode.objects.get(code=value.upper())
            if not promo.is_valid():
                raise serializers.ValidationError("Promo code is not active")
        except PromoCode.DoesNotExist:
            raise serializers.ValidationError("Invalid promo code")
        
        return value.upper()
    
    def validate(self, data):
        """Validate promo code usage"""
        promo_code = data['promo_code']
        deposit_amount = data['deposit_amount']
        
        try:
            promo = PromoCode.objects.get(code=promo_code)
            
            # Check minimum deposit
            if deposit_amount < promo.min_deposit:
                raise serializers.ValidationError(
                    f"Minimum deposit required: {promo.min_deposit} EUR"
                )
            
            # Check if user can use this promo
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                if not promo.can_be_used_by_user(request.user):
                    raise serializers.ValidationError("You cannot use this promo code")
            
        except PromoCode.DoesNotExist:
            raise serializers.ValidationError("Invalid promo code")
        
        return data


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








