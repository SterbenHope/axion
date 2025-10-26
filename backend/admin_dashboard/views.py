from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, Count, Avg, Max, Min
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from rest_framework import status, generics, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
import uuid
from decimal import Decimal
from datetime import timedelta
from .models import AdminDashboard, DashboardWidget, DashboardLayout, AdminNotification, AuditLog
from .serializers import (
    DashboardOverviewSerializer, UserStatsSerializer, UserActivitySerializer,
    UserSearchSerializer, GameStatsSerializer, GamePerformanceSerializer,
    FinancialStatsSerializer, TransactionStatsSerializer, KYCStatsSerializer,
    PromoStatsSerializer, SystemHealthSerializer, AuditLogSerializer,
    AuditLogFilterSerializer, DashboardWidgetSerializer, DashboardLayoutSerializer,
    ExportDataSerializer, BulkActionSerializer, NotificationSerializer,
    NotificationCreateSerializer, ReportGeneratorSerializer
)
from django.contrib.auth import get_user_model

User = get_user_model()
from users.models import UserProfile
from games.models import Game, GameRound, GameSession
from transactions.models import Transaction, PaymentMethod
from kyc.models import KYCVerification, KYCDocument
from promo.models import PromoCode, PromoRedemption, PromoCampaign


class DashboardOverviewView(APIView):
    """Get dashboard overview statistics"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Calculate date ranges
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # User statistics
        total_users = User.objects.count()
        active_users_today = User.objects.filter(
            last_login__date=today
        ).count()
        active_users_week = User.objects.filter(
            last_login__date__gte=week_ago
        ).count()
        active_users_month = User.objects.filter(
            last_login__date__gte=month_ago
        ).count()
        
        new_users_today = User.objects.filter(
            date_joined__date=today
        ).count()
        new_users_week = User.objects.filter(
            date_joined__date__gte=week_ago
        ).count()
        new_users_month = User.objects.filter(
            date_joined__date__gte=month_ago
        ).count()
        
        # Financial statistics
        total_revenue = Transaction.objects.filter(
            transaction_type='DEPOSIT',
            status='COMPLETED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        revenue_today = Transaction.objects.filter(
            transaction_type='DEPOSIT',
            status='COMPLETED',
            created_at__date=today
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        revenue_week = Transaction.objects.filter(
            transaction_type='DEPOSIT',
            status='COMPLETED',
            created_at__date__gte=week_ago
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        revenue_month = Transaction.objects.filter(
            transaction_type='DEPOSIT',
            status='COMPLETED',
            created_at__date__gte=month_ago
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        # Game statistics
        total_games_played = GameRound.objects.count()
        games_today = GameRound.objects.filter(
            started_at__date=today
        ).count()
        games_week = GameRound.objects.filter(
            started_at__date__gte=week_ago
        ).count()
        games_month = GameRound.objects.filter(
            started_at__date__gte=month_ago
        ).count()
        
        # Pending requests
        pending_kyc = KYCVerification.objects.filter(status='PENDING').count()
        pending_deposits = Transaction.objects.filter(transaction_type='DEPOSIT', status='PENDING').count()
        pending_withdrawals = Transaction.objects.filter(transaction_type='WITHDRAWAL', status='PENDING').count()
        active_promo_codes = PromoCode.objects.filter(is_active=True).count()
        
        overview = {
            'total_users': total_users,
            'active_users_today': active_users_today,
            'active_users_week': active_users_week,
            'active_users_month': active_users_month,
            'new_users_today': new_users_today,
            'new_users_week': new_users_week,
            'new_users_month': new_users_month,
            'total_revenue': total_revenue,
            'revenue_today': revenue_today,
            'revenue_week': revenue_week,
            'revenue_month': revenue_month,
            'total_games_played': total_games_played,
            'games_today': games_today,
            'games_week': games_week,
            'games_month': games_month,
            'pending_kyc': pending_kyc,
            'pending_deposits': pending_deposits,
            'pending_withdrawals': pending_withdrawals,
            'active_promo_codes': active_promo_codes
        }
        
        serializer = DashboardOverviewSerializer(overview)
        return Response(serializer.data)


class UserStatsView(APIView):
    """Get user statistics"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Basic user counts
        total_users = User.objects.count()
        verified_users = User.objects.filter(kyc_status='VERIFIED').count()
        unverified_users = User.objects.filter(kyc_status='NONE').count()
        active_users = User.objects.filter(is_active=True).count()
        inactive_users = User.objects.filter(is_active=False).count()
        
        # Calculate premium users (users with high balance or activity)
        premium_users = User.objects.filter(
            Q(balance_neon__gte=1000) | Q(date_joined__lte=timezone.now() - timedelta(days=30))
        ).distinct().count()
        
        # New user counts
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        new_users_today = User.objects.filter(date_joined__date=today).count()
        new_users_week = User.objects.filter(date_joined__date__gte=week_ago).count()
        new_users_month = User.objects.filter(date_joined__date__gte=month_ago).count()
        
        # Calculate user growth rate
        if month_ago > 0:
            previous_month_users = User.objects.filter(
                date_joined__lt=month_ago
            ).count()
            current_month_users = User.objects.filter(
                date_joined__gte=month_ago
            ).count()
            user_growth_rate = ((current_month_users - previous_month_users) / previous_month_users * 100) if previous_month_users > 0 else 0
        else:
            user_growth_rate = 0
        
        # Calculate average user age
        user_ages = []
        for user in User.objects.all():
            if user.date_joined:
                age = (timezone.now() - user.date_joined).days
                user_ages.append(age)
        
        average_user_age = sum(user_ages) / len(user_ages) if user_ages else 0
        
        # Top countries
        top_countries = User.objects.values('country').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # User activity distribution
        user_activity_distribution = {
            'very_active': User.objects.filter(last_login__date__gte=today - timedelta(days=1)).count(),
            'active': User.objects.filter(
                last_login__date__gte=today - timedelta(days=7),
                last_login__date__lt=today - timedelta(days=1)
            ).count(),
            'moderate': User.objects.filter(
                last_login__date__gte=today - timedelta(days=30),
                last_login__date__lt=today - timedelta(days=7)
            ).count(),
            'inactive': User.objects.filter(
                last_login__date__lt=today - timedelta(days=30)
            ).count()
        }
        
        stats = {
            'total_users': total_users,
            'verified_users': verified_users,
            'unverified_users': unverified_users,
            'active_users': active_users,
            'inactive_users': inactive_users,
            'premium_users': premium_users,
            'new_users_today': new_users_today,
            'new_users_week': new_users_week,
            'new_users_month': new_users_month,
            'user_growth_rate': round(user_growth_rate, 2),
            'average_user_age': round(average_user_age, 1),
            'top_countries': list(top_countries),
            'user_activity_distribution': user_activity_distribution
        }
        
        serializer = UserStatsSerializer(stats)
        return Response(serializer.data)


