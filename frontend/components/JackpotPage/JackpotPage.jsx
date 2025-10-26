import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth/useAuth';
import './JackpotPage.css';
import axios from 'axios';
import { API_URL } from '../../http';

const JackpotPage = ({ onRegisterModalOpen, onPageChange }) => {
  const { isAuthenticated, updateUserData } = useAuth();
  const [betAmount, setBetAmount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [playersCount, setPlayersCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [fakePlayers, setFakePlayers] = useState([]);
  const [timer, setTimer] = useState(120); // 2 minutes = 120 seconds
  const [gameHash, setGameHash] = useState('');
  
  // Generate random hash function
  const generateRandomHash = () => {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  };
  
  // Countdown timer and game update every 2 minutes
  useEffect(() => {
    const generateFakePlayers = () => {
      const names = ['Player1', 'Player2', 'Player3', 'Player4', 'Player5', 'Player6', 'Player7', 'Player8'];
      const players = Array.from({ length: 8 }, (_, i) => ({
        name: names[i],
        amount: Math.floor(Math.random() * 500) + 50,
        time: 'just now'
      }));
      setFakePlayers(players);
      
      // Random players count between 120 and 430
      const randomPlayers = Math.floor(Math.random() * 311) + 120;
      setPlayersCount(randomPlayers);
      
      // Random total amount between 5000 and 50000
      const randomAmount = Math.floor(Math.random() * 45001) + 5000;
      setTotalAmount(randomAmount);
      
      // Generate new random hash
      setGameHash(generateRandomHash());
    };
    
    generateFakePlayers();
    
    // Countdown timer
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          // Reset timer to 120 seconds and update game data
          generateFakePlayers();
          return 120;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(countdown);
  }, []);
  
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
      
      // Update balance after game completes
      if (updateUserData) {
        updateUserData();
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
                    <span className="timer-text">
                      {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                    </span>
                    <div className="timer-icon">
                      <img src="/images/timer-icon.svg" alt="Timer" />
                    </div>
                    <span className="timer-value">{totalAmount.toLocaleString()}</span>
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
                <p className="game-hash">{gameHash || '14a1d8678a7e3e2de0e766fa64db041df8e01e446693301794aad47461899634'}</p>
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
                  <span className="stat-value">{totalAmount.toLocaleString()}</span>
                  <span className="stat-label">Total amount</span>
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-background"></div>
                <div className="stat-content">
                  <div className="stat-icon">
                    <img src="/images/stat-icon-2.svg" alt="Stat Icon" />
                  </div>
                  <span className="stat-value">{playersCount}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default JackpotPage;
