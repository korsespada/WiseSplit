-- Add Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'comments' 
        AND policyname = 'Public Access'
    ) THEN
        CREATE POLICY "Public Access" ON comments FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
