-- Add promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  source_tag VARCHAR(100),
  bonus_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_uses INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add promo redemptions table
CREATE TABLE IF NOT EXISTS promo_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
  bonus_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, promo_code_id)
);

-- Add KYC submissions table
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  document_front_url TEXT,
  document_back_url TEXT,
  selfie_url TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id)
);

-- Update users table to add KYC status and referral fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'NONE' CHECK (kyc_status IN ('NONE', 'PENDING', 'VERIFIED', 'REJECTED')),
ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS ref_source_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user ON promo_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user ON kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON kyc_submissions(status);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);

-- Insert some sample promo codes
INSERT INTO promo_codes (code, title, source_tag, bonus_amount, max_uses, expires_at) VALUES
('WELCOME2024', 'Welcome Bonus 2024', 'website', 500.00, NULL, '2024-12-31 23:59:59'),
('TELEGRAM100', 'Telegram Community Bonus', 'telegram', 100.00, 1000, '2024-06-30 23:59:59'),
('BIGWIN', 'Big Winner Bonus', 'promotion', 1000.00, 100, '2024-03-31 23:59:59'),
('NEWPLAYER', 'New Player Special', 'ads', 250.00, NULL, NULL)
ON CONFLICT (code) DO NOTHING;
