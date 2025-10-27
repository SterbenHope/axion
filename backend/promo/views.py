"""
Promo code API views for NeonCasino.
"""

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
import json
import logging

from .models import PromoCode, PromoRedemption, PromoManager, PromoCodeRequest
from .serializers import PromoCodeSerializer, PromoRedemptionSerializer, PromoManagerSerializer, PromoCodeRequestSerializer

logger = logging.getLogger(__name__)


class PromoCodeValidationView(APIView):
    """Validate and redeem promo codes."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            data = request.data
            code = data.get('code', '').strip().upper()
            
            if not code:
                return Response({
                    'success': False,
                    'error': 'Promo code is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                promo_code = PromoCode.objects.get(code=code)
            except PromoCode.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Invalid promo code'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check if promo code is valid
            if not promo_code.is_valid:
                return Response({
                    'success': False,
                    'error': 'Promo code is not valid'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user can use this promo code
            can_use, message = promo_code.can_be_used_by_user(request.user)
            if not can_use:
                return Response({
                    'success': False,
                    'error': message
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Apply promo code
            try:
                with transaction.atomic():
                    # Get IP address and user agent
                    ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
                    if ip_address and ',' in ip_address:
                        ip_address = ip_address.split(',')[0].strip()
                    user_agent = request.META.get('HTTP_USER_AGENT', '')
                    
                    redemption = promo_code.apply_bonus(
                        request.user,
                        deposit_amount=0,
                        ip_address=ip_address,
                        user_agent=user_agent
                    )
                    
                    return Response({
                        'success': True,
                        'message': f'Promo code activated! You received {redemption.bonus_amount} AXION',
                        'redemption': PromoRedemptionSerializer(redemption).data
                    }, status=status.HTTP_200_OK)
                    
            except Exception as e:
                return Response({
                    'success': False,
                    'error': f'Failed to activate promo code: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PromoCodeListView(APIView):
    """List available promo codes for user."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            # Get active promo codes that user can use
            available_codes = []
            
            for promo_code in PromoCode.objects.filter(status='ACTIVE', is_active=True):
                can_use, message = promo_code.can_be_used_by_user(request.user)
                if can_use:
                    # Check if user has already used this code
                    used = PromoRedemption.objects.filter(
                        promo_code=promo_code,
                        user=request.user
                    ).exists()
                    
                    if not used:
                        available_codes.append({
                            'code': promo_code.code,
                            'name': promo_code.name,
                            'description': promo_code.description,
                            'promo_type': promo_code.promo_type,
                            'bonus_amount': float(promo_code.bonus_amount),
                            'bonus_percentage': float(promo_code.bonus_percentage),
                            'max_bonus': float(promo_code.max_bonus),
                            'min_deposit': float(promo_code.min_deposit),
                            'free_spins': promo_code.free_spins,
                            'valid_until': promo_code.valid_until.isoformat() if promo_code.valid_until else None,
                            'terms_conditions': promo_code.terms_conditions
                        })
            
            return Response({
                'success': True,
                'available_codes': available_codes
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Temporary placeholder views for URL compatibility
class PromoCodeDetailView(APIView):
    def get(self, request, code):
        return Response({'message': 'Promo detail view - coming soon'})

class PromoCodeRedemptionView(APIView):
    def post(self, request):
        return Response({'message': 'Promo redemption view - coming soon'})

class PromoRedemptionListView(APIView):
    def get(self, request):
        return Response({'message': 'User promo list view - coming soon'})

class AdminPromoCodeView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        return Response({'message': 'Admin promo code view - coming soon'})


# ===== MANAGER VIEWS =====

class PromoManagerListView(APIView):
    """List all promo managers (admin only)"""
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        try:
            managers = PromoManager.objects.all()
            serializer = PromoManagerSerializer(managers, many=True)
            return Response({
                'success': True,
                'managers': serializer.data
            })
        except Exception as e:
            logger.error(f"Error listing managers: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PromoManagerDetailView(APIView):
    """Get/Update promo manager details"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, manager_id):
        try:
            manager = get_object_or_404(PromoManager, id=manager_id)
            serializer = PromoManagerSerializer(manager)
            return Response({
                'success': True,
                'manager': serializer.data
            })
        except Exception as e:
            logger.error(f"Error getting manager details: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def apply_for_manager(request):
    """Apply for promo manager position"""
    try:
        # Check if user already applied
        if PromoManager.objects.filter(user=request.user).exists():
            return Response({
                'success': False,
                'error': 'You have already applied for manager position'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create manager profile
        manager = PromoManager.objects.create(
            user=request.user,
            telegram_username=request.data.get('telegram_username', ''),
            experience_years=request.data.get('experience_years', 0),
            experience_description=request.data.get('experience_description', ''),
            skills=request.data.get('skills', [])
        )
        
        logger.info(f"Manager application submitted by {request.user.email}")
        
        # Send Telegram notification to admin
        try:
            from telegram_bot_new.services import TelegramBotService
            bot_service = TelegramBotService()
            bot_service.notify_admin_manager_application(manager)
        except Exception as e:
            logger.error(f"Failed to send manager application notification: {e}")
        
        return Response({
            'success': True,
            'message': 'Manager application submitted successfully',
            'manager_id': manager.id
        })
        
    except Exception as e:
        logger.error(f"Error applying for manager: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def approve_manager(request, manager_id):
    """Approve manager application (admin only)"""
    try:
        manager = get_object_or_404(PromoManager, id=manager_id)
        
        if manager.status != 'pending':
            return Response({
                'success': False,
                'error': 'Manager application is not pending'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        manager.status = 'active'
        manager.approved_by = request.user
        manager.approved_at = timezone.now()
        manager.save()
        
        logger.info(f"Manager {manager.user.email} approved by {request.user.email}")
        
        # Send Telegram notification to manager
        try:
            from telegram_bot_new.services import TelegramBotService
            bot_service = TelegramBotService()
            bot_service.notify_manager_approved(manager)
        except Exception as e:
            logger.error(f"Failed to send manager approval notification: {e}")
        
        return Response({
            'success': True,
            'message': 'Manager application approved',
            'manager_id': manager.id
        })
        
    except Exception as e:
        logger.error(f"Error approving manager: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===== PROMO CODE REQUEST VIEWS =====

class PromoCodeRequestListView(APIView):
    """List and create promo code requests"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            if request.user.is_staff:
                requests = PromoCodeRequest.objects.all()
            else:
                manager = get_object_or_404(PromoManager, user=request.user)
                requests = PromoCodeRequest.objects.filter(manager=manager)
            
            serializer = PromoCodeRequestSerializer(requests, many=True)
            return Response({
                'success': True,
                'requests': serializer.data
            })
        except Exception as e:
            logger.error(f"Error listing promo requests: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        try:
            # Get or create manager profile
            manager, created = PromoManager.objects.get_or_create(
                user=request.user,
                defaults={
                    'status': 'pending',
                    'experience_years': 0,
                    'experience_description': 'Auto-created during promo request'
                }
            )
            
            # Create promo request
            request_data = request.data.copy()
            request_data['manager'] = manager.id
            
            serializer = PromoCodeRequestSerializer(data=request_data)
            if serializer.is_valid():
                promo_request = serializer.save()
                
                # Send Telegram notification to admin
                try:
                    from telegram_bot_new.services import TelegramBotService
                    bot_service = TelegramBotService()
                    bot_service.notify_admin_promo_request(promo_request)
                except Exception as e:
                    logger.error(f"Failed to send promo request notification: {e}")
                
                return Response({
                    'success': True,
                    'message': 'Promo code request submitted successfully',
                    'request': serializer.data
                })
            else:
                return Response({
                    'success': False,
                    'error': 'Invalid data',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error creating promo request: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def approve_promo_request(request, request_id):
    """Approve promo code request (admin only)"""
    try:
        promo_request = get_object_or_404(PromoCodeRequest, id=request_id)
        
        if promo_request.status != 'pending':
            return Response({
                'success': False,
                'error': 'Promo request is not pending'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create promo code
        promo = PromoCode.objects.create(
            code=promo_request.promo_code,
            name=promo_request.name,
            description=promo_request.description,
            discount_type=promo_request.discount_type,
            discount_value=promo_request.discount_value,
            max_discount=promo_request.max_discount,
            max_uses=promo_request.max_uses_per_user,
            total_max_uses=promo_request.total_max_uses,
            valid_from=timezone.now(),
            valid_until=timezone.now() + timezone.timedelta(days=promo_request.valid_days)
        )
        
        # Update request status
        promo_request.status = 'approved'
        promo_request.reviewed_by = request.user
        promo_request.reviewed_at = timezone.now()
        promo_request.save()
        
        # Update manager stats
        manager = promo_request.manager
        manager.total_promos_created += 1
        manager.save()
        
        logger.info(f"Promo request {request_id} approved, promo code {promo.code} created")
        
        # Send Telegram notification to manager
        try:
            from telegram_bot_new.services import TelegramBotService
            bot_service = TelegramBotService()
            bot_service.notify_manager_promo_approved(promo_request, promo)
        except Exception as e:
            logger.error(f"Failed to send promo approval notification: {e}")
        
        return Response({
            'success': True,
            'message': 'Promo request approved',
            'promo_code_id': promo.id,
            'promo_code': promo.code
        })
        
    except Exception as e:
        logger.error(f"Error approving promo request: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
