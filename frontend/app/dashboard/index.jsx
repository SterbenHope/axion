import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth/useAuth';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API_URL } from '../../http';
import './dashboard.css';

const DashboardPage = ({ onPageChange }) => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    balance: 0,
    totalWins: 0,
    totalLosses: 0,
    gamesPlayed: 0,
    winRate: 0,
    totalDeposits: 0,
    totalWithdrawals: 0
  });
  const [recentGames, setRecentGames] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initial load only
      fetchDashboardData(false);
    }
  }, [isAuthenticated, user]);

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      
      // Fetch dashboard data from backend
      const response = await axios.get(`${API_URL}/dashboard/data/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const data = response.data;
      
      // Set stats from API
      setStats({
        balance: data.user?.balance_neon || 0,
        totalWins: data.financial?.total_deposits || 0,
        totalLosses: data.financial?.total_withdrawals || 0,
        gamesPlayed: 0, // Will be fetched from games API
        winRate: 0, // Will be calculated from games
        totalDeposits: data.financial?.total_deposits || 0,
        totalWithdrawals: data.financial?.total_withdrawals || 0
      });

      // Fetch recent games
      try {
        const gamesResponse = await axios.get(`${API_URL}/games/list/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const games = gamesResponse.data.results || gamesResponse.data || [];
        setRecentGames(games.slice(0, 5));
      } catch (gamesError) {
        console.error('Error fetching games:', gamesError);
        setRecentGames([]);
      }

      // Set recent transactions from payments
      const payments = data.recent_activity?.payments || [];
      setRecentTransactions(payments.slice(0, 5).map(payment => ({
        id: payment.id,
        type: payment.amount > 0 ? 'Deposit' : 'Withdrawal',
        amount: Math.abs(parseFloat(payment.amount)),
        status: payment.status,
        date: payment.created_at,
        method: payment.payment_method
      })));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      setRecentGames([]);
      setRecentTransactions([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'text-green-400';
      case 'Pending': return 'text-yellow-400';
      case 'Failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'Win': return 'text-green-400';
      case 'Loss': return 'text-red-400';
      default: return 'text-gray-400';
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

  // Don't show loading screen after initial load to avoid flickering
  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
  //       <div className="flex items-center justify-center min-h-screen">
  //         <div className="text-center">
  //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
  //           <p className="text-white text-lg">Loading dashboard...</p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="dashboard-content">
            <div className="dashboard-header">
              <h1 className="text-4xl font-bold text-white mb-2">Welcome, {user?.username || user?.email}</h1>
              <p className="text-gray-400">{t('dashboard.hereYourGamingOverview')}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="glass-effect rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{t('dashboard.balance')}</p>
                        <p className="text-3xl font-bold text-white">{(stats.balance || 0).toFixed(2)} AXION</p>
                    <p className="text-green-400 text-xs mt-1">≈ ${((stats.balance || 0) * 1.0).toFixed(2)} USD</p>
                  </div>
                  <div className="text-4xl">💰</div>
                </div>
              </div>

              <div className="glass-effect rounded-xl p-6 hover:border-green-400/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{t('dashboard.totalWins')}</p>
                    <p className="text-3xl font-bold text-white">{stats.totalWins}</p>
                        <p className="text-green-400 text-xs mt-1">+{stats.totalWins * 10} AXION earned</p>
                  </div>
                  <div className="text-4xl">🏆</div>
                </div>
              </div>

              <div className="glass-effect rounded-xl p-6 hover:border-purple-400/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{t('dashboard.winRate')}</p>
                    <p className="text-3xl font-bold text-white">{stats.winRate}%</p>
                    <p className="text-purple-400 text-xs mt-1">Based on {stats.gamesPlayed} games</p>
                  </div>
                  <div className="text-4xl">📊</div>
                </div>
              </div>

              <div className="glass-effect rounded-xl p-6 hover:border-orange-400/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{t('dashboard.gamesPlayed')}</p>
                    <p className="text-3xl font-bold text-white">{stats.gamesPlayed}</p>
                    <p className="text-orange-400 text-xs mt-1">Total games</p>
                  </div>
                  <div className="text-4xl">🎮</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-effect rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('dashboard.quickActions')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => onPageChange && onPageChange('payments', 'deposit')} 
                  className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <span className="mr-2">💰</span>
                  {t('dashboard.deposit')}
                </button>
                <button 
                  onClick={() => onPageChange && onPageChange('payments', 'withdraw')} 
                  className="flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  <span className="mr-2">💸</span>
                  {t('dashboard.withdraw')}
                </button>
                <button 
                  onClick={() => onPageChange && onPageChange('main')} 
                  className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <span className="mr-2">🎮</span>
                  {t('dashboard.playGames')}
                </button>
                <button 
                  onClick={() => onPageChange && onPageChange('promo')} 
                  className="flex items-center justify-center px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
                >
                  <span className="mr-2">🎁</span>
                  {t('dashboard.promoCodes')}
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-effect rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">{t('dashboard.recentGames')}</h2>
                {recentGames.length > 0 ? (
                  <ul className="space-y-3">
                    {recentGames.map(game => (
                      <li key={game.id} className="flex justify-between items-center text-gray-300 hover:text-white transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">🎮</span>
                          <div>
                            <span className="font-medium">{game.game || 'Unknown Game'}</span>
                            <span className="text-sm text-gray-400 ml-2">{game.date ? formatDate(game.date) : 'N/A'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold ${getResultColor(game.result)}`}>
                              {game.result === 'Win' ? '+' : '-'}{(game.amount || 0).toFixed(2)} AXION
                          </span>
                          {game.multiplier > 0 && (
                            <div className="text-xs text-gray-400">x{game.multiplier}</div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No recent games played.</p>
                )}
                <a href="/games" className="block text-center mt-4 text-cyan-400 hover:text-cyan-300 transition-colors">
                  {t('dashboard.viewAll')} →
                </a>
              </div>

              <div className="glass-effect rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">{t('dashboard.recentTransactions')}</h2>
                {recentTransactions.length > 0 ? (
                  <ul className="space-y-3">
                    {recentTransactions.map(transaction => (
                      <li key={transaction.id} className="flex justify-between items-center text-gray-300 hover:text-white transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {transaction.type === 'Deposit' ? '💰' : '💸'}
                          </span>
                          <div>
                            <span className="font-medium">{transaction.type || 'Transaction'}</span>
                            <span className="text-sm text-gray-400 ml-2">{transaction.date ? formatDate(transaction.date) : 'N/A'}</span>
                            <div className="text-xs text-gray-500">{transaction.method || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold ${transaction.type === 'Deposit' ? 'text-green-400' : 'text-red-400'}`}>
                              {transaction.type === 'Deposit' ? '+' : '-'}{(transaction.amount || 0).toFixed(2)} AXION
                          </span>
                          <div className={`text-xs ${getStatusColor(transaction.status)}`}>
                            {transaction.status || 'Unknown'}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No recent transactions.</p>
                )}
                <a href="/payments" className="block text-center mt-4 text-cyan-400 hover:text-cyan-300 transition-colors">
                  {t('dashboard.viewAll')} →
                </a>
              </div>
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
    </div>
  );
};

export default DashboardPage;