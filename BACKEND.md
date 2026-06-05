# Qur'an Chat App - Backend & Infrastructure

## Project Structure

```
├── api/                    # Vercel serverless functions
│   ├── chat.mjs           # Main chat endpoint
│   └── conversations.mjs  # Conversation management
├── lib/                   # Shared utilities
│   ├── supabase.mjs      # Supabase client initialization
│   └── gemini.mjs        # Gemini API integration
├── frontend/             # React/Vite frontend
├── scripts/              # Setup & utility scripts
│   ├── schema.sql       # Database schema (run in Supabase)
│   ├── extract-log.py   # Agentic logging
│   └── setup-db.mjs     # DB setup automation
├── .env                 # Environment variables
└── vercel.json          # Vercel deployment config
```

## Setup Steps

### 1. Database Schema (Supabase)

Copy the SQL from `scripts/schema.sql` and run it in your Supabase dashboard's SQL Editor:
- Go to Supabase Dashboard → Your Project → SQL Editor
- Create new query
- Paste contents of `scripts/schema.sql`
- Run

This creates:
- `users` table
- `conversations` table
- `messages` table
- `quran_cache` table
- `chat_logs` table
- All necessary RLS policies and indexes

### 2. Environment Variables

Add to your `.env` file:
```
VITE_SUPABASE_URL=https://ltjsiywjcjfjzbcimnwc.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_URL=https://ltjsiywjcjfjzbcimnwc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
VITE_GEMINI_API_KEY=<your-gemini-api-key>
```

### 3. Install Dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. API Endpoints

#### POST `/api/chat`
Sends a message and gets AI response.

**Request:**
```json
{
  "conversationId": "uuid",
  "userMessage": "What does the Qur'an say about mercy?",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "userMessage": {...},
  "assistantMessage": {...},
  "tokensUsed": 145
}
```

#### GET/POST/PUT/DELETE `/api/conversations`
Manage conversations.

**POST - Create:**
```json
{
  "userId": "uuid",
  "title": "My Qur'an Questions"
}
```

**GET - List:**
```json
{
  "userId": "uuid"
}
```

## Gemini API Prompt System

The system uses a specialized prompt to:
- Ground responses in Qur'anic teachings
- Cite relevant verses (Surah, Ayah)
- Provide thoughtful, academic explanations
- Maintain respectful, conversational tone
- Redirect non-Qur'anic questions appropriately

## Row Level Security (RLS)

All tables have RLS enabled:
- Users can only see their own data
- Only authenticated users can access conversations/messages
- Public read access to Qur'an cache
- Logs are private to each user

## Deployment to Vercel

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add VITE_GEMINI_API_KEY
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

vercel deploy
```
