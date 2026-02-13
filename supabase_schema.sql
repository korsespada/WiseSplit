-- Create Users table (handled by Telegram Auth mainly, but we store profiles)
CREATE TABLE users (
  id BIGINT PRIMARY KEY, -- Telegram User ID
  first_name TEXT NOT NULL,
  username TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Groups table
CREATE TABLE groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Group Members join table
CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Create Expenses table
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  payer_id BIGINT REFERENCES users(id),
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Splits table (who owes what for each expense)
CREATE TABLE splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id), -- The person who owes
  amount DECIMAL(10, 2) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE
);

-- Row Level Security (RLS) Policies (Basic for now)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE splits ENABLE ROW LEVEL SECURITY;

-- Allow read/write for all (logic handled in app for MVP, refine later)
CREATE POLICY "Public Access" ON users FOR ALL USING (true);
CREATE POLICY "Public Access" ON groups FOR ALL USING (true);
CREATE POLICY "Public Access" ON group_members FOR ALL USING (true);
CREATE POLICY "Public Access" ON expenses FOR ALL USING (true);
CREATE POLICY "Public Access" ON splits FOR ALL USING (true);
