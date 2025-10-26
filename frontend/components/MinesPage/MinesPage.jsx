import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth/useAuth';
import axios from 'axios';
import { API_URL } from '../../http';
import './MinesPage.css';

const MinesPage = ({ onRegisterModalOpen }) => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [minesCount, setMinesCount] = useState(10);
  const [betAmount, setBetAmount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [revealedCells, setRevealedCells] = useState([]);
  const [gameHash, setGameHash] = useState('no hash');

  // 5x5 grid = 25 cells
  const gridSize = 5;
  const totalCells = gridSize * gridSize;

  // Create cells array
  const cells = Array.from({ length: totalCells }, (_, index) => ({
    id: index,
    isRevealed: revealedCells.includes(index),
    isMine: false, // In real game this will be determined by server
    adjacentMines: 0
  }));

  const handleCellClick = (cellId) => {
    if (gameStarted && !revealedCells.includes(cellId)) {
      setRevealedCells([...revealedCells, cellId]);
    }
  };

  const handleMinesCountChange = (count) => {
    setMinesCount(count);
  };

  const handleBetAmountChange = (amount) => {
    setBetAmount(amount);
  };

  const startGame = async () => {
    if (!isAuthenticated) {
      if (onRegisterModalOpen) {
        onRegisterModalOpen();
      }
      return;
    }
    
    if (betAmount <= 0 || minesCount <= 0) {
      alert('Please enter bet amount and select mines count');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/games/mines/play/`, {
        action: 'bet',
        betAmount: betAmount,
        minesCount: minesCount
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setGameStarted(true);
        setRevealedCells([]);
        setGameHash(Math.random().toString(36).substring(2, 15));
        localStorage.setItem('userBalance', response.data.newBalance.toString());
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to start game');
    }
  };

  const cashOut = async () => {
    if (!isAuthenticated || !gameStarted) return;
    
    try {
      const token = localStorage.getItem('token');
      const multiplier = revealedCells.length * 1.2; // Calculate multiplier
      
      const response = await axios.post(`${API_URL}/games/mines/play/`, {
        action: 'cashout',
        betAmount: betAmount,
        multiplier: multiplier,
        multipliersRevealed: revealedCells.length
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        localStorage.setItem('userBalance', response.data.newBalance.toString());
        setGameStarted(false);
        setRevealedCells([]);
        setBetAmount(0);
        alert(`Cash out successful! Won: ${response.data.payout}`);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to cash out');
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setRevealedCells([]);
    setBetAmount(0);
  };

  return (
    <div className="mines-page">
      <div className="mines-background"></div>
      
      <div className="mines-content">
        <div className="mines-game-area">
          <div className="mines-game-container">
            <div className="mines-game-info">
              <div className="game-hash-section">
                <div className="hash-display">
                  <span className="hash-text">{gameHash}</span>
                </div>
              </div>
            </div>
            
            <div className="mines-grid-container">
              <div className="mines-grid">
                {cells.map((cell) => (
                  <div
                    key={cell.id}
                    className={`mine-cell ${cell.isRevealed ? 'revealed' : ''}`}
                    onClick={() => handleCellClick(cell.id)}
                  >
                    {cell.isRevealed ? (
                      <div className="cell-content">
                        {cell.isMine ? (
                          <div className="mine-icon">💣</div>
                        ) : (
                          <div className="diamond-icon">💎</div>
                        )}
                      </div>
                    ) : (
                      <div className="cell-question">?</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mines-controls">
            <div className="controls-container">
              <div className="bet-section">
                <div className="bet-amount">
                  <label className="control-label">Bet amount</label>
                  <div className="bet-input-container">
                    <div className="currency-icon">
                      <img src="/images/blackcoin-1a9023c1.svg" alt={t('common.currency')} />
                    </div>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => handleBetAmountChange(parseFloat(e.target.value) || 0)}
                      className="bet-input"
                      placeholder="0"
                      disabled={gameStarted}
                    />
                    <div className="clear-icon">
                      <img src="/images/copy-icon.svg" alt={t('common.clear')} />
                    </div>
                  </div>
                  
                  <div className="bet-quick-actions">
                    <button className="quick-bet-btn" onClick={() => handleBetAmountChange(betAmount + 100)}>+100</button>
                    <button className="quick-bet-btn" onClick={() => handleBetAmountChange(betAmount + 500)}>+500</button>
                    <button className="quick-bet-btn" onClick={() => handleBetAmountChange(betAmount + 1000)}>+1000</button>
                    <button className="quick-bet-btn" onClick={() => handleBetAmountChange(betAmount + 5000)}>+5000</button>
                    <button className="quick-bet-btn" onClick={() => handleBetAmountChange(betAmount / 2)}>1/2</button>
                    <button className="quick-bet-btn" onClick={() => handleBetAmountChange(betAmount * 2)}>x2</button>
                    <button className="quick-bet-btn" onClick={() => handleBetAmountChange(10000)}>max</button>
                  </div>
                </div>
                
                <div className="mines-count">
                  <label className="control-label">{t('mines.minesAmount')}</label>
                  <div className="mines-input-container">
                    <div className="mines-icon">
                      <img src="/images/mines-game-56586a.png" alt={t('games.mines')} />
                    </div>
                    <input
                      type="number"
                      value={minesCount}
                      onChange={(e) => handleMinesCountChange(parseInt(e.target.value) || 1)}
                      className="mines-input"
                      placeholder="10"
                      min="1"
                      max="24"
                      disabled={gameStarted}
                    />
                  </div>
                  
                  <div className="mines-quick-actions">
                    <button 
                      className={`mines-count-btn ${minesCount === 1 ? 'active' : ''}`}
                      onClick={() => handleMinesCountChange(1)}
                    >1</button>
                    <button 
                      className={`mines-count-btn ${minesCount === 3 ? 'active' : ''}`}
                      onClick={() => handleMinesCountChange(3)}
                    >3</button>
                    <button 
                      className={`mines-count-btn ${minesCount === 5 ? 'active' : ''}`}
                      onClick={() => handleMinesCountChange(5)}
                    >5</button>
                    <button 
                      className={`mines-count-btn ${minesCount === 10 ? 'active' : ''}`}
                      onClick={() => handleMinesCountChange(10)}
                    >10</button>
                    <button 
                      className={`mines-count-btn ${minesCount === 24 ? 'active' : ''}`}
                      onClick={() => handleMinesCountChange(24)}
                    >24</button>
                  </div>
                </div>
              </div>
              
              <div className="game-actions">
                <button 
                  className="cashout-btn"
                  onClick={cashOut}
                  disabled={!gameStarted || revealedCells.length === 0}
                >
                  <img src="/images/coinflip-tails.png" alt={t('common.cashOut')} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mines-footer">
          <p className="footer-text">
            {t('mines.gameOfChance')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MinesPage;
