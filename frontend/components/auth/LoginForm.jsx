import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import './AuthForms.css';

const LoginForm = ({ onSubmit, isLoading = false }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-form-header">
        <h2>{t('auth.casinoLogin')}</h2>
        <p>{t('auth.welcomeBack')}</p>
      </div>
      
      <div className="form-group">
        <label htmlFor="email">{t('auth.email')}</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="form-input"
          placeholder="your@email.com"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">{t('auth.password')}</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="form-input"
          placeholder="••••••••"
        />
      </div>

      <div className="form-actions">
        <Button 
          type="submit" 
          variant="primary" 
          size="large"
          disabled={isLoading}
          className="auth-submit-btn"
        >
          {isLoading ? t('auth.loggingIn') : t('auth.login')}
        </Button>
      </div>

      <div className="auth-links">
        <a href="/register" className="auth-link">
          {t('auth.noAccount')}
        </a>
      </div>
    </form>
  );
};

export default LoginForm;


