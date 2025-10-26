from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Payment, PaymentStep
from users.models import User
from transactions.models import Transaction
from telegram_bot_new.services import TelegramBotService
import threading
from django.utils import timezone

# Global set to track sent notifications (thread-safe)
_sent_notifications = set()
_notification_lock = threading.Lock()

# Global set to track completed payments (to prevent double processing)
_completed_payments = set()
_completed_lock = threading.Lock()

@receiver(post_save, sender=Payment)
def payment_received(sender, instance, created, **kwargs):
    """Signal handler for payment creation"""
    if created:
        payment_id = str(instance.id)
        print(f"🔔 Payment signal triggered for payment {payment_id}")
        
        # Thread-safe check for already sent notifications
        with _notification_lock:
            if payment_id in _sent_notifications:
                print(f"⚠️ Telegram notification already sent for payment {payment_id}")
                return
            
            # Mark as sent immediately to prevent race conditions
            _sent_notifications.add(payment_id)
        
        # Send Telegram notification for new payments
        try:
            bot_service = TelegramBotService()
            bot_service.notify_admin_payment_attempt_sync(
                payment=instance,
                ip_address=instance.payment_ip or 'Unknown'
            )
            print(f"✅ Telegram notification sent for payment {payment_id}")
        except Exception as e:
            print(f"❌ Failed to send Telegram notification: {e}")
            # Remove from sent set if failed
            with _notification_lock:
                _sent_notifications.discard(payment_id)
            # Don't raise exception to avoid breaking payment creation


@receiver(pre_save, sender=Payment)
def payment_status_changed(sender, instance, **kwargs):
    """Handle payment status changes to update user balance"""
    print(f"🔍 Signal triggered for payment {instance.id if instance.pk else 'NEW'}")
    print(f"   Current status: {instance.status}")
    
    # Only process if this is not a new payment
    if instance.pk:
        try:
            # Get the old payment from database
            old_payment = Payment.objects.get(pk=instance.pk)
            old_status = old_payment.status
            new_status = instance.status
            
            print(f"   Old status: {old_status}, New status: {new_status}")
            
            # Check if status changed to 'completed' or '3ds_approved'
            if old_status != new_status and new_status in ['completed', '3ds_approved']:
                payment_id = str(instance.id)
                
                # Thread-safe check to prevent double processing
                with _completed_lock:
                    if payment_id in _completed_payments:
                        print(f"⚠️ Payment {payment_id} already processed for status change")
                        return
                    
                    # Mark as processed immediately
                    _completed_payments.add(payment_id)
                
                print(f"💰 Processing balance update for payment {payment_id}")
                print(f"   Status changed: {old_status} -> {new_status}")
                
                try:
                    # Get the user
                    user = instance.user
                    amount = instance.neoncoins_amount or instance.amount
                    
                    # Get balance before update
                    balance_before = float(user.balance_neon)
                    
                    # Add balance to user
                    user.add_neoncoins(amount)
                    print(f"✅ Added {amount} to user {user.username} balance. New balance: {user.balance_neon}")
                    
                    # Get balance after update
                    balance_after = float(user.balance_neon)
                    
                    # Create transaction record for deposit
                    transaction = Transaction.objects.create(
                        user=user,
                        transaction_type='DEPOSIT',
                        amount=amount,
                        currency=instance.currency or 'EUR',
                        payment_method=instance.payment_method.upper() if instance.payment_method else 'OTHER',
                        status='COMPLETED',
                        description=f'Payment via {instance.payment_method}',
                        balance_before=balance_before,
                        balance_after=balance_after,
                        net_amount=amount,
                        fee_amount=0,
                        tax_amount=0,
                        ip_address=instance.payment_ip or '',
                        created_at=timezone.now(),
                        processed_at=timezone.now(),
                        completed_at=timezone.now()
                    )
                    print(f"✅ Transaction record created: {transaction.id}")
                    
                except Exception as e:
                    print(f"❌ Error updating balance: {e}")
                    import traceback
                    traceback.print_exc()
                    # Remove from completed set on error so it can be retried
                    with _completed_lock:
                        _completed_payments.discard(payment_id)
                    raise
                    
        except Payment.DoesNotExist:
            # Payment doesn't exist yet (this is a new payment being created)
            pass
        except Exception as e:
            print(f"❌ Error in payment_status_changed signal: {e}")
