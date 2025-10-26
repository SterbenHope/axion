import React from 'react';

const RecentGames = ({ games, loading }) => {
  if (loading) {
    return (
      <div className="bg-black/50 border border-purple-500/30 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Games</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/50 border border-purple-500/30 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">Recent Games</h3>
      {games.length === 0 ? (
        <p className="text-gray-400">No recent games. Start playing to see your history!</p>
      ) : (
        <div className="space-y-3">
          {games.map((game) => (
            <div key={game.id} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
              <div>
                <p className="text-white font-medium">{game.game?.title || 'Unknown Game'}</p>
                <p className="text-gray-400 text-sm">{new Date(game.started_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className={`font-mono ${game.is_win ? 'text-green-400' : 'text-red-400'}`}>
                  {game.is_win ? '+' : '-'}${Math.abs(parseFloat(game.profit_loss)).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentGames;

