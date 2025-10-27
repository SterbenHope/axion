"""
Utility functions for user management.
"""

import random
import string
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from .models import EmailVerification
import logging

logger = logging.getLogger(__name__)


def generate_verification_code(length=6):
    """Generate a random verification code."""
    return ''.join(random.choices(string.digits, k=length))


def send_verification_email(email, code):
    """Send verification code to user's email."""
    try:
        subject = 'Axion Casino - Email Verification Code'
        message = f'''
Hello!

Your email verification code for Axion Casino is: {code}

This code will expire in {settings.EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES} minutes.

If you did not request this code, please ignore this email.

Best regards,
Axion Casino Team
        '''
        
        from_email = settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@axion-play.su'
        recipient_list = [email]
        
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        logger.info(f"Verification email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send verification email to {email}: {e}")
        return False


def create_verification_code(email):
    """Create and send a verification code for the given email."""
    # Clean up old verification codes for this email
    EmailVerification.objects.filter(email=email).delete()
    
    # Generate new code
    code = generate_verification_code()
    
    # Create verification record
    verification = EmailVerification.objects.create(
        email=email,
        code=code
    )
    
    # Send email
    if send_verification_email(email, code):
        return verification
    else:
        verification.delete()
        return None


def verify_email_code(email, code):
    """Verify the email code."""
    try:
        verification = EmailVerification.objects.filter(
            email=email,
            code=code,
            is_verified=False
        ).first()
        
        if not verification:
            return False, "Invalid verification code"
        
        # Check if code is expired
        expiry_time = verification.created_at + timedelta(minutes=settings.EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES)
        if timezone.now() > expiry_time:
            return False, "Verification code has expired"
        
        # Check attempts
        if verification.attempts >= settings.EMAIL_VERIFICATION_MAX_ATTEMPTS:
            return False, "Maximum verification attempts exceeded"
        
        # Increment attempts
        verification.attempts += 1
        verification.save()
        
        # Mark as verified
        verification.is_verified = True
        verification.save()
        
        return True, "Email verified successfully"
        
    except Exception as e:
        logger.error(f"Error verifying email code: {e}")
        return False, "An error occurred during verification"
