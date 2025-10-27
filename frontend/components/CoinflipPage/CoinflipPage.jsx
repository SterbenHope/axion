import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth/useAuth';
import './CoinflipPage.css';
import axios from 'axios';
import { API_URL } from '../../http';

const CoinflipPage = ({ onRegisterModalOpen, onPageChange }) => {
  const { isAuthenticated, updateUserData } = useAuth();
  const [betAmount, setBetAmount] = useState(0);
  const [choice, setChoice] = useState('heads');
  const [result, setResult] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeGames, setActiveGames] = useState([
    { id: 1, player1: 'user-avatar1-56586a.jpg', player2: 'user-avatar2-56586a.jpg', type: 'double down', coin: 'redcoin-1a42d3cf.svg', amount: 745.91 },
    { id: 2, player1: 'user-avatar3-56586a.jpg', player2: 'user-avatar4-56586a.jpg', type: 'double down', coin: 'blackcoin-1a9023c1.svg', amount: 471.59 },
    { id: 3, player1: 'user-avatar5-56586a.jpg', player2: 'user-avatar6-56586a.jpg', type: 'double down', coin: 'blackcoin-1a9023c1.svg', amount: 376.32 },
    { id: 4, player1: 'user-avatar7-56586a.jpg', player2: 'user-avatar8-56586a.jpg', type: 'double down', coin: 'redcoin-1a42d3cf.svg', amount: 318.28 },
    { id: 5, player1: 'user-avatar1-56586a.jpg', player2: 'user-avatar3-56586a.jpg', type: 'double down', coin: 'blackcoin-1a9023c1.svg', amount: 245.67 }
  ]);
  
  useEffect(() => {
    const updateGames = () => {
      const avatars = [
        'user-avatar1-56586a.jpg', 'user-avatar2-56586a.jpg', 'user-avatar3-56586a.jpg',
        'user-avatar4-56586a.jpg', 'user-avatar5-56586a.jpg', 'user-avatar6-56586a.jpg',
        'user-avatar7-56586a.jpg', 'user-avatar8-56586a.jpg'
      ];
      const coins = ['redcoin-1a42d3cf.svg', 'blackcoin-1a9023c1.svg'];
      
      setActiveGames(prevGames => prevGames.map(game => ({
        ...game,
        player1: avatars[Math.floor(Math.random() * avatars.length)],
        player2: avatars[Math.floor(Math.random() * avatars.length)],
        coin: coins[Math.floor(Math.random() * coins.length)],
        amount: Math.floor(Math.random() * 800 + 50) + (Math.random() * 100).toFixed(2) / 100
      })));
    };
    
    const interval = setInterval(updateGames, Math.floor(Math.random() * 20000 + 5000)); // 5-25 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const handleFlip = async () => {
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
      const response = await axios.post(`${API_URL}/games/coinflip/play/`, {
        betAmount: betAmount,
        choice: choice
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setResult(response.data);
      localStorage.setItem('userBalance', response.data.newBalance.toString());
      
      if (response.data.isWin) {
        alert(`🎉 You won ${response.data.payout}!`);
      } else {
        alert(`You lost ${betAmount}. Try again!`);
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
    <div className="coinflip-page">
      <div className="coinflip-background">
        <img src="/images/coinflip-bg-56586a.png" alt="Coinflip Background" />
      </div>
      
      <div className="coinflip-content">
        <div className="coinflip-stats">
          <div className="stats-container">
            <div className="stat-item">
              <div className="stat-background"></div>
              <div className="stat-content">
                <div className="stat-icon">
                  <svg width="32" height="19" viewBox="0 0 32 19" fill="none">
                    <path d="M0.01 8.66L19.84 8.66L19.84 15.19L0.01 15.19L0.01 8.66Z" fill="url(#statGradient1)"/>
                    <path d="M0.01 7.06L19.84 7.06L19.84 13.59L0.01 13.59L0.01 7.06Z" fill="#FF922E"/>
                    <path d="M3.83 8.32L15.01 8.32L15.01 12.33L3.83 12.33L3.83 8.32Z" fill="#FFFFFF"/>
                    <path d="M3.67 8.27L16.18 8.27L16.18 12.39L3.67 12.39L3.67 8.27Z" fill="#FF922E"/>
                    <path d="M2.77 7.97L17.09 7.97L17.09 12.69L2.77 12.69L2.77 7.97Z" fill="#F7FAF6"/>
                    <path d="M3.2 8.11L16.66 8.11L16.66 12.54L3.2 12.54L3.2 8.11Z" fill="#F7FAF6"/>
                    <defs>
                      <linearGradient id="statGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#D86C1A"/>
                        <stop offset="100%" stopColor="#E87E25"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="stat-text">
                  <span className="stat-value">5,236,302</span>
                  <span className="stat-label">Total amount</span>
                </div>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-background"></div>
              <div className="stat-content">
                <div className="stat-icon">
                  <img src="/images/coinflip-stat-icon-56586a.png" alt="Stat Icon" />
                </div>
                <div className="stat-text">
                  <span className="stat-value">948</span>
                  <span className="stat-label">Total items</span>
                </div>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-background"></div>
              <div className="stat-content">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="6" stroke="#FFFFFF" strokeWidth="2"/>
                    <circle cx="3" cy="3" r="18" fill="#FFFFFF" fillOpacity="0.75"/>
                  </svg>
                </div>
                <div className="stat-text">
                  <span className="stat-value">0</span>
                  <span className="stat-label">Available games</span>
                </div>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-background"></div>
              <div className="stat-content">
                <div className="stat-icon">
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                    <path d="M14.03 8.96L25.38 8.96L25.38 23.14L14.03 23.14L14.03 8.96Z" fill="#FFFFFF"/>
                    <path d="M5 6.25L15.66 6.25L15.66 20.43L5 20.43L5 6.25Z" fill="#FFFFFF"/>
                  </svg>
                </div>
                <div className="stat-text">
                  <span className="stat-value">100</span>
                  <span className="stat-label">Total players</span>
                </div>
              </div>
            </div>
            
            <div className="stat-item create-game">
              <div className="stat-background"></div>
              <div className="stat-content">
                <button className="create-game-btn" onClick={() => {
                  // Show notification to user to top up balance
                  alert('💰 Please top up your balance to create a coinflip game!');
                  if (onPageChange) {
                    onPageChange('payments', 'deposit');
                  } else if (onRegisterModalOpen) {
                    onRegisterModalOpen();
                  }
                }}>
                  <img src="/images/coinflip-create-game-5465cb.png" alt="Create Game" />
                  <span>Create a game</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="coinflip-history">
          <div className="history-header">
            <h3>Previous games:</h3>
            <div className="history-coins">
              <img src="/images/redcoin-1a42d3cf.svg" alt="Red Coin" />
              <img src="/images/redcoin-1a42d3cf.svg" alt="Red Coin" />
              <img src="/images/blackcoin-1a9023c1.svg" alt="Black Coin" />
              <img src="/images/redcoin-1a42d3cf.svg" alt="Red Coin" />
              <img src="/images/blackcoin-1a9023c1.svg" alt="Black Coin" />
              <img src="/images/blackcoin-1a9023c1.svg" alt="Black Coin" />
              <img src="/images/blackcoin-1a9023c1.svg" alt="Black Coin" />
              <img src="/images/blackcoin-1a9023c1.svg" alt="Black Coin" />
              <img src="/images/blackcoin-1a9023c1.svg" alt="Black Coin" />
              <img src="/images/redcoin-1a42d3cf.svg" alt="Red Coin" />
              <img src="/images/redcoin-1a42d3cf.svg" alt="Red Coin" />
              <img src="/images/redcoin-1a42d3cf.svg" alt="Red Coin" />
              <img src="/images/redcoin-1a42d3cf.svg" alt="Red Coin" />
              <img src="/images/redcoin-1a42d3cf.svg" alt="Red Coin" />
              <img src="/images/blackcoin-1a9023c1.svg" alt="Black Coin" />
            </div>
          </div>
          
          <div className="history-stats">
            <div className="history-stat">
              <div className="stat-item">
                <img src="/images/redcoin-1a42d3cf.svg" alt="Red Coin" />
                <span className="stat-percentage">43%</span>
              </div>
              <div className="stat-item">
                <img src="/images/blackcoin-1a9023c1.svg" alt="Black Coin" />
                <span className="stat-percentage">57%</span>
              </div>
            </div>
          </div>
          
          <div className="active-games">
            {activeGames.map((game) => (
              <div key={game.id} className="game-item">
                <div className="game-header">
                  <div className="vs-section">
                    <div className="player-avatar">
                      <img src={`/images/${game.player1}`} alt="Player" />
                    </div>
                    <span className="vs-text">vs</span>
                    <div className="player-avatar">
                      <img src={`/images/${game.player2}`} alt="Player" />
                    </div>
                  </div>
                  <div className="game-info">
                    <span className="game-type">{game.type}</span>
                    <img src={`/images/${game.coin}`} alt="Coin" />
                    <span className="game-amount">$ {game.amount.toFixed(2)}</span>
                  </div>
                  <button className="view-outcome-btn">
                    <img src="/images/coinflip-view-outcome-2a88f7.png" alt="View Outcome" />
                    <span>View outcome</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinflipPage;
