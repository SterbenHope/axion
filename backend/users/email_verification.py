"""
API views for email verification.
"""

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
from django.core.validators import validate_email
from .models import User
from .utils import create_verification_code, verify_email_code
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_email_verification_code(request):
    """Send email verification code."""
    # Check if email verification is enabled
    if not settings.EMAIL_VERIFICATION_ENABLED:
        return Response({
            'success': True,
            'message': 'Email verification is disabled',
            'verification_required': False
        })
    
    try:
        email = request.data.get('email')
        
        if not email:
            return Response({
                'success': False,
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate email format
        try:
            validate_email(email)
        except:
            return Response({
                'success': False,
                'error': 'Invalid email format'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if email is already registered
        if User.objects.filter(email=email).exists():
            return Response({
                'success': False,
                'error': 'Email already registered'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create and send verification code
        verification = create_verification_code(email)
        
        if verification:
            return Response({
                'success': True,
                'message': 'Verification code sent to email',
                'verification_required': True
            })
        else:
            return Response({
                'success': False,
                'error': 'Failed to send verification code'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Error sending verification code: {e}")
        return Response({
            'success': False,
            'error': 'An error occurred'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_email_code_view(request):
    """Verify email verification code."""
    # Check if email verification is enabled
    if not settings.EMAIL_VERIFICATION_ENABLED:
        return Response({
            'success': True,
            'verified': True
        })
    
    try:
        email = request.data.get('email')
        code = request.data.get('code')
        
        if not email or not code:
            return Response({
                'success': False,
                'error': 'Email and code are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify code
        success, message = verify_email_code(email, code)
        
        if success:
            return Response({
                'success': True,
                'verified': True,
                'message': message
            })
        else:
            return Response({
                'success': False,
                'verified': False,
                'error': message
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error verifying code: {e}")
        return Response({
            'success': False,
            'error': 'An error occurred'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
