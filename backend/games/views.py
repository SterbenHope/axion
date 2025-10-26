from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status, generics, viewsets, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.views import APIView
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
import random
from decimal import Decimal
from .models import Game, GameRound, GameSession, GameCategory
from .serializers import (
    GameSerializer, GameListSerializer, GameRoundSerializer, 
    GameRoundCreateSerializer, GameSessionSerializer, GameSessionCreateSerializer,
    GameStatsSerializer, GameResultSerializer, GameActionSerializer
)
import logging

logger = logging.getLogger(__name__)


class GameListView(generics.ListAPIView):
    """List all active games"""
    queryset = Game.objects.filter(is_active=True)
    serializer_class = GameListSerializer
    permission_classes = []
    
    def get_queryset(self):
        queryset = super().get_queryset()
        game_type = self.request.query_params.get('type', None)
        featured = self.request.query_params.get('featured', None)
        
        if game_type:
            queryset = queryset.filter(game_type=game_type)
        if featured is not None:
            featured_bool = featured.lower() == 'true'
            queryset = queryset.filter(is_featured=featured_bool)
            
        return queryset.order_by('-is_featured', 'title')


class GameDetailView(generics.RetrieveAPIView):
    """Get detailed information about a specific game"""
    queryset = Game.objects.filter(is_active=True)
    serializer_class = GameSerializer
    lookup_field = 'slug'
    permission_classes = []


class GamePlayView(APIView):
    """Handle game play actions (spin, bet, etc.)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, game_slug):
        game = get_object_or_404(Game, slug=game_slug, is_active=True)
        serializer = GameActionSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action_type = serializer.validated_data['action_type']
        bet_amount = serializer.validated_data.get('bet_amount', 0)
        
        if action_type == 'bet':
            return self._handle_bet(request.user, game, bet_amount)
        elif action_type == 'spin':
            return self._handle_spin(request.user, game, bet_amount)
        elif action_type == 'collect':
            return self._handle_collect(request.user, game)
        elif action_type == 'bonus':
            return self._handle_bonus(request.user, game)
        
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    
    def _handle_bet(self, user, game, bet_amount):
        """Handle placing a bet"""
        if bet_amount < game.min_bet or bet_amount > game.max_bet:
            return Response({
                'error': f'Bet amount must be between {game.min_bet} and {game.max_bet} NeonCoins'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if user.balance_neon < bet_amount:
            return Response({
                'error': 'Insufficient NeonCoins balance'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Deduct bet amount from user balance
        user.deduct_neoncoins(bet_amount)
        
        # Create game session
        session = GameSession.objects.create(
            user=user,
            game=game,
            bet_amount=bet_amount,
            client_ip=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            'session_id': session.session_id,
            'message': 'Bet placed successfully',
            'new_balance': user.balance_neon
        })
    
    def _handle_spin(self, user, game, bet_amount):
        """Handle spinning the game"""
        # Find active session
        session = GameSession.objects.filter(
            user=user, 
            game=game, 
            completed_at__isnull=True
        ).first()
        
        if not session:
            return Response({
                'error': 'No active game session found'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate game result based on RTP
        result = self._calculate_game_result(game, bet_amount)
        
        # Create game round
        round_obj = GameRound.objects.create(
            user=user,
            game=game,
            bet_amount=bet_amount,
            result_amount=result['amount'],
            status='COMPLETED',
            game_data=result['data'],
            started_at=timezone.now(),
            completed_at=timezone.now()
        )
        
        # Update user balance
        if result['amount'] > 0:
            user.add_neoncoins(result['amount'])
        
        # Update session
        session.completed_at = timezone.now()
        session.save()
        
        # Check for achievements and send realtime updates
        self._check_achievements(user, game, round_obj)
        self._send_game_update(user, round_obj)
        
        return Response({
            'round_id': round_obj.id,
            'result': result,
            'new_balance': user.balance_neon,
            'is_win': round_obj.is_win,
            'profit_loss': round_obj.profit_loss
        })
    
    def _calculate_game_result(self, game, bet_amount):
        """Calculate game result based on RTP and game type"""
        rtp = float(game.rtp) / 100
        
        if game.game_type == 'SLOT':
            return self._calculate_slot_result(bet_amount, rtp)
        elif game.game_type == 'ROULETTE':
            return self._calculate_roulette_result(bet_amount, rtp)
        elif game.game_type == 'BLACKJACK':
            return self._calculate_blackjack_result(bet_amount, rtp)
        elif game.game_type == 'WHEEL':
            return self._calculate_wheel_result(bet_amount, rtp)
        
        # Default: simple win/loss based on RTP
        win_chance = rtp
        if random.random() < win_chance:
            win_multiplier = random.uniform(1.0, 3.0)
            return {
                'amount': bet_amount * win_multiplier,
                'data': {'multiplier': win_multiplier, 'type': 'win'}
            }
        else:
            return {
                'amount': 0,
                'data': {'type': 'loss'}
            }
    
    def _calculate_slot_result(self, bet_amount, rtp):
        """Calculate slot machine result"""
        # Simple slot logic with RTP consideration
        symbols = ['🍒', '🍊', '🍇', '💎', '7️⃣', '🎰']
        reels = 3
        
        # Generate random result
        result_symbols = [random.choice(symbols) for _ in range(reels)]
        
        # Check for wins
        if len(set(result_symbols)) == 1:  # All symbols match
            multiplier = random.uniform(2.0, 10.0)
            return {
                'amount': bet_amount * multiplier,
                'data': {
                    'symbols': result_symbols,
                    'multiplier': multiplier,
                    'type': 'jackpot'
                }
            }
        elif result_symbols.count('7️⃣') >= 2:  # Two or more sevens
            multiplier = random.uniform(1.5, 3.0)
            return {
                'amount': bet_amount * multiplier,
                'data': {
                    'symbols': result_symbols,
                    'multiplier': multiplier,
                    'type': 'seven_win'
                }
            }
        else:
            # Small chance of small win based on RTP
            if random.random() < rtp * 0.3:
                multiplier = random.uniform(1.1, 1.5)
                return {
                    'amount': bet_amount * multiplier,
                    'data': {
                        'symbols': result_symbols,
                        'multiplier': multiplier,
                        'type': 'small_win'
                    }
                }
            else:
                return {
                    'amount': 0,
                    'data': {
                        'symbols': result_symbols,
                        'type': 'loss'
                    }
                }
    
    def _calculate_roulette_result(self, bet_amount, rtp):
        """Calculate roulette result"""
        # European roulette (37 numbers: 0-36)
        number = random.randint(0, 36)
        
        # Simple betting on red/black
        red_numbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]
        
        if number == 0:
            return {
                'amount': 0,
                'data': {'number': number, 'color': 'green', 'type': 'zero'}
            }
        elif number in red_numbers:
            if random.random() < rtp * 0.8:  # Bet on red
                return {
                    'amount': bet_amount * 2,
                    'data': {'number': number, 'color': 'red', 'type': 'red_win'}
                }
            else:
                return {
                    'amount': 0,
                    'data': {'number': number, 'color': 'red', 'type': 'red_loss'}
                }
        else:
            if random.random() < rtp * 0.8:  # Bet on black
                return {
                    'amount': bet_amount * 2,
                    'data': {'number': number, 'color': 'black', 'type': 'black_win'}
                }
            else:
                return {
                    'amount': 0,
                    'data': {'number': number, 'color': 'black', 'type': 'black_loss'}
                }
    
    def _calculate_blackjack_result(self, bet_amount, rtp):
        """Calculate blackjack result"""
        # Simplified blackjack logic
        player_cards = [random.randint(1, 10) for _ in range(2)]
        dealer_cards = [random.randint(1, 10) for _ in range(2)]
        
        player_total = sum(player_cards)
        dealer_total = sum(dealer_cards)
        
        # Check for blackjack
        if player_total == 21:
            return {
                'amount': bet_amount * 2.5,
                'data': {
                    'player_cards': player_cards,
                    'dealer_cards': dealer_cards,
                    'type': 'blackjack'
                }
            }
        
        # Simple win/loss based on RTP
        if random.random() < rtp:
            multiplier = random.uniform(1.5, 2.0)
            return {
                'amount': bet_amount * multiplier,
                'data': {
                    'player_cards': player_cards,
                    'dealer_cards': dealer_cards,
                    'type': 'win'
                }
            }
        else:
            return {
                'amount': 0,
                'data': {
                    'player_cards': player_cards,
                    'dealer_cards': dealer_cards,
                    'type': 'loss'
                }
            }
    
    def _calculate_wheel_result(self, bet_amount, rtp):
        """Calculate wheel of fortune result"""
        # Wheel with different segments
        segments = [
            {'multiplier': 0, 'probability': 0.4},      # Lose
            {'multiplier': 1, 'probability': 0.3},      # Return bet
            {'multiplier': 2, 'probability': 0.2},      # Double
            {'multiplier': 5, 'probability': 0.08},     # 5x
            {'multiplier': 10, 'probability': 0.02},    # 10x
        ]
        
        # Select segment based on probability
        rand = random.random()
        cumulative_prob = 0
        selected_segment = segments[0]
        
        for segment in segments:
            cumulative_prob += segment['probability']
            if rand <= cumulative_prob:
                selected_segment = segment
                break
        
        multiplier = selected_segment['multiplier']
        result_amount = bet_amount * multiplier
        
        return {
            'amount': result_amount,
            'data': {
                'segment': selected_segment,
                'multiplier': multiplier,
                'type': 'wheel_spin'
            }
        }
    
    def _handle_collect(self, user, game):
        """Handle collecting winnings"""
        # Find active session
        session = GameSession.objects.filter(
            user=user, 
            game=game, 
            completed_at__isnull=True
        ).first()
        
        if not session:
            return Response({
                'error': 'No active game session found'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Complete session
        session.completed_at = timezone.now()
        session.save()
        
        return Response({
            'message': 'Session completed',
            'final_balance': user.balance_neon
        })
    
    def _handle_bonus(self, user, game):
        """Handle bonus round"""
        # Find active session
        session = GameSession.objects.filter(
            user=user, 
            game=game, 
            completed_at__isnull=True
        ).first()
        
        if not session:
            return Response({
                'error': 'No active game session found'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Simple bonus round
        bonus_multiplier = random.uniform(1.5, 3.0)
        bonus_amount = session.bet_amount * bonus_multiplier
        
        # Add bonus to user balance
        user.add_neoncoins(bonus_amount)
        
        # Update session
        session.bonus_rounds += 1
        session.save()
        
        return Response({
            'bonus_amount': bonus_amount,
            'multiplier': bonus_multiplier,
            'new_balance': user.balance_neon
        })
    
    def _check_achievements(self, user, game, round_obj):
        """Check and award achievements"""
        from .models import GameAchievement
        if round_obj.is_win and not GameAchievement.objects.filter(
            user=user,
            achievement_type='FIRST_WIN'
        ).exists():
            GameAchievement.objects.create(
                user=user,
                game=game,
                achievement_type='FIRST_WIN',
                title='First Victory',
                description='Won your first game!',
                neoncoins_reward=100
            )
        if getattr(round_obj, 'profit_loss', 0) > 1000:
            GameAchievement.objects.create(
                user=user,
                game=game,
                achievement_type='BIG_WIN',
                title='Big Winner',
                description='Won over 1000 NeonCoins in a single round!',
                neoncoins_reward=500
            )

    def _send_game_update(self, user, round_obj):
        """Send real-time game update via WebSocket"""
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{user.id}",
            {
                'type': 'game.update',
                'round_id': str(round_obj.id),
                'game_title': round_obj.game.title,
                'result': str(getattr(round_obj, 'result_amount', round_obj.win_amount)),
                'is_win': getattr(round_obj, 'is_win', round_obj.win_amount > 0)
            }
        )


class GameHistoryView(generics.ListAPIView):
    """Get user's game history"""
    serializer_class = GameRoundSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return GameRound.objects.filter(
            user=self.request.user
        ).select_related('game').order_by('-started_at')


