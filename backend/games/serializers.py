from rest_framework import serializers
from .models import Game, GameRound, GameSession, GameCategory, GameAchievement, GameLeaderboard


class GameCategorySerializer(serializers.ModelSerializer):
    """Serializer for GameCategory model"""
    class Meta:
        model = GameCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'display_order', 'is_active', 'is_featured']


class GameSerializer(serializers.ModelSerializer):
    """Serializer for Game model"""
    category = GameCategorySerializer(read_only=True)
    
    class Meta:
        model = Game
        fields = [
            'id', 'title', 'slug', 'description', 'short_description', 'game_type', 
            'provider', 'category', 'min_bet', 'max_bet', 'rtp_percentage', 'volatility',
            'thumbnail', 'banner', 'demo_url', 'game_url', 'has_demo', 'has_free_spins',
            'has_bonus_rounds', 'has_progressive_jackpot', 'is_mobile_compatible',
            'is_active', 'is_featured', 'is_new', 'is_hot', 'total_plays', 'total_wagered',
            'total_won', 'average_play_time', 'created_at', 'updated_at', 'released_at'
        ]
        read_only_fields = ['id', 'total_plays', 'total_wagered', 'total_won', 'average_play_time', 'created_at', 'updated_at']


class GameListSerializer(serializers.ModelSerializer):
    """Serializer for listing games (minimal data)"""
    category = GameCategorySerializer(read_only=True)
    
    class Meta:
        model = Game
        fields = [
            'id', 'title', 'slug', 'description', 'short_description', 'game_type', 
            'provider', 'category', 'min_bet', 'max_bet', 'rtp_percentage', 'volatility',
            'thumbnail', 'banner', 'is_active', 'is_featured', 'is_new', 'is_hot',
            'total_plays', 'created_at'
        ]


class GameRoundSerializer(serializers.ModelSerializer):
    """Serializer for GameRound model"""
    game = GameListSerializer(read_only=True)
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = GameRound
        fields = [
            'id', 'round_id', 'user', 'game', 'bet_amount', 'win_amount', 'total_wagered',
            'status', 'game_state', 'result_data', 'started_at', 'completed_at', 'duration',
            'ip_address', 'user_agent', 'device_info'
        ]
        read_only_fields = ['id', 'round_id', 'user', 'started_at', 'completed_at', 'duration']


class GameRoundCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new game rounds"""
    class Meta:
        model = GameRound
        fields = ['game', 'bet_amount']
    
    def validate_bet_amount(self, value):
        game = self.context.get('game')
        if game:
            if value < game.min_bet:
                raise serializers.ValidationError(
                    f"Bet amount must be at least {game.min_bet} NeonCoins"
                )
            if value > game.max_bet:
                raise serializers.ValidationError(
                    f"Bet amount cannot exceed {game.max_bet} NeonCoins"
                )
        return value


class GameSessionSerializer(serializers.ModelSerializer):
    """Serializer for GameSession model"""
    game = GameListSerializer(read_only=True)
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = GameSession
        fields = [
            'id', 'session_id', 'user', 'game', 'total_rounds', 'total_wagered',
            'total_won', 'net_result', 'is_active', 'started_at', 'ended_at',
            'last_activity', 'session_data'
        ]
        read_only_fields = ['id', 'session_id', 'user', 'started_at', 'ended_at', 'last_activity']


class GameSessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new game sessions"""
    class Meta:
        model = GameSession
        fields = ['game']
    
    def create(self, validated_data):
        user = self.context['request'].user
        game = validated_data['game']
        
        # Generate unique session ID
        import uuid
        session_id = str(uuid.uuid4())
        
        return GameSession.objects.create(
            user=user,
            game=game,
            session_id=session_id
        )


class GameStatsSerializer(serializers.Serializer):
    """Serializer for game statistics"""
    total_games = serializers.IntegerField()
    total_rounds = serializers.IntegerField()
    total_wagered = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_won = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_bet = serializers.DecimalField(max_digits=15, decimal_places=2)
    win_rate = serializers.DecimalField(max_digits=5, decimal_places=2)


class GameResultSerializer(serializers.Serializer):
    """Serializer for game results"""
    round_id = serializers.CharField()
    win_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    multiplier = serializers.DecimalField(max_digits=10, decimal_places=2)
    is_big_win = serializers.BooleanField()
    is_jackpot = serializers.BooleanField()
    result_data = serializers.JSONField()


class GameActionSerializer(serializers.Serializer):
    """Serializer for game actions"""
    action_type = serializers.ChoiceField(choices=[
        'bet', 'spin', 'collect', 'bonus', 'free_spin'
    ])
    bet_amount = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    action_data = serializers.JSONField(required=False)



    def validate_bet_amount(self, value):
        game = self.context.get('game')
        if game:
            if value < game.min_bet:
                raise serializers.ValidationError(
                    f"Bet amount must be at least {game.min_bet} NeonCoins"
                )
            if value > game.max_bet:
                raise serializers.ValidationError(
                    f"Bet amount cannot exceed {game.max_bet} NeonCoins"
                )
        return value


class GameAchievementSerializer(serializers.ModelSerializer):
    """Serializer for GameAchievement model"""
    game = GameListSerializer(read_only=True)
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = GameAchievement
        fields = [
            'id', 'user', 'game', 'achievement_type', 'title', 
            'description', 'value', 'metadata', 'neoncoins_reward', 
            'badge_icon', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']


class GameLeaderboardSerializer(serializers.ModelSerializer):
    """Serializer for GameLeaderboard model"""
    game = GameListSerializer(read_only=True)
    
    class Meta:
        model = GameLeaderboard
        fields = [
            'id', 'game', 'period', 'period_start', 'period_end',
            'rankings', 'total_players', 'total_volume'
        ]
        read_only_fields = ['id', 'period_start', 'period_end', 
                           'total_players', 'total_volume']


class GameStatsSerializer(serializers.Serializer):
    """Serializer for game statistics"""
    total_games_played = serializers.IntegerField()
    total_wins = serializers.IntegerField()
    total_losses = serializers.IntegerField()
    win_rate = serializers.FloatField()
    total_bet_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_result_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    net_profit_loss = serializers.DecimalField(max_digits=15, decimal_places=2)
    favorite_game = serializers.CharField(allow_null=True)
    achievements_count = serializers.IntegerField()


class GameResultSerializer(serializers.Serializer):
    """Serializer for game results"""
    round_id = serializers.IntegerField()
    game_title = serializers.CharField()
    bet_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    result_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    is_win = serializers.BooleanField()
    profit_loss = serializers.DecimalField(max_digits=15, decimal_places=2)
    game_data = serializers.JSONField()
    completed_at = serializers.DateTimeField()


class GameActionSerializer(serializers.Serializer):
    """Serializer for game actions (spin, bet, etc.)"""
    action_type = serializers.ChoiceField(choices=['spin', 'bet', 'collect', 'bonus'])
    bet_amount = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    game_data = serializers.JSONField(required=False)
    
    def validate(self, data):
        if data.get('action_type') == 'bet' and 'bet_amount' not in data:
            raise serializers.ValidationError("Bet amount is required for bet action")
        return data


