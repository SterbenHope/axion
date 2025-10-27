import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = ({ onPageChange }) => {
  const { t, i18n } = useTranslation();

  const handleFaqClick = (e) => {
    e.preventDefault();
    if (onPageChange) {
      onPageChange('faq');
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="footer-title">{t('footer.about')}</h3>
          <ul className="footer-links">
            <li>
              <Link to="/" onClick={handleFaqClick}>
                {t('footer.faq')}
              </Link>
            </li>
            <li>
              <a href="/terms" target="_blank" rel="noopener noreferrer">
                {t('footer.terms')}
              </a>
            </li>
            <li>
              <a href="/privacy" target="_blank" rel="noopener noreferrer">
                {t('footer.privacy')}
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">{t('footer.contact')}</h3>
          <ul className="footer-links">
            <li>
              <a href="mailto:support@axion-play.su">
                <span className="footer-icon">📧</span> support@axion-play.su
              </a>
            </li>
            <li>
              <a href="https://t.me/axionsupport" target="_blank" rel="noopener noreferrer">
                <span className="footer-icon">💬</span> {t('footer.telegram')}
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">{t('footer.games')}</h3>
          <ul className="footer-links">
            <li>
              <a href="#plinko">Plinko</a>
            </li>
            <li>
              <a href="#wheel">Wheel</a>
            </li>
            <li>
              <a href="#jackpot">Jackpot</a>
            </li>
            <li>
              <a href="#mines">Mines</a>
            </li>
            <li>
              <a href="#coinflip">Coinflip</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          © {new Date().getFullYear()} Axion. {t('footer.rightsReserved')}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