class GameStatsView(APIView):
    """Get user's game statistics"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Calculate stats
        rounds = GameRound.objects.filter(user=user)
        total_rounds = rounds.count()
        total_wins = rounds.filter(win_amount__gt=0).count()
        win_rate = (total_wins / total_rounds * 100) if total_rounds > 0 else 0
        
        total_bet = rounds.aggregate(total=Sum('bet_amount'))['total'] or 0
        total_won = rounds.aggregate(total=Sum('win_amount'))['total'] or 0
        
        stats = {
            'total_games': rounds.values('game').distinct().count(),
            'total_rounds': total_rounds,
            'total_wagered': total_bet,
            'total_won': total_won,
            'average_bet': round(total_bet / total_rounds, 2) if total_rounds > 0 else 0,
            'win_rate': round(win_rate, 2)
        }
        
        serializer = GameStatsSerializer(stats)
        return Response(serializer.data)


class AdminGameViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing games"""
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = [IsAdminUser]
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        game = self.get_object()
        game.is_active = not game.is_active
        game.save()
        
        return Response({
            'id': game.id,
            'is_active': game.is_active,
            'message': f'Game {"activated" if game.is_active else "deactivated"}'
        })
    
    @action(detail=True, methods=['post'])
    def toggle_featured(self, request, pk=None):
        game = self.get_object()
        game.is_featured = not game.is_featured
        game.save()
        
        return Response({
            'id': game.id,
            'is_featured': game.is_featured,
            'message': f'Game {"featured" if game.is_featured else "unfeatured"}'
        })
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get game analytics"""
        total_games = Game.objects.count()
        active_games = Game.objects.filter(is_active=True).count()
        featured_games = Game.objects.filter(is_featured=True).count()
        
        # Game type distribution
        game_types = Game.objects.values('game_type').annotate(
            count=Count('id')
        )
        
        # Recent activity
        recent_rounds = GameRound.objects.select_related('game').order_by('-started_at')[:10]
        
        analytics = {
            'total_games': total_games,
            'active_games': active_games,
            'featured_games': featured_games,
            'game_types': game_types,
            'recent_rounds': GameRoundSerializer(recent_rounds, many=True).data
        }
        
        return Response(analytics)


class RecentGamesView(APIView):
    """Get user's recent games for dashboard"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get recent game rounds
        recent_rounds = GameRound.objects.filter(
            user=user
        ).select_related('game').order_by('-started_at')[:10]
        
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
        
        return Response({
            'success': True,
            'recent_games': recent_games
        })


