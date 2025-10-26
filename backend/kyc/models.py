from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import FileExtensionValidator
import uuid


class KYCVerification(models.Model):
    """KYC verification process for users"""
    
    VERIFICATION_STATUS = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('EXPIRED', 'Expired'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    VERIFICATION_LEVELS = [
        ('BASIC', 'Basic Verification'),
        ('ENHANCED', 'Enhanced Verification'),
        ('FULL', 'Full Verification'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='kyc_verification')
    
    # Verification details
    verification_level = models.CharField(max_length=20, choices=VERIFICATION_LEVELS, default='BASIC')
    status = models.CharField(max_length=20, choices=VERIFICATION_STATUS, default='PENDING')
    
    # Personal information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    nationality = models.CharField(max_length=100)
    country_of_residence = models.CharField(max_length=100)
    
    # Address information
    address_line_1 = models.CharField(max_length=255)
    address_line_2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state_province = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    
    # Contact information
    phone_number = models.CharField(max_length=20)
    email = models.EmailField()
    
    # Identity documents
    id_document_type = models.CharField(max_length=50, choices=[
        ('PASSPORT', 'Passport'),
        ('NATIONAL_ID', 'National ID'),
        ('DRIVERS_LICENSE', 'Driver\'s License'),
        ('RESIDENCE_PERMIT', 'Residence Permit'),
    ])
    id_document_number = models.CharField(max_length=100)
    id_document_issuing_country = models.CharField(max_length=100)
    id_document_expiry_date = models.DateField()
    
    # Document uploads
    id_document_front = models.FileField(
        upload_to='kyc/documents/',
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'pdf'])]
    )
    id_document_back = models.FileField(
        upload_to='kyc/documents/',
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'pdf'])],
        blank=True
    )
    proof_of_address = models.FileField(
        upload_to='kyc/documents/',
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'pdf'])]
    )
    selfie_with_id = models.FileField(
        upload_to='kyc/documents/',
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'pdf'])]
    )
    
    # Verification process
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='kyc_reviews'
    )
    
    # Review details
    review_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'kyc_verifications'
        ordering = ['-created_at']
        verbose_name = 'KYC Verification'
        verbose_name_plural = 'KYC Verifications'
    
    def __str__(self):
        return f"{self.user.username} - {self.get_verification_level_display()}"
    
    @property
    def is_complete(self):
        """Check if all required documents are uploaded"""
        required_fields = [
            self.id_document_front,
            self.proof_of_address,
            self.selfie_with_id
        ]
        return all(field for field in required_fields)
    
    @property
    def is_expired(self):
        """Check if verification has expired"""
        if self.id_document_expiry_date:
            return self.id_document_expiry_date < timezone.now().date()
        return False
    
    def approve(self, reviewer, notes=""):
        """Approve KYC verification"""
        self.status = 'APPROVED'
        self.reviewed_at = timezone.now()
        self.reviewed_by = reviewer
        self.review_notes = notes
        self.save()
        
        # Update user KYC status
        self.user.kyc_status = 'VERIFIED'
        self.user.save(update_fields=['kyc_status'])
    
    def reject(self, reviewer, reason):
        """Reject KYC verification"""
        self.status = 'REJECTED'
        self.reviewed_at = timezone.now()
        self.reviewed_by = reviewer
        self.rejection_reason = reason
        self.save()
        
        # Update user KYC status
        self.user.kyc_status = 'REJECTED'
        self.user.save(update_fields=['kyc_status'])


