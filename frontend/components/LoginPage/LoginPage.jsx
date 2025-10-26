import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './LoginPage.css';

const LoginPage = ({ onClose, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();

  const handleLogin = async () => {
    if (email.trim() && password.trim()) {
      const result = await login(email, password);
      if (result.success) {
        onClose();
      }
    }
  };

  return (
    <div className="register-modal-overlay" onClick={onClose}>
      <div className="register-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <h2 className="header-title">Login</h2>
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
                <label className="form-label">Email</label>
              </div>
              <div className="input-container">
                <div className="input-background"></div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-input-group">
              <div className="form-header">
                <label className="form-label">Password</label>
              </div>
              <div className="input-container">
                <div className="input-background"></div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input"
                />
              </div>
            </div>

            <button className="register-button" onClick={handleLogin} disabled={loading}>
              <span className="register-text">{loading ? 'Loading...' : 'Login'}</span>
            </button>

            {error && <div className="error-message">{error}</div>}

            <div className="switch-auth">
              <span>Don't have an account?</span>
              <button className="link-btn" onClick={onSwitchToRegister}>Register</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;












