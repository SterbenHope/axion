import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const DepositPage = ({ onProceedToPayment }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount && parseFloat(amount) > 0) {
      onProceedToPayment(amount);
    }
  };

  return (
    <div className="deposit-page">
      <div className="deposit-container">
        <h2>{t('balance.deposit')}</h2>
        <form onSubmit={handleSubmit} className="deposit-form">
          <div className="form-group">
            <label htmlFor="amount">{t('balance.amount')}</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
            />
          </div>
          <button type="submit" className="deposit-btn">
            {t('balance.deposit')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DepositPage;

