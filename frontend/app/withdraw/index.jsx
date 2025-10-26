import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const WithdrawPage = () => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount && parseFloat(amount) > 0) {
      // Handle withdrawal logic
      console.log('Withdraw amount:', amount);
    }
  };

  return (
    <div className="withdraw-page">
      <div className="withdraw-container">
        <h2>{t('balance.withdraw')}</h2>
        <form onSubmit={handleSubmit} className="withdraw-form">
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
          <button type="submit" className="withdraw-btn">
            {t('balance.withdraw')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WithdrawPage;

