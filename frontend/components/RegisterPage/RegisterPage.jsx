import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import './RegisterPage.css';

const RegisterPage = ({ onClose }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const { register, loading, error } = useAuth();

  useEffect(() => {
    // Check URL parameter ref
    const urlParams = new URLSearchParams(window.location.search);
    const refFromUrl = urlParams.get('ref');
    
    if (refFromUrl) {
      // Save to localStorage
      localStorage.setItem('referralCode', refFromUrl.toUpperCase());
      setReferralCode(refFromUrl.toUpperCase());
    } else {
      // Check localStorage
      const savedRef = localStorage.getItem('referralCode');
      if (savedRef) {
        setReferralCode(savedRef);
      }
    }
  }, []);

  const handleRegister = async () => {
    if (email.trim() && password.trim()) {
      const result = await register(email, password, referralCode || null);
      if (result.success) {
        // Clear referral code after successful registration
        localStorage.removeItem('referralCode');
        onClose();
      }
    }
  };

  const handleDailyCaseOpen = () => {
    console.log('Opening daily case');
    // Logic for opening daily case will be here
  };

  return (
    <div className="register-modal-overlay" onClick={onClose}>
      <div className="register-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-background">
          <img src="/images/free-coins-rain.png" alt={t('register.freeCoinsRain')} />
        </div>
        
        <div className="modal-header">
          <div className="header-content">
            <h2 className="header-title">{t('register.register')}</h2>
          </div>
          <button className="close-button" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="7" fill="#8C98A9"/>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          <div className="form-section">
            <div className="form-input-group">
              <div className="form-header">
                <label className="form-label">{t('register.name')}</label>
              </div>
              
              <div className="input-container">
                <div className="input-background"></div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('register.enterName')}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-input-group">
              <div className="form-header">
                <label className="form-label">{t('auth.email')}</label>
              </div>
              
              <div className="input-container">
                <div className="input-background"></div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('register.enterEmail')}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-input-group">
              <div className="form-header">
                <label className="form-label">{t('auth.password')}</label>
              </div>
              
              <div className="input-container">
                <div className="input-background"></div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('register.enterPassword')}
                  className="form-input"
                />
              </div>
            </div>

            <button className="register-button" onClick={handleRegister} disabled={loading}>
              <span className="register-text">{loading ? t('register.loading') : t('register.register')}</span>
            </button>

            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="features-section">
            <div className="feature-card daily-cases" onClick={handleDailyCaseOpen}>
              <div className="feature-content">
                <div className="feature-text">
                  <h3 className="feature-title">{t('register.dailyCases')}</h3>
                  <p className="feature-description">{t('register.dailyCasesDescription')}</p>
                </div>
                <div className="feature-image">
                  <img src="/images/free-daily-case.png" alt={t('register.dailyCase')} />
                </div>
              </div>
            </div>

            <div className="feature-card flash-codes">
              <div className="feature-content">
                <div className="feature-text">
                  <h3 className="feature-title">{t('register.flashCodes')}</h3>
                  <p className="feature-description">{t('register.flashCodesDescription')}</p>
                </div>
                <div className="social-media">
                  <div className="social-icon">
                    <img src="/images/social-media-1.png" alt={t('register.socialMedia1')} />
                  </div>
                  <div className="social-icon">
                    <img src="/images/social-media-2.png" alt={t('register.socialMedia2')} />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
