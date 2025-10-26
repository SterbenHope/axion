import React from 'react';

const BalanceCard = ({ balance, totalWinnings, totalLosses }) => {
  return (
    <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 border border-purple-500/30 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Balance</h2>
          <p className="text-3xl font-mono text-cyan-400">${balance.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-green-400 text-sm">+${totalWinnings.toFixed(2)}</p>
          <p className="text-red-400 text-sm">-${totalLosses.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;

