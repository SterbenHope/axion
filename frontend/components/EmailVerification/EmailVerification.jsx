import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API_URL } from '../../http';
import './EmailVerification.css';

const EmailVerification = ({ email, onVerified, onBack, onClose }) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    // Start countdown timer
    setTimeLeft(60);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Please enter verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/users/verify-email-code/`, {
        email: email,
        code: code.trim()
      });

      if (response.data.success && response.data.verified) {
        setSuccess('Email verified successfully!');
        setTimeout(() => {
          onVerified();
        }, 1000);
      } else {
        setError(response.data.error || 'Invalid verification code');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/users/send-verification-code/`, {
        email: email
      });

      if (response.data.success) {
        setSuccess('Verification code sent to your email');
        setCanResend(false);
        setTimeLeft(60);
        
        // Start countdown again
        const timer = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              setCanResend(true);
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(response.data.error || 'Failed to send verification code');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send verification code');
    } finally {
      setResendLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="email-verification-overlay" onClick={onClose}>
      <div className="email-verification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="email-verification-header">
          <h2 className="email-verification-title">{t('emailVerification.title', 'Email Verification')}</h2>
          <button className="email-verification-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="7" fill="#8C98A9"/>
            </svg>
          </button>
        </div>

        <div className="email-verification-content">
          <div className="email-verification-info">
            <p className="email-verification-text">
              {t('emailVerification.message', 'We sent a verification code to')} <strong>{email}</strong>
            </p>
            <p className="email-verification-instruction">
              {t('emailVerification.instruction', 'Please enter the 6-digit code below')}
            </p>
          </div>

          <div className="email-verification-form">
            <div className="email-verification-input-group">
              <label className="email-verification-label">
                {t('emailVerification.codeLabel', 'Verification Code')}
              </label>
              <div className="email-verification-input-container">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyPress={handleKeyPress}
                  placeholder="000000"
                  className="email-verification-input"
                  maxLength="6"
                />
              </div>
            </div>

            <div className="email-verification-actions">
              <button
                className="email-verification-verify-btn"
                onClick={handleVerify}
                disabled={loading || !code.trim()}
              >
                {loading ? t('emailVerification.verifying', 'Verifying...') : t('emailVerification.verify', 'Verify')}
              </button>

              <button
                className="email-verification-resend-btn"
                onClick={handleResendCode}
                disabled={resendLoading || !canResend}
              >
                {resendLoading 
                  ? t('emailVerification.sending', 'Sending...') 
                  : canResend 
                    ? t('emailVerification.resend', 'Resend Code')
                    : `${t('emailVerification.resendIn', 'Resend in')} ${timeLeft}s`
                }
              </button>
            </div>

            <div className="email-verification-back">
              <button
                className="email-verification-back-btn"
                onClick={onBack}
              >
                {t('emailVerification.backToRegister', 'Back to Registration')}
              </button>
            </div>
          </div>

          {error && <div className="email-verification-error">{error}</div>}
          {success && <div className="email-verification-success">{success}</div>}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
