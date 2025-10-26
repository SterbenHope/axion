import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth/useAuth';
import { useTranslation } from 'react-i18next';
import Header from '../../components/layout/header';
import Footer from '../../components/layout/footer';
import axios from 'axios';
import { API_URL } from '../../http';

const GamesPage = ({ onPageChange }) => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchGames();
    }
  }, [isAuthenticated]);

  const fetchGames = async () => {
    // Mock data for games
    const mockGames = [
      { id: 1, name: 'Plinko', category: 'crypto', image: '/images/plinko.png', status: 'live', minBet: 0.1, maxBet: 100, rtp: 99, description: 'Drop the ball and watch it bounce to victory!', players: 1250 },
      { id: 2, name: 'Wheel', category: 'casino', image: '/images/wheel.png', status: 'live', minBet: 0.5, maxBet: 200, rtp: 97, description: 'Spin the wheel and win big!', players: 890 },
      { id: 3, name: 'Jackpot', category: 'casino', image: '/images/jackpot.png', status: 'live', minBet: 1, maxBet: 500, rtp: 95, description: 'The ultimate jackpot experience!', players: 2100 },
      { id: 4, name: 'Mines', category: 'crypto', image: '/images/mines.png', status: 'live', minBet: 0.1, maxBet: 50, rtp: 98, description: 'Navigate through the minefield!', players: 1750 },
      { id: 5, name: 'Coinflip', category: 'crypto', image: '/images/coinflip.png', status: 'live', minBet: 0.2, maxBet: 150, rtp: 96, description: 'Heads or tails? Your choice!', players: 980 },
      { id: 6, name: 'PVP Mines', category: 'crypto', image: '/images/pvp-mines.png', status: 'coming_soon', minBet: 0.5, maxBet: 100, rtp: 97, description: 'Compete against other players!', players: 0 },
      { id: 7, name: 'Upgrader', category: 'casino', image: '/images/upgrader.png', status: 'maintenance', minBet: 0.1, maxBet: 75, rtp: 94, description: 'Upgrade your way to victory!', players: 0 },
      { id: 8, name: 'Slots', category: 'casino', image: '/images/slots.png', status: 'live', minBet: 0.2, maxBet: 100, rtp: 96, description: 'Classic slot machine fun!', players: 1450 },
      { id: 9, name: 'Live Casino', category: 'live_casino', image: '/images/live-casino.png', status: 'live', minBet: 1, maxBet: 1000, rtp: 99, description: 'Real dealers, real excitement!', players: 3200 },
      { id: 10, name: 'Table Games', category: 'table_games', image: '/images/table-games.png', status: 'live', minBet: 0.5, maxBet: 300, rtp: 98, description: 'Classic table game experience!', players: 1100 },
    ];

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/games/list/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Ensure response.data is an array
      const gamesArray = Array.isArray(response.data) && response.data.length > 0 ? response.data : mockGames;
      setGames(gamesArray);
    } catch (error) {
      console.error('Error fetching games:', error);
      setError('Failed to load games');
      
      // Fallback to mock data if API fails
      setGames(mockGames);
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = games.filter(game => {
    const matchesCategory = activeCategory === 'all' || game.category === activeCategory;
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedGames = [...filteredGames].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'players':
        return b.players - a.players;
      case 'rtp':
        return b.rtp - a.rtp;
      default:
        return 0;
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'text-green-400';
      case 'coming_soon': return 'text-yellow-400';
      case 'maintenance': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'live': return t('games.live');
      case 'coming_soon': return t('games.comingSoon');
      case 'maintenance': return t('games.maintenance');
      default: return status;
    }
  };

  const getGameIcon = (gameName) => {
    const icons = {
      'Plinko': '🎯',
      'Wheel': '🎡',
      'Jackpot': '🎰',
      'Mines': '💣',
      'Coinflip': '🪙',
      'PVP Mines': '⚔️',
      'Upgrader': '⬆️',
      'Slots': '🎲',
      'Live Casino': '🎭',
      'Table Games': '🃏'
    };
    return icons[gameName] || '🎮';
  };

  const handlePlayGame = (game) => {
    if (game.status === 'live') {
      // Map game names to page names
      const gamePageMap = {
        'Plinko': 'plinko',
        'Wheel': 'wheel',
        'Jackpot': 'jackpot',
        'Mines': 'mines',
        'Coinflip': 'coinflip',
        'PVP Mines': 'pvp-mines'
      };
      
      const pageName = gamePageMap[game.name];
      if (pageName && onPageChange) {
        console.log('Launching game:', game.name);
        onPageChange(pageName);
      } else {
        console.log('Playing game:', game.name);
        // Show non-blocking notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #3b82f6;
          color: white;
          padding: 16px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          max-width: 400px;
          animation: slideIn 0.3s ease-out;
        `;
        
        notification.innerHTML = `
          <div style="font-weight: 600; margin-bottom: 4px;">🎮 Launching Game!</div>
          <div>${game.name} is starting...</div>
          <button onclick="this.parentElement.remove()" style="
            position: absolute;
            top: 8px;
            right: 8px;
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            opacity: 0.7;
          ">×</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 4000);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-white">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
        <Header />
        <main className="pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                <p className="text-white text-lg">Loading games...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="games-content">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white neon-glow">{t('games.allGames')}</h1>
        <button
          onClick={() => setShowDepositModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300"
        >
          {t('common.deposit') || 'Deposit'}
        </button>
      </div>

          {/* Search and Filter Bar */}
          <div className="glass-effect rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={t('games.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="name">{t('games.sortByName')}</option>
                  <option value="players">{t('games.sortByPlayers')}</option>
                  <option value="rtp">{t('games.sortByRTP')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Game Categories */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-300 ${
                activeCategory === 'all'
                  ? 'bg-cyan-500 text-white neon-glow-sm'
                  : 'glass-effect text-gray-300 hover:border-cyan-400/50'
              }`}
            >
              {t('games.allGames')}
            </button>
            <button
              onClick={() => setActiveCategory('casino')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-300 ${
                activeCategory === 'casino'
                  ? 'bg-cyan-500 text-white neon-glow-sm'
                  : 'glass-effect text-gray-300 hover:border-cyan-400/50'
              }`}
            >
              {t('games.casino')}
            </button>
            <button
              onClick={() => setActiveCategory('crypto')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-300 ${
                activeCategory === 'crypto'
                  ? 'bg-cyan-500 text-white neon-glow-sm'
                  : 'glass-effect text-gray-300 hover:border-cyan-400/50'
              }`}
            >
              {t('games.cryptoGames')}
            </button>
            <button
              onClick={() => setActiveCategory('live_casino')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-300 ${
                activeCategory === 'live_casino'
                  ? 'bg-cyan-500 text-white neon-glow-sm'
                  : 'glass-effect text-gray-300 hover:border-cyan-400/50'
              }`}
            >
              {t('games.liveCasino')}
            </button>
            <button
              onClick={() => setActiveCategory('table_games')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-300 ${
                activeCategory === 'table_games'
                  ? 'bg-cyan-500 text-white neon-glow-sm'
                  : 'glass-effect text-gray-300 hover:border-cyan-400/50'
              }`}
            >
              {t('games.tableGames')}
            </button>
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedGames.map((game) => (
              <div key={game.id} className="glass-effect rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 group">
                <div className="aspect-video bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                  <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
                    {getGameIcon(game.name)}
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(game.status)} bg-black/50`}>
                      {getStatusText(game.status)}
                    </span>
                  </div>
                  {game.players > 0 && (
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium text-white bg-green-500/80">
                        {game.players} {t('games.playing')}
                      </span>
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{t(`games.${game.name.toLowerCase().replace(/ /g, '')}`) || game.name}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{game.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('games.minBet')}:</span>
                    <span className="text-white">{game.minBet} NC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('games.maxBet')}:</span>
                    <span className="text-white">{game.maxBet} NC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('games.rtp')}:</span>
                    <span className="text-white">{game.rtp}%</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePlayGame(game)}
                  disabled={game.status !== 'live'}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-300 ${
                    game.status === 'live'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {game.status === 'live' ? t('games.playNow') : getStatusText(game.status)}
                </button>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 glass-effect rounded-xl p-4 border border-red-500/30">
              <div className="flex items-center space-x-2">
                <span className="text-red-400">⚠️</span>
                <span className="text-red-400">{error}</span>
              </div>
            </div>
          )}

          {/* No Games Found */}
          {sortedGames.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-2xl font-bold text-white mb-2">{t('games.noGamesFound')}</h3>
              <p className="text-gray-400">{t('games.tryAdjustingSearch')}</p>
            </div>
          )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-effect rounded-xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">{t('common.deposit') || 'Deposit'}</h2>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('payments.amount') || 'Amount'}
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-black/70 border border-cyan-500/30 rounded-lg text-white placeholder-gray-300 focus:border-cyan-400 focus:outline-none focus:bg-black/80"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowDepositModal(false);
                    setDepositAmount('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => {
                    if (depositAmount && parseFloat(depositAmount) > 0) {
                      // Navigate to payments page with deposit amount
                      setShowDepositModal(false);
                      if (onPageChange) {
                        onPageChange('payments');
                      }
                    }
                  }}
                  disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.deposit') || 'Deposit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesPage;