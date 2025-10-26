import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth/useAuth';
import './JackpotPage.css';
import axios from 'axios';
import { API_URL } from '../../http';

const JackpotPage = ({ onRegisterModalOpen, onPageChange }) => {
  const { isAuthenticated } = useAuth();
  const [betAmount, setBetAmount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState(null);
  
  const handlePlay = async () => {
    if (!isAuthenticated) {
      onRegisterModalOpen();
      return;
    }
    
    if (betAmount <= 0) {
      alert('Enter bet amount');
      return;
    }
    
    setIsPlaying(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/games/jackpot/play/`, {
        betAmount: betAmount
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setResult(response.data);
      localStorage.setItem('userBalance', response.data.newBalance.toString());
      
      if (response.data.isWin) {
        alert(`🎉 JACKPOT! You won ${response.data.payout} with multiplier ${response.data.multiplier}x!`);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to play');
    } finally {
      setIsPlaying(false);
    }
  };
  return (
    <div className="jackpot-page">
      <div className="jackpot-background">
        <img src="/images/jackpot-bg-56586a.png" alt="Jackpot Background" />
      </div>
      
      <div className="jackpot-content">
        <div className="jackpot-game-area">
          <div className="jackpot-wheel-container">
            <div className="jackpot-wheel">
              <div className="wheel-background">
                <img src="/images/jackpot-game-bg-56586a.png" alt="Wheel Background" />
              </div>
              <div className="wheel-center">
                <div className="wheel-image">
                  <img src="/images/jackpot-wheel-56586a.png" alt="Wheel" />
                </div>
                <div className="wheel-splash">
                  <img src="/images/wheel-splash.svg" alt="Wheel Splash" />
                  <div className="timer-display">
                    <span className="timer-text">00:00</span>
                    <div className="timer-icon">
                      <img src="/images/timer-icon.svg" alt="Timer" />
                    </div>
                    <span className="timer-value">0</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="jackpot-controls">
              <div className="timer-section">
                <button className="deposit-btn" onClick={() => {
                  if (onPageChange) {
                    onPageChange('payments', 'deposit');
                  } else if (onRegisterModalOpen) {
                    onRegisterModalOpen();
                  }
                }}>Deposit</button>
              </div>
              
              <div className="game-info">
                <p className="game-hash">14a1d8678a7e3e2de0e766fa64db041df8e01e446693301794aad47461899634</p>
                <div className="copy-icon">
                  <img src="/images/copy-icon.svg" alt="Copy" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="jackpot-stats">
            <div className="stats-container">
              <div className="stat-item">
                <div className="stat-background"></div>
                <div className="stat-content">
                  <div className="stat-icon">
                    <img src="/images/stat-icon-1.svg" alt="Stat Icon" />
                  </div>
                  <span className="stat-value">0</span>
                  <span className="stat-label">Total amount</span>
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-background"></div>
                <div className="stat-content">
                  <div className="stat-icon">
                    <img src="/images/stat-icon-2.svg" alt="Stat Icon" />
                  </div>
                  <span className="stat-value">0</span>
                  <span className="stat-label">Players total</span>
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-background"></div>
                <div className="stat-content">
                  <div className="stat-icon">
                    <img src="/images/stat-icon-3-56586a.png" alt="Stat Icon" />
                  </div>
                  <span className="stat-value">0/120</span>
                  <span className="stat-label">Items total</span>
                </div>
              </div>
            </div>
            
            <div className="players-section">
              <div className="players-container">
                <div className="no-players">
                  <span>No players yet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JackpotPage;