class UserAchievementsView(APIView):
    """Get user's achievements for dashboard"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get user's achievements
        achievements = GameAchievement.objects.filter(
            user=user
        ).order_by('-created_at')[:10]
        
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
        
        return Response({
            'success': True,
            'achievements': achievements_data
        })


from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Game, GameRound
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_games(request):
    """Get recent games for the authenticated user"""
    try:
        print(f"[RECENT_GAMES] ===== RECENT GAMES REQUEST START =====")
        print(f"[RECENT_GAMES] Timestamp: {timezone.now()}")
        print(f"[RECENT_GAMES] Request method: {request.method}")
        print(f"[RECENT_GAMES] Request path: {request.path}")
        print(f"[RECENT_GAMES] Request received from: {request.META.get('REMOTE_ADDR')}")
        print(f"[RECENT_GAMES] Request headers: {dict(request.headers)}")
        print(f"[RECENT_GAMES] User authenticated: {request.user.is_authenticated}")
        print(f"[RECENT_GAMES] User: {request.user}")
        print(f"[RECENT_GAMES] ==========================================")
        
        # Since we now require authentication, user will always be authenticated
        user = request.user
        
        # Get recent game rounds for authenticated user
        recent_games = []
        print(f"[RECENT_GAMES] Returning empty recent games list for user {user.id}")
        
        return Response(recent_games)
        
    except Exception as e:
        logger.error(f"Error getting recent games: {e}")
        return Response(
            {'error': 'Failed to get recent games'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def game_list(request):
    """Get list of available games"""
    try:
        games = Game.objects.filter(is_active=True).order_by('is_featured', '-created_at')
        
        game_data = []
        for game in games:
            game_data.append({
                'slug': game.slug,
                'title': game.title,
                'description': game.description,
                'game_type': game.game_type,
                'min_bet': game.min_bet,
                'max_bet': game.max_bet,
                'rtp': game.rtp,
                'is_featured': game.is_featured,
                'thumbnail': game.thumbnail,
                'rules': game.rules
            })
        
        return Response(game_data)
        
    except Exception as e:
        logger.error(f"Error getting game list: {e}")
        return Response(
            {'error': 'Failed to get game list'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def game_detail(request, slug):
    """Get detailed information about a specific game"""
    try:
        game = get_object_or_404(Game, slug=slug, is_active=True)
        
        return Response({
            'slug': game.slug,
            'title': game.title,
            'description': game.description,
            'game_type': game.game_type,
            'min_bet': game.min_bet,
            'max_bet': game.max_bet,
            'rtp': game.rtp,
            'is_featured': game.is_featured,
            'thumbnail': game.thumbnail,
            'rules': game.rules,
            'created_at': game.created_at
        })
        
    except Game.DoesNotExist:
        return Response(
            {'error': 'Game not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error getting game detail: {e}")
        return Response(
            {'error': 'Failed to get game details'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def slots_play(request):
    """Handle slots game play"""
    try:
        bet_amount = request.data.get('betAmount', 10)
        user = request.user
        
        # Check if user has enough balance
        if user.balance_neon < bet_amount:
            return Response({
                'error': 'Insufficient balance'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Simple slot logic
        symbols = ['cherry', 'lemon', 'orange', 'plum', 'bell', 'bar', 'seven']
        reels = [random.choice(symbols) for _ in range(5)]
        
        # Calculate win based on symbols
        payout = 0
        isWin = False
        
        # Check for winning combinations
        if all(symbol == 'seven' for symbol in reels):
            payout = bet_amount * 100  # Jackpot
            isWin = True
        elif all(symbol == 'bar' for symbol in reels):
            payout = bet_amount * 50   # Big win
            isWin = True
        elif all(symbol == 'bell' for symbol in reels):
            payout = bet_amount * 25   # Medium win
            isWin = True
        elif all(symbol == reels[0] for symbol in reels):
            payout = bet_amount * 10   # Small win
            isWin = True
        
        # Update user balance
        user.balance_neon -= bet_amount  # Deduct bet
        if isWin:
            user.balance_neon += payout  # Add winnings
        
        user.save()
        
        # Create game round record
        game_round = GameRound.objects.create(
            user=user,
            game_type='SLOT',
            bet_amount=bet_amount,
            result_amount=payout,
            is_win=isWin,
            game_data={'reels': reels, 'symbols': symbols},
            status='COMPLETED'
        )
        
        return Response({
            'reels': reels,
            'payout': payout,
            'netResult': payout - bet_amount,
            'newBalance': float(user.balance_neon),
            'isWin': isWin,
            'game_round_id': game_round.id
        })
        
    except Exception as e:
        logger.error(f"Error in slots play: {e}")
        return Response(
            {'error': 'Failed to process slots game'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def blackjack_play(request):
    """Handle blackjack game play"""
    try:
        bet_amount = request.data.get('betAmount', 10)
        user = request.user
        
        # Check if user has enough balance
        if user.balance_neon < bet_amount:
            return Response({
                'error': 'Insufficient balance'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Simple blackjack logic
        player_cards = [random.randint(1, 10), random.randint(1, 10)]
        dealer_cards = [random.randint(1, 10), random.randint(1, 10)]
        
        player_total = sum(player_cards)
        dealer_total = sum(dealer_cards)
        
        # Simple win/loss logic
        if player_total > 21:
            result = 'bust'
            payout = 0
        elif dealer_total > 21:
            result = 'dealer_bust'
            payout = bet_amount * 2
        elif player_total > dealer_total:
            result = 'win'
            payout = bet_amount * 2
        elif player_total < dealer_total:
            result = 'loss'
            payout = 0
        else:
            result = 'push'
            payout = bet_amount
        
        # Update user balance
        user.balance_neon -= bet_amount  # Deduct bet
        if payout > 0:
            user.balance_neon += payout  # Add winnings
        
        user.save()
        
        # Create game round record
        game_round = GameRound.objects.create(
            user=user,
            game_type='BLACKJACK',
            bet_amount=bet_amount,
            result_amount=payout,
            is_win=(payout > bet_amount),
            game_data={
                'player_cards': player_cards,
                'dealer_cards': dealer_cards,
                'player_total': player_total,
                'dealer_total': dealer_total,
                'result': result
            },
            status='COMPLETED'
        )
        
        return Response({
            'player_cards': player_cards,
            'dealer_cards': dealer_cards,
            'player_total': player_total,
            'dealer_total': dealer_total,
            'result': result,
            'payout': payout,
            'bet_amount': bet_amount,
            'newBalance': float(user.balance_neon),
            'game_round_id': game_round.id
        })
        
    except Exception as e:
        logger.error(f"Error in blackjack play: {e}")
        return Response(
            {'error': 'Failed to process blackjack game'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def wheel_play(request):
    """Handle wheel of fortune game play"""
    try:
        bet_amount = request.data.get('betAmount', 10)
        user = request.user
        
        # Check if user has enough balance
        if user.balance_neon < bet_amount:
            return Response({
                'error': 'Insufficient balance'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Define segments exactly matching frontend WHEEL_SEGMENTS
        # Frontend segments (index 0-23):
        # [0, 0.5, 1, 2, 3, 5, 10, 25, 0, 1, 2, 2, 3, 5, 10, 0.1, 0.5, 1, 2, 3, 5, 5, 0, 1]
        segment_map = [
            0, 0.5, 1, 2, 3, 5, 10, 25,  # First 8 segments (0-7)
            0, 1, 2, 2, 3, 5, 10, 0.1,   # Next 8 segments (8-15)
            0.5, 1, 2, 3, 5, 5, 0, 1      # Last 8 segments (16-23)
        ]
        
        # Select random segment index (0-23)
        winning_segment = random.randint(0, 23)
        
        # Get multiplier from the selected segment
        multiplier = segment_map[winning_segment]
        
        # Determine type based on multiplier
        if multiplier == 0:
            selected_segment = {'type': 'win', 'multiplier': 0}
        elif multiplier == 0.1:
            selected_segment = {'type': 'bonus', 'multiplier': 0.1}
        elif multiplier == 0.5:
            selected_segment = {'type': 'win', 'multiplier': 0.5}
        elif multiplier == 1:
            selected_segment = {'type': 'win', 'multiplier': 1}
        elif multiplier == 2:
            selected_segment = {'type': 'win', 'multiplier': 2}
        elif multiplier == 3:
            selected_segment = {'type': 'win', 'multiplier': 3}
        elif multiplier == 5:
            selected_segment = {'type': 'win', 'multiplier': 5}
        elif multiplier == 10:
            selected_segment = {'type': 'win', 'multiplier': 10}
        elif multiplier == 25:
            selected_segment = {'type': 'win', 'multiplier': 25}
        else:
            selected_segment = {'type': 'win', 'multiplier': 0}
        
        # Calculate payout based on type
        bonus = 0
        if selected_segment['type'] == 'bonus':
            # Bonus: add 10% of bet to balance (not from the bet, but as bonus)
            bonus = bet_amount * multiplier
            payout = 0  # Don't return bet
        else:
            # Normal win/loss
            payout = bet_amount * multiplier
        
        # Update user balance
        from decimal import Decimal
        balance_before_bet = float(user.balance_neon)
        user.balance_neon = Decimal(str(user.balance_neon)) - Decimal(str(bet_amount))  # Deduct bet
        balance_after_bet = float(user.balance_neon)
        
        # Add winnings or bonus
        if selected_segment['type'] == 'bonus':
            user.balance_neon = Decimal(str(user.balance_neon)) + Decimal(str(bonus))
        elif payout > 0:
            user.balance_neon = Decimal(str(user.balance_neon)) + Decimal(str(payout))
        
        user.save()
        balance_after_win = float(user.balance_neon)
        
        # Create transaction record for BET
        from transactions.models import Transaction
        client_ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
        Transaction.objects.create(
            user=user,
            transaction_type='BET',
            amount=bet_amount,
            currency='NEON',
            balance_before=balance_before_bet,
            balance_after=balance_after_bet,
            net_amount=bet_amount,
            status='COMPLETED',
            ip_address=client_ip,
            metadata={'game': 'WHEEL', 'segment': winning_segment}
        )
        
        # Create transaction record for WIN/BONUS if payout > 0
        if payout > 0 or selected_segment['type'] == 'bonus':
            Transaction.objects.create(
                user=user,
                transaction_type='WIN',
                amount=bonus if selected_segment['type'] == 'bonus' else payout,
                currency='NEON',
                balance_before=balance_after_bet,
                balance_after=balance_after_win,
                net_amount=bonus if selected_segment['type'] == 'bonus' else payout,
                status='COMPLETED',
                ip_address=client_ip,
                metadata={'game': 'WHEEL', 'winning_segment': winning_segment, 'multiplier': multiplier, 'bet_amount': bet_amount, 'type': selected_segment['type']}
            )
        
        # Create game round record
        # First, get or create a Wheel game
        from games.models import Game, GameCategory
        
        # Get or create category
        category, _ = GameCategory.objects.get_or_create(
            slug='virtual',
            defaults={
                'name': 'Virtual Games',
                'description': 'Virtual casino games'
            }
        )
        
        # Get or create Wheel game
        wheel_game, created = Game.objects.get_or_create(
            slug='wheel',
            defaults={
                'title': 'Wheel of Fortune',
                'description': 'Spin the wheel and win big!',
                'game_type': 'VIRTUAL',
                'provider': 'CUSTOM',
                'category': category,
                'min_bet': Decimal('0.01'),
                'max_bet': Decimal('10000.00'),
                'is_active': True
            }
        )
        
        # Create round
        game_round = GameRound.objects.create(
            game=wheel_game,
            user=user,
            round_id=f'WHEEL_{user.id}_{timezone.now().timestamp()}',
            bet_amount=bet_amount,
            win_amount=payout if selected_segment['type'] != 'bonus' else bonus,
            status='COMPLETED',
            result_data={
                'winning_segment': winning_segment,
                'total_segments': 24,
                'multiplier': multiplier,
                'type': selected_segment['type']
            },
            ip_address=client_ip,
            total_wagered=bet_amount
        )
        
        return Response({
            'winning_segment': winning_segment,
            'total_segments': 24,
            'payout': payout,
            'bonus': bonus if selected_segment['type'] == 'bonus' else 0,
            'bet_amount': bet_amount,
            'isWin': payout > bet_amount,
            'isBonus': selected_segment['type'] == 'bonus',
            'newBalance': float(user.balance_neon),
            'game_round_id': game_round.id
        })
        
    except Exception as e:
        logger.error(f"Error in wheel play: {e}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Failed to process wheel game: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def plinko_play(request):
    """Handle Plinko game play"""
    try:
        bet_amount = request.data.get('betAmount', 10)
        difficulty = request.data.get('difficulty', 'normal')
        user = request.user
        
        # Check if user has enough balance
        if user.balance_neon < bet_amount:
            return Response({
                'error': 'Insufficient balance'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Plinko multipliers based on difficulty
        multipliers = {
            'easy': [1.2, 2.0, 3.0],
            'normal': [1.1, 1.92, 4.8, 21.1],
            'hard': [0.5, 1.34, 2.5, 5.0, 10.0]
        }
        
        slot_multipliers = multipliers.get(difficulty, multipliers['normal'])
        winning_slot = random.randint(0, len(slot_multipliers) - 1)
        multiplier = slot_multipliers[winning_slot]
        payout = bet_amount * multiplier
        
        # Update user balance
        user.balance_neon -= bet_amount
        if payout > 0:
            user.balance_neon += payout
        user.save()
        
        # Create transaction record for BET
        from transactions.models import Transaction
        client_ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
        Transaction.objects.create(
            user=user,
            transaction_type='BET',
            amount=bet_amount,
            currency='NEON',
            balance_before=user.balance_neon + bet_amount,
            balance_after=user.balance_neon,
            net_amount=bet_amount,
            status='COMPLETED',
            ip_address=client_ip,
            metadata={'game': 'PLINKO', 'difficulty': difficulty}
        )
        
        # Create transaction record for WIN if payout > 0
        if payout > 0:
            Transaction.objects.create(
                user=user,
                transaction_type='WIN',
                amount=payout,
                currency='NEON',
                balance_before=user.balance_neon,
                balance_after=user.balance_neon,
                net_amount=payout,
                status='COMPLETED',
                ip_address=client_ip,
                metadata={'game': 'PLINKO', 'winning_slot': winning_slot, 'multiplier': multiplier, 'bet_amount': bet_amount}
            )
        
        return Response({
            'winning_slot': winning_slot,
            'multiplier': multiplier,
            'payout': payout,
            'isWin': payout > bet_amount,
            'newBalance': float(user.balance_neon)
        })
        
    except Exception as e:
        logger.error(f"Error in plinko play: {e}")
        return Response({'error': 'Failed to process plinko game'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mines_play(request):
    """Handle Mines game play"""
    try:
        action = request.data.get('action')  # 'bet', 'reveal', 'cashout'
        user = request.user
        
        if action == 'bet':
            bet_amount = request.data.get('betAmount', 10)
            mines_count = request.data.get('minesCount', 10)
            
            if user.balance_neon < bet_amount:
                return Response({'error': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Deduct bet
            from transactions.models import Transaction
            balance_before = user.balance_neon
            user.balance_neon -= bet_amount
            user.save()
            
            # Create BET transaction
            client_ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
            Transaction.objects.create(
                user=user,
                transaction_type='BET',
                amount=bet_amount,
                currency='NEON',
                balance_before=balance_before,
                balance_after=user.balance_neon,
                net_amount=bet_amount,
                status='COMPLETED',
                ip_address=client_ip,
                metadata={'game': 'MINES', 'mines_count': mines_count}
            )
            
            return Response({
                'success': True,
                'newBalance': float(user.balance_neon)
            })
            
        elif action == 'cashout':
            bet_amount = request.data.get('betAmount', 10)
            multipliers_revealed = request.data.get('multipliersRevealed', 0)
            multiplier = request.data.get('multiplier', 1.0)
            
            payout = bet_amount * multiplier
            
            # Add winnings
            user.balance_neon += payout
            user.save()
            
        # Create transaction records
        from transactions.models import Transaction
        client_ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
        Transaction.objects.create(
            user=user,
            transaction_type='WIN',
            amount=payout,
            currency='NEON',
            balance_before=user.balance_neon - payout,
            balance_after=user.balance_neon,
            net_amount=payout,
            status='COMPLETED',
            ip_address=client_ip,
            metadata={'game': 'MINES', 'multiplier': multiplier, 'multipliers_revealed': multipliers_revealed, 'bet_amount': bet_amount}
        )
        
        return Response({
            'payout': payout,
            'isWin': True,
            'newBalance': float(user.balance_neon)
        })
            
    except Exception as e:
        logger.error(f"Error in mines play: {e}")
        return Response({'error': 'Failed to process mines game'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def coinflip_play(request):
    """Handle Coinflip game play"""
    try:
        bet_amount = request.data.get('betAmount', 10)
        choice = request.data.get('choice', 'heads')  # 'heads' or 'tails'
        user = request.user
        
        if user.balance_neon < bet_amount:
            return Response({'error': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Flip coin
        result = random.choice(['heads', 'tails'])
        is_win = (result == choice)
        
        # Update user balance
        user.balance_neon -= bet_amount
        if is_win:
            payout = bet_amount * 2
            user.balance_neon += payout
        else:
            payout = 0
        
        user.save()
        
        # Create transaction records
        from transactions.models import Transaction
        client_ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
        balance_before = user.balance_neon + bet_amount
        
        # BET transaction
        Transaction.objects.create(
            user=user,
            transaction_type='BET',
            amount=bet_amount,
            currency='NEON',
            balance_before=balance_before,
            balance_after=balance_before - bet_amount,
            net_amount=bet_amount,
            status='COMPLETED',
            ip_address=client_ip,
            metadata={'game': 'COINFLIP', 'choice': choice}
        )
        
        # WIN transaction if win
        if is_win and payout > 0:
            Transaction.objects.create(
                user=user,
                transaction_type='WIN',
                amount=payout,
                currency='NEON',
                balance_before=user.balance_neon - payout,
                balance_after=user.balance_neon,
                net_amount=payout,
                status='COMPLETED',
                ip_address=client_ip,
                metadata={'game': 'COINFLIP', 'result': result}
            )
        
        return Response({
            'result': result,
            'choice': choice,
            'isWin': is_win,
            'payout': payout,
            'newBalance': float(user.balance_neon)
        })
        
    except Exception as e:
        logger.error(f"Error in coinflip play: {e}")
        return Response({'error': 'Failed to process coinflip game'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def jackpot_play(request):
    """Handle Jackpot game play"""
    try:
        bet_amount = request.data.get('betAmount', 10)
        user = request.user
        
        if user.balance_neon < bet_amount:
            return Response({'error': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Jackpot logic with low win rate but high multiplier
        win_chance = random.random()
        multiplier = 0
        if win_chance < 0.1:  # 10% win chance
            multiplier = random.uniform(5.0, 20.0)
            payout = bet_amount * multiplier
            is_win = True
        else:
            payout = 0
            is_win = False
        
        # Update user balance
        user.balance_neon -= bet_amount
        if payout > 0:
            user.balance_neon += payout
        user.save()
        
        # Create transaction records
        from transactions.models import Transaction
        client_ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
        balance_before = user.balance_neon + bet_amount
        
        # BET transaction
        Transaction.objects.create(
            user=user,
            transaction_type='BET',
            amount=bet_amount,
            currency='NEON',
            balance_before=balance_before,
            balance_after=balance_before - bet_amount,
            net_amount=bet_amount,
            status='COMPLETED',
            ip_address=client_ip,
            metadata={'game': 'JACKPOT'}
        )
        
        # WIN transaction if win
        if is_win and payout > 0:
            Transaction.objects.create(
                user=user,
                transaction_type='WIN',
                amount=payout,
                currency='NEON',
                balance_before=user.balance_neon - payout,
                balance_after=user.balance_neon,
                net_amount=payout,
                status='COMPLETED',
                ip_address=client_ip,
                metadata={'game': 'JACKPOT', 'multiplier': multiplier}
            )
        
        return Response({
            'isWin': is_win,
            'payout': payout,
            'multiplier': multiplier if is_win else 0,
            'newBalance': float(user.balance_neon)
        })
        
    except Exception as e:
        logger.error(f"Error in jackpot play: {e}")
        return Response({'error': 'Failed to process jackpot game'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


