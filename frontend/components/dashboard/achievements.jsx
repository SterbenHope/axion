import React from 'react';

const Achievements = ({ achievements, loading }) => {
  if (loading) {
    return (
      <div className="bg-black/50 border border-purple-500/30 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Achievements</h3>
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
      <h3 className="text-xl font-bold text-white mb-4">Achievements</h3>
      {achievements.length === 0 ? (
        <p className="text-gray-400">No achievements yet. Keep playing to unlock them!</p>
      ) : (
        <div className="space-y-3">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="flex items-center p-3 bg-gray-800/50 rounded-lg">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center mr-3">
                <span className="text-yellow-400">🏆</span>
              </div>
              <div>
                <p className="text-white font-medium">{achievement.achievements?.name || 'Achievement'}</p>
                <p className="text-gray-400 text-sm">{achievement.achievements?.description || 'Description'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Achievements;

