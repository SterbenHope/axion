import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth/useAuth';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API_URL } from '../../http';
import KYCForm from '../../components/profile/kyc-form';
import './profile.css';

const ProfilePage = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [preferences, setPreferences] = useState({
    push_notifications: true,
    email_marketing: false,
    language: 'en',
    currency: 'USD'
  });
  const [gameHistory, setGameHistory] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || ''
      });
      setPreferences({
        push_notifications: user.push_notifications !== false,
        email_marketing: user.email_marketing === true,
        language: user.language || 'en',
        currency: user.currency || 'USD'
      });
    }
  }, [user]);

  // Load game history
  useEffect(() => {
    const fetchGameHistory = async () => {
      if (!user) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/games/history/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data) {
          // Response is a list of GameRound objects
          setGameHistory(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error('Failed to load game history:', error);
      }
    };
    
    if (isAuthenticated) {
      fetchGameHistory();
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/users/profile/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess(t('profile.success') || 'Profile updated successfully');
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || t('profile.error') || 'Failed to update profile');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError(t('profile.passwordMismatch') || 'Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/users/change-password/`,
        passwordData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess(t('profile.passwordSuccess') || 'Password changed successfully');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || t('profile.passwordError') || 'Failed to change password');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesChange = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/users/preferences/`,
        preferences,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess(t('profile.preferencesSuccess') || 'Preferences updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || t('profile.preferencesError') || 'Failed to update preferences');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="glass-effect rounded-xl p-8 text-center">
          <p className="text-white text-xl">{t('profile.loginRequired') || 'Please log in to view your profile'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">{t('profile.title') || 'Profile'}</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-200">
            {success}
          </div>
        )}

        <div className="profile-content glass-effect rounded-xl p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">{t('profile.info') || 'Personal Information'}</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
              >
                {t('profile.edit') || 'Edit'}
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white mb-2">{t('profile.firstName') || 'First Name'}</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-white mb-2">{t('profile.lastName') || 'Last Name'}</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-white mb-2">{t('profile.email') || 'Email'}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-white mb-2">{t('profile.phone') || 'Phone Number'}</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>

            {isEditing && (
              <div className="mt-8 flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? t('profile.saving') || 'Saving...' : t('profile.save') || 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setError(null);
                  }}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {t('profile.cancel') || 'Cancel'}
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="profile-content glass-effect rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-8">{t('profile.password') || 'Change Password'}</h2>
          
          <form onSubmit={handlePasswordChange}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-white mb-2">{t('profile.currentPassword') || 'Current Password'}</label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white mb-2">{t('profile.newPassword') || 'New Password'}</label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white mb-2">{t('profile.confirmPassword') || 'Confirm Password'}</label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? t('profile.saving') || 'Saving...' : t('profile.updatePassword') || 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        <div className="profile-content glass-effect rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-8">{t('profile.preferences') || 'Preferences'}</h2>
          
          <div className="space-y-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="push_notifications"
                checked={preferences.push_notifications}
                onChange={(e) => setPreferences({ ...preferences, push_notifications: e.target.checked })}
                className="w-5 h-5 text-cyan-500 bg-black/50 border-cyan-500/30 rounded focus:ring-cyan-500"
              />
              <label htmlFor="push_notifications" className="ml-3 text-white">
                {t('profile.pushNotifications') || 'Push Notifications'}
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="email_marketing"
                checked={preferences.email_marketing}
                onChange={(e) => setPreferences({ ...preferences, email_marketing: e.target.checked })}
                className="w-5 h-5 text-cyan-500 bg-black/50 border-cyan-500/30 rounded focus:ring-cyan-500"
              />
              <label htmlFor="email_marketing" className="ml-3 text-white">
                {t('profile.emailMarketing') || 'Email Marketing'}
              </label>
            </div>

            <div>
              <label className="block text-white mb-2">{t('profile.language') || 'Language'}</label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                className="w-full md:w-64 px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
              </select>
            </div>

            <div>
              <label className="block text-white mb-2">{t('profile.currency') || 'Currency'}</label>
              <select
                value={preferences.currency}
                onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                className="w-full md:w-64 px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="AXION">AXION</option>
              </select>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handlePreferencesChange}
              disabled={loading}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? t('profile.saving') || 'Saving...' : t('profile.savePreferences') || 'Save Preferences'}
            </button>
          </div>
        </div>

        <div id="kyc-form-section" className="profile-content glass-effect rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-8">{t('profile.kycVerification') || 'KYC Verification'}</h2>
          <KYCForm kycStatus={user?.kyc_status} />
        </div>

        {/* Game History */}
        <div className="profile-content glass-effect rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-8">{t('profile.gameHistory') || 'Game History'}</h2>
          
          {gameHistory.length === 0 ? (
            <p className="text-gray-400 text-center py-8">{t('profile.noGameHistory') || 'No game history yet'}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-cyan-500/30">
                    <th className="pb-3 text-white font-semibold">{t('profile.game') || 'Game'}</th>
                    <th className="pb-3 text-white font-semibold">{t('profile.bet') || 'Bet'}</th>
                    <th className="pb-3 text-white font-semibold">{t('profile.win') || 'Win'}</th>
                    <th className="pb-3 text-white font-semibold">{t('profile.multiplier') || 'Multiplier'}</th>
                    <th className="pb-3 text-white font-semibold">{t('profile.date') || 'Date'}</th>
                  </tr>
                </thead>
                <tbody>
                  {gameHistory.map((game) => (
                    <tr key={game.id} className="border-b border-cyan-500/10 hover:bg-cyan-500/5">
                      <td className="py-3 text-white">
                        {game.game === 'WHEEL' ? '🎰 Wheel' : 
                         game.game === 'PLINKO' ? '🎯 Plinko' :
                         game.game === 'MINES' ? '💣 Mines' :
                         game.game === 'COINFLIP' ? '🪙 Coinflip' :
                         game.game === 'JACKPOT' ? '🎁 Jackpot' : game.game || 'Game'}
                      </td>
                      <td className="py-3 text-white">{game.bet_amount || game.betAmount || 0}</td>
                      <td className={`py-3 ${game.win_amount && game.win_amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {game.win_amount || 0}
                      </td>
                      <td className="py-3 text-yellow-400">
                        {game.result_data?.multiplier ? `${game.result_data.multiplier}x` : 
                         game.multiplier ? `${game.multiplier}x` : '-'}
                      </td>
                      <td className="py-3 text-gray-400 text-sm">
                        {new Date(game.created_at || game.date).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  );
};

export default ProfilePage;
