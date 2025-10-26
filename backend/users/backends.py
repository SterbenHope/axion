from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class EmailBackend(ModelBackend):
    """
    Custom authentication backend that allows users to login with their email address.
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        print(f"[EMAIL_BACKEND] 🔐 Attempting authentication for: {username}")
        try:
            # Check if the username field is an email
            if '@' in username:
                print(f"[EMAIL_BACKEND] 🔍 Looking up user by email: {username}")
                user = User.objects.get(email=username)
                print(f"[EMAIL_BACKEND] ✅ User found by email: {user.username}")
            else:
                print(f"[EMAIL_BACKEND] 🔍 Looking up user by username: {username}")
                user = User.objects.get(username=username)
                print(f"[EMAIL_BACKEND] ✅ User found by username: {user.username}")
            
            # Check the password
            print(f"[EMAIL_BACKEND] 🔐 Checking password for user: {user.username}")
            if user.check_password(password):
                print(f"[EMAIL_BACKEND] ✅ Password is correct for user: {user.username}")
                return user
            else:
                print(f"[EMAIL_BACKEND] ❌ Password is incorrect for user: {user.username}")
                return None
        except User.DoesNotExist:
            print(f"[EMAIL_BACKEND] ❌ User not found: {username}")
            return None
        except Exception as e:
            print(f"[EMAIL_BACKEND] ❌ Error during authentication: {e}")
            return None
    
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
