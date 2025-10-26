from django.urls import path
from . import views

app_name = 'games'

urlpatterns = [
    # Public game endpoints
    path('list/', views.GameListView.as_view(), name='game-list'),
    path('detail/<slug:slug>/', views.GameDetailView.as_view(), name='game-detail'),
    
    # Game play endpoints (authenticated)
    path('play/<slug:game_slug>/', views.GamePlayView.as_view(), name='game-play'),
    path('history/', views.GameHistoryView.as_view(), name='game-history'),
    path('stats/', views.GameStatsView.as_view(), name='game-stats'),
    
    # Recent games for dashboard
    path('recent/', views.recent_games, name='recent-games'),  # Используем функцию вместо класса
    path('achievements/', views.UserAchievementsView.as_view(), name='user-achievements'),
    
    # Game-specific endpoints
    path('slots/play/', views.slots_play, name='slots-play'),
    path('blackjack/play/', views.blackjack_play, name='blackjack-play'),
    path('wheel/play/', views.wheel_play, name='wheel-play'),
    path('plinko/play/', views.plinko_play, name='plinko-play'),
    path('mines/play/', views.mines_play, name='mines-play'),
    path('coinflip/play/', views.coinflip_play, name='coinflip-play'),
    path('jackpot/play/', views.jackpot_play, name='jackpot-play'),
]