class UserActivityView(APIView):
    """Get user activity data"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Get query parameters
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))
        
        # Get users with activity data
        users = User.objects.select_related('profile').order_by('-last_login')[offset:offset + limit]
        
        activity_data = []
        for user in users:
            # Calculate game statistics
            total_games_played = GameRound.objects.filter(user=user).count()
            total_wins = GameRound.objects.filter(user=user, is_win=True).count()
            total_losses = total_games_played - total_wins
            win_rate = (total_wins / total_games_played * 100) if total_games_played > 0 else 0
            
            activity_data.append({
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
                'last_login': user.last_login,
                'last_activity': user.last_login,  # Simplified
                'total_games_played': total_games_played,
                'total_wins': total_wins,
                'total_losses': total_losses,
                'win_rate': round(win_rate, 2),
                'balance_neon': user.balance_neon,
                'kyc_status': user.kyc_status,
                'is_active': user.is_active,
                'created_at': user.date_joined
            })
        
        return Response(activity_data)


class UserSearchView(APIView):
    """Search users with filters"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        serializer = UserSearchSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        queryset = User.objects.all()
        
        # Apply filters
        if data.get('query'):
            query = data['query']
            queryset = queryset.filter(
                Q(username__icontains=query) |
                Q(email__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query)
            )
        
        if data.get('kyc_status'):
            queryset = queryset.filter(kyc_status=data['kyc_status'])
        
        if data.get('is_active') is not None:
            queryset = queryset.filter(is_active=data['is_active'])
        
        if data.get('date_from'):
            queryset = queryset.filter(date_joined__date__gte=data['date_from'])
        
        if data.get('date_to'):
            queryset = queryset.filter(date_joined__date__lte=data['date_to'])
        
        if data.get('min_balance'):
            queryset = queryset.filter(balance_neon__gte=data['min_balance'])
        
        if data.get('max_balance'):
            queryset = queryset.filter(balance_neon__lte=data['max_balance'])
        
        if data.get('country'):
            queryset = queryset.filter(country__icontains=data['country'])
        
        # Pagination
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))
        
        total_count = queryset.count()
        users = queryset[offset:offset + limit]
        
        # Serialize user data
        user_data = []
        for user in users:
            user_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'kyc_status': user.kyc_status,
                'balance_neon': user.balance_neon,
                'is_active': user.is_active,
                'date_joined': user.date_joined,
                'last_login': user.last_login
            })
        
        return Response({
            'users': user_data,
            'total_count': total_count,
            'limit': limit,
            'offset': offset
        })


