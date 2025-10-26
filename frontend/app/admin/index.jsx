import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth/useAuth';
import { useTranslation } from 'react-i18next';
import Header from '../../components/layout/header';
import Footer from '../../components/layout/footer';
import axios from 'axios';
import { API_URL } from '../../http';

const AdminPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    totalGames: 0,
    pendingKYC: 0,
    pendingWithdrawals: 0
  });
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?.is_staff) {
      fetchAdminData();
    }
  }, [isAuthenticated, user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch admin stats
      const statsResponse = await axios.get(`${API_URL}/admin/stats/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(statsResponse.data);

      // Fetch users
      const usersResponse = await axios.get(`${API_URL}/admin/users/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(usersResponse.data);

      // Fetch transactions
      const transactionsResponse = await axios.get(`${API_URL}/admin/transactions/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTransactions(transactionsResponse.data);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError('Failed to load admin data');
      
      // Fallback to mock data if API fails
      setStats({
        totalUsers: 1250,
        activeUsers: 890,
        totalRevenue: 125000,
        totalGames: 15,
        pendingKYC: 45,
        pendingWithdrawals: 23
      });
      setUsers([
        { id: 1, username: 'john_doe', email: 'john@example.com', balance: 125.50, kyc_status: 'verified', join_date: '2023-10-24' },
        { id: 2, username: 'jane_smith', email: 'jane@example.com', balance: 89.25, kyc_status: 'pending', join_date: '2023-10-23' },
        { id: 3, username: 'bob_wilson', email: 'bob@example.com', balance: 250.00, kyc_status: 'verified', join_date: '2023-10-22' },
      ]);
      setTransactions([
        { id: 1, user: 'john_doe', type: 'deposit', amount: 50.00, status: 'completed', date: '2023-10-24' },
        { id: 2, user: 'jane_smith', type: 'withdrawal', amount: 25.00, status: 'pending', date: '2023-10-23' },
        { id: 3, user: 'bob_wilson', type: 'deposit', amount: 100.00, status: 'completed', date: '2023-10-22' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      case 'verified': return 'text-green-400';
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

  if (!user?.is_staff) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
        <Header />
        <main className="pt-20 pb-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-8">{t('admin.accessDenied')}</h1>
            <p className="text-gray-400 mb-8">{t('admin.noPermission')}</p>
            <a href="/dashboard" className="inline-block px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors">
              {t('admin.goToDashboard')}
            </a>
          </div>
        </main>
        <Footer />
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
                <p className="text-white text-lg">Loading admin panel...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-content">
      <h1 className="text-4xl font-bold text-white mb-8">{t('admin.adminPanel')}</h1>
          <p className="text-gray-400 mb-8">{t('admin.manageCasinoPlatform')}</p>
          
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-300 ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500 text-white'
                  : 'glass-effect text-gray-300 hover:border-cyan-400/50'
              }`}
            >
              {t('admin.dashboard')}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-300 ${
                activeTab === 'users'
                  ? 'bg-cyan-500 text-white'
                  : 'glass-effect text-gray-300 hover:border-cyan-400/50'
              }`}
            >
              {t('admin.users')}
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-300 ${
                activeTab === 'transactions'
                  ? 'bg-cyan-500 text-white'
                  : 'glass-effect text-gray-300 hover:border-cyan-400/50'
              }`}
            >
              {t('admin.transactions')}
            </button>
            <button
              onClick={() => setActiveTab('promo')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-300 ${
                activeTab === 'promo'
                  ? 'bg-cyan-500 text-white'
                  : 'glass-effect text-gray-300 hover:border-cyan-400/50'
              }`}
            >
              {t('admin.promoCodes')}
            </button>
            <button
              onClick={() => setActiveTab('games')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-300 ${
                activeTab === 'games'
                  ? 'bg-cyan-500 text-white'
                  : 'glass-effect text-gray-300 hover:border-cyan-400/50'
              }`}
            >
              {t('admin.games')}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-300 ${
                activeTab === 'settings'
                  ? 'bg-cyan-500 text-white'
                  : 'glass-effect text-gray-300 hover:border-cyan-400/50'
              }`}
            >
              {t('admin.settings')}
            </button>
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="glass-effect rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{t('admin.totalUsers')}</p>
                      <p className="text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
                      <p className="text-green-400 text-xs mt-1">+{stats.activeUsers} {t('admin.activeUsers')}</p>
                    </div>
                    <div className="text-4xl">👥</div>
                  </div>
                </div>

                <div className="glass-effect rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{t('admin.totalRevenue')}</p>
                      <p className="text-3xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
                      <p className="text-green-400 text-xs mt-1">+12% {t('admin.thisMonth')}</p>
                    </div>
                    <div className="text-4xl">💰</div>
                  </div>
                </div>

                <div className="glass-effect rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{t('admin.totalGames')}</p>
                      <p className="text-3xl font-bold text-white">{stats.totalGames}</p>
                      <p className="text-blue-400 text-xs mt-1">{t('admin.gamesPlayed')}</p>
                    </div>
                    <div className="text-4xl">🎮</div>
                  </div>
                </div>

                <div className="glass-effect rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{t('admin.pendingKYC')}</p>
                      <p className="text-3xl font-bold text-white">{stats.pendingKYC}</p>
                      <p className="text-yellow-400 text-xs mt-1">{t('admin.needsReview')}</p>
                    </div>
                    <div className="text-4xl">📋</div>
                  </div>
                </div>

                <div className="glass-effect rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{t('admin.pendingWithdrawals')}</p>
                      <p className="text-3xl font-bold text-white">{stats.pendingWithdrawals}</p>
                      <p className="text-red-400 text-xs mt-1">{t('admin.requiresApproval')}</p>
                    </div>
                    <div className="text-4xl">💸</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-effect rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">{t('admin.recentUsers')}</h2>
                  <div className="space-y-3">
                    {users.slice(0, 5).map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                        <div>
                          <span className="text-white font-medium">{user.username}</span>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-green-400 font-bold">${user.balance}</span>
                          <p className="text-gray-400 text-xs">{formatDate(user.join_date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-effect rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">{t('admin.recentTransactions')}</h2>
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map(transaction => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                        <div>
                          <span className="text-white font-medium">{transaction.user}</span>
                          <p className="text-gray-400 text-sm capitalize">{transaction.type}</p>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold ${transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                            {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount}
                          </span>
                          <p className={`text-xs ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="glass-effect rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">{t('admin.userManagement')}</h2>
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                  {t('admin.addUser')}
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">{t('admin.user')}</th>
                      <th className="text-left py-3 px-4 text-gray-300">{t('admin.email')}</th>
                      <th className="text-left py-3 px-4 text-gray-300">{t('admin.balance')}</th>
                      <th className="text-left py-3 px-4 text-gray-300">{t('admin.kycStatus')}</th>
                      <th className="text-left py-3 px-4 text-gray-300">{t('admin.joinDate')}</th>
                      <th className="text-left py-3 px-4 text-gray-300">{t('admin.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-gray-800">
                        <td className="py-3 px-4 text-white">{user.username}</td>
                        <td className="py-3 px-4 text-gray-300">{user.email}</td>
                        <td className="py-3 px-4 text-green-400">${user.balance}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.kyc_status)}`}>
                            {user.kyc_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{formatDate(user.join_date)}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">
                              {t('admin.view')}
                            </button>
                            <button className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors">
                              {t('admin.edit')}
                            </button>
                            <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors">
                              {t('admin.ban')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Other tabs placeholder */}
          {activeTab !== 'dashboard' && activeTab !== 'users' && (
            <div className="glass-effect rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">{t('admin.comingSoon')}</h2>
              <p className="text-gray-400">{t('admin.underDevelopment')}</p>
            </div>
          )}

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

export default AdminPage;