from django.contrib import admin
from django.utils.html import format_html
from .models import Game, GameRound, GameSession, GameCategory, GameLeaderboard


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ['title', 'game_type', 'provider', 'category', 'min_bet', 'max_bet', 'rtp_percentage', 'is_active', 'is_featured', 'is_new', 'is_hot', 'total_plays']
    list_filter = ['game_type', 'provider', 'category', 'is_active', 'is_featured', 'is_new', 'is_hot', 'created_at']
    search_fields = ['title', 'description', 'slug']
    list_editable = ['is_active', 'is_featured', 'is_new', 'is_hot']
    prepopulated_fields = {'slug': ('title',)}
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'description', 'short_description', 'game_type', 'provider', 'category')
        }),
        ('Game Configuration', {
            'fields': ('min_bet', 'max_bet', 'rtp_percentage', 'volatility')
        }),
        ('Game Features', {
            'fields': ('has_demo', 'has_free_spins', 'has_bonus_rounds', 'has_progressive_jackpot', 'is_mobile_compatible')
        }),
        ('Visual Assets', {
            'fields': ('thumbnail', 'banner', 'demo_url', 'game_url')
        }),
        ('Status & Display', {
            'fields': ('is_active', 'is_featured', 'is_new', 'is_hot')
        }),
        ('Statistics', {
            'fields': ('total_plays', 'total_wagered', 'total_won', 'average_play_time'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'released_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['created_at', 'updated_at', 'total_plays', 'total_wagered', 'total_won', 'average_play_time']
    ordering = ['-is_featured', '-is_new', '-total_plays', 'title']


@admin.register(GameRound)
class GameRoundAdmin(admin.ModelAdmin):
    list_display = ['round_id', 'user', 'game', 'bet_amount', 'win_amount', 'status', 'duration', 'started_at']
    list_filter = ['game', 'status', 'started_at', 'completed_at']
    search_fields = ['round_id', 'user__username', 'user__email', 'game__title']
    readonly_fields = ['id', 'started_at', 'completed_at', 'duration']
    
    fieldsets = (
        ('Game Information', {
            'fields': ('user', 'game', 'round_id', 'status')
        }),
        ('Betting Details', {
            'fields': ('bet_amount', 'win_amount', 'total_wagered')
        }),
        ('Game State', {
            'fields': ('game_state', 'result_data'),
            'classes': ('collapse',)
        }),
        ('Timing', {
            'fields': ('started_at', 'completed_at', 'duration')
        }),
        ('Metadata', {
            'fields': ('ip_address', 'user_agent', 'device_info'),
            'classes': ('collapse',)
        })
    )
    
    ordering = ['-started_at']


@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'user', 'game', 'total_rounds', 'total_wagered', 'total_won', 'net_result', 'is_active', 'started_at']
    list_filter = ['game', 'is_active', 'started_at', 'ended_at']
    search_fields = ['session_id', 'user__username', 'game__title']
    readonly_fields = ['id', 'started_at', 'ended_at', 'last_activity']
    
    fieldsets = (
        ('Session Information', {
            'fields': ('user', 'game', 'session_id', 'is_active')
        }),
        ('Statistics', {
            'fields': ('total_rounds', 'total_wagered', 'total_won', 'net_result')
        }),
        ('Timing', {
            'fields': ('started_at', 'ended_at', 'last_activity')
        }),
        ('Session Data', {
            'fields': ('session_data',),
            'classes': ('collapse',)
        })
    )
    
    ordering = ['-started_at']


@admin.register(GameCategory)
class GameCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'display_order', 'is_active', 'is_featured', 'created_at']
    list_filter = ['is_active', 'is_featured', 'created_at']
    search_fields = ['name', 'description']
    list_editable = ['display_order', 'is_active', 'is_featured']
    prepopulated_fields = {'slug': ('name',)}
    
    fieldsets = (
        ('Category Information', {
            'fields': ('name', 'slug', 'description')
        }),
        ('Display Settings', {
            'fields': ('icon', 'display_order', 'is_active', 'is_featured')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['display_order', 'name']



@admin.register(GameLeaderboard)
class GameLeaderboardAdmin(admin.ModelAdmin):
    list_display = ['game', 'period', 'period_start', 'period_end', 'total_players', 'total_volume']
    list_filter = ['game', 'period', 'period_start', 'period_end']
    search_fields = ['game__title']
    readonly_fields = ['period_start', 'period_end', 'total_players', 'total_volume']
    
    fieldsets = (
        ('Leaderboard Information', {
            'fields': ('game', 'period', 'period_start', 'period_end')
        }),
        ('Statistics', {
            'fields': ('rankings', 'total_players', 'total_volume'),
            'classes': ('collapse',)
        })
    )
    
    ordering = ['-period_start']


