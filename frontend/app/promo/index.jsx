import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth/useAuth';
import { useTranslation } from 'react-i18next';
import Header from '../../components/layout/header';
import Footer from '../../components/layout/footer';
import axios from 'axios';
import { API_URL } from '../../http';
import './promo.css';

const PromoPage = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [promoCode, setPromoCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemedPromos, setRedeemedPromos] = useState([]);
  const [availablePromos, setAvailablePromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPromoData();
    }
  }, [isAuthenticated]);

  const fetchPromoData = async () => {
    try {
      setLoading(true);
      
      // Fetch redeemed promos (user's redemption history)
      try {
        const redeemedResponse = await axios.get(`${API_URL}/promo/my-promos/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (redeemedResponse.data && Array.isArray(redeemedResponse.data)) {
          setRedeemedPromos(redeemedResponse.data.map(promo => ({
            id: promo.id,
            code: promo.promo_code_code || promo.code,
            amount: promo.bonus_amount,
            redeemed_at: promo.redeemed_at,
            status: promo.status
          })));
        }
      } catch (err) {
        console.warn('Could not fetch redeemed promos:', err);
        setRedeemedPromos([]);
      }

      // Fetch available promos
      try {
        const availableResponse = await axios.get(`${API_URL}/promo/list/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (availableResponse.data && availableResponse.data.available_codes) {
          setAvailablePromos(availableResponse.data.available_codes.map(promo => ({
            id: promo.code,
            code: promo.code,
            name: promo.name,
            description: promo.description || promo.name,
            expires_at: promo.valid_until,
            bonus_amount: promo.bonus_amount,
            bonus_percentage: promo.bonus_percentage,
            free_spins: promo.free_spins
          })));
        }
      } catch (err) {
        console.warn('Could not fetch available promos:', err);
        setAvailablePromos([]);
      }

    } catch (error) {
      console.error('Error fetching promo data:', error);
      setError('Failed to load promo data');
      setRedeemedPromos([]);
      setAvailablePromos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    
    setIsRedeeming(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await axios.post(`${API_URL}/promo/validate/`, {
        code: promoCode.trim().toUpperCase()
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setSuccess(response.data.message || t('promo.redeemedSuccessfully'));
        setPromoCode('');
        
        // Refresh promo data
        await fetchPromoData();
      } else {
        setError(response.data.error || t('promo.failedToRedeem'));
      }
      
    } catch (error) {
      console.error('Error redeeming promo code:', error);
      setError(error.response?.data?.error || t('promo.failedToRedeem'));
    } finally {
      setIsRedeeming(false);
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

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
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
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                <p className="text-white text-lg">Loading promo codes...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="promo-content">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">{t('promo.promoCodes')}</h1>
          
          {/* Redeem Promo Code */}
          <div className="glass-effect rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">{t('promo.redeemPromoCode')}</h2>
            
            <form onSubmit={handleRedeem} className="space-y-6">
              <div>
                <label htmlFor="promoCode" className="block text-sm font-medium text-gray-300 mb-2">
                  {t('promo.promoCode')}
                </label>
                <input
                  type="text"
                  id="promoCode"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder={t('promo.enterPromoCode')}
                  className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isRedeeming || !promoCode.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRedeeming ? t('promo.redeeming') : t('promo.redeemCode')}
              </button>
            </form>

            prompt
            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-red-400">⚠️</span>
                  <span className="text-red-400">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✅</span>
                  <span className="text-green-400">{success}</span>
                </div>
              </div>
            )}
          </div>

          {/* Redeemed Promo Codes */}
          <div className="glass-effect rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Your Redeemed Promo Codes</h2>
            
            {redeemedPromos.length > 0 ? (
              <div className="space-y-4">
                {redeemedPromos.map((promo) => (
                  <div key={promo.id} className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">🎁</div>
                      <div>
                        <span className="font-bold text-white">{promo.code}</span>
                        <p className="text-gray-400 text-sm">
                          Redeemed: {formatDate(promo.redeemed_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-green-400 font-bold">+{promo.amount} NC</span>
                      <p className="text-gray-400 text-sm capitalize">{promo.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">You haven't redeemed any promo codes yet.</p>
            )}
          </div>
    </div>
  );
};

export default PromoPage;