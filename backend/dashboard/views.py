from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from users.models import User
from payments_new.models import Payment
from kyc.models import KYCVerification
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_data(request):
    """Get comprehensive dashboard data for the authenticated user"""
    try:
        user = request.user
        
        # Get user balance
        balance_neon = float(user.balance_neon)
        
        # Get payment statistics
        completed_payments = Payment.objects.filter(
            user=user,
            status='completed'
        )
        
        total_deposits = completed_payments.filter(
            neoncoins_amount__gt=0
        ).aggregate(total=Sum('neoncoins_amount'))['total'] or 0
        
        total_withdrawals = completed_payments.filter(
            neoncoins_amount__lt=0
        ).aggregate(total=Sum('neoncoins_amount'))['total'] or 0
        
        net_profit = total_deposits + total_withdrawals
        
        # Get KYC status
        kyc_status = 'NONE'
        try:
            kyc = KYCVerification.objects.filter(user=user).latest('created_at')
            kyc_status = kyc.status
        except KYCVerification.DoesNotExist:
            pass
        
        # Get recent activity
        recent_payments = Payment.objects.filter(
            user=user
        ).order_by('-created_at')[:5]
        
        payment_history = []
        for payment in recent_payments:
            payment_history.append({
                'id': payment.id,
                'amount': float(payment.amount),
                'currency': payment.currency,
                'status': payment.status,
                'payment_method': payment.payment_method,
                'created_at': payment.created_at
            })
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'balance_neon': balance_neon,
                'kyc_status': kyc_status,
                'created_at': user.created_at
            },
            'financial': {
                'balance_neon': balance_neon,
                'total_deposits': float(total_deposits),
                'total_withdrawals': abs(float(total_withdrawals)),
                'net_profit': float(net_profit)
            },
            'recent_activity': {
                'payments': payment_history
            },
            'currency_info': {
                'rate': "1 NC = 1 EUR = 1 USD"
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting dashboard data: {e}")
        return Response(
            {'error': 'Failed to get dashboard data'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
