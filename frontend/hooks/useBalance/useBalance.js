import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../lib/api/client';
import { useWebSocket } from '../useWebSocket';
import { WS_EVENTS } from '../../lib/constants';

export const useBalance = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const wsUrl = import.meta.env.VITE_WS_URL;
  const token = localStorage.getItem('auth_token');
  const { subscribe } = useWebSocket(wsUrl, token);

  // Load initial balance
  const loadBalance = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getBalance();
      setBalance(data.balance);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load transactions
  const loadTransactions = useCallback(async (page = 1, limit = 20) => {
    try {
      setTransactionsLoading(true);
      const data = await apiClient.getTransactions(page, limit);
      if (page === 1) {
        setTransactions(data.transactions);
      } else {
        setTransactions(prev => [...prev, ...data.transactions]);
      }
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  // Deposit money
  const deposit = useCallback(async (amount, paymentMethod) => {
    try {
      const result = await apiClient.deposit(amount, paymentMethod);
      await loadBalance(); // Refresh balance
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [loadBalance]);

  // Withdraw money
  const withdraw = useCallback(async (amount, withdrawMethod) => {
    try {
      const result = await apiClient.withdraw(amount, withdrawMethod);
      await loadBalance(); // Refresh balance
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [loadBalance]);

  useEffect(() => {
    loadBalance();
    loadTransactions();
  }, [loadBalance, loadTransactions]);

  useEffect(() => {
    // Subscribe to real-time balance updates
    const unsubscribeBalance = subscribe(WS_EVENTS.BALANCE_UPDATE, (data) => {
      setBalance(data.balance);
    });

    // Subscribe to transaction updates
    const unsubscribeTransactions = subscribe(WS_EVENTS.TRANSACTION_UPDATE, (data) => {
      setTransactions(prev => [data.transaction, ...prev]);
    });

    return () => {
      unsubscribeBalance();
      unsubscribeTransactions();
    };
  }, [subscribe]);

  const refreshBalance = useCallback(() => {
    loadBalance();
  }, [loadBalance]);

  const refreshTransactions = useCallback(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    balance,
    loading,
    error,
    transactions,
    transactionsLoading,
    deposit,
    withdraw,
    loadTransactions,
    refreshBalance,
    refreshTransactions,
    clearError: () => setError(null),
  };
};


