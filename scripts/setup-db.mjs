import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ltjsiywjcjfjzbcimnwc.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0anNpeXdqY2pmanpiY2ltbndjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY1MTcyNCwiZXhwIjoyMDk2MjI3NzI0fQ.9HYaPYQ1r-Qm4hkYFcjcHPvH0oV5pYola_6HmPjlONo";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log("🚀 Setting up Supabase database schema...");

  try {
    // Create users table
    console.log("📝 Creating users table...");
    const { error: usersError } = await supabase.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view their own data" ON users
          FOR SELECT USING (auth.uid() = id);
      `,
    });

    if (usersError && !usersError.message.includes("already exists"))
      throw usersError;
    console.log("✅ Users table ready");

    // Create conversations table
    console.log("📝 Creating conversations table...");
    const { error: convError } = await supabase.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          title TEXT DEFAULT 'New Conversation',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view their conversations" ON conversations
          FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can create conversations" ON conversations
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update their conversations" ON conversations
          FOR UPDATE USING (auth.uid() = user_id);
      `,
    });

    if (convError && !convError.message.includes("already exists"))
      throw convError;
    console.log("✅ Conversations table ready");

    // Create messages table
    console.log("📝 Creating messages table...");
    const { error: msgError } = await supabase.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
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
      `,
    });

    if (msgError && !msgError.message.includes("already exists"))
      throw msgError;
    console.log("✅ Messages table ready");

    // Create quran_cache table
    console.log("📝 Creating quran_cache table...");
    const { error: quranError } = await supabase.rpc("exec", {
      sql: `
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
        CREATE POLICY "Allow read access to all" ON quran_cache
          FOR SELECT USING (true);
      `,
    });

    if (quranError && !quranError.message.includes("already exists"))
      throw quranError;
    console.log("✅ Quran cache table ready");

    // Create chat_logs table (for tracking AI responses)
    console.log("📝 Creating chat_logs table...");
    const { error: logsError } = await supabase.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS chat_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
          prompt TEXT,
          response TEXT,
          model TEXT DEFAULT 'gemini-pro',
          tokens_used INTEGER,
          created_at TIMESTAMP DEFAULT NOW()
        );
        ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view their logs" ON chat_logs
          FOR SELECT USING (auth.uid() = user_id);
      `,
    });

    if (logsError && !logsError.message.includes("already exists"))
      throw logsError;
    console.log("✅ Chat logs table ready");

    console.log("✨ Database setup complete!");
  } catch (error) {
    console.error("❌ Error setting up database:", error);
  }
}

setupDatabase();
