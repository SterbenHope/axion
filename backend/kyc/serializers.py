from rest_framework import serializers
from .models import KYCVerification, KYCDocument, KYCVerificationLog, KYCRequirements, KYCDocumentTemplate
from users.models import User


class KYCVerificationSerializer(serializers.ModelSerializer):
    """Serializer for KYC verification"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    verification_level_display = serializers.CharField(source='get_verification_level_display', read_only=True)
    
    class Meta:
        model = KYCVerification
        fields = [
            'id', 'user', 'user_username', 'user_email', 'verification_level', 'verification_level_display',
            'status', 'status_display', 'first_name', 'last_name', 'date_of_birth', 'nationality',
            'country_of_residence', 'address_line_1', 'address_line_2', 'city', 'state_province',
            'postal_code', 'country', 'phone_number', 'email', 'id_document_type',
            'id_document_number', 'id_document_issuing_country', 'id_document_expiry_date',
            'id_document_front', 'id_document_back', 'proof_of_address', 'selfie_with_id',
            'submitted_at', 'reviewed_at', 'reviewed_by', 'reviewed_by_username',
            'review_notes', 'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'submitted_at', 'reviewed_at', 'reviewed_by', 'created_at', 'updated_at'
        ]


class KYCVerificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating KYC verification"""
    
    class Meta:
        model = KYCVerification
        fields = [
            'verification_level', 'first_name', 'last_name', 'date_of_birth', 'nationality',
            'country_of_residence', 'address_line_1', 'address_line_2', 'city', 'state_province',
            'postal_code', 'country', 'phone_number', 'email', 'id_document_type',
            'id_document_number', 'id_document_issuing_country', 'id_document_expiry_date',
            'id_document_front', 'id_document_back', 'proof_of_address', 'selfie_with_id'
        ]
    
    def validate(self, data):
        """Validate KYC data"""
        # Check if user already has a pending verification
        user = self.context['request'].user
        if KYCVerification.objects.filter(
            user=user,
            status__in=['PENDING']
        ).exists():
            raise serializers.ValidationError("You already have a pending KYC verification")
        
        # Validate document expiry date
        if data.get('id_document_expiry_date'):
            from django.utils import timezone
            if data['id_document_expiry_date'] <= timezone.now().date():
                raise serializers.ValidationError("ID document must not be expired")
        
        return data


class KYCVerificationUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating KYC verification"""
    
    class Meta:
        model = KYCVerification
        fields = [
            'first_name', 'last_name', 'date_of_birth', 'nationality',
            'country_of_residence', 'address_line_1', 'address_line_2', 'city', 'state_province',
            'postal_code', 'country', 'phone_number', 'email', 'id_document_type',
            'id_document_number', 'id_document_issuing_country', 'id_document_expiry_date',
            'id_document_front', 'id_document_back', 'proof_of_address', 'selfie_with_id'
        ]
    
    def validate(self, data):
        """Validate update data"""
        instance = self.instance
        
        # Only allow updates for pending verifications
        if instance.status != 'PENDING':
            raise serializers.ValidationError("Cannot update non-pending verification")
        
        # Validate document expiry date
        if data.get('id_document_expiry_date'):
            from django.utils import timezone
            if data['id_document_expiry_date'] <= timezone.now().date():
                raise serializers.ValidationError("ID document must not be expired")
        
        return data


class KYCVerificationReviewSerializer(serializers.Serializer):
    """Serializer for reviewing KYC verification"""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    notes = serializers.CharField(required=False, allow_blank=True)
    reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        """Validate review data"""
        action = data['action']
        
        if action == 'reject' and not data.get('reason'):
            raise serializers.ValidationError("Reason is required when rejecting KYC verification")
        
        return data


class KYCVerificationLogSerializer(serializers.ModelSerializer):
    """Serializer for KYC verification logs"""
    performed_by_username = serializers.CharField(source='performed_by.username', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = KYCVerificationLog
        fields = [
            'id', 'kyc_verification', 'action', 'action_display', 'description',
            'performed_by', 'performed_by_username', 'ip_address', 'user_agent',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class KYCStatusSerializer(serializers.Serializer):
    """Serializer for KYC status"""
    kyc_status = serializers.CharField()
    verification_id = serializers.UUIDField(allow_null=True)
    verification_status = serializers.CharField(allow_null=True)
    verification_level = serializers.CharField(allow_null=True)
    submitted_at = serializers.DateTimeField(allow_null=True)
    reviewed_at = serializers.DateTimeField(allow_null=True)
    rejection_reason = serializers.CharField(allow_null=True)
    can_submit = serializers.BooleanField()
    can_update = serializers.BooleanField()
    requirements_met = serializers.BooleanField()


class KYCDocumentSerializer(serializers.ModelSerializer):
    """Serializer for KYC documents"""
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    
    class Meta:
        model = KYCDocument
        fields = [
            'id', 'kyc_verification', 'document_type', 'document_type_display',
            'file', 'file_name', 'file_size', 'content_type', 'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_at']


class KYCUploadURLSerializer(serializers.Serializer):
    """Serializer for KYC upload URL request"""
    document_type = serializers.CharField()
    file_name = serializers.CharField()
    file_size = serializers.IntegerField()
    content_type = serializers.CharField()


class KYCUploadResponseSerializer(serializers.Serializer):
    """Serializer for KYC upload URL response"""
    upload_url = serializers.URLField()
    document_type = serializers.CharField()
    file_name = serializers.CharField()
    expires_in = serializers.IntegerField()
    fields = serializers.DictField()


class KYCVerificationSummarySerializer(serializers.Serializer):
    """Serializer for KYC verification summary"""
    total_verifications = serializers.IntegerField()
    pending_verifications = serializers.IntegerField()
    approved_verifications = serializers.IntegerField()
    rejected_verifications = serializers.IntegerField()
    approval_rate = serializers.FloatField()
    average_processing_time = serializers.FloatField()


class KYCComplianceReportSerializer(serializers.Serializer):
    """Serializer for KYC compliance report"""
    period = serializers.DictField()
    summary = serializers.DictField()
    processing_times = serializers.DictField()
    country_distribution = serializers.ListField()
    document_type_distribution = serializers.ListField()



class KYCDocumentTemplateSerializer(serializers.ModelSerializer):
    """Serializer for KYC document templates"""
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    
    class Meta:
        model = KYCDocumentTemplate
        fields = [
            'id', 'document_type', 'document_type_display', 'name', 'description',
            'is_required', 'max_file_size', 'allowed_extensions', 'validation_rules',
            'instructions', 'example_image', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class KYCStatusSerializer(serializers.Serializer):
    """Serializer for KYC status information"""
    kyc_status = serializers.CharField()
    submission_id = serializers.UUIDField(allow_null=True)
    submission_status = serializers.CharField(allow_null=True)
    submitted_at = serializers.DateTimeField(allow_null=True)
    reviewed_at = serializers.DateTimeField(allow_null=True)
    rejection_reason = serializers.CharField(allow_null=True)
    additional_notes = serializers.CharField(allow_null=True)
    verification_attempts = serializers.IntegerField()
    last_verification_attempt = serializers.DateTimeField(allow_null=True)
    can_submit = serializers.BooleanField()
    can_update = serializers.BooleanField()
    requirements_met = serializers.BooleanField()


class KYCUploadURLSerializer(serializers.Serializer):
    """Serializer for S3 presigned upload URLs"""
    document_type = serializers.CharField()
    file_name = serializers.CharField()
    file_size = serializers.IntegerField()
    content_type = serializers.CharField()
    
    def validate_file_size(self, value):
        """Validate file size (max 10MB)"""
        max_size = 10 * 1024 * 1024  # 10MB in bytes
        
        if value > max_size:
            raise serializers.ValidationError("File size cannot exceed 10MB")
        
        return value
    
    def validate_content_type(self, value):
        """Validate content type"""
        allowed_types = [
            'image/jpeg', 'image/jpg', 'image/png', 'application/pdf'
        ]
        
        if value not in allowed_types:
            raise serializers.ValidationError("Invalid file type. Only JPEG, PNG, and PDF are allowed")
        
        return value


class KYCUploadResponseSerializer(serializers.Serializer):
    """Serializer for S3 presigned upload response"""
    upload_url = serializers.URLField()
    file_key = serializers.CharField()
    expires_in = serializers.IntegerField()  # seconds
    fields = serializers.DictField()  # form fields for upload


class KYCSubmissionSummarySerializer(serializers.Serializer):
    """Serializer for KYC submission summary"""
    total_submissions = serializers.IntegerField()
    pending_review = serializers.IntegerField()
    approved = serializers.IntegerField()
    rejected = serializers.IntegerField()
    additional_info_required = serializers.IntegerField()
    average_processing_time = serializers.FloatField()  # hours
    recent_submissions = serializers.ListField(child=KYCVerificationSerializer())


class KYCComplianceReportSerializer(serializers.Serializer):
    """Serializer for KYC compliance report"""
    report_date = serializers.DateField()
    total_users = serializers.IntegerField()
    kyc_verified_users = serializers.IntegerField()
    kyc_pending_users = serializers.IntegerField()
    kyc_rejected_users = serializers.IntegerField()
    compliance_rate = serializers.FloatField()  # percentage
    country_breakdown = serializers.DictField()
    document_type_breakdown = serializers.DictField()
    processing_times = serializers.DictField()


