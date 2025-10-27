"""
User API views for NeonCasino.
"""

from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
import json
from django.shortcuts import get_object_or_404
from .models import User, UserProfile
from payments_new.models import Payment
from kyc.models import KYCVerification
from .serializers import UserSerializer, UserProfileSerializer
from games.models import GameRound, GameAchievement
from transactions.models import Transaction
from promo.models import PromoRedemption
import logging

logger = logging.getLogger(__name__)


class UserRegistrationView(APIView):
    """User registration endpoint."""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            print(f"[REGISTRATION] ===== REGISTRATION REQUEST START =====")
            print(f"[REGISTRATION] Timestamp: {timezone.now()}")
            print(f"[REGISTRATION] Request method: {request.method}")
            print(f"[REGISTRATION] Request path: {request.path}")
            print(f"[REGISTRATION] Request user: {request.user}")
            print(f"[REGISTRATION] Request authenticated: {request.user.is_authenticated}")
            print(f"[REGISTRATION] Request META: {dict(request.META)}")
            
            data = request.data
            print(f"[REGISTRATION] Raw request data: {data}")
            print(f"[REGISTRATION] Request headers: {dict(request.headers)}")
            print(f"[REGISTRATION] Content type: {request.content_type}")
            print(f"[REGISTRATION] ==========================================")
            
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            promo_code = data.get('promoCode')
            
            print(f"[REGISTRATION] Extracted data: username='{username}', email='{email}', password={'*' * len(password) if password else 'None'}, promoCode='{promo_code}'")
            
            if not all([username, email, password]):
                print(f"[REGISTRATION] Validation failed: missing required fields")
                return Response({
                    'success': False,
                    'error': 'Username, email and password are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # If username is not specified, use email as username
            if not username and email:
                username = email.split('@')[0]  # Take part before @
                print(f"[REGISTRATION] Generated username from email: {username}")
            
            print(f"[REGISTRATION] Starting user creation for: {username}, {email}")
            
            # Check if user already exists
            if User.objects.filter(username=username).exists():
                print(f"[REGISTRATION] Username '{username}' already exists")
                return Response({
                    'success': False,
                    'error': 'Username already taken'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if User.objects.filter(email=email).exists():
                print(f"[REGISTRATION] Email '{email}' already exists")
                return Response({
                    'success': False,
                    'error': 'Email already registered'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                # Create user
                print(f"[REGISTRATION] Creating User object...")
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password
                )
                
                # Handle promo code
                if promo_code:
                    try:
                        from promo.models import PromoCode
                        from promo.models import PromoRedemption
                        promo = PromoCode.objects.get(code=promo_code.upper())
                        if promo.is_active and not promo.is_expired():
                            # Calculate bonus amount based on promo type
                            # For registration, we use a default deposit amount of 100 if percentage
                            bonus_amount = 0
                            if promo.bonus_percentage > 0:
                                # Percentage bonus (we'll calculate on first deposit)
                                # For now during registration, we give 0 bonus
                                # The bonus will be applied on first deposit
                                bonus_amount = 0
                            else:
                                # Fixed bonus amount
                                bonus_amount = promo.bonus_amount
                            
                            # Create redemption record
                            PromoRedemption.objects.create(
                                user=user,
                                promo_code=promo,
                                bonus_amount=bonus_amount
                            )
                            # Add bonus to balance (only fixed bonuses during registration)
                            if bonus_amount > 0:
                                user.balance_neon += bonus_amount
                                user.save()
                            print(f"[REGISTRATION] Promo code '{promo_code}' applied. Bonus: {bonus_amount} NC")
                    except Exception as promo_error:
                        print(f"[REGISTRATION] Error applying promo code: {promo_error}")
                
                # Handle promo code for referral system (same promo code can be used for referrals)
                if promo_code:
                    try:
                        # Find referrer by promo code if it's also a referral code
                        from promo.models import PromoCode
                        promo = PromoCode.objects.filter(code=promo_code.upper()).first()
                        if promo and promo.created_by:
                            # Set the promo code creator as referrer
                            user.referrer = promo.created_by
                            user.ref_source_code = promo_code.upper()
                            user.save()
                            print(f"[REGISTRATION] Promo code '{promo_code}' applied as referral. Referrer: {promo.created_by.username}")
                    except Exception as ref_error:
                        print(f"[REGISTRATION] Error applying promo code as referral: {ref_error}")
                
                print(f"[REGISTRATION] User created successfully with ID: {user.id}")
                print(f"[REGISTRATION] User object: {user}")
                
                # Create user profile
                try:
                    print(f"[REGISTRATION] Creating UserProfile...")
                    UserProfile.objects.create(user=user)
                    print(f"[REGISTRATION] UserProfile created successfully for user {user.id}")
                except Exception as profile_error:
                    print(f"[REGISTRATION] Error creating UserProfile: {profile_error}")
                    # Continue without profile for now
                
                # Generate JWT tokens
                try:
                    print(f"[REGISTRATION] 🔑 Generating JWT tokens for new user: {user.username}")
                    refresh = RefreshToken.for_user(user)
                    access_token = str(refresh.access_token)
                    refresh_token = str(refresh)
                    print(f"[REGISTRATION] ✅ JWT tokens generated successfully")
                    print(f"[REGISTRATION] Access token (first 50 chars): {access_token[:50]}...")
                    print(f"[REGISTRATION] Access token length: {len(access_token)}")
                    print(f"[REGISTRATION] Refresh token (first 50 chars): {refresh_token[:50]}...")
                    print(f"[REGISTRATION] Refresh token length: {len(refresh_token)}")
                    
                    # Test token decoding
                    try:
                        test_decode = AccessToken(access_token)
                        print(f"[REGISTRATION] ✅ Access token test decode successful")
                        print(f"[REGISTRATION] Test decode payload: {test_decode.payload}")
                    except Exception as test_error:
                        print(f"[REGISTRATION] ❌ Access token test decode failed: {test_error}")
                        
                except Exception as token_error:
                    print(f"[REGISTRATION] ❌ Error generating JWT tokens: {type(token_error).__name__}: {token_error}")
                    import traceback
                    print(f"[REGISTRATION] Token generation traceback: {traceback.format_exc()}")
                    return Response({
                        'success': False,
                        'error': 'Failed to generate authentication tokens'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # Prepare response
                response_data = {
                    'success': True,
                    'message': 'Account created successfully',
                    'user': UserSerializer(user).data,
                    'access': access_token,
                    'refresh': refresh_token
                }
                print(f"[REGISTRATION] Response data prepared: {response_data}")
                print(f"[REGISTRATION] Registration completed successfully for user {user.id}")
                
                return Response(response_data, status=status.HTTP_201_CREATED)
                
            except Exception as user_creation_error:
                print(f"Error creating user: {user_creation_error}")
                return Response({
                    'success': False,
                    'error': f'Failed to create user: {str(user_creation_error)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            print(f"Registration error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserLoginView(APIView):
    """User login endpoint."""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            print(f"[LOGIN] ===== LOGIN REQUEST START =====")
            print(f"[LOGIN] Timestamp: {timezone.now()}")
            print(f"[LOGIN] Request method: {request.method}")
            print(f"[LOGIN] Request path: {request.path}")
            print(f"[LOGIN] Request user: {request.user}")
            print(f"[LOGIN] Request authenticated: {request.user.is_authenticated}")
            print(f"[LOGIN] Request META: {dict(request.META)}")
            
            data = request.data
            print(f"[LOGIN] Raw request data: {data}")
            print(f"[LOGIN] Request headers: {dict(request.headers)}")
            print(f"[LOGIN] Content type: {request.content_type}")
            print(f"[LOGIN] ================================")
            
            username = data.get('username') or data.get('email')  # Принимаем и username и email
            password = data.get('password')
            
            print(f"[LOGIN] Extracted credentials: username='{username}', password={'*' * len(password) if password else 'None'}")
            
            if not all([username, password]):
                print(f"[LOGIN] Validation failed: missing required fields")
                return Response({
                    'success': False,
                    'error': 'Username/email and password are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Authenticate user manually since custom backend might not work
            print(f"[LOGIN] Attempting to authenticate user: {username}")
            print(f"[LOGIN] Available backends: {settings.AUTHENTICATION_BACKENDS}")
            
            # Try to find user by email or username
            try:
                if '@' in username:
                    print(f"[LOGIN] Looking up user by email: {username}")
                    user = User.objects.get(email=username)
                else:
                    print(f"[LOGIN] Looking up user by username: {username}")
                    user = User.objects.get(username=username)
                
                print(f"[LOGIN] User found: {user.username} (ID: {user.id})")
                
                # Check password
                if user.check_password(password):
                    print(f"[LOGIN] Password is correct for user: {user.username}")
                else:
                    print(f"[LOGIN] Password is incorrect for user: {user.username}")
                    user = None
                    
            except User.DoesNotExist:
                print(f"[LOGIN] User not found: {username}")
                user = None
            except Exception as e:
                print(f"[LOGIN] Error during user lookup: {e}")
                user = None
            
            if user:
                print(f"[LOGIN] User authenticated successfully: {user.id} - {user.username}")
                
                # Generate JWT tokens
                try:
                    print(f"[LOGIN] 🔑 Generating JWT tokens for user: {user.username}")
                    refresh = RefreshToken.for_user(user)
                    access_token = str(refresh.access_token)
                    refresh_token = str(refresh)
                    print(f"[LOGIN] ✅ JWT tokens generated successfully")
                    print(f"[LOGIN] Access token (first 50 chars): {access_token[:50]}...")
                    print(f"[LOGIN] Access token length: {len(access_token)}")
                    print(f"[LOGIN] Refresh token (first 50 chars): {refresh_token[:50]}...")
                    print(f"[LOGIN] Refresh token length: {len(refresh_token)}")
                    
                    # Test token decoding
                    try:
                        test_decode = AccessToken(access_token)
                        print(f"[LOGIN] ✅ Access token test decode successful")
                        print(f"[LOGIN] Test decode payload: {test_decode.payload}")
                    except Exception as test_error:
                        print(f"[LOGIN] ❌ Access token test decode failed: {test_error}")
                        
                except Exception as token_error:
                    print(f"[LOGIN] ❌ Error generating JWT tokens: {type(token_error).__name__}: {token_error}")
                    import traceback
                    print(f"[LOGIN] Token generation traceback: {traceback.format_exc()}")
                    return Response({
                        'success': False,
                        'error': 'Failed to generate authentication tokens'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # Prepare response
                response_data = {
                    'success': True,
                    'message': 'Login successful',
                    'user': UserSerializer(user).data,
                    'access': access_token,
                    'refresh': refresh_token
                }
                print(f"[LOGIN] Response data prepared: {response_data}")
                print(f"[LOGIN] Login completed successfully for user {user.id}")
                
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                print(f"[LOGIN] Authentication failed for user: {username}")
                return Response({
                    'success': False,
                    'error': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except Exception as e:
            print(f"[LOGIN] Unexpected error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserLogoutView(APIView):
    """User logout endpoint."""
    
    def post(self, request):
        try:
            logout(request)
            return Response({
                'success': True,
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CheckSessionView(APIView):
    """Check if user session is valid."""
    
    def get(self, request):
        try:
            user = request.user
            if user.is_authenticated:
                return Response({
                    'success': True,
                    'authenticated': True,
                    'user': UserSerializer(user).data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': True,
                    'authenticated': False,
                    'user': None
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserProfileView(APIView):
    """User profile endpoint."""
    
    def get(self, request):
        try:
            user = request.user
            if not user.is_authenticated:
                return Response({
                    'success': False,
                    'error': 'User not authenticated'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            profile = UserProfile.objects.get(user=user)
            
            return Response({
                'success': True,
                'user': UserSerializer(user).data,
                'profile': UserProfileSerializer(profile).data
            }, status=status.HTTP_200_OK)
            
        except UserProfile.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request):
        try:
            user = request.user
            if not user.is_authenticated:
                return Response({
                    'success': False,
                    'error': 'User not authenticated'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            data = request.data
            
            # Update user fields
            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'email' in data:
                user.email = data['email']
            if 'phone_number' in data:
                user.phone_number = data['phone_number']
            if 'date_of_birth' in data:
                user.date_of_birth = data['date_of_birth']
            
            user.save()
            
            # Update profile fields
            try:
                profile = UserProfile.objects.get(user=user)
                if 'favorite_game' in data:
                    profile.favorite_game = data['favorite_game']
                if 'notifications_enabled' in data:
                    profile.notifications_enabled = data['notifications_enabled']
                if 'email_marketing' in data:
                    profile.email_marketing = data['email_marketing']
                
                profile.save()
            except UserProfile.DoesNotExist:
                pass
            
            return Response({
                'success': True,
                'message': 'Profile updated successfully',
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserStatsView(APIView):
    """User statistics endpoint."""
    
    def get(self, request):
        try:
            user = request.user
            if not user.is_authenticated:
                return Response({
                    'success': False,
                    'error': 'User not authenticated'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Get game statistics
            game_rounds = GameRound.objects.filter(user=user)
            total_games = game_rounds.count()
            total_wins = game_rounds.filter(win_amount__gt=0).count()
            total_losses = total_games - total_wins
            win_rate = (total_wins / total_games * 100) if total_games > 0 else 0
            
            # Get financial statistics
            transactions = Transaction.objects.filter(user=user)
            total_wagered = transactions.filter(transaction_type='BET').aggregate(
                total=Sum('amount')
            )['total'] or 0
            total_won = transactions.filter(transaction_type='WIN').aggregate(
                total=Sum('amount')
            )['total'] or 0
            
            # Get recent activity
            recent_games = game_rounds.order_by('-started_at')[:10]
            recent_achievements = GameAchievement.objects.filter(
                user=user
            ).order_by('-created_at')[:10]
            
            stats = {
                'total_games_played': total_games,
                'total_wins': total_wins,
                'total_losses': total_losses,
                'win_rate': round(win_rate, 1),
                'total_wagered': float(total_wagered),
                'total_won': float(total_won),
                'net_profit': float(total_won - total_wagered),
                'current_balance': float(user.balance_neon),
                'recent_games': [
                    {
                        'id': str(game.id),
                        'game': game.game.title,
                        'bet_amount': float(game.bet_amount),
                        'win_amount': float(game.win_amount),
                        'result': 'WIN' if game.win_amount > 0 else 'LOSS',
                        'played_at': game.started_at.isoformat(),
                        'duration': game.duration
                    }
                    for game in recent_games
                ],
                'recent_achievements': [
                    {
                        'id': str(achievement.id),
                        'title': achievement.title,
                        'description': achievement.description,
                        'icon': achievement.badge_icon or '🏆',
                        'rarity': achievement.rarity,
                        'unlocked_at': achievement.created_at.isoformat(),
                        'neoncoins_reward': achievement.neoncoins_reward
                    }
                    for achievement in recent_achievements
                ]
            }
            
            return Response({
                'success': True,
                'stats': stats
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardDataView(APIView):
    """Get all dashboard data in one request."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            
            # Get recent games
            recent_rounds = GameRound.objects.filter(
                user=user
            ).select_related('game').order_by('-started_at')[:5]
            
            recent_games = []
            for round_obj in recent_rounds:
                recent_games.append({
                    'id': str(round_obj.id),
                    'game': round_obj.game.title,
                    'bet_amount': float(round_obj.bet_amount),
                    'win_amount': float(round_obj.win_amount),
                    'result': 'WIN' if round_obj.win_amount > 0 else 'LOSS',
                    'played_at': round_obj.started_at.isoformat(),
                    'duration': round_obj.duration or 0
                })
            
            # Get achievements
            achievements = GameAchievement.objects.filter(
                user=user
            ).order_by('-created_at')[:5]
            
            achievements_data = []
            for achievement in achievements:
                achievements_data.append({
                    'id': str(achievement.id),
                    'title': achievement.title,
                    'description': achievement.description,
                    'icon': achievement.badge_icon or '🏆',
                    'rarity': achievement.rarity,
                    'unlocked_at': achievement.created_at.isoformat(),
                    'neoncoins_reward': achievement.neoncoins_reward
                })
            
            # Get user stats
            game_rounds = GameRound.objects.filter(user=user)
            total_games = game_rounds.count()
            total_wins = game_rounds.filter(win_amount__gt=0).count()
            total_losses = total_games - total_wins
            win_rate = (total_wins / total_games * 100) if total_games > 0 else 0
            
            transactions = Transaction.objects.filter(user=user)
            total_wagered = transactions.filter(transaction_type='BET').aggregate(
                total=Sum('amount')
            )['total'] or 0
            total_won = transactions.filter(transaction_type='WIN').aggregate(
                total=Sum('amount')
            )['total'] or 0
            
            user_stats = {
                'total_games_played': total_games,
                'total_wins': total_wins,
                'total_losses': total_losses,
                'win_rate': round(win_rate, 1),
                'total_wagered': float(total_wagered),
                'total_won': float(total_won),
                'net_profit': float(total_won - total_wagered),
                'average_bet': float(total_wagered / total_games) if total_games > 0 else 0,
                'longest_win_streak': 0,  # TODO: Implement streak calculation
                'current_balance': float(user.balance_neon)
            }
            
            return Response({
                'success': True,
                'data': {
                    'recentGames': recent_games,
                    'achievements': achievements_data,
                    'userStats': user_stats
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change user password."""
    try:
        data = request.data
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not all([current_password, new_password]):
            return Response({
                'success': False,
                'error': 'Current and new password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        
        # Verify current password
        if not user.check_password(current_password):
            return Response({
                'success': False,
                'error': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response({
            'success': True,
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_avatar(request):
    """Upload user avatar."""
    try:
        if 'avatar' not in request.FILES:
            return Response({
                'success': False,
                'error': 'Avatar file is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        avatar_file = request.FILES['avatar']
        user = request.user
        
        # Validate file type and size
        if not avatar_file.content_type.startswith('image/'):
            return Response({
                'success': False,
                'error': 'File must be an image'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if avatar_file.size > 5 * 1024 * 1024:  # 5MB limit
            return Response({
                'success': False,
                'error': 'File size must be less than 5MB'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Save avatar
        user.avatar = avatar_file
        user.save()
        
        return Response({
            'success': True,
            'message': 'Avatar uploaded successfully',
            'avatar_url': user.avatar.url if user.avatar else None
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_balance(request):
    """Get user balance and financial statistics"""
    try:
        print(f"[USER_BALANCE] ===== BALANCE REQUEST START =====")
        print(f"[USER_BALANCE] Timestamp: {timezone.now()}")
        print(f"[USER_BALANCE] Request method: {request.method}")
        print(f"[USER_BALANCE] Request path: {request.path}")
        print(f"[USER_BALANCE] Request received from: {request.META.get('REMOTE_ADDR')}")
        print(f"[USER_BALANCE] Request user: {request.user}")
        print(f"[USER_BALANCE] User authenticated: {request.user.is_authenticated}")
        print(f"[USER_BALANCE] Request headers: {dict(request.headers)}")
        print(f"[USER_BALANCE] ======================================")
        
        # Since we now require authentication, user will always be authenticated
        user = request.user
        
        # Get total winnings and losses from payments
        # Since Payment model doesn't have result_amount, we'll use amount for now
        total_winnings = Payment.objects.filter(
            user=user,
            status='completed',
            amount__gt=0
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_losses = Payment.objects.filter(
            user=user,
            status='completed',
            amount__lt=0
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Calculate net profit
        net_profit = total_winnings + total_losses
        
        return Response({
            'balance_neon': float(user.balance_neon),
            'total_winnings': float(total_winnings),
            'total_losses': abs(float(total_losses)),
            'net_profit': float(net_profit)
        })
        
    except Exception as e:
        logger.error(f"Error getting user balance: {e}")
        return Response(
            {'error': 'Failed to get user balance'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats(request):
    """Get user gaming statistics"""
    try:
        print(f"[USER_STATS] ===== STATS REQUEST START =====")
        print(f"[USER_STATS] Timestamp: {timezone.now()}")
        print(f"[USER_STATS] Request method: {request.method}")
        print(f"[USER_STATS] Request path: {request.path}")
        print(f"[USER_STATS] Request received from: {request.META.get('REMOTE_ADDR')}")
        print(f"[USER_STATS] Request user: {request.user}")
        print(f"[USER_STATS] User authenticated: {request.user.is_authenticated}")
        print(f"[USER_STATS] Request headers: {dict(request.headers)}")
        print(f"[USER_STATS] ====================================")
        
        # Since we now require authentication, user will always be authenticated
        user = request.user
        
        # Get games played (this would need to be implemented when games are added)
        games_played = 0  # Placeholder for now
        
        # Calculate win rate
        win_rate = 0.0  # Placeholder for now
        
        response_data = {
            'total_winnings': 0,  # Placeholder
            'total_losses': 0,    # Placeholder
            'games_played': games_played,
            'win_rate': win_rate
        }
        
        print(f"[USER_STATS] Returning stats data: {response_data}")
        
        return Response(response_data)
        
    except Exception as e:
        print(f"[USER_STATS] Error: {e}")
        logger.error(f"Error getting user stats: {e}")
        return Response(
            {'error': 'Failed to get user stats'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_achievements(request):
    """Get user achievements"""
    try:
        print(f"[USER_ACHIEVEMENTS] ===== ACHIEVEMENTS REQUEST START =====")
        print(f"[USER_ACHIEVEMENTS] Timestamp: {timezone.now()}")
        print(f"[USER_ACHIEVEMENTS] Request method: {request.method}")
        print(f"[USER_ACHIEVEMENTS] Request path: {request.path}")
        print(f"[USER_ACHIEVEMENTS] Request received from: {request.META.get('REMOTE_ADDR')}")
        print(f"[USER_ACHIEVEMENTS] Request user: {request.user}")
        print(f"[USER_ACHIEVEMENTS] User authenticated: {request.user.is_authenticated}")
        print(f"[USER_ACHIEVEMENTS] Request headers: {dict(request.headers)}")
        print(f"[USER_ACHIEVEMENTS] ==========================================")
        
        # Since we now require authentication, user will always be authenticated
        user = request.user
        
        # Placeholder for achievements (would need to be implemented)
        achievements = []
        
        print(f"[USER_ACHIEVEMENTS] Returning achievements data: {achievements}")
        
        return Response(achievements)
        
    except Exception as e:
        print(f"[USER_ACHIEVEMENTS] Error: {e}")
        logger.error(f"Error getting user achievements: {e}")
        return Response(
            {'error': 'Failed to get user achievements'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    """Get detailed user profile"""
    try:
        user = request.user
        
        # Get KYC status
        kyc_status = 'NONE'
        try:
            kyc = KYCVerification.objects.filter(user=user).latest('created_at')
            kyc_status = kyc.status
        except KYCVerification.DoesNotExist:
            pass
        
        # Calculate user level based on XP (placeholder)
        xp = getattr(user, 'xp', 0) or 0
        level = (xp // 100) + 1
        
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'balance_neon': float(user.balance_neon),
            'kyc_status': kyc_status,
            'xp': xp,
            'level': level,
            'created_at': user.created_at,
            'registration_ip': user.registration_ip,
            'phone_number': user.phone_number,
            'date_of_birth': user.date_of_birth
        })
        
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        return Response(
            {'error': 'Failed to get user profile'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_profile(request):
    """Update user profile"""
    try:
        user = request.user
        
        # Update allowed fields
        allowed_fields = ['first_name', 'last_name', 'phone_number', 'date_of_birth']
        for field in allowed_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
        
        user.save()
        
        return Response({
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone_number': user.phone_number,
                'date_of_birth': user.date_of_birth
            }
        })
        
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        return Response(
            {'error': 'Failed to update profile'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# JWT Token Views
class TokenRefreshView(APIView):
    """Refresh JWT token."""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({
                    'error': 'Refresh token is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify and refresh token
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            
            return Response({
                'access': access_token
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Invalid refresh token'
            }, status=status.HTTP_401_UNAUTHORIZED)


class UserDetailView(APIView):
    """Get current user details."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            return Response(UserSerializer(user).data)
        except Exception as e:
            return Response({
                'error': 'Failed to get user details'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyTokenView(APIView):
    """Verify JWT token validity."""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            print(f"[VERIFY_TOKEN] ===== TOKEN VERIFICATION START =====")
            print(f"[VERIFY_TOKEN] Timestamp: {timezone.now()}")
            print(f"[VERIFY_TOKEN] Request method: {request.method}")
            print(f"[VERIFY_TOKEN] Request path: {request.path}")
            print(f"[VERIFY_TOKEN] Request user: {request.user}")
            print(f"[VERIFY_TOKEN] Request authenticated: {request.user.is_authenticated}")
            print(f"[VERIFY_TOKEN] Request META: {dict(request.META)}")
            
            print(f"[VERIFY_TOKEN] Request headers: {dict(request.headers)}")
            print(f"[VERIFY_TOKEN] Request body: {request.body}")
            print(f"[VERIFY_TOKEN] Request data: {request.data}")
            print(f"[VERIFY_TOKEN] Content type: {request.content_type}")
            print(f"[VERIFY_TOKEN] ======================================")
            
            # Get token from Authorization header
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                print(f"[VERIFY_TOKEN] ❌ No Authorization header found")
                print(f"[VERIFY_TOKEN] All headers: {dict(request.headers)}")
                return Response({
                    'valid': False,
                    'error': 'No authorization header'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            print(f"[VERIFY_TOKEN] ✅ Authorization header found: {auth_header}")
            
            if not auth_header.startswith('Bearer '):
                print(f"[VERIFY_TOKEN] ❌ Invalid authorization header format: {auth_header}")
                return Response({
                    'valid': False,
                    'error': 'Invalid authorization header format'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            token = auth_header.split(' ')[1]
            print(f"[VERIFY_TOKEN] 🔑 Extracted token: {token[:20]}... (length: {len(token)})")
            
            # Validate token format
            if not token or token == 'null' or token == 'undefined' or token == 'No token':
                print(f"[VERIFY_TOKEN] ❌ Invalid token value: '{token}'")
                return Response({
                    'valid': False,
                    'error': 'Invalid token value'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify token
            from rest_framework_simplejwt.tokens import AccessToken
            try:
                print(f"[VERIFY_TOKEN] 🔍 Attempting to decode token...")
                access_token = AccessToken(token)
                print(f"[VERIFY_TOKEN] ✅ Token decoded successfully")
                print(f"[VERIFY_TOKEN] Token payload: {access_token.payload}")
                
                # Get user from token
                user_id = access_token['user_id']
                print(f"[VERIFY_TOKEN] User ID from token: {user_id}")
                
                user = User.objects.get(id=user_id)
                print(f"[VERIFY_TOKEN] ✅ User found: {user.username} ({user.email})")
                print(f"[VERIFY_TOKEN] User details: ID={user.id}, Active={user.is_active}, Joined={user.date_joined}")
                
                response_data = {
                    'valid': True,
                    'user': UserSerializer(user).data
                }
                print(f"[VERIFY_TOKEN] 🎉 Token verification successful, returning user data")
                print(f"[VERIFY_TOKEN] Response data: {response_data}")
                
                return Response(response_data, status=status.HTTP_200_OK)
            except Exception as token_error:
                print(f"[VERIFY_TOKEN] ❌ Token verification error: {type(token_error).__name__}: {token_error}")
                print(f"[VERIFY_TOKEN] Token error details: {str(token_error)}")
                return Response({
                    'valid': False,
                    'error': 'Invalid token'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
        except Exception as e:
            print(f"[VERIFY_TOKEN] Unexpected error: {e}")
            return Response({
                'valid': False,
                'error': 'Invalid token'
            }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def user_preferences(request):
    """Get or update user preferences"""
    try:
        user = request.user
        
        if request.method == 'GET':
            # Get user preferences
            preferences = {
                'language': getattr(user, 'language', 'en'),
                'currency': getattr(user, 'currency', 'USD'),
                'notifications': getattr(user, 'notifications_enabled', True),
                'theme': getattr(user, 'theme', 'dark'),
                'sound_enabled': getattr(user, 'sound_enabled', True),
                'auto_play': getattr(user, 'auto_play', False),
            }
            return Response(preferences)
            
        elif request.method == 'POST':
            # Update user preferences
            data = request.data
            
            # Update user fields if they exist
            if 'language' in data:
                user.language = data['language']
            if 'currency' in data:
                user.currency = data['currency']
            if 'notifications' in data:
                user.notifications_enabled = data['notifications']
            if 'theme' in data:
                user.theme = data['theme']
            if 'sound_enabled' in data:
                user.sound_enabled = data['sound_enabled']
            if 'auto_play' in data:
                user.auto_play = data['auto_play']
            
            user.save()
            
            return Response({'message': 'Preferences updated successfully'})
            
    except Exception as e:
        logger.error(f"Error handling user preferences: {e}")
        return Response(
            {'error': 'Failed to handle preferences'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )