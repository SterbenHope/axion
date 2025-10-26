import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth/useAuth';
import { useTranslation } from 'react-i18next';
import Header from '../../components/layout/header';
import Footer from '../../components/layout/footer';
import axios from 'axios';
import { API_URL } from '../../http';

const PaymentsPage = ({ defaultTab = 'deposit', initialAmount = '', onNavigateToCardPayment }) => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  
  // Extended Cryptocurrencies and networks
  const cryptocurrencies = {
    bitcoin: { 
      name: 'Bitcoin', 
      symbol: 'BTC', 
      networks: ['Bitcoin', 'Lightning Network'],
      walletAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
    },
    ethereum: { 
      name: 'Ethereum', 
      symbol: 'ETH', 
      networks: ['Ethereum', 'Polygon', 'BSC', 'Arbitrum', 'Optimism'],
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
    },
    litecoin: { 
      name: 'Litecoin', 
      symbol: 'LTC', 
      networks: ['Litecoin'],
      walletAddress: 'ltc1qfajdqkseee3z8ulh7mqx4fgys7lcex2fcehqj9'
    },
    dogecoin: { 
      name: 'Dogecoin', 
      symbol: 'DOGE', 
      networks: ['Dogecoin'],
      walletAddress: 'DSo5BDFn7VYP1MQPK8ha8DUPUNLZ3wZWZW'
    },
    usdt: { 
      name: 'Tether', 
      symbol: 'USDT', 
      networks: ['Ethereum', 'Tron', 'Polygon', 'BSC'],
      walletAddress: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE'
    },
    usdc: { 
      name: 'USD Coin', 
      symbol: 'USDC', 
      networks: ['Ethereum', 'Polygon', 'BSC'],
      walletAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    },
    binance: {
      name: 'Binance Coin',
      symbol: 'BNB',
      networks: ['BSC', 'BSC Beacon Chain'],
      walletAddress: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52'
    },
    solana: {
      name: 'Solana',
      symbol: 'SOL',
      networks: ['Solana'],
      walletAddress: 'So11111111111111111111111111111111111112'
    },
    cardano: {
      name: 'Cardano',
      symbol: 'ADA',
      networks: ['Cardano'],
      walletAddress: 'addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnjxpzz3k3hsggn3x3xpqp92m8pt'
    },
    ripple: {
      name: 'Ripple',
      symbol: 'XRP',
      networks: ['XRP Ledger'],
      walletAddress: 'rXrpBpGXHbQ9zHqWPNxFqcHLT7XERjMvCy'
    },
    polkadot: {
      name: 'Polkadot',
      symbol: 'DOT',
      networks: ['Polkadot'],
      walletAddress: '1FRMM8PEiWXYax7rpS6X4XZX1aAAxSWx1CrKTyrVYhV24fgq'
    },
    chainlink: {
      name: 'Chainlink',
      symbol: 'LINK',
      networks: ['Ethereum', 'Polygon', 'BSC'],
      walletAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA'
    },
    polygon: {
      name: 'Polygon',
      symbol: 'MATIC',
      networks: ['Polygon', 'Ethereum'],
      walletAddress: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0'
    },
    avalanche: {
      name: 'Avalanche',
      symbol: 'AVAX',
      networks: ['Avalanche'],
      walletAddress: '0xF3F8A60cD2E72f74C275f7D1c7a5C0bdb94De9C8'
    },
    stellar: {
      name: 'Stellar',
      symbol: 'XLM',
      networks: ['Stellar'],
      walletAddress: 'GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A'
    },
    monero: {
      name: 'Monero',
      symbol: 'XMR',
      networks: ['Monero'],
      walletAddress: '49J8Cvkr71pf4o24eXeK9g23wY6oM8PBv48s9KXKb8sNP3'
    }
  };
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [amount, setAmount] = useState(initialAmount);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cryptoType, setCryptoType] = useState('bitcoin');
  const [cryptoNetwork, setCryptoNetwork] = useState('Bitcoin');
  const [walletAddress, setWalletAddress] = useState('');
  const [showCryptoDetails, setShowCryptoDetails] = useState(false);
  const [cryptoTimer, setCryptoTimer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(3600); // 1 hour in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false); // Prevent multiple clicks
  const [notification, setNotification] = useState(null);

  const validateForm = () => {
    const errors = [];
    
    if (!amount || parseFloat(amount) <= 0) {
      errors.push('Please enter a valid amount');
    }
    
    if (paymentMethod === 'card') {
      if (!cardNumber || cardNumber.length < 19) {
        errors.push('Please enter a valid card number');
      }
      if (!expiryDate || expiryDate.length < 5) {
        errors.push('Please enter a valid expiry date');
      }
      if (!cvv || cvv.length < 3) {
        errors.push('Please enter a valid CVV');
      }
      if (!cardholderName) {
        errors.push('Please enter cardholder name');
      }
    }
    
    if (paymentMethod === 'crypto') {
      if (!walletAddress) {
        errors.push('Please enter wallet address');
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Handle withdrawal differently
          if (activeTab === 'withdraw') {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/transactions/withdrawals/`, {
          amount: parseFloat(amount),
          currency: 'EUR',
          payment_method: paymentMethod.toUpperCase(),
          withdrawal_address: walletAddress || cardholderName || '',
          withdrawal_notes: 'Withdrawal request'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Show success notification
        console.log('Withdrawal requested:', response.data);
        setNotification({ type: 'success', message: 'Withdrawal request submitted successfully! Please wait for admin approval.' });
        setTimeout(() => setNotification(null), 5000);
        return;
      } catch (error) {
        console.error('Withdrawal error:', error);
        setNotification({ type: 'error', message: error.response?.data?.error || 'Failed to submit withdrawal request' });
        setTimeout(() => setNotification(null), 5000);
        return;
      }
    }
    
    // For crypto payments, show details first if not shown yet
    if (paymentMethod === 'crypto' && !showCryptoDetails) {
      setShowCryptoDetails(true);
      return;
    }
    
    const errors = validateForm();
    if (errors.length > 0) {
      // HTML5 validation will show errors automatically
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const paymentData = {
        amount: parseFloat(amount),
        method: paymentMethod,
        type: activeTab
      };
      
      if (paymentMethod === 'card') {
        paymentData.cardData = {
          number: cardNumber,
          expiry: expiryDate,
          cvv: cvv,
          name: cardholderName
        };
      } else if (paymentMethod === 'crypto') {
        paymentData.cryptoData = {
          type: cryptoType,
          network: cryptoNetwork,
          address: cryptocurrencies[cryptoType]?.walletAddress
        };
      }
      
      // Call API to process the payment
      console.log('Processing payment:', paymentData);
      
      const token = localStorage.getItem('token');
      let response;
      if (paymentMethod === 'card') {
        response = await axios.post('/api/payments/create-card-payment', {
          amount: parseFloat(amount),
          card_holder: cardholderName,
          card_number: cardNumber.replace(/\s/g, ''),
          card_expiry: expiryDate,
          card_cvv: cvv
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else if (paymentMethod === 'crypto') {
        response = await axios.post('/api/payments/create-crypto-payment', {
          amount: parseFloat(amount),
          crypto_type: cryptoType,
          crypto_network: cryptoNetwork,
          wallet_address: walletAddress
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else if (paymentMethod === 'bank') {
        response = await axios.post('/api/payments/create-bank-payment', {
          amount: parseFloat(amount)
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      console.log('Payment response:', response.data);
      
      // Save payment ID to sessionStorage for crypto payments
      if (paymentMethod === 'crypto') {
        sessionStorage.setItem('crypto_payment_id', response.data.payment_id);
      }
      
      // Redirect to card payment processing page for all payment methods
      if (onNavigateToCardPayment) {
        onNavigateToCardPayment(response.data.payment_id);
      } else {
        window.location.href = `/card-payment?payment_id=${response.data.payment_id}`;
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      // Show error notification - don't redirect
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-white">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payments-content">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">{t('payments.payments')}</h1>
          
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="glass-effect rounded-lg p-1">
              <button
                onClick={() => setActiveTab('deposit')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'deposit'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {t('payments.depositFunds')}
              </button>
              <button
                onClick={() => setActiveTab('withdraw')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'withdraw'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {t('payments.withdrawFunds')}
              </button>
            </div>
          </div>

          {/* Payment Form */}
          <div className="glass-effect rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Input */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
                  {t('payments.enterAmount')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-white/90 border border-cyan-500/30 rounded-lg text-black placeholder-black focus:border-cyan-400 focus:outline-none focus:bg-white"
                    required
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">AXION</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  {activeTab === 'deposit' ? t('payments.paymentMethod') : t('payments.withdrawalMethod')}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Bank Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      paymentMethod === 'card'
                        ? 'border-cyan-500 bg-cyan-500/20'
                        : 'border-gray-600 hover:border-cyan-400/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">💳</div>
                      <h3 className="text-white font-medium">{t('payments.bankCard')}</h3>
                      <p className="text-gray-400 text-sm mt-1">{t('payments.cardDescription')}</p>
                      <div className="mt-2 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-xs">
                        Commission: 1%
                      </div>
                    </div>
                  </button>

                  {/* Cryptocurrency */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('crypto')}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      paymentMethod === 'crypto'
                        ? 'border-cyan-500 bg-cyan-500/20'
                        : 'border-gray-600 hover:border-cyan-400/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">₿</div>
                      <h3 className="text-white font-medium">{t('payments.cryptocurrency')}</h3>
                      <p className="text-gray-400 text-sm mt-1">{t('payments.cryptoDescription')}</p>
                      <div className="mt-2 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-green-400 text-xs">
                        Bonus: +25%
                      </div>
                    </div>
                  </button>

                  {/* Bank Transfer */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      paymentMethod === 'bank'
                        ? 'border-cyan-500 bg-cyan-500/20'
                        : 'border-gray-600 hover:border-cyan-400/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">🏦</div>
                      <h3 className="text-white font-medium">{t('payments.bankTransfer')}</h3>
                      <p className="text-gray-400 text-sm mt-1">{t('payments.bankDescription')}</p>
                      <div className="mt-2 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-400 text-xs">
                        No fees
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Payment Method Specific Fields */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-300 mb-2">
                        {t('payment.cardNumber')}
                      </label>
                      <input
                        type="text"
                        id="cardNumber"
                        value={cardNumber}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
                          let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                          if (formattedValue.length <= 19) {
                            setCardNumber(formattedValue);
                          }
                        }}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        className="w-full px-4 py-3 bg-white/90 border border-cyan-500/30 rounded-lg text-black placeholder-black focus:border-cyan-400 focus:outline-none focus:bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-300 mb-2">
                        {t('payment.expiryDate')}
                      </label>
                      <input
                        type="text"
                        id="expiryDate"
                        value={expiryDate}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length >= 2) {
                            value = value.substring(0, 2) + '/' + value.substring(2, 4);
                          }
                          if (value.length <= 5) {
                            setExpiryDate(value);
                          }
                        }}
                        placeholder="MM/YY"
                        maxLength="5"
                        className="w-full px-4 py-3 bg-white/90 border border-cyan-500/30 rounded-lg text-black placeholder-black focus:border-cyan-400 focus:outline-none focus:bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium text-gray-300 mb-2">
                        {t('payment.cvv')}
                      </label>
                      <input
                        type="text"
                        id="cvv"
                        value={cvv}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 4) {
                            setCvv(value);
                          }
                        }}
                        placeholder="123"
                        maxLength="4"
                        className="w-full px-4 py-3 bg-white/90 border border-cyan-500/30 rounded-lg text-black placeholder-black focus:border-cyan-400 focus:outline-none focus:bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-300 mb-2">
                        {t('payment.cardholderName')}
                      </label>
                      <input
                        type="text"
                        id="cardholderName"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 bg-white/90 border border-cyan-500/30 rounded-lg text-black placeholder-black focus:border-cyan-400 focus:outline-none focus:bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'crypto' && !showCryptoDetails && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="cryptoType" className="block text-sm font-medium text-gray-300 mb-2">
                      {t('payments.selectCryptocurrency')}
                    </label>
                    <select
                      id="cryptoType"
                      value={cryptoType}
                      onChange={(e) => {
                        setCryptoType(e.target.value);
                        setCryptoNetwork(cryptocurrencies[e.target.value].networks[0]);
                      }}
                      className="w-full px-4 py-3 bg-black/70 border border-cyan-500/30 rounded-lg text-white focus:border-cyan-400 focus:outline-none focus:bg-black/80"
                    >
                      {Object.entries(cryptocurrencies).map(([key, crypto]) => (
                        <option key={key} value={key}>
                          {crypto.name} ({crypto.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="cryptoNetwork" className="block text-sm font-medium text-gray-300 mb-2">
                      {t('payments.selectNetwork')}
                    </label>
                    <select
                      id="cryptoNetwork"
                      value={cryptoNetwork}
                      onChange={(e) => setCryptoNetwork(e.target.value)}
                      className="w-full px-4 py-3 bg-black/70 border border-cyan-500/30 rounded-lg text-white focus:border-cyan-400 focus:outline-none focus:bg-black/80"
                    >
                      {cryptocurrencies[cryptoType]?.networks.map((network) => (
                        <option key={network} value={network}>
                          {network.charAt(0).toUpperCase() + network.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-green-400">
                      <span className="text-lg">🎁</span>
                      <span className="font-medium">Crypto Bonus: +25% to your deposit!</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      When you deposit with cryptocurrency, you get an extra 25% bonus added to your account.
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === 'crypto' && showCryptoDetails && (
                <div className="space-y-4">
                  <div className="glass-effect rounded-xl p-6 border border-cyan-500/30">
                    <h3 className="text-xl font-bold text-white mb-4">📧 Crypto Payment Details</h3>
                    
                    {/* Wallet Address Display */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Send exactly <span className="text-cyan-400 font-bold">{amount} {cryptocurrencies[cryptoType]?.symbol}</span> to:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={cryptocurrencies[cryptoType]?.walletAddress}
                          className="flex-1 px-4 py-3 bg-black/70 border border-cyan-500/30 rounded-lg text-white font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(cryptocurrencies[cryptoType]?.walletAddress)}
                          className="px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                        >
                          📋 Copy
                        </button>
                      </div>
                    </div>

                    {/* Network Info */}
                    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 text-sm">
                        ⚠️ Network: <span className="font-bold">{cryptoNetwork}</span> - Make sure you're using the correct network!
                      </p>
                    </div>

                    {/* Timer */}
                    {timeRemaining > 0 && (
                      <div className="text-center mb-4">
                        <div className="text-2xl font-bold text-white mb-2">
                          {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                        </div>
                        <p className="text-gray-400 text-sm">Time remaining to complete payment</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCryptoDetails(false);
                          // Cancel payment - set status to cancelled
                        }}
                        className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg font-medium transition-colors"
                      >
                        Cancel Payment
                      </button>
                      <button
                        type="button"
                        disabled={isTimerRunning}
                        onClick={async () => {
                          // Prevent multiple clicks
                          if (isTimerRunning) return;
                          
                          setIsTimerRunning(true);
                          
                          // Only start timer if not already running
                          if (cryptoTimer) {
                            clearInterval(cryptoTimer);
                          }
                          
                          // Start timer with 1 hour (3600 seconds)
                          // Timer decreases by 1 minute every second for 60 minutes
                          let totalSeconds = 3600;
                          const interval = setInterval(() => {
                            setTimeRemaining(totalSeconds);
                            totalSeconds -= 60; // Decrease by 1 minute per second
                            if (totalSeconds <= 0) {
                              clearInterval(interval);
                              setCryptoTimer(null);
                              setIsTimerRunning(false);
                              setTimeRemaining(0);
                            }
                          }, 1000); // Update every 1 second, but decrease by 1 minute
                          setCryptoTimer(interval);
                          
                          // Send notification to backend
                          try {
                            const token = localStorage.getItem('token');
                            await axios.post(`${API_URL}/payments/crypto-payment-sent/`, {
                              payment_id: sessionStorage.getItem('crypto_payment_id'),
                              crypto_type: cryptoType,
                              amount: parseFloat(amount)
                            }, {
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              }
                            });
                          } catch (error) {
                            console.error('Failed to notify backend:', error);
                          }
                        }}
                        className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        I've Sent Payment
                      </button>
                    </div>

                    {/* Processing Status */}
                    {timeRemaining < 3600 && timeRemaining > 0 && (
                      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          <p className="text-blue-400 text-sm">
                            Waiting for payment confirmation... This may take a few minutes.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {paymentMethod === 'bank' && (
                <div className="space-y-4">
                  <div className="glass-effect rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">Bank Transfer Instructions</h3>
                    <p className="text-gray-400 text-sm">
                      {t('payments.bankTransferInstructions')}
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      {t('payments.contactSupportForDetails')}
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'deposit'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessing ? t('payments.processing') : t('payments.proceedToPayment')}
              </button>
              
              {/* Notification Banner */}
              {notification && (
                <div 
                  className={`mt-4 p-4 rounded-lg border ${
                    notification.type === 'success' 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : notification.type === 'error'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-blue-500/10 border-blue-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {notification.type === 'success' && <span className="text-green-400 text-xl">✅</span>}
                    {notification.type === 'error' && <span className="text-red-400 text-xl">❌</span>}
                    {notification.type === 'loading' && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>}
                    <p className={notification.type === 'success' ? 'text-green-400' : notification.type === 'error' ? 'text-red-400' : 'text-blue-400'}>
                      {notification.message}
                    </p>
                  </div>
                </div>
              )}
            </form>
          </div>
    </div>
  );
};

export default PaymentsPage;

