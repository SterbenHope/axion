import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import UserService from '../../services/UserService';
import './AuthDemo.css';

const AuthDemo = () => {
  const { user, loading, error, isAuthenticated, login, register, logout } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);

  const handleLogin = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    await register(email, password);
  };

  const getUsers = async () => {
    try {
      const response = await UserService.fetchUsers();
      setUsers(response.data);
    } catch (error) {
      console.log(error.response?.data?.message);
    }
  };

  if (loading) {
    return <div className="auth-demo-loading">{t('auth.loading')}</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-demo">
        <h1>{t('auth.authentication')}</h1>
        <form className="auth-demo-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-demo-input"
          />
          <input
            type="password"
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-demo-input"
          />
          <div className="auth-demo-buttons">
            <button onClick={handleLogin} className="auth-demo-button">
              {t('auth.login')}
            </button>
            <button onClick={handleRegister} className="auth-demo-button">
              {t('auth.register')}
            </button>
          </div>
        </form>
        {error && <div className="auth-demo-error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="auth-demo">
      <h1>{t('auth.welcomeExclamation')}</h1>
      <div className="auth-demo-user">
        <p>{t('auth.userAuthorized')}: {user.email}</p>
        <p>ID: {user.id}</p>
        <p>{t('auth.activated')}: {user.isActivated ? t('auth.yes') : t('auth.no')}</p>
      </div>
      <button onClick={logout} className="auth-demo-button">
        {t('auth.logout')}
      </button>
      <div className="auth-demo-users">
        <button onClick={getUsers} className="auth-demo-button">
          {t('auth.getUserList')}
        </button>
        {users.length > 0 && (
          <div className="auth-demo-users-list">
            <h3>{t('auth.userList')}:</h3>
            {users.map((u) => (
              <div key={u.id} className="auth-demo-user-item">
                {u.email}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthDemo;