class GameStatsView(APIView):
    """Get game statistics"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Basic game counts
        total_games = Game.objects.count()
        active_games = Game.objects.filter(is_active=True).count()
        featured_games = Game.objects.filter(is_featured=True).count()
        
        # Game play statistics
        total_games_played = GameRound.objects.count()
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        games_today = GameRound.objects.filter(started_at__date=today).count()
        games_week = GameRound.objects.filter(started_at__date__gte=week_ago).count()
        games_month = GameRound.objects.filter(started_at__date__gte=month_ago).count()
        
        # Financial statistics
        total_bet_amount = GameRound.objects.aggregate(
            total=Sum('bet_amount')
        )['total'] or Decimal('0.00')
        
        total_win_amount = GameRound.objects.aggregate(
            total=Sum('result_amount')
        )['total'] or Decimal('0.00')
        
        average_rtp = Game.objects.aggregate(avg=Avg('rtp'))['avg'] or 0.0
        
        # Most popular game
        most_popular = Game.objects.annotate(
            play_count=Count('rounds')
        ).order_by('-play_count').first()
        
        most_popular_game = {
            'id': most_popular.id,
            'title': most_popular.title,
            'play_count': most_popular.play_count,
            'game_type': most_popular.game_type
        } if most_popular else None
        
        # Top performing games
        top_games = Game.objects.annotate(
            play_count=Count('rounds'),
            total_bet=Sum('rounds__bet_amount'),
            total_win=Sum('rounds__result_amount')
        ).order_by('-play_count')[:10]
        
        top_performing_games = []
        for game in top_games:
            top_performing_games.append({
                'id': game.id,
                'title': game.title,
                'game_type': game.game_type,
                'play_count': game.play_count,
                'total_bet': game.total_bet or Decimal('0.00'),
                'total_win': game.total_win or Decimal('0.00'),
                'rtp': game.rtp
            })
        
        # Game type distribution
        game_type_distribution = Game.objects.values('game_type').annotate(
            count=Count('id')
        )
        
        stats = {
            'total_games': total_games,
            'active_games': active_games,
            'featured_games': featured_games,
            'total_games_played': total_games_played,
            'games_today': games_today,
            'games_week': games_week,
            'games_month': games_month,
            'total_bet_amount': total_bet_amount,
            'total_win_amount': total_win_amount,
            'average_rtp': round(average_rtp, 2),
            'most_popular_game': most_popular_game,
            'top_performing_games': top_performing_games,
            'game_type_distribution': list(game_type_distribution)
        }
        
        serializer = GameStatsSerializer(stats)
        return Response(serializer.data)


class GamePerformanceView(APIView):
    """Get individual game performance"""
    permission_classes = [IsAdminUser]
    
    def get(self, request, game_id):
        try:
            game = Game.objects.get(id=game_id)
        except Game.DoesNotExist:
            return Response(
                {'error': 'Game not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Game statistics
        rounds = GameRound.objects.filter(game=game)
        total_rounds = rounds.count()
        total_bet_amount = rounds.aggregate(total=Sum('bet_amount'))['total'] or Decimal('0.00')
        total_win_amount = rounds.aggregate(total=Sum('result_amount'))['total'] or Decimal('0.00')
        
        # Calculate RTP
        if total_bet_amount > 0:
            rtp = (total_win_amount / total_bet_amount) * 100
        else:
            rtp = game.rtp
        
        average_bet = rounds.aggregate(avg=Avg('bet_amount'))['avg'] or Decimal('0.00')
        
        # Player statistics
        total_players = rounds.values('user').distinct().count()
        unique_players = total_players  # Simplified
        
        performance = {
            'game_id': game.id,
            'game_title': game.title,
            'game_type': game.game_type,
            'total_rounds': total_rounds,
            'total_bet_amount': total_bet_amount,
            'total_win_amount': total_win_amount,
            'rtp': round(rtp, 2),
            'average_bet': average_bet,
            'total_players': total_players,
            'unique_players': unique_players,
            'is_active': game.is_active,
            'is_featured': game.is_featured,
            'created_at': game.created_at
        }
        
        serializer = GamePerformanceSerializer(performance)
        return Response(serializer.data)


class FinancialStatsView(APIView):
    """Get financial statistics"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Overall financial data
        total_revenue = Transaction.objects.filter(
            transaction_type='DEPOSIT',
            status='COMPLETED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        total_deposits = total_revenue  # Simplified
        
        total_withdrawals = Transaction.objects.filter(
            transaction_type='WITHDRAWAL',
            status='COMPLETED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        total_bonuses = Transaction.objects.filter(
            transaction_type='BONUS',
            status='COMPLETED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        total_fees = Transaction.objects.filter(
            transaction_type__in=['DEPOSIT_FEE', 'WITHDRAWAL_FEE'],
            status='COMPLETED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        net_profit = total_revenue - total_withdrawals - total_bonuses - total_fees
        
        # Time-based revenue
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        revenue_today = Transaction.objects.filter(
            transaction_type='DEPOSIT',
            status='COMPLETED',
            created_at__date=today
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        revenue_week = Transaction.objects.filter(
            transaction_type='DEPOSIT',
            status='COMPLETED',
            created_at__date__gte=week_ago
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        revenue_month = Transaction.objects.filter(
            transaction_type='DEPOSIT',
            status='COMPLETED',
            created_at__date__gte=month_ago
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        # Pending amounts
        pending_deposits = Transaction.objects.filter(
            transaction_type='DEPOSIT',
            status='PENDING'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        pending_withdrawals = Transaction.objects.filter(
            transaction_type='WITHDRAWAL',
            status='PENDING'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        # Averages
        average_deposit = Transaction.objects.filter(
            transaction_type='DEPOSIT',
            status='COMPLETED'
        ).aggregate(avg=Avg('amount'))['avg'] or Decimal('0.00')
        
        average_withdrawal = Transaction.objects.filter(
            transaction_type='WITHDRAWAL',
            status='COMPLETED'
        ).aggregate(avg=Avg('amount'))['avg'] or Decimal('0.00')
        
        # Conversion rate (simplified)
        total_users = User.objects.count()
        users_with_deposits = Transaction.objects.filter(
            transaction_type='DEPOSIT',
            status='COMPLETED'
        ).values('user').distinct().count()
        
        conversion_rate = (users_with_deposits / total_users * 100) if total_users > 0 else 0
        
        stats = {
            'total_revenue': total_revenue,
            'total_deposits': total_deposits,
            'total_withdrawals': total_withdrawals,
            'total_bonuses': total_bonuses,
            'total_fees': total_fees,
            'net_profit': net_profit,
            'revenue_today': revenue_today,
            'revenue_week': revenue_week,
            'revenue_month': revenue_month,
            'pending_deposits': pending_deposits,
            'pending_withdrawals': pending_withdrawals,
            'average_deposit': average_deposit,
            'average_withdrawal': average_withdrawal,
            'conversion_rate': round(conversion_rate, 2)
        }
        
        serializer = FinancialStatsSerializer(stats)
        return Response(serializer.data)


class TransactionStatsView(APIView):
    """Get transaction statistics"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Basic transaction counts
        total_transactions = Transaction.objects.count()
        successful_transactions = Transaction.objects.filter(status='COMPLETED').count()
        failed_transactions = Transaction.objects.filter(status='FAILED').count()
        pending_transactions = Transaction.objects.filter(status='PENDING').count()
        
        # Volume statistics
        total_volume = Transaction.objects.filter(
            status='COMPLETED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        average_transaction_value = Transaction.objects.filter(
            status='COMPLETED'
        ).aggregate(avg=Avg('amount'))['avg'] or Decimal('0.00')
        
        # Time-based statistics
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        transactions_today = Transaction.objects.filter(created_at__date=today).count()
        transactions_week = Transaction.objects.filter(created_at__date__gte=week_ago).count()
        transactions_month = Transaction.objects.filter(created_at__date__gte=month_ago).count()
        
        # Top transaction types
        top_transaction_types = Transaction.objects.values('transaction_type').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('-count')[:10]
        
        # Transaction status distribution
        transaction_status_distribution = Transaction.objects.values('status').annotate(
            count=Count('id')
        )
        
        stats = {
            'total_transactions': total_transactions,
            'successful_transactions': successful_transactions,
            'failed_transactions': failed_transactions,
            'pending_transactions': pending_transactions,
            'total_volume': total_volume,
            'average_transaction_value': average_transaction_value,
            'transactions_today': transactions_today,
            'transactions_week': transactions_week,
            'transactions_month': transactions_month,
            'top_transaction_types': list(top_transaction_types),
            'transaction_status_distribution': list(transaction_status_distribution)
        }
        
        serializer = TransactionStatsSerializer(stats)
        return Response(stats)


class KYCStatsView(APIView):
    """Get KYC statistics"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Basic KYC counts
        total_submissions = KYCVerification.objects.count()
        pending_submissions = KYCVerification.objects.filter(status='PENDING').count()
        approved_submissions = KYCVerification.objects.filter(status='APPROVED').count()
        rejected_submissions = KYCVerification.objects.filter(status='REJECTED').count()
        
        # Calculate approval rate
        if total_submissions > 0:
            approval_rate = (approved_submissions / total_submissions) * 100
        else:
            approval_rate = 0
        
        # Calculate average processing time
        processed_submissions = KYCVerification.objects.filter(
            reviewed_at__isnull=False
        )
        
        if processed_submissions.exists():
            total_processing_time = 0
            for submission in processed_submissions:
                if submission.reviewed_at and submission.created_at:
                    processing_time = (submission.reviewed_at - submission.created_at).total_seconds() / 3600  # hours
                    total_processing_time += processing_time
            
            average_processing_time = total_processing_time / processed_submissions.count()
        else:
            average_processing_time = 0
        
        # Time-based statistics
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        submissions_today = KYCVerification.objects.filter(created_at__date=today).count()
        submissions_week = KYCVerification.objects.filter(created_at__date__gte=week_ago).count()
        submissions_month = KYCVerification.objects.filter(created_at__date__gte=month_ago).count()
        
        # Top countries
        top_countries = KYCVerification.objects.values('country').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Document type distribution
        document_type_distribution = KYCVerification.objects.values('id_document_type').annotate(
            count=Count('id')
        )
        
        stats = {
            'total_submissions': total_submissions,
            'pending_submissions': pending_submissions,
            'approved_submissions': approved_submissions,
            'rejected_submissions': rejected_submissions,
            'approval_rate': round(approval_rate, 2),
            'average_processing_time': round(average_processing_time, 2),
            'submissions_today': submissions_today,
            'submissions_week': submissions_week,
            'submissions_month': submissions_month,
            'top_countries': list(top_countries),
            'document_type_distribution': list(document_type_distribution)
        }
        
        serializer = KYCStatsSerializer(stats)
        return Response(stats)


class PromoStatsView(APIView):
    """Get promotional statistics"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Basic promo counts
        total_promo_codes = PromoCode.objects.count()
        active_promo_codes = PromoCode.objects.filter(is_active=True).count()
        expired_promo_codes = PromoCode.objects.filter(
            end_date__lt=timezone.now().date()
        ).count()
        
        # Redemption statistics
        total_redemptions = PromoRedemption.objects.count()
        total_rewards_given = PromoRedemption.objects.filter(
            status='ACTIVE'
        ).aggregate(
            total=Sum('promo_code__discount_value')
        )['total'] or Decimal('0.00')
        
        average_reward_value = PromoCode.objects.aggregate(
            avg=Avg('discount_value')
        )['avg'] or Decimal('0.00')
        
        # Calculate conversion rate (simplified)
        if total_promo_codes > 0:
            conversion_rate = (total_redemptions / total_promo_codes) * 100
        else:
            conversion_rate = 0
        
        # Top performing codes
        top_codes = PromoCode.objects.annotate(
            redemption_count=Count('redemptions')
        ).order_by('-redemption_count')[:10]
        
        top_performing_codes = []
        for code in top_codes:
            top_performing_codes.append({
                'code': code.code,
                'name': code.name,
                'redemption_count': code.redemption_count,
                'discount_value': code.discount_value,
                'discount_type': code.discount_type
            })
        
        # Campaign performance
        campaigns = PromoCampaign.objects.annotate(
            redemption_count=Count('promo_codes__redemptions')
        ).order_by('-redemption_count')[:5]
        
        campaign_performance = []
        for campaign in campaigns:
            campaign_performance.append({
                'campaign_id': campaign.id,
                'campaign_name': campaign.name,
                'total_redemptions': campaign.redemption_count,
                'total_rewards_given': Decimal('0.00'),  # Calculate this if needed
                'average_reward_value': Decimal('0.00'),  # Calculate this if needed
                'conversion_rate': 0.0,  # Calculate this if needed
                'cost_per_acquisition': Decimal('0.00')  # Calculate this if needed
            })
        
        # Redemption trends (simplified)
        redemption_trends = {
            'daily': PromoRedemption.objects.filter(
                redeemed_at__date__gte=today - timedelta(days=7)
            ).count(),
            'weekly': PromoRedemption.objects.filter(
                redeemed_at__date__gte=today - timedelta(days=30)
            ).count(),
            'monthly': PromoRedemption.objects.filter(
                redeemed_at__date__gte=today - timedelta(days=90)
            ).count()
        }
        
        stats = {
            'total_promo_codes': total_promo_codes,
            'active_promo_codes': active_promo_codes,
            'expired_promo_codes': expired_promo_codes,
            'total_redemptions': total_redemptions,
            'total_rewards_given': total_rewards_given,
            'average_reward_value': average_reward_value,
            'conversion_rate': round(conversion_rate, 2),
            'top_performing_codes': top_performing_codes,
            'campaign_performance': campaign_performance,
            'redemption_trends': redemption_trends
        }
        
        serializer = PromoStatsSerializer(stats)
        return Response(stats)


class SystemHealthView(APIView):
    """Get system health information"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # This would typically check actual system status
        # For now, return mock data
        health_data = {
            'database_status': 'healthy',
            'redis_status': 'healthy',
            'celery_status': 'healthy',
            'storage_status': 'healthy',
            'api_response_time': 0.15,
            'active_connections': 25,
            'memory_usage': 65.2,
            'cpu_usage': 45.8,
            'disk_usage': 78.5,
            'error_rate': 0.02,
            'uptime': timedelta(days=15, hours=8, minutes=32),
            'last_backup': timezone.now() - timedelta(hours=6),
            'system_alerts': []
        }
        
        serializer = SystemHealthSerializer(health_data)
        return Response(health_data)


class PerformanceMetricsView(APIView):
    """Get system performance metrics"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # This would return actual performance metrics
        # For now, return mock data
        
        performance_data = {
            'cpu_usage': 45.2,
            'memory_usage': 67.8,
            'disk_usage': 23.1,
            'network_throughput': 125.6,
            'database_connections': 12,
            'active_sessions': 89,
            'response_time_avg': 0.045,
            'error_rate': 0.12,
            'uptime': '15 days, 8 hours',
            'last_backup': '2024-01-15 02:00:00',
            'backup_size': '2.3 GB',
            'system_load': [1.2, 1.1, 0.9]
        }
        
        return Response(performance_data)


class AuditLogView(APIView):
    """Get audit log entries"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        serializer = AuditLogFilterSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        queryset = AuditLog.objects.all()
        
        # Apply filters
        if data.get('user'):
            queryset = queryset.filter(user__icontains=data['user'])
        
        if data.get('action'):
            queryset = queryset.filter(action=data['action'])
        
        if data.get('resource_type'):
            queryset = queryset.filter(resource_type=data['resource_type'])
        
        if data.get('date_from'):
            queryset = queryset.filter(timestamp__date__gte=data['date_from'])
        
        if data.get('date_to'):
            queryset = queryset.filter(timestamp__date__lte=data['date_to'])
        
        if data.get('ip_address'):
            queryset = queryset.filter(ip_address=data['ip_address'])
        
        # Pagination
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))
        
        total_count = queryset.count()
        logs = queryset.order_by('-timestamp')[offset:offset + limit]
        
        # Serialize log data
        log_data = []
        for log in logs:
            log_data.append({
                'id': log.id,
                'user': log.user,
                'action': log.action,
                'resource_type': log.resource_type,
                'resource_id': log.resource_id,
                'details': log.details,
                'ip_address': log.ip_address,
                'user_agent': log.user_agent,
                'timestamp': log.timestamp
            })
        
        return Response({
            'logs': log_data,
            'total_count': total_count,
            'limit': limit,
            'offset': offset
        })


class ExportDataView(APIView):
    """Export data in various formats"""
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        serializer = ExportDataSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        data_type = data['data_type']
        format_type = data['format']
        
        # This would implement actual data export logic
        # For now, return a success message
        
        return Response({
            'message': f'Data export initiated for {data_type} in {format_type} format',
            'export_id': str(uuid.uuid4()),
            'status': 'processing'
        })


class BulkActionView(APIView):
    """Handle bulk actions"""
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        serializer = BulkActionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action = serializer.validated_data['action']
        resource_type = serializer.validated_data['resource_type']
        resource_ids = serializer.validated_data['resource_ids']
        parameters = serializer.validated_data.get('parameters', {})
        
        # This would implement actual bulk action logic
        # For now, return a success message
        
        return Response({
            'message': f'Bulk action {action} initiated for {len(resource_ids)} {resource_type}',
            'action': action,
            'resource_type': resource_type,
            'processed_count': len(resource_ids)
        })


class NotificationView(APIView):
    """Get and create notifications"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # This would return actual notifications
        # For now, return empty list
        return Response([])
    
    def post(self, request):
        serializer = NotificationCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # This would create actual notifications
        # For now, return success message
        
        return Response({
            'message': 'Notification created successfully',
            'notification_id': str(uuid.uuid4())
        })


class ReportGeneratorView(APIView):
    """Generate reports"""
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        serializer = ReportGeneratorSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        report_type = data['report_type']
        format_type = data['format']
        
        # This would implement actual report generation
        # For now, return success message
        
        return Response({
            'message': f'Report generation initiated for {report_type} in {format_type} format',
            'report_id': str(uuid.uuid4()),
            'status': 'processing'
        })


# ViewSets
class AdminDashboardViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing dashboards"""
    queryset = AdminDashboard.objects.all()
    serializer_class = DashboardWidgetSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        return AdminDashboard.objects.filter(created_by=self.request.user)


class DashboardWidgetViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing dashboard widgets"""
    queryset = DashboardWidget.objects.all()
    serializer_class = DashboardWidgetSerializer
    permission_classes = [IsAdminUser]


class DashboardLayoutViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing dashboard layouts"""
    queryset = DashboardLayout.objects.all()
    serializer_class = DashboardLayoutSerializer
    permission_classes = [IsAdminUser]


class AdminNotificationViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing notifications"""
    queryset = AdminNotification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        return AdminNotification.objects.filter(recipient=self.request.user)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin viewset for viewing audit logs"""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Apply filters
        action = self.request.query_params.get('action')
        user = self.request.query_params.get('user')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if action:
            queryset = queryset.filter(action=action)
        
        if user:
            queryset = queryset.filter(
                Q(performed_by__username__icontains=user) |
                Q(target_user__username__icontains=user)
            )
        
        if date_from:
            queryset = queryset.filter(timestamp__date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(timestamp__date__lte=date_to)
        
        return queryset.select_related('performed_by', 'target_user').order_by('-timestamp')


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_stats(request):
    """Get admin dashboard statistics"""
    try:
        # Get current date and week ago
        now = timezone.now()
        today = now.date()
        week_ago = today - timedelta(days=7)
        
        # Users statistics
        users_total = User.objects.count()
        users_today = User.objects.filter(date_joined__date=today).count()
        users_week = User.objects.filter(date_joined__date__gte=week_ago).count()
        
        # Games statistics
        games_total = GameRound.objects.count()
        games_today = GameRound.objects.filter(created_at__date=today).count()
        games_week = GameRound.objects.filter(created_at__date__gte=week_ago).count()
        
        # Transactions statistics
        transactions_total = Transaction.objects.count()
        transactions_today_volume = Transaction.objects.filter(
            created_at__date=today,
            transaction_type='DEPOSIT'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # KYC statistics
        kyc_pending = KYCDocument.objects.filter(status='PENDING').count()
        
        # Promo codes statistics
        promos_active = PromoCode.objects.filter(is_active=True).count()
        
        # Recent users
        recent_users = User.objects.order_by('-date_joined')[:5].values(
            'id', 'username', 'email', 'created_at'
        )
        
        # Add neon_coins field (assuming it exists)
        for user in recent_users:
            user['neon_coins'] = getattr(User.objects.get(id=user['id']), 'balance_neon', 0)
        
        stats = {
            'users': {
                'total': users_total,
                'today': users_today,
                'week': users_week
            },
            'games': {
                'total': games_total,
                'today': games_today,
                'week': games_week
            },
            'transactions': {
                'total': transactions_total,
                'todayVolume': float(transactions_today_volume)
            },
            'kyc': {
                'pending': kyc_pending
            },
            'promoCodes': {
                'active': promos_active
            },
            'recentUsers': list(recent_users)
        }
        
        return Response(stats)
        
    except Exception as e:
        print(f"❌ Error getting admin stats: {e}")
        return Response(
            {'error': 'Failed to get admin statistics'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


