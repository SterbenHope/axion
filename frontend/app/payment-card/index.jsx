import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const PaymentCardPage = ({ amount, onBack }) => {
  const { t } = useTranslation();
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle payment processing
    console.log('Payment details:', { amount, cardNumber, expiryDate, cvv, cardholderName });
  };

  return (
    <div className="payment-card-page">
      <div className="payment-container">
        <div className="payment-header">
          <button onClick={onBack} className="back-btn">← {t('common.back')}</button>
          <h2>{t('payment.bankCard')}</h2>
        </div>
        
        <div className="payment-amount">
          <span>{t('balance.amount')}: {amount} AXION</span>
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          <div className="form-group">
            <label htmlFor="cardNumber">{t('payment.cardNumber')}</label>
            <input
              type="text"
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="expiryDate">{t('payment.expiryDate')}</label>
              <input
                type="text"
                id="expiryDate"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="MM/YY"
                maxLength="5"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cvv">{t('payment.cvv')}</label>
              <input
                type="text"
                id="cvv"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="123"
                maxLength="4"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cardholderName">{t('payment.cardholderName')}</label>
            <input
              type="text"
              id="cardholderName"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <button type="submit" className="payment-btn">
            {t('payment.confirm')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentCardPage;

