import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth/useAuth';
import axios from 'axios';
import { API_URL } from '../../http';
import './PlinkoPage.css';

const PlinkoPage = ({ onRegisterModalOpen }) => {
  const { isAuthenticated, updateUserData } = useAuth();
  const { t } = useTranslation();
  const [betAmount, setBetAmount] = useState(0);
  const [rows, setRows] = useState(14); // Default to 14 rows for better gameplay
  const [difficulty, setDifficulty] = useState('normal');
  const [mode, setMode] = useState('manual');
  const [isPlaying, setIsPlaying] = useState(false);
  const [multipliers, setMultipliers] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [ballPosition, setBallPosition] = useState({ row: 0, column: 5, x: 0, y: 0 });
  const [winningSlot, setWinningSlot] = useState(null); // Store winning slot from backend

  // Multipliers for different difficulty levels
  const getMultipliers = (rows, difficulty) => {
    const baseMultipliers = {
      easy: [21.1, 4.8, 1.92, 1.34, 0.58, 0.38, 0.58, 1.34, 1.92, 4.8, 21.1],
      normal: [21.1, 4.8, 1.92, 1.34, 0.58, 0.38, 0.58, 1.34, 1.92, 4.8, 21.1],
      hard: [21.1, 4.8, 1.92, 1.34, 0.58, 0.38, 0.58, 1.34, 1.92, 4.8, 21.1]
    };
    return baseMultipliers[difficulty] || baseMultipliers.normal;
  };

  useEffect(() => {
    setMultipliers(getMultipliers(rows, difficulty));
  }, [rows, difficulty]);

  const animateBall = () => {
    setIsAnimating(true);
    
    // Board dimensions
    const boardWidth = 500; // Match CSS width
    const rowHeight = 28; // Vertical distance between rows
    const startX = boardWidth / 2;
    
    // Initial position (top center)
    let currentRow = 0;
    let currentCol = Math.floor(rows / 2) + 1; // Center column based on rows
    let x = startX;
    let y = 30; // Starting y position
    
    // Track for momentum
    let velocityX = 0;
    let lastDirection = 0;
    
    // Calculate column width dynamically based on rows
    const maxCols = rows + 1; // One more peg per row
    const columnWidth = boardWidth / (maxCols - 1);
    
    const animate = () => {
      // Move to next row
      currentRow++;
      y += rowHeight;
      
      // Determine bounce direction with momentum physics
      const randomValue = Math.random();
      let directionChange = 0;
      
      if (lastDirection === 0) {
        // First bounce - completely random
        directionChange = randomValue > 0.5 ? 1 : -1;
      } else {
        // Use momentum: 70% chance to continue, 30% to reverse
        if (randomValue < 0.70) {
          directionChange = lastDirection;
        } else {
          directionChange = -lastDirection;
        }
      }
      
      currentCol += directionChange;
      lastDirection = directionChange;
      
      // Keep within bounds (0 to maxCols-1)
      const minCol = 0;
      const maxCol = maxCols - 1;
      
      if (currentCol < minCol) {
        currentCol = minCol;
        lastDirection = -lastDirection; // Bounce off wall
      } else if (currentCol > maxCol) {
        currentCol = maxCol;
        lastDirection = -lastDirection; // Bounce off wall
      }
      
      // Calculate x position
      x = startX + (currentCol - (maxCols / 2)) * columnWidth;
      
      // Update position
      setBallPosition({ row: currentRow, column: currentCol, x, y, velocityX: 0 });
      
      // Check if reached bottom
      if (currentRow >= rows) {
        // Use winning slot from backend to determine final position
        let finalSlotToUse = currentCol;
        let finalX = x;
        
        if (winningSlot !== null) {
          // Backend provides winning_slot (0-10) for the 11 multiplier slots
          // We need to map this to the actual column position on the board
          
          // Calculate the center of the multiplier slots area
          const slotWidth = boardWidth / 11; // 11 multiplier slots
          finalX = (winningSlot * slotWidth) + (slotWidth / 2); // Center of the winning slot
          
          // Calculate which peg column this corresponds to
          finalSlotToUse = Math.round(((finalX / boardWidth) * maxCols) - (maxCols / 2));
          finalSlotToUse = Math.max(0, Math.min(maxCols - 1, finalSlotToUse));
          
          console.log('Final position calc:', {
            winningSlot,
            finalX: finalX.toFixed(1),
            finalSlotToUse,
            slotWidth: slotWidth.toFixed(1)
          });
        }
        
        // Move ball to bottom position - make it more visible
        // y position should be at the bottom of the board but visible above multipliers
        setBallPosition({ row: rows, column: finalSlotToUse, x: finalX, y: 530, velocityX: 0 }); // y: 530 visible above slots
        
        // Keep ball visible at bottom for a moment (1 second)
        setTimeout(() => {
          setIsAnimating(false);
        }, 1000);
        
        return;
      }
      
      // Continue animation
      requestAnimationFrame(() => {
        setTimeout(animate, 120); // Smooth timing
      });
    };
    
    // Start animation
    animate();
  };

  const handleBet = async () => {
    if (!isAuthenticated) {
      if (onRegisterModalOpen) {
        onRegisterModalOpen();
      }
      return;
    }
    
    if (betAmount <= 0) {
      alert('Please enter bet amount');
      return;
    }
    
    setIsPlaying(true);
    setIsAnimating(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/games/plinko/play/`, {
        betAmount: betAmount,
        difficulty: difficulty
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data) {
        // Store winning slot from backend
        setWinningSlot(response.data.winning_slot);
        
        // Calculate final column position based on winning slot (0-10)
        const finalSlot = response.data.winning_slot;
        const maxCols = rows + 1;
        const boardWidth = 500;
        const columnWidth = boardWidth / (maxCols - 1);
        const centerOffset = Math.floor((maxCols - 11) / 2);
        const finalCol = finalSlot + centerOffset + 2; // Offset to match visual slots
        
        console.log('Plinko Debug:', {
          winningSlot: finalSlot,
          finalCol,
          maxCols,
          centerOffset
        });
        
        const gameResult = {
          id: Date.now(),
          user: 'Player',
          betAmount,
          multiplier: response.data.multiplier,
          payout: response.data.payout,
          date: new Date().toLocaleString(),
          slot: response.data.winning_slot
        };
        
        setGameHistory(prev => [gameResult, ...prev.slice(0, 9)]);
        
        // Update balance
        if (response.data.newBalance !== undefined) {
          localStorage.setItem('userBalance', response.data.newBalance.toString());
        }
        
        // Start animation with determined final position
        animateBall();
        
        // Show result after animation
        setTimeout(() => {
          alert(response.data.payout > 0 ? `🎉 You won ${response.data.payout}! Multiplier: ${response.data.multiplier}x` : 'You lost this round');
          
          // Update balance after animation completes
          if (updateUserData) {
            updateUserData();
          }
        }, rows * 120 + 500 + 500); // Timing: rows * interval + bottom delay + extra
      }
    } catch (error) {
      console.error('Error playing Plinko:', error);
      alert(error.response?.data?.error || 'Failed to process plinko game');
      setIsAnimating(false);
    } finally {
      setIsPlaying(false);
    }
  };

  const quickBetAmounts = [100, 500, 1000, 5000];
  const rowOptions = [12, 14, 16, 18, 20]; // More rows for better gameplay

  return (
    <div className="plinko-page">
      <div className="plinko-container">
        {/* Control Panel */}
        <div className="plinko-controls">
          <div className="control-section">
            <div className="control-group">
              <label>Mode</label>
              <div className="mode-buttons">
                <button 
                  className={mode === 'manual' ? 'active' : ''}
                  onClick={() => setMode('manual')}
                >
                  Manual
                </button>
                <button 
                  className={mode === 'auto' ? 'active' : ''}
                  onClick={() => setMode('auto')}
                >
                  Auto
                </button>
              </div>
            </div>

            <div className="control-group">
              <label>Difficulty</label>
              <div className="difficulty-buttons">
                <button 
                  className={difficulty === 'easy' ? 'active' : ''}
                  onClick={() => setDifficulty('easy')}
                >
                  Easy
                </button>
                <button 
                  className={difficulty === 'normal' ? 'active' : ''}
                  onClick={() => setDifficulty('normal')}
                >
                  Normal
                </button>
                <button 
                  className={difficulty === 'hard' ? 'active' : ''}
                  onClick={() => setDifficulty('hard')}
                >
                  Hard
                </button>
              </div>
            </div>

            <div className="control-group">
              <label>Bet amount</label>
              <div className="bet-input-container">
                <div className="coin-icon">🪙</div>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  placeholder="0"
                  className="bet-input"
                />
                <div className="bet-actions">
                  <button>+</button>
                  <button>-</button>
                </div>
              </div>
              <div className="quick-bet-buttons">
                {quickBetAmounts.map(amount => (
                  <button 
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    className="quick-bet"
                  >
                    +{amount}
                  </button>
                ))}
                <button onClick={() => setBetAmount(Math.max(1, Math.floor(betAmount / 2)))}>1/2</button>
                <button onClick={() => setBetAmount(betAmount * 2)}>x2</button>
                <button onClick={() => {
                  const balance = parseFloat(localStorage.getItem('userBalance') || '0');
                  setBetAmount(Math.floor(balance));
                }}>max</button>
              </div>
            </div>

            <div className="control-group">
              <label>Amount of rows</label>
              <div className="row-buttons">
                {rowOptions.map(option => (
                  <button
                    key={option}
                    className={rows === option ? 'active' : ''}
                    onClick={() => setRows(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-win">
              MAX WIN: 10,000,000 coins
            </div>

            <button 
              className="place-bet-btn"
              onClick={handleBet}
              disabled={isPlaying || betAmount <= 0}
            >
              {isPlaying ? 'Playing...' : 'place bet'}
            </button>
          </div>
        </div>

        {/* Game Field */}
        <div className="plinko-game-area">
          <div className="plinko-board">
            <div className="plinko-pins">
              {/* Generate pins for grid */}
              {Array.from({ length: rows }, (_, rowIndex) => (
                <div key={rowIndex} className="pin-row">
                  {Array.from({ length: rowIndex + 1 }, (_, pinIndex) => (
                    <div key={pinIndex} className="pin" />
                  ))}
                </div>
              ))}
            </div>
            
            {/* Animated Ball */}
            {isAnimating && (
              <div 
                className="plinko-ball"
                style={{
                  position: 'absolute',
                  left: `${ballPosition.x}px`,
                  top: `${ballPosition.y}px`,
                  transform: 'translate(-50%, -50%)',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  willChange: 'transform'
                }}
              >
                ⚽
              </div>
            )}
            
            {/* {t('plinko.slotsWithMultipliers')} */}
            <div className="multiplier-slots">
              {multipliers.map((multiplier, index) => (
                <div key={index} className="multiplier-slot">
                  <div className={`multiplier-icon multiplier-${index}`}>
                    {index === 0 || index === multipliers.length - 1 ? '🔥' : '💎'}
                  </div>
                  <span className="multiplier-value">{multiplier}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Game History */}
        <div className="plinko-history">
          <div className="history-header">
            <div>User</div>
            <div>Bet amount</div>
            <div>Multiplier</div>
            <div>Payout</div>
            <div>Date</div>
          </div>
          <div className="history-list">
            {gameHistory.map((game) => (
              <div key={game.id} className="history-item">
                <div className="user-info">
                  <div className="user-avatar">👤</div>
                  <span>{game.user}</span>
                </div>
                <div className="bet-info">
                  <div className="coin-icon">🪙</div>
                  <span>{game.betAmount}</span>
                </div>
                <div className="multiplier-info">{game.multiplier}x</div>
                <div className="payout-info">
                  <div className="coin-icon">🪙</div>
                  <span className={game.payout > game.betAmount ? 'win' : 'loss'}>
                    {game.payout}
                  </span>
                </div>
                <div className="date-info">{game.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlinkoPage;




