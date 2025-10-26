import React from 'react';
import { useTranslation } from 'react-i18next';
import './PaymentNotification.css';
import Modal from '../Modal/Modal';

const PaymentNotification = ({ isOpen, onClose, success, message, transactionId }) => {
  const { t } = useTranslation();
  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} size="small">
      <div className="payment-notification">
        <div className={`notification-icon ${success ? 'success' : 'error'}`}>
          {success ? (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
              <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
              <path d="M8 8L16 16M16 8L8 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        <div className="notification-content">
          <h2 className="notification-title">
            {success ? t('payment.paymentConfirmed') : t('payment.paymentCancelled')}
          </h2>
          <p className="notification-message">{message}</p>
          
          {transactionId && (
            <div className="transaction-info">
              <span className="transaction-label">{t('payment.transactionId')}:</span>
              <span className="transaction-id">{transactionId}</span>
            </div>
          )}
        </div>

        <button 
          className={`notification-button ${success ? 'success' : 'error'}`}
          onClick={onClose}
        >
          {t('payment.ok')}
        </button>
      </div>
    </Modal>
  );
};

export default PaymentNotification;

