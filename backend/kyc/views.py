from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from rest_framework import status, generics, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.views import APIView
from integrations.telegram import send_admin_notification
from telegram_bot_new.services import TelegramBotService
import uuid
from decimal import Decimal
from .models import KYCVerification, KYCDocument, KYCVerificationLog
from .serializers import (
    KYCVerificationSerializer, KYCVerificationCreateSerializer, KYCVerificationUpdateSerializer,
    KYCVerificationReviewSerializer, KYCVerificationLogSerializer, KYCStatusSerializer,
    KYCDocumentSerializer, KYCUploadURLSerializer, KYCUploadResponseSerializer,
    KYCVerificationSummarySerializer, KYCComplianceReportSerializer
)
from users.models import User


class KYCStatusView(APIView):
    """Get current user's KYC status"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get latest KYC verification
        latest_verification = KYCVerification.objects.filter(
            user=user
        ).order_by('-created_at').first()
        
        # Check if user can submit KYC
        can_submit = user.kyc_status == 'NONE' or (
            latest_verification and 
            latest_verification.status in ['REJECTED']
        )
        
        # Check if user can update existing verification
        can_update = latest_verification and latest_verification.status in ['PENDING']
        
        # Check if requirements are met
        requirements_met = True  # Simplified - would check actual requirements
        
        status_data = {
            'kyc_status': user.kyc_status,
            'verification_id': latest_verification.id if latest_verification else None,
            'verification_status': latest_verification.status if latest_verification else None,
            'verification_level': latest_verification.verification_level if latest_verification else None,
            'submitted_at': latest_verification.created_at if latest_verification else None,
            'reviewed_at': latest_verification.reviewed_at if latest_verification else None,
            'rejection_reason': latest_verification.rejection_reason if latest_verification else None,
            'can_submit': can_submit,
            'can_update': can_update,
            'requirements_met': requirements_met
        }
        
        serializer = KYCStatusSerializer(status_data)
        return Response(serializer.data)


class KYCVerificationCreateView(APIView):
    """Create new KYC verification"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Check if user can submit KYC
        if request.user.kyc_status == 'VERIFIED':
            return Response(
                {'error': 'KYC already verified'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for existing pending verification
        existing_pending = KYCVerification.objects.filter(
            user=request.user,
            status__in=['PENDING']
        ).exists()
        
        if existing_pending:
            return Response(
                {'error': 'You already have a pending KYC verification'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = KYCVerificationCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Create KYC verification
        verification = serializer.save(
            user=request.user
        )
        
        # Log the action
        KYCVerificationLog.log_action(
            verification=verification,
            action='SUBMITTED',
            description='KYC verification submitted',
            performed_by=request.user
        )
        
        return Response({
            'message': 'KYC verification submitted successfully',
            'verification_id': verification.id
        }, status=status.HTTP_201_CREATED)


class KYCVerificationDetailView(generics.RetrieveUpdateAPIView):
    """Get and update KYC verification details"""
    permission_classes = [IsAuthenticated]
    serializer_class = KYCVerificationSerializer
    
    def get_queryset(self):
        return KYCVerification.objects.filter(user=self.request.user)
    
    def get_object(self):
        return get_object_or_404(
            KYCVerification,
            user=self.request.user,
            id=self.kwargs['pk']
        )


class KYCVerificationListView(generics.ListAPIView):
    """List user's KYC verifications"""
    permission_classes = [IsAuthenticated]
    serializer_class = KYCVerificationSerializer
    
    def get_queryset(self):
        return KYCVerification.objects.filter(user=self.request.user).order_by('-created_at')


class KYCVerificationReviewView(APIView):
    """Admin review of KYC verification"""
    permission_classes = [IsAdminUser]
    
    def post(self, request, pk):
        verification = get_object_or_404(KYCVerification, pk=pk)
        serializer = KYCVerificationReviewSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action = serializer.validated_data['action']
        notes = serializer.validated_data.get('notes', '')
        
        if action == 'approve':
            verification.approve(request.user, notes)
            log_action = 'APPROVED'
            log_description = f'KYC verification approved: {notes}'
        elif action == 'reject':
            reason = serializer.validated_data.get('reason', '')
            verification.reject(request.user, reason)
            log_action = 'REJECTED'
            log_description = f'KYC verification rejected: {reason}'
        else:
            return Response(
                {'error': 'Invalid action'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Log the action
        KYCVerificationLog.log_action(
            verification=verification,
            action=log_action,
            description=log_description,
            performed_by=request.user
        )
        
        return Response({
            'message': f'KYC verification {action}d successfully',
            'verification_id': verification.id
        })


class KYCDocumentUploadView(APIView):
    """Upload KYC documents"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        verification = get_object_or_404(
            KYCVerification,
            user=request.user,
            id=request.data.get('verification_id')
        )
        
        serializer = KYCDocumentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Create document
        document = serializer.save(kyc_verification=verification)
        
        # Log the action
        KYCVerificationLog.log_action(
            verification=verification,
            action='DOCUMENT_UPLOADED',
            description=f'Document uploaded: {document.get_document_type_display()}',
            performed_by=request.user
        )
        
        try:
            send_admin_notification(f"KYC document uploaded by user {request.user.id}, verification {verification.id}")
        except Exception:
            pass
        return Response({
            'message': 'Document uploaded successfully',
            'document_id': document.id
        }, status=status.HTTP_201_CREATED)


class KYCVerificationLogView(generics.ListAPIView):
    """Get KYC verification logs"""
    permission_classes = [IsAuthenticated]
    serializer_class = KYCVerificationLogSerializer
    
    def get_queryset(self):
        verification_id = self.request.query_params.get('verification_id')
        if verification_id:
            return KYCVerificationLog.objects.filter(
                kyc_verification__user=self.request.user,
                kyc_verification_id=verification_id
            ).order_by('-created_at')
        return KYCVerificationLog.objects.filter(
            kyc_verification__user=self.request.user
        ).order_by('-created_at')


class AdminKYCViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing KYC verifications"""
    queryset = KYCVerification.objects.all()
    serializer_class = KYCVerificationSerializer
    permission_classes = [IsAdminUser]
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        verification = self.get_object()
        notes = request.data.get('notes', '')
        verification.approve(request.user, notes)
        
        return Response({
            'message': 'KYC verification approved',
            'verification_id': verification.id
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        verification = self.get_object()
        reason = request.data.get('reason', '')
        verification.reject(request.user, reason)
        
        return Response({
            'message': 'KYC verification rejected',
            'verification_id': verification.id
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get KYC statistics"""
        total_verifications = KYCVerification.objects.count()
        pending_verifications = KYCVerification.objects.filter(status='PENDING').count()
        approved_verifications = KYCVerification.objects.filter(status='APPROVED').count()
        rejected_verifications = KYCVerification.objects.filter(status='REJECTED').count()
        
        # Verification level distribution
        level_distribution = KYCVerification.objects.values('verification_level').annotate(
            count=Count('id')
        )
        
        # Recent activity
        recent_logs = KYCVerificationLog.objects.select_related(
            'kyc_verification__user'
        ).order_by('-created_at')[:10]
        
        statistics = {
            'total_verifications': total_verifications,
            'pending_verifications': pending_verifications,
            'approved_verifications': approved_verifications,
            'rejected_verifications': rejected_verifications,
            'level_distribution': level_distribution,
            'recent_logs': KYCVerificationLogSerializer(recent_logs, many=True).data
        }
        
        return Response(statistics)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_kyc(request):
    """Submit KYC application with documents"""
    try:
        print(f"[KYC_SUBMIT] ===== KYC SUBMISSION START =====")
        print(f"[KYC_SUBMIT] Timestamp: {timezone.now()}")
        print(f"[KYC_SUBMIT] Request method: {request.method}")
        print(f"[KYC_SUBMIT] Request path: {request.path}")
        print(f"[KYC_SUBMIT] Request received from: {request.META.get('REMOTE_ADDR')}")
        print(f"[KYC_SUBMIT] Request headers: {dict(request.headers)}")
        print(f"[KYC_SUBMIT] User authenticated: {request.user.is_authenticated}")
        print(f"[KYC_SUBMIT] User: {request.user}")
        print(f"[KYC_SUBMIT] Raw data: {request.data}")
        print(f"[KYC_SUBMIT] Content type: {request.content_type}")
        print(f"[KYC_SUBMIT] ==========================================")
        
        user = request.user if request.user.is_authenticated else None
        
        # Check if user is authenticated
        if not user:
            return Response(
                {'error': 'You must be logged in to submit KYC'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user can submit KYC
        if user.kyc_status == 'VERIFIED':
            return Response(
                {'error': 'KYC already verified'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for existing pending verification
        existing_pending = KYCVerification.objects.filter(
            user=user,
            status__in=['PENDING']
        ).exists()
        
        if existing_pending:
            return Response(
                {'error': 'You already have a pending KYC verification'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create KYC verification with all required fields
        verification = KYCVerification.objects.create(
            user=user,
            first_name=request.data.get('first_name', ''),
            last_name=request.data.get('last_name', ''),
            date_of_birth=request.data.get('date_of_birth'),
            nationality=request.data.get('nationality', 'Unknown'),
            country_of_residence=request.data.get('country_of_residence', ''),
            address_line_1=request.data.get('address_line_1', 'Not provided'),
            address_line_2=request.data.get('address_line_2', ''),
            city=request.data.get('city', 'Not provided'),
            state_province=request.data.get('state_province', 'Not provided'),
            postal_code=request.data.get('postal_code', 'Not provided'),
            country=request.data.get('country', 'Not provided'),
            phone_number=request.data.get('phone_number', ''),
            email=user.email,
            id_document_type=request.data.get('id_document_type', ''),
            id_document_number=request.data.get('id_document_number', ''),
            id_document_issuing_country=request.data.get('id_document_issuing_country', 'Unknown'),
            id_document_expiry_date=request.data.get('id_document_expiry_date'),
            id_document_front=request.data.get('id_document_front'),
            proof_of_address=request.data.get('proof_of_address'),
            selfie_with_id=request.data.get('selfie_with_id'),
            status='PENDING',
            verification_level='BASIC'
        )
        
        # Update user KYC status
        user.kyc_status = 'PENDING'
        user.save(update_fields=['kyc_status'])
        
        # Send Telegram notification
        try:
            bot_service = TelegramBotService()
            print(f"Bot service initialized: {bot_service.bot is not None}")
            if bot_service.bot:
                bot_service.notify_admin_kyc_submitted_sync(verification)
                print(f"Telegram notification sent for KYC {verification.id}")
            else:
                print("Bot not initialized, skipping notification")
        except Exception as e:
            print(f"Failed to send Telegram notification: {e}")
            import traceback
            traceback.print_exc()
        
        print(f"KYC submitted successfully: {verification.id}")
        
        return Response({
            'message': 'KYC application submitted successfully',
            'verification_id': verification.id
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
