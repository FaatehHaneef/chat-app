-- Qur'an Chat App - Supabase Schema Setup
-- Run this SQL in your Supabase dashboard (SQL Editor)

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- 2. Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- 4. Quran cache table (for storing verses and tafsir)
CREATE TABLE IF NOT EXISTS quran_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  text_arabic TEXT,
  text_english TEXT,
  tafsir TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(surah_number, ayah_number)
);

ALTER TABLE quran_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON quran_cache
  FOR SELECT USING (true);

-- 5. Chat logs table (for tracking AI interactions)
CREATE TABLE IF NOT EXISTS chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  model TEXT DEFAULT 'gemini-pro',
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their logs" ON chat_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_logs_user_id ON chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_quran_cache_surah_ayah ON quran_cache(surah_number, ayah_number);