class KYCDocument(models.Model):
    """Individual KYC documents"""
    
    DOCUMENT_TYPES = [
        ('ID_FRONT', 'ID Document Front'),
        ('ID_BACK', 'ID Document Back'),
        ('PROOF_OF_ADDRESS', 'Proof of Address'),
        ('SELFIE_WITH_ID', 'Selfie with ID'),
        ('BANK_STATEMENT', 'Bank Statement'),
        ('UTILITY_BILL', 'Utility Bill'),
        ('OTHER', 'Other Document'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kyc_verification = models.ForeignKey(KYCVerification, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    
    # Document details
    file = models.FileField(
        upload_to='kyc/documents/',
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'pdf'])]
    )
    original_filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    mime_type = models.CharField(max_length=100)
    
    # Verification status
    is_verified = models.BooleanField(default=False)
    verification_notes = models.TextField(blank=True)
    
    # Metadata
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='document_verifications'
    )
    
    class Meta:
        db_table = 'kyc_documents'
        ordering = ['-uploaded_at']
        verbose_name = 'KYC Document'
        verbose_name_plural = 'KYC Documents'
        unique_together = ['kyc_verification', 'document_type']
    
    def __str__(self):
        return f"{self.kyc_verification.user.username} - {self.get_document_type_display()}"
    
    def save(self, *args, **kwargs):
        """Set file metadata on save"""
        if self.file and not self.file_size:
            self.file_size = self.file.size
            self.original_filename = self.file.name.split('/')[-1]
            self.mime_type = self.file.content_type
        super().save(*args, **kwargs)
    
    def verify_document(self, verifier, notes=""):
        """Mark document as verified"""
        self.is_verified = True
        self.verified_at = timezone.now()
        self.verified_by = verifier
        self.verification_notes = notes
        self.save()


class KYCVerificationLog(models.Model):
    """Log of KYC verification activities"""
    
    ACTION_TYPES = [
        ('SUBMITTED', 'Verification Submitted'),
        ('DOCUMENT_UPLOADED', 'Document Uploaded'),
        ('DOCUMENT_VERIFIED', 'Document Verified'),
        ('REVIEW_STARTED', 'Review Started'),
        ('APPROVED', 'Verification Approved'),
        ('REJECTED', 'Verification Rejected'),
        ('EXPIRED', 'Verification Expired'),
        ('CANCELLED', 'Verification Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kyc_verification = models.ForeignKey(KYCVerification, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    
    # Action details
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    
    # User performing action
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='kyc_actions'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'kyc_verification_logs'
        ordering = ['-created_at']
        verbose_name = 'KYC Verification Log'
        verbose_name_plural = 'KYC Verification Logs'
    
    def __str__(self):
        return f"{self.kyc_verification.user.username} - {self.get_action_display()}"
    
    @classmethod
    def log_action(cls, verification, action, description, performed_by=None, metadata=None):
        """Create a log entry for KYC action"""
        return cls.objects.create(
            kyc_verification=verification,
            action=action,
            description=description,
            performed_by=performed_by,
            metadata=metadata or {}
        )



class KYCRequirements(models.Model):
    """KYC requirements for different countries"""
    country = models.CharField(max_length=3, unique=True)
    requires_kyc = models.BooleanField(default=True)
    minimum_age = models.PositiveIntegerField(default=18)
    verification_threshold = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    required_documents = models.JSONField(default=list)
    optional_documents = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'KYC Requirements'
        verbose_name_plural = 'KYC Requirements'
        ordering = ['country']
    
    def __str__(self):
        return f"KYC Requirements for {self.country}"


class KYCDocumentTemplate(models.Model):
    """Templates for KYC document types"""
    DOCUMENT_TYPES = [
        ('PASSPORT', 'Passport'),
        ('ID_CARD', 'National ID Card'),
        ('DRIVERS_LICENSE', 'Driver\'s License'),
        ('UTILITY_BILL', 'Utility Bill'),
        ('BANK_STATEMENT', 'Bank Statement'),
        ('OTHER', 'Other')
    ]
    
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_required = models.BooleanField(default=False)
    max_file_size = models.PositiveIntegerField(default=5242880)  # 5MB
    allowed_extensions = models.JSONField(default=list)
    example_image = models.ImageField(upload_to='kyc/templates/', blank=True, null=True)
    validation_rules = models.JSONField(default=dict)
    instructions = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'KYC Document Template'
        verbose_name_plural = 'KYC Document Templates'
        ordering = ['document_type', 'name']
    
    def __str__(self):
        return f"{self.get_document_type_display()} - {self.name}"


