import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './UpgraderPage.css';

const UpgraderPage = ({ onRegisterModalOpen }) => {
  const { t } = useTranslation();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [coins, setCoins] = useState(1000);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const levels = [
    { level: 1, cost: 0, multiplier: 1.0, color: '#4D5B97' },
    { level: 2, cost: 100, multiplier: 1.2, color: '#3B436B' },
    { level: 3, cost: 250, multiplier: 1.5, color: '#2D3660' },
    { level: 4, cost: 500, multiplier: 2.0, color: '#FFC701' },
    { level: 5, cost: 1000, multiplier: 3.0, color: '#FF922E' },
  ];

  const handleUpgrade = () => {
    const nextLevel = levels[currentLevel];
    if (coins >= nextLevel.cost) {
      setIsUpgrading(true);
      setTimeout(() => {
        setCoins(coins - nextLevel.cost);
        setCurrentLevel(currentLevel + 1);
        setIsUpgrading(false);
      }, 2000);
    } else {
      onRegisterModalOpen();
    }
  };

  const currentLevelData = levels[currentLevel - 1];
  const nextLevelData = levels[currentLevel];

  return (
    <div className="upgrader-page">
      <div className="upgrader-background">
        <img src="/images/upgrader-game-56586a.png" alt="Upgrader Background" />
      </div>
      
      <div className="upgrader-content">
        <div className="upgrader-header">
          <h1>{t('games.upgrader')} Game</h1>
          <div className="coins-display">
            <span className="coins-label">{t('upgrader.coins')}:</span>
            <span className="coins-amount">{coins.toLocaleString()}</span>
          </div>
        </div>

        <div className="upgrader-game-area">
          <div className="current-level">
            <div className="level-info">
              <h2>Current Level: {currentLevel}</h2>
              <div className="level-stats">
                <div className="stat">
                  <span className="stat-label">Multiplier:</span>
                  <span className="stat-value">{currentLevelData.multiplier}x</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Color:</span>
                  <div 
                    className="stat-color" 
                    style={{ backgroundColor: currentLevelData.color }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="upgrade-section">
            {nextLevelData ? (
              <div className="next-level">
                <h3>Next Level: {nextLevelData.level}</h3>
                <div className="upgrade-cost">
                  <span>Cost: {nextLevelData.cost} coins</span>
                </div>
                <div className="upgrade-benefits">
                  <div className="benefit">
                    <span>New Multiplier: {nextLevelData.multiplier}x</span>
                  </div>
                  <div className="benefit">
                    <span>New Color: </span>
                    <div 
                      className="benefit-color" 
                      style={{ backgroundColor: nextLevelData.color }}
                    ></div>
                  </div>
                </div>
                
                <button 
                  className={`upgrade-btn ${coins >= nextLevelData.cost ? 'available' : 'insufficient'}`}
                  onClick={handleUpgrade}
                  disabled={isUpgrading || coins < nextLevelData.cost}
                >
                  {isUpgrading ? 'Upgrading...' : 
                   coins >= nextLevelData.cost ? 'Upgrade Now' : 'Need More Coins'}
                </button>
              </div>
            ) : (
              <div className="max-level">
                <h3>🎉 Max Level Reached! 🎉</h3>
                <p>You've reached the maximum level!</p>
              </div>
            )}
          </div>

          <div className="levels-preview">
            <h3>All Levels</h3>
            <div className="levels-grid">
              {levels.map((level, index) => (
                <div 
                  key={level.level}
                  className={`level-card ${currentLevel === level.level ? 'current' : 
                             currentLevel > level.level ? 'completed' : 'locked'}`}
                >
                  <div className="level-number">{level.level}</div>
                  <div 
                    className="level-color" 
                    style={{ backgroundColor: level.color }}
                  ></div>
                  <div className="level-multiplier">{level.multiplier}x</div>
                  <div className="level-cost">{level.cost} coins</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgraderPage;


