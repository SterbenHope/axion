import React from 'react';

const DepositOverview = () => {
  return (
    <div className="bg-black/50 border border-purple-500/30 rounded-xl p-6 mt-8">
      <h3 className="text-xl font-bold text-white mb-4">Deposit Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-800/50 rounded-lg">
          <h4 className="text-green-400 font-bold text-lg">$0.00</h4>
          <p className="text-gray-400 text-sm">Total Deposits</p>
        </div>
        <div className="text-center p-4 bg-gray-800/50 rounded-lg">
          <h4 className="text-blue-400 font-bold text-lg">0</h4>
          <p className="text-gray-400 text-sm">Deposit Count</p>
        </div>
        <div className="text-center p-4 bg-gray-800/50 rounded-lg">
          <h4 className="text-yellow-400 font-bold text-lg">$0.00</h4>
          <p className="text-gray-400 text-sm">Last Deposit</p>
        </div>
      </div>
    </div>
  );
};

export default DepositOverview;

