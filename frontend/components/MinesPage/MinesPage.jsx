import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth/useAuth';
import axios from 'axios';
import { API_URL } from '../../http';
import './MinesPage.css';

const MinesPage = ({ onRegisterModalOpen }) => {
  const { isAuthenticated, updateUserData } = useAuth();
  const { t } = useTranslation('games');
  const [minesCount, setMinesCount] = useState(10);
  const [betAmount, setBetAmount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [revealedCells, setRevealedCells] = useState([]);
  const [gameHash, setGameHash] = useState('');
  const [minePositions, setMinePositions] = useState([]);
  const [gameResult, setGameResult] = useState(null);

  // 5x5 grid = 25 cells
  const gridSize = 5;
  const totalCells = gridSize * gridSize;

  // Create cells array
  const cells = Array.from({ length: totalCells }, (_, index) => ({
    id: index,
    isRevealed: revealedCells.includes(index),
    isMine: minePositions.includes(index),
    isBombHit: false
  }));

  const handleCellClick = (cellId) => {
    if (!gameStarted || revealedCells.includes(cellId) || gameResult) return;
    
    const isMine = minePositions.includes(cellId);
    const newRevealedCells = [...revealedCells, cellId];
    
    setRevealedCells(newRevealedCells);
    
    // Check if hit a mine
    if (isMine) {
      setGameResult('lose');
      setGameStarted(false);
      // DON'T clear minePositions - keep them visible so all mines show on the grid
      alert(t('games.mines.mineHit') || '💣 You hit a mine! Game over!');
      
      // Update balance after loss
      if (updateUserData) {
        updateUserData();
      }
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
      alert(t('games.mines.pleaseEnter') || 'Please enter bet amount and select mines count');
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
        // Generate random mine positions
        const mines = [];
        while (mines.length < minesCount) {
          const pos = Math.floor(Math.random() * totalCells);
          if (!mines.includes(pos)) {
            mines.push(pos);
          }
        }
        
        setMinePositions(mines);
        setGameStarted(true);
        setRevealedCells([]);
        setGameResult(null);
        // Generate random hash for this game
        const hash = Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
        setGameHash(hash);
        localStorage.setItem('userBalance', response.data.newBalance.toString());
        
        if (updateUserData) {
          updateUserData();
        }
      }
    } catch (error) {
      alert(error.response?.data?.error || t('games.mines.failedToStart') || 'Failed to start game');
    }
  };

  const cashOut = async () => {
    if (!isAuthenticated || !gameStarted || revealedCells.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Calculate multiplier based on cells revealed
      // Each revealed cell increases multiplier by 1.21x
      const baseMultiplier = 1.0;
      const multiplier = Math.pow(1.21, revealedCells.length);
      
      const response = await axios.post(`${API_URL}/games/mines/play/`, {
        action: 'cashout',
        betAmount: betAmount,
        multiplier: multiplier,
        multipliersRevealed: revealedCells.length
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data && response.data.newBalance !== undefined) {
        localStorage.setItem('userBalance', response.data.newBalance.toString());
        setGameResult('win');
        setGameStarted(false);
        alert(`${t('games.mines.cashOutSuccess') || '🎉 Cash out successful! Won:'} ${response.data.payout.toFixed(2)}!`);
        
        // Update balance after game completes
        if (updateUserData) {
          updateUserData();
        }
      }
    } catch (error) {
      alert(error.response?.data?.error || t('games.mines.failedToCashOut') || 'Failed to cash out');
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setRevealedCells([]);
    setMinePositions([]); // Clear mines for new game
    setGameResult(null);
    // Don't reset betAmount - keep it for next game
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
                {cells.map((cell) => {
                  const shouldShowMine = gameResult === 'lose' && cell.isMine;
                  const isRevealed = cell.isRevealed || shouldShowMine;
                  
                  // Determine what to show
                  let cellContent;
                  if (isRevealed) {
                    if (cell.isMine) {
                      cellContent = <div className="mine-icon">💣</div>;
                    } else {
                      cellContent = <div className="diamond-icon">💎</div>;
                    }
                  } else {
                    cellContent = <div className="cell-question">?</div>;
                  }
                  
                  return (
                    <div
                      key={cell.id}
                      className={`mine-cell ${isRevealed ? 'revealed' : ''} ${cell.isMine && shouldShowMine ? 'mine-hit' : ''}`}
                      onClick={() => handleCellClick(cell.id)}
                      style={{ cursor: gameResult || !gameStarted ? 'not-allowed' : 'pointer' }}
                    >
                      <div className="cell-content">
                        {cellContent}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="mines-controls">
            <div className="controls-container">
              <div className="bet-section">
                <div className="bet-amount">
                  <label className="control-label">{t('games.mines.betAmount') || 'Bet amount'}</label>
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
                    <div className="clear-icon" onClick={() => handleBetAmountChange(0)}>
                      ✕
                    </div>
                  </div>
                  
                  <div className="bet-quick-actions">
                    <button className="quick-bet-btn" onClick={() => handleBetAmountChange(betAmount + 100)}>+100</button>
                    <button className="quick-bet-btn" onClick={() => handleBetAmountChange(betAmount + 500)}>+500</button>
                    <button className="quick-bet-btn" onClick={() => handleBetAmountChange(betAmount + 1000)}>+1000</button>
                    <button className="quick-bet-btn" onClick={() => handleBetAmountChange(betAmount + 5000)}>+5000</button>
                    <button className="quick-bet-btn" onClick={() => handleBetAmountChange(betAmount / 2)}>1/2</button>
                    <button className="quick-bet-btn" onClick={() => handleBetAmountChange(betAmount * 2)}>x2</button>
                    <button className="quick-bet-btn" onClick={() => {
                      const balance = parseFloat(localStorage.getItem('userBalance') || '0');
                      handleBetAmountChange(Math.floor(balance));
                    }}>max</button>
                  </div>
                </div>
                
                <div className="mines-count">
                                      <label className="control-label">{t('games.mines.minesAmount') || 'Mines Count'}</label>
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
                      disabled={gameStarted}
                    >1</button>
                    <button 
                      className={`mines-count-btn ${minesCount === 3 ? 'active' : ''}`}
                      onClick={() => handleMinesCountChange(3)}
                      disabled={gameStarted}
                    >3</button>
                    <button 
                      className={`mines-count-btn ${minesCount === 5 ? 'active' : ''}`}
                      onClick={() => handleMinesCountChange(5)}
                      disabled={gameStarted}
                    >5</button>
                    <button 
                      className={`mines-count-btn ${minesCount === 10 ? 'active' : ''}`}
                      onClick={() => handleMinesCountChange(10)}
                      disabled={gameStarted}
                    >10</button>
                    <button 
                      className={`mines-count-btn ${minesCount === 24 ? 'active' : ''}`}
                      onClick={() => handleMinesCountChange(24)}
                      disabled={gameStarted}
                    >24</button>
                  </div>
                </div>
              </div>
              
              <div className="game-actions">
                {!gameStarted ? (
                  <button 
                    className="play-btn"
                    onClick={startGame}
                    disabled={betAmount <= 0 || minesCount <= 0}
                  >
                                          {t('games.mines.play') || 'Play'}
                  </button>
                ) : (
                  <div className="game-buttons">
                    <button 
                      className="cashout-btn"
                      onClick={cashOut}
                      disabled={revealedCells.length === 0}
                    >
                      {t('games.mines.cashOut') || 'Cash Out'}
                    </button>
                    <button 
                      className="reset-btn"
                      onClick={resetGame}
                    >
                      {t('games.mines.reset') || 'Reset'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mines-footer">
          <p className="footer-text">
            {t('games.mines.gameOfChance')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MinesPage;
