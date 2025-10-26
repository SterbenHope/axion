import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth/useAuth';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../ui/LanguageSelector';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-cyan-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-white font-bold text-xl">Axion Casino</div>
                <div className="text-cyan-400 text-xs">Premium Gaming</div>
              </div>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/dashboard" className="text-gray-300 hover:text-white transition-colors duration-300 font-medium">
              Dashboard
            </a>
            <a href="/games" className="text-gray-300 hover:text-white transition-colors duration-300 font-medium">
              Games
            </a>
            <a href="/payments" className="text-gray-300 hover:text-white transition-colors duration-300 font-medium">
              Payments
            </a>
            <a href="/promo" className="text-gray-300 hover:text-white transition-colors duration-300 font-medium">
              Promo
            </a>
            <a href="/profile" className="text-gray-300 hover:text-white transition-colors duration-300 font-medium">
              Profile
            </a>
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <LanguageSelector />

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-white text-sm font-medium">
                      {user?.username || user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {Number(user?.balance_neon || 0).toFixed(2)} NC
                    </div>
                  </div>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 16 16" 
                    fill="none"
                    className={`text-gray-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`}
                  >
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-sm border border-cyan-500/30 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-700/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {user?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {user?.username || user?.email?.split('@')[0] || 'User'}
                          </div>
                          <div className="text-gray-400 text-sm">{user?.email}</div>
                          <div className="text-cyan-400 text-sm font-medium">
                            Balance: {Number(user?.balance_neon || 0).toFixed(2)} NC
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <a
                        href="/profile"
                        className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200"
                      >
                        <span className="text-lg">👤</span>
                        <span>Profile</span>
                      </a>
                      <a
                        href="/dashboard"
                        className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200"
                      >
                        <span className="text-lg">📊</span>
                        <span>Dashboard</span>
                      </a>
                      <a
                        href="/payments"
                        className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200"
                      >
                        <span className="text-lg">💳</span>
                        <span>Payments</span>
                      </a>
                      {user?.is_staff && (
                        <a
                          href="/admin"
                          className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200"
                        >
                          <span className="text-lg">⚙️</span>
                          <span>Admin Panel</span>
                        </a>
                      )}
                      <hr className="my-2 border-gray-700/30" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                      >
                        <span className="text-lg">🚪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <a
                  href="/login"
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-300 font-medium"
                >
                  Login
                </a>
                <a
                  href="/register"
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 font-medium"
                >
                  Register
                </a>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors duration-300"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700/30 py-4">
            <nav className="flex flex-col space-y-4">
              <a 
                href="/dashboard" 
                className="text-gray-300 hover:text-white transition-colors duration-300 font-medium px-4 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </a>
              <a 
                href="/games" 
                className="text-gray-300 hover:text-white transition-colors duration-300 font-medium px-4 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Games
              </a>
              <a 
                href="/payments" 
                className="text-gray-300 hover:text-white transition-colors duration-300 font-medium px-4 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Payments
              </a>
              <a 
                href="/promo" 
                className="text-gray-300 hover:text-white transition-colors duration-300 font-medium px-4 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Promo
              </a>
              <a 
                href="/profile" 
                className="text-gray-300 hover:text-white transition-colors duration-300 font-medium px-4 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;