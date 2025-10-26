-- NeonCasino Database Schema
-- Create users table with extended profile information
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  neon_coins DECIMAL(10,2) DEFAULT 1000.00,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  total_winnings DECIMAL(10,2) DEFAULT 0.00,
  total_losses DECIMAL(10,2) DEFAULT 0.00,
  games_played INTEGER DEFAULT 0,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  kyc_document_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('slots', 'blackjack', 'wheel', 'roulette')),
  min_bet DECIMAL(10,2) DEFAULT 10.00,
  max_bet DECIMAL(10,2) DEFAULT 1000.00,
  house_edge DECIMAL(5,4) DEFAULT 0.05,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  bet_amount DECIMAL(10,2) NOT NULL,
  result_amount DECIMAL(10,2) NOT NULL,
  game_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'completed' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'win', 'loss', 'bonus')),
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id UUID,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL,
  reward_coins DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Insert default games
INSERT INTO games (name, type, min_bet, max_bet, house_edge, config) VALUES
('Neon Slots', 'slots', 10.00, 500.00, 0.05, '{"reels": 5, "paylines": 25, "symbols": ["cherry", "lemon", "orange", "plum", "bell", "bar", "seven"]}'),
('Cyber Blackjack', 'blackjack', 25.00, 1000.00, 0.02, '{"decks": 6, "dealer_stands_17": true, "blackjack_pays": 1.5}'),
('Fortune Wheel', 'wheel', 5.00, 200.00, 0.08, '{"segments": 24, "multipliers": [1, 2, 5, 10, 20, 50]}'),
('Neon Roulette', 'roulette', 1.00, 100.00, 0.027, '{"type": "european", "numbers": 37}')
ON CONFLICT DO NOTHING;

-- Insert sample achievements
INSERT INTO achievements (name, description, icon, condition_type, condition_value, reward_coins) VALUES
('First Spin', 'Сыграйте свою первую игру', '🎰', 'games_played', 1, 50.00),
('High Roller', 'Поставьте более 500 NeonCoins за раз', '💎', 'max_bet', 500, 100.00),
('Lucky Seven', 'Выиграйте 7 игр подряд', '🍀', 'win_streak', 7, 200.00),
('Millionaire', 'Накопите 10,000 NeonCoins', '💰', 'total_balance', 10000, 500.00)
ON CONFLICT DO NOTHING;
