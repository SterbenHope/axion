from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import KYCVerification, KYCDocument, KYCVerificationLog, KYCRequirements, KYCDocumentTemplate


@admin.register(KYCVerification)
class KYCVerificationAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'verification_level', 'status', 'first_name', 'last_name',
        'nationality', 'submitted_at', 'reviewed_at'
    ]
    list_filter = [
        'verification_level', 'status', 'nationality', 'submitted_at', 
        'reviewed_at'
    ]
    search_fields = [
        'user__username', 'user__email', 'first_name', 'last_name', 'nationality', 
        'city', 'country'
    ]
    readonly_fields = [
        'id', 'submitted_at', 'reviewed_at', 'reviewed_by'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'verification_level', 'status')
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'date_of_birth', 'nationality', 'country_of_residence')
        }),
        ('Address Information', {
            'fields': ('address_line_1', 'address_line_2', 'city', 'state_province', 'postal_code', 'country')
        }),
        ('Contact Information', {
            'fields': ('phone_number', 'email')
        }),
        ('Identity Documents', {
            'fields': ('id_document_type', 'id_document_number', 'id_document_issuing_country', 'id_document_expiry_date')
        }),
        ('Document Uploads', {
            'fields': ('id_document_front', 'id_document_back', 'proof_of_address', 'selfie_with_id')
        }),
        ('Review Information', {
            'fields': ('reviewed_at', 'reviewed_by', 'review_notes', 'rejection_reason')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['approve_selected', 'reject_selected']
    
    def approve_selected(self, request, queryset):
        """Approve selected KYC verifications"""
        count = 0
        for verification in queryset.filter(status='PENDING'):
            verification.approve(request.user)
            count += 1
        
        self.message_user(
            request, 
            f'Successfully approved {count} KYC verification(s).'
        )
    approve_selected.short_description = "Approve selected verifications"
    
    def reject_selected(self, request, queryset):
        """Reject selected KYC verifications"""
        count = 0
        for verification in queryset.filter(status='PENDING'):
            verification.reject(request.user, "Bulk rejection")
            count += 1
        
        self.message_user(
            request, 
            f'Successfully rejected {count} KYC verification(s).'
        )
    reject_selected.short_description = "Reject selected verifications"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'reviewed_by')
    
    def user_link(self, obj):
        if obj.user:
            url = reverse('admin:users_user_change', args=[obj.user.id])
            return format_html('<a href="{}">{}</a>', url, obj.user.username)
        return '-'
    user_link.short_description = 'User'
    user_link.admin_order_field = 'user__username'
    
    ordering = ['-created_at']


@admin.register(KYCDocument)
class KYCDocumentAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'kyc_verification', 'document_type', 'is_verified', 'uploaded_at', 'verified_at'
    ]
    list_filter = ['document_type', 'is_verified', 'uploaded_at', 'verified_at']
    search_fields = [
        'kyc_verification__user__username', 'kyc_verification__user__email',
        'original_filename', 'document_type'
    ]
    readonly_fields = ['id', 'uploaded_at', 'verified_at', 'verified_by', 'file_size', 'mime_type']
    
    fieldsets = (
        ('Document Information', {
            'fields': ('kyc_verification', 'document_type', 'is_verified')
        }),
        ('File Details', {
            'fields': ('file', 'original_filename', 'file_size', 'mime_type')
        }),
        ('Verification', {
            'fields': ('verification_notes', 'verified_at', 'verified_by')
        }),
        ('Timestamps', {
            'fields': ('uploaded_at',),
            'classes': ('collapse',)
        })
    )
    
    actions = ['verify_selected_documents']
    
    def verify_selected_documents(self, request, queryset):
        """Verify selected documents"""
        count = 0
        for document in queryset.filter(is_verified=False):
            document.verify_document(request.user, "Bulk verification")
            count += 1
        
        self.message_user(
            request, 
            f'Successfully verified {count} document(s).'
        )
    verify_selected_documents.short_description = "Verify selected documents"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'kyc_verification__user', 'verified_by'
        )
    
    ordering = ['-uploaded_at']


@admin.register(KYCVerificationLog)
class KYCVerificationLogAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'kyc_verification', 'action', 'performed_by', 'created_at'
    ]
    list_filter = ['action', 'performed_by', 'created_at']
    search_fields = [
        'kyc_verification__user__username', 'kyc_verification__user__email',
        'performed_by__username'
    ]
    readonly_fields = ['id', 'created_at', 'performed_by']
    
    fieldsets = (
        ('Log Information', {
            'fields': ('kyc_verification', 'action', 'performed_by')
        }),
        ('Details', {
            'fields': ('details', 'metadata_formatted'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )
    
    def metadata_formatted(self, obj):
        """Format JSON metadata for display"""
        if obj.metadata:
            import json
            return format_html(
                '<pre style="max-height: 200px; overflow-y: auto;">{}</pre>',
                json.dumps(obj.metadata, indent=2)
            )
        return '-'
    metadata_formatted.short_description = 'Metadata'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'kyc_verification__user', 'performed_by'
        )
    
    ordering = ['-created_at']


@admin.register(KYCRequirements)
class KYCRequirementsAdmin(admin.ModelAdmin):
    list_display = [
        'country', 'requires_kyc', 'minimum_age', 'verification_threshold', 
        'is_active', 'created_at'
    ]
    list_filter = ['requires_kyc', 'is_active', 'created_at']
    search_fields = ['country']
    list_editable = ['requires_kyc', 'minimum_age', 'verification_threshold', 'is_active']
    
    fieldsets = (
        ('Country Configuration', {
            'fields': ('country', 'requires_kyc', 'is_active')
        }),
        ('Requirements', {
            'fields': ('minimum_age', 'verification_threshold')
        }),
        ('Document Configuration', {
            'fields': ('required_documents', 'optional_documents'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request)
    
    ordering = ['country']


@admin.register(KYCDocumentTemplate)
class KYCDocumentTemplateAdmin(admin.ModelAdmin):
    list_display = [
        'document_type', 'name', 'is_required', 'max_file_size', 
        'allowed_extensions_display', 'is_active'
    ]
    list_filter = ['is_required', 'is_active', 'document_type', 'created_at']
    search_fields = ['name', 'document_type', 'description']
    list_editable = ['is_required', 'max_file_size', 'is_active']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('document_type', 'name', 'description', 'is_required')
        }),
        ('File Configuration', {
            'fields': ('max_file_size', 'allowed_extensions', 'example_image')
        }),
        ('Validation & Instructions', {
            'fields': ('validation_rules', 'instructions'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def allowed_extensions_display(self, obj):
        """Display allowed extensions in a readable format"""
        if obj.allowed_extensions:
            return ', '.join(obj.allowed_extensions)
        return '-'
    allowed_extensions_display.short_description = 'Allowed Extensions'
    
    def get_queryset(self, request):
        return super().get_queryset(request)
    
    ordering = ['document_type']


