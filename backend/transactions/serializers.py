from rest_framework import serializers
from django.core.validators import MinValueValidator
from .models import Transaction, DepositRequest, WithdrawalRequest, TransactionLog, CryptoPayment


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for Transaction model"""
    user = serializers.StringRelatedField(read_only=True)
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_credit = serializers.BooleanField(read_only=True)
    is_debit = serializers.BooleanField(read_only=True)
    is_pending = serializers.BooleanField(read_only=True)
    is_completed = serializers.BooleanField(read_only=True)
    is_failed = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'user', 'transaction_type', 'transaction_type_display', 'status', 'status_display',
            'amount', 'currency', 'fee_amount', 'net_amount', 'balance_before', 'balance_after',
            'reference_id', 'external_reference', 'description', 'game_round', 'promo_code',
            'kyc_submission', 'ip_address', 'user_agent', 'created_at', 'updated_at',
            'processed_at', 'admin_notes', 'processed_by', 'is_credit', 'is_debit',
            'is_pending', 'is_completed', 'is_failed'
        ]
        read_only_fields = [
            'id', 'user', 'balance_before', 'balance_after', 'reference_id', 'external_reference',
            'ip_address', 'user_agent', 'created_at', 'updated_at', 'processed_at',
            'admin_notes', 'processed_by', 'is_credit', 'is_debit', 'is_pending',
            'is_completed', 'is_failed'
        ]


class TransactionListSerializer(serializers.ModelSerializer):
    """Serializer for listing transactions (minimal data)"""
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_type', 'transaction_type_display', 'status', 'status_display',
            'amount', 'currency', 'net_amount', 'reference_id', 'description', 'created_at'
        ]


class DepositRequestSerializer(serializers.ModelSerializer):
    """Serializer for DepositRequest model"""
    user = serializers.StringRelatedField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    is_pending = serializers.BooleanField(read_only=True)
    is_approved = serializers.BooleanField(read_only=True)
    is_rejected = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = DepositRequest
        fields = [
            'id', 'user', 'amount', 'currency', 'payment_method', 'payment_method_display',
            'status', 'status_display', 'payment_reference', 'payment_proof', 'payment_notes',
            'requested_at', 'processed_at', 'processed_by', 'admin_notes', 'rejection_reason',
            'ip_address', 'user_agent', 'is_pending', 'is_approved', 'is_rejected'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'requested_at', 'processed_at', 'processed_by',
            'admin_notes', 'rejection_reason', 'ip_address', 'user_agent', 'is_pending',
            'is_approved', 'is_rejected'
        ]


class DepositRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating deposit requests"""
    amount = serializers.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        validators=[MinValueValidator(1.0)]
    )
    
    class Meta:
        model = DepositRequest
        fields = [
            'amount', 'currency', 'payment_method', 'payment_reference', 
            'payment_proof', 'payment_notes'
        ]
    
    def validate_amount(self, value):
        """Validate deposit amount"""
        if value < 1.0:
            raise serializers.ValidationError("Minimum deposit amount is 1.0 NeonCoins")
        return value
    
    def validate(self, data):
        """Validate deposit request data"""
        # Check if user has pending deposit requests
        user = self.context['request'].user
        pending_deposits = DepositRequest.objects.filter(
            user=user, 
            status='PENDING'
        ).count()
        
        if pending_deposits >= 3:
            raise serializers.ValidationError("You can have maximum 3 pending deposit requests")
        
        return data


class WithdrawalRequestSerializer(serializers.ModelSerializer):
    """Serializer for WithdrawalRequest model"""
    user = serializers.StringRelatedField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    is_pending = serializers.BooleanField(read_only=True)
    is_approved = serializers.BooleanField(read_only=True)
    is_rejected = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = WithdrawalRequest
        fields = [
            'id', 'user', 'amount', 'currency', 'payment_method', 'payment_method_display',
            'status', 'status_display', 'withdrawal_address', 'withdrawal_notes',
            'requested_at', 'processed_at', 'processed_by', 'admin_notes', 'rejection_reason',
            'ip_address', 'user_agent', 'is_pending', 'is_approved', 'is_rejected'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'requested_at', 'processed_at', 'processed_by',
            'admin_notes', 'rejection_reason', 'ip_address', 'user_agent', 'is_pending',
            'is_approved', 'is_rejected'
        ]


class WithdrawalRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating withdrawal requests"""
    amount = serializers.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        validators=[MinValueValidator(10.0)]
    )
    
    class Meta:
        model = WithdrawalRequest
        fields = [
            'amount', 'currency', 'payment_method', 'withdrawal_address', 'withdrawal_notes'
        ]
    
    def validate_amount(self, value):
        """Validate withdrawal amount"""
        if value < 10.0:
            raise serializers.ValidationError("Minimum withdrawal amount is 10.0 NeonCoins")
        return value
    
    def validate(self, data):
        """Validate withdrawal request data"""
        user = self.context['request'].user
        
        # Check if user has sufficient balance
        if user.balance_neon < data['amount']:
            raise serializers.ValidationError("Insufficient balance for withdrawal")
        
        # Check KYC status
        if not user.is_kyc_verified:
            raise serializers.ValidationError("You must complete KYC verification before withdrawal")
        
        # Check if user has pending withdrawal requests
        pending_withdrawals = WithdrawalRequest.objects.filter(
            user=user, 
            status='PENDING'
        ).count()
        
        if pending_withdrawals >= 2:
            raise serializers.ValidationError("You can have maximum 2 pending withdrawal requests")
        
        return data


class TransactionLogSerializer(serializers.ModelSerializer):
    """Serializer for TransactionLog model"""
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    performed_by = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = TransactionLog
        fields = [
            'id', 'action', 'action_display', 'performed_by', 'timestamp', 'details',
            'ip_address', 'transaction', 'deposit_request', 'withdrawal_request'
        ]
        read_only_fields = ['id', 'timestamp']


class TransactionSummarySerializer(serializers.Serializer):
    """Serializer for transaction summary"""
    total_transactions = serializers.IntegerField()
    total_deposits = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_withdrawals = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_bonuses = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_fees = serializers.DecimalField(max_digits=15, decimal_places=2)
    net_flow = serializers.DecimalField(max_digits=15, decimal_places=2)
    pending_deposits = serializers.IntegerField()
    pending_withdrawals = serializers.IntegerField()
    recent_transactions = serializers.ListField(child=TransactionListSerializer())


class DepositRequestSummarySerializer(serializers.Serializer):
    """Serializer for deposit request summary"""
    total_requests = serializers.IntegerField()
    pending_requests = serializers.IntegerField()
    approved_requests = serializers.IntegerField()
    rejected_requests = serializers.IntegerField()
    total_amount_pending = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_amount_approved = serializers.DecimalField(max_digits=15, decimal_places=2)
    recent_requests = serializers.ListField(child=DepositRequestSerializer())


class WithdrawalRequestSummarySerializer(serializers.Serializer):
    """Serializer for withdrawal request summary"""
    total_requests = serializers.IntegerField()
    pending_requests = serializers.IntegerField()
    approved_requests = serializers.IntegerField()
    rejected_requests = serializers.IntegerField()
    total_amount_pending = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_amount_approved = serializers.DecimalField(max_digits=15, decimal_places=2)
    recent_requests = serializers.ListField(child=WithdrawalRequestSerializer())


class TransactionFilterSerializer(serializers.Serializer):
    """Serializer for filtering transactions"""
    transaction_type = serializers.ChoiceField(
        choices=Transaction.TYPE_CHOICES,
        required=False
    )
    status = serializers.ChoiceField(
        choices=Transaction.STATUS_CHOICES,
        required=False
    )
    currency = serializers.CharField(max_length=3, required=False)
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    min_amount = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    max_amount = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    
    def validate(self, data):
        """Validate filter parameters"""
        date_from = data.get('date_from')
        date_to = data.get('date_to')
        
        if date_from and date_to and date_from > date_to:
            raise serializers.ValidationError("date_from cannot be after date_to")
        
        min_amount = data.get('min_amount')
        max_amount = data.get('max_amount')
        
        if min_amount and max_amount and min_amount > max_amount:
            raise serializers.ValidationError("min_amount cannot be greater than max_amount")
        
        return data


class DepositRequestFilterSerializer(serializers.Serializer):
    """Serializer for filtering deposit requests"""
    status = serializers.ChoiceField(
        choices=DepositRequest.STATUS_CHOICES,
        required=False
    )
    payment_method = serializers.ChoiceField(
        choices=DepositRequest.PAYMENT_METHOD_CHOICES,
        required=False
    )
    currency = serializers.CharField(max_length=3, required=False)
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    min_amount = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    max_amount = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)


class WithdrawalRequestFilterSerializer(serializers.Serializer):
    """Serializer for filtering withdrawal requests"""
    status = serializers.ChoiceField(
        choices=WithdrawalRequest.STATUS_CHOICES,
        required=False
    )
    payment_method = serializers.ChoiceField(
        choices=WithdrawalRequest.PAYMENT_METHOD_CHOICES,
        required=False
    )
    currency = serializers.CharField(max_length=3, required=False)
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    min_amount = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    max_amount = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)


class TransactionBulkActionSerializer(serializers.Serializer):
    """Serializer for bulk actions on transactions"""
    action = serializers.ChoiceField(choices=[
        'process', 'reject', 'cancel', 'refund'
    ])
    transaction_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1
    )
    reason = serializers.CharField(required=False)
    
    def validate_transaction_ids(self, value):
        """Validate transaction IDs exist"""
        from .models import Transaction
        existing_ids = Transaction.objects.filter(id__in=value).values_list('id', flat=True)
        if len(existing_ids) != len(value):
            missing_ids = set(value) - set(existing_ids)
            raise serializers.ValidationError(f"Transactions not found: {missing_ids}")
        return value


class DepositRequestBulkActionSerializer(serializers.Serializer):
    """Serializer for bulk actions on deposit requests"""
    action = serializers.ChoiceField(choices=[
        'approve', 'reject', 'cancel'
    ])
    deposit_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1
    )
    reason = serializers.CharField(required=False)
    notes = serializers.CharField(required=False)
    
    def validate_deposit_ids(self, value):
        """Validate deposit request IDs exist"""
        from .models import DepositRequest
        existing_ids = DepositRequest.objects.filter(id__in=value).values_list('id', flat=True)
        if len(existing_ids) != len(value):
            missing_ids = set(value) - set(existing_ids)
            raise serializers.ValidationError(f"Deposit requests not found: {missing_ids}")
        return value


class WithdrawalRequestBulkActionSerializer(serializers.Serializer):
    """Serializer for bulk actions on withdrawal requests"""
    action = serializers.ChoiceField(choices=[
        'approve', 'reject', 'cancel'
    ])
    withdrawal_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1
    )
    reason = serializers.CharField(required=False)
    notes = serializers.CharField(required=False)
    
    def validate_withdrawal_ids(self, value):
        """Validate withdrawal request IDs exist"""
        from .models import WithdrawalRequest
        existing_ids = WithdrawalRequest.objects.filter(id__in=value).values_list('id', flat=True)
        if len(existing_ids) != len(value):
            missing_ids = set(value) - set(existing_ids)
            raise serializers.ValidationError(f"Withdrawal requests not found: {missing_ids}")
        return value


class CryptoPaymentIntentSerializer(serializers.Serializer):
    """Сериализатор для создания крипто-платежа"""
    amount = serializers.DecimalField(max_digits=20, decimal_places=8)
    currency = serializers.ChoiceField(choices=[
        ('BTC', 'Bitcoin'),
        ('ETH', 'Ethereum'), 
        ('USDT', 'Tether'),
        ('BNB', 'Binance Coin')
    ])
    network = serializers.CharField(max_length=20)

class CryptoPaymentStatusSerializer(serializers.ModelSerializer):
    """Сериализатор для статуса крипто-платежа"""
    class Meta:
        model = CryptoPayment
        fields = ['id', 'status', 'confirmations', 'required_confirmations', 'created_at', 'confirmed_at']


