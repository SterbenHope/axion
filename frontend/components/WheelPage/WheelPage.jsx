import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth/useAuth';
import axios from 'axios';
import { API_URL } from '../../http';
import './WheelPage.css';

const WheelPage = ({ onRegisterModalOpen }) => {
  const { isAuthenticated, updateUserData } = useAuth();
  const { t } = useTranslation();
  const [betAmount, setBetAmount] = useState(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const wheelRef = useRef(null);

  // 24-segment wheel with varied outcomes
  const WHEEL_SEGMENTS = [
    // First 8 segments
    { id: 1, multiplier: 0, color: '#991b1b', label: 'LOSE', type: 'lose' },           // Red - Lose All
    { id: 2, multiplier: 0.5, color: '#dc2626', label: '0.5x', type: 'low' },        // Light Red - Win Half
    { id: 3, multiplier: 1, color: '#f97316', label: '1x', type: 'even' },            // Orange - Break Even
    { id: 4, multiplier: 2, color: '#ea580c', label: '2x', type: 'win' },             // Dark Orange - Double
    { id: 5, multiplier: 3, color: '#f59e0b', label: '3x', type: 'win' },             // Yellow - Triple
    { id: 6, multiplier: 5, color: '#eab308', label: '5x', type: 'big' },             // Bright Yellow - 5x
    { id: 7, multiplier: 10, color: '#22c55e', label: '10x', type: 'big' },           // Green - 10x
    { id: 8, multiplier: 25, color: '#10b981', label: '25x', type: 'jackpot' },       // Bright Green - 25x (rare)
    
    // Next 8 segments
    { id: 9, multiplier: 0, color: '#991b1b', label: 'LOSE', type: 'lose' },
    { id: 10, multiplier: 1, color: '#f97316', label: '1x', type: 'even' },
    { id: 11, multiplier: 2, color: '#ea580c', label: '2x', type: 'win' },
    { id: 12, multiplier: 2, color: '#ea580c', label: '2x', type: 'win' },
    { id: 13, multiplier: 3, color: '#f59e0b', label: '3x', type: 'win' },
    { id: 14, multiplier: 5, color: '#eab308', label: '5x', type: 'big' },
    { id: 15, multiplier: 10, color: '#22c55e', label: '10x', type: 'big' },
    { id: 16, multiplier: 0.1, color: '#8b5cf6', label: '+10%', type: 'bonus' },      // Purple - Bonus!
    
    // Last 8 segments
    { id: 17, multiplier: 0.5, color: '#dc2626', label: '0.5x', type: 'low' },
    { id: 18, multiplier: 1, color: '#f97316', label: '1x', type: 'even' },
    { id: 19, multiplier: 2, color: '#ea580c', label: '2x', type: 'win' },
    { id: 20, multiplier: 3, color: '#f59e0b', label: '3x', type: 'win' },
    { id: 21, multiplier: 5, color: '#eab308', label: '5x', type: 'big' },
    { id: 22, multiplier: 5, color: '#eab308', label: '5x', type: 'big' },
    { id: 23, multiplier: 0, color: '#991b1b', label: 'LOSE', type: 'lose' },
    { id: 24, multiplier: 1, color: '#f97316', label: '1x', type: 'even' },
  ];

  const segmentAngle = 360 / WHEEL_SEGMENTS.length;

  const handleSpin = async () => {
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

    setIsSpinning(true);
    setLastResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/games/wheel/play/`, {
        betAmount: betAmount
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data) {
        // SERVER IS THE SINGLE SOURCE OF TRUTH
        // Frontend doesn't calculate anything, just applies server's parameters
        
        const winningSegment = response.data.winning_segment || 0;
        const targetAngleDeg = response.data.target_angle_deg || 0;
        const extraRotations = response.data.extra_rotations || 5;
        const durationMs = response.data.duration_ms || 5000;
        const totalRotationDeg = response.data.total_rotation_deg || 0;
        
        console.log('Wheel Spin Debug (Server Params):', {
          winningSegment,
          multiplier: WHEEL_SEGMENTS[winningSegment].multiplier,
          targetAngleDeg: targetAngleDeg.toFixed(2),
          extraRotations,
          durationMs,
          totalRotationDeg: totalRotationDeg.toFixed(2)
        });
        
        // Apply the rotation with server-provided parameters
        if (wheelRef.current) {
          wheelRef.current.style.transition = 'none';
          wheelRef.current.style.transform = `rotate(0deg)`;
          void wheelRef.current.offsetWidth;
          wheelRef.current.style.transition = `transform ${durationMs / 1000}s cubic-bezier(0.15, 0.85, 0.1, 1)`;
          wheelRef.current.style.transform = `rotate(${totalRotationDeg}deg)`;
        }

        setWheelRotation(totalRotationDeg);

                  // Wait for animation to complete
          setTimeout(() => {
            setLastResult({
              segment: WHEEL_SEGMENTS[winningSegment],
              payout: response.data.payout,
              isWin: response.data.isWin,
              newBalance: response.data.newBalance
            });

            // Update balance
            if (response.data.newBalance !== undefined) {
              localStorage.setItem('userBalance', response.data.newBalance.toString());
            }

            // Show result based on outcome
            console.log('Wheel Result Debug:', {
              winningSegment,
              segment: WHEEL_SEGMENTS[winningSegment],
              multiplier: WHEEL_SEGMENTS[winningSegment].multiplier,
              payout: response.data.payout,
              isWin: response.data.isWin,
              isBonus: response.data.isBonus
            });
            
            if (response.data.isBonus) {
              alert(`🎁 BONUS! You got +${response.data.bonus.toFixed(2)} extra!`);
            } else if (response.data.isWin) {
              alert(`🎉 Wheel landed on ${WHEEL_SEGMENTS[winningSegment].multiplier}x! You won ${response.data.payout.toFixed(2)}!`);
            } else if (WHEEL_SEGMENTS[winningSegment].multiplier === 0) {
              alert(`😢 You lost! Better luck next time!`);
            } else {
              alert(`Wheel landed on ${WHEEL_SEGMENTS[winningSegment].multiplier}x. You got ${response.data.payout.toFixed(2)}!`);
            }

            setIsSpinning(false);
            
            // Update balance after animation completes
            if (updateUserData) {
              updateUserData();
            }
          }, durationMs);
      }
    } catch (error) {
      console.error('Error spinning wheel:', error);
      alert(error.response?.data?.error || 'Failed to spin wheel');
      setIsSpinning(false);
    }
  };

  const quickBetAmounts = [100, 500, 1000, 5000];

  return (
    <div className="wheel-page">
      <div className="wheel-container">
        {/* Control Panel */}
        <div className="wheel-controls">
          <div className="control-section">
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
                  disabled={isSpinning}
                />
                <div className="bet-actions">
                  <button onClick={() => setBetAmount(Math.max(1, Math.floor(betAmount / 2)))} disabled={isSpinning}>½</button>
                  <button onClick={() => setBetAmount(betAmount * 2)} disabled={isSpinning}>×2</button>
                  <button onClick={() => {
                    const balance = parseFloat(localStorage.getItem('userBalance') || '0');
                    setBetAmount(Math.floor(balance));
                  }} disabled={isSpinning}>max</button>
                </div>
              </div>
              <div className="quick-bet-buttons">
                {quickBetAmounts.map(amount => (
                  <button 
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    className="quick-bet"
                    disabled={isSpinning}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <label>Last Result</label>
              {lastResult ? (
                <div className="last-result">
                  <div className="result-multiplier">
                    {lastResult.segment.multiplier}x
                  </div>
                  <div className="result-payout">
                    Payout: {lastResult.payout}
                  </div>
                </div>
              ) : (
                <div className="no-result">No spins yet</div>
              )}
            </div>

            <button 
              className="spin-button"
              onClick={handleSpin}
              disabled={isSpinning || betAmount <= 0}
            >
              {isSpinning ? 'Spinning...' : 'SPIN WHEEL'}
            </button>

            <div className="max-win">
              MAX WIN: 25x your bet! 🎯
            </div>

            {/* Legend */}
            <div className="wheel-legend">
              <div className="legend-title">Outcomes</div>
              <div className="legend-items">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#991b1b' }}></div>
                  <span className="legend-label">LOSE</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#dc2626' }}></div>
                  <span className="legend-label">0.5x</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#f97316' }}></div>
                  <span className="legend-label">1x</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#ea580c' }}></div>
                  <span className="legend-label">2x</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
                  <span className="legend-label">3x</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#eab308' }}></div>
                  <span className="legend-label">5x</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#22c55e' }}></div>
                  <span className="legend-label">10x</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
                  <span className="legend-label">25x</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#8b5cf6' }}></div>
                  <span className="legend-label">+10%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wheel Game Area */}
        <div className="wheel-game-area">
          <div className="wheel-wrapper">
            <div className="wheel-pointer">
              <div className="pointer-arrow">▼</div>
            </div>
            
            <div 
              ref={wheelRef}
              className="wheel-circle"
              style={{
                transform: `rotate(${wheelRotation}deg)`,
              }}
            >
              {WHEEL_SEGMENTS.map((segment, index) => {
                const startAngle = segmentAngle * index;
                const endAngle = segmentAngle * (index + 1);
                
                // Calculate the points of the segment
                const startRad = (startAngle - 90) * Math.PI / 180;
                const endRad = (endAngle - 90) * Math.PI / 180;
                
                const x1 = 50 + 50 * Math.cos(startRad);
                const y1 = 50 + 50 * Math.sin(startRad);
                const x2 = 50 + 50 * Math.cos(endRad);
                const y2 = 50 + 50 * Math.sin(endRad);
                
                // largeArc flag: 1 if angle >= 180, else 0
                const largeArc = segmentAngle >= 180 ? 1 : 0;
                
                // Sweep flag: 1 for clockwise
                const sweep = 1;
                
                                 // Calculate label position - center of segment at distance from center
                 const labelAngle = (startAngle + segmentAngle / 2) * Math.PI / 180;
                 const labelDistance = 35; // Distance from center in percentage (35%)
                 const labelX = 50 + labelDistance * Math.cos(labelAngle - Math.PI / 2);
                 const labelY = 50 + labelDistance * Math.sin(labelAngle - Math.PI / 2);
                 
                 return (
                  <div
                    key={segment.id}
                    className="wheel-segment"
                  >
                    <svg className="segment-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path
                        d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} ${sweep} ${x2} ${y2} Z`}
                        fill={segment.color}
                        stroke="rgba(0, 0, 0, 0.3)"
                        strokeWidth="2"
                      />
                    </svg>
                    <div 
                      className="segment-label"
                      style={{
                        left: `${labelX}%`,
                        top: `${labelY}%`,
                        transform: `translate(-50%, -50%) rotate(${startAngle + segmentAngle / 2}deg)`,
                      }}
                    >
                      {segment.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center circle */}
          <div className="wheel-center">
            <div className="center-text">SPIN</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WheelPage;
