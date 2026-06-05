# Qur'an Chat App - 8x Play Engineer Assignment

An AI-powered conversational application for Muslims to ask questions about the Qur'an and get clear, respectful, grounded answers. Built with React, Supabase, and Gemini API.

## 🎯 Core Features

- **Chat Interface**: Beautiful, responsive chat UI for asking questions
- **AI Responses**: Powered by Google Gemini API with specialized Qur'an knowledge
- **Conversation History**: Store and manage multiple conversations
- **Message Persistence**: All messages saved to Supabase
- **Mobile Ready**: Works on real iOS devices with React Native
- **Authentication**: User authentication via Supabase Auth (optional)

## 🛠 Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **AI/LLM**: Google Gemini API
- **Deployment**: Vercel
- **Real-time**: Supabase Realtime (optional)

## 📋 Prerequisites

- Node.js 18+
- Supabase account with project created
- Google Gemini API key
- Git

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd quran-chat-app
npm run install-all
```

### 2. Setup Database

**Run this SQL in your Supabase Dashboard (SQL Editor):**

Copy the entire contents of `scripts/schema.sql` and paste it into Supabase's SQL Editor, then execute.

This creates:
- `users` table
- `conversations` table
- `messages` table
- `quran_cache` table
- `chat_logs` table
- All RLS policies and indexes

### 3. Configure Environment Variables

Create/update `.env` in the root directory:

```env
# Supabase
VITE_SUPABASE_URL=https://ltjsiywjcjfjzbcimnwc.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_URL=https://ltjsiywjcjfjzbcimnwc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Gemini API
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

**Get your keys from:**
- Supabase: Dashboard → Settings → API → Project Keys
- Gemini: [Google AI Studio](https://aistudio.google.com/app/apikey)

### 4. Run Development Server

```bash
npm run dev
```

Opens at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
quran-chat-app/
├── frontend/              # React/Vite frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.jsx       # Main app component
│   │   └── api.js        # API client
│   └── package.json
├── api/                  # Vercel serverless functions
│   ├── chat.mjs         # Chat endpoint
│   └── conversations.mjs# Conversation CRUD
├── lib/                 # Shared utilities
│   ├── supabase.mjs    # Supabase client
│   └── gemini.mjs      # Gemini integration
├── scripts/            # Setup & utilities
│   ├── schema.sql     # Database schema
│   └── extract-log.py # Agentic logging
├── .env               # Environment variables
├── vercel.json        # Vercel config
├── package.json       # Root dependencies
└── BACKEND.md         # Backend documentation
```

## 🔌 API Endpoints

All endpoints are deployed to Vercel and can be called from the frontend.

### POST `/api/chat`

Send a message and get AI response.

**Request:**
```json
{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "userMessage": "What does the Qur'an say about patience?",
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "userMessage": { "id": "...", "content": "What does..." },
  "assistantMessage": { "id": "...", "content": "The Qur'an..." },
  "tokensUsed": 245
}
```

### GET/POST/PUT/DELETE `/api/conversations`

Manage conversations.

**Create:**
```json
{
  "userId": "user-uuid",
  "title": "Qur'an Questions"
}
```

## 🔐 Security

- **Row Level Security (RLS)**: All tables protected with RLS policies
- **User isolation**: Users can only access their own data
- **Public read**: Qur'an cache is publicly readable
- **Service role**: Backend uses service role key for admin operations
- **Secrets**: All keys in environment variables

## 📤 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add VITE_GEMINI_API_KEY
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy
vercel deploy --prod
```

## 📊 Gemini AI System

The app uses a specialized system prompt to:

1. **Ground in Qur'anic teachings** - All responses based on Qur'anic content
2. **Cite verses** - References (e.g., "Surah Al-Baqarah, verse 255")
3. **Academic rigor** - Scholarly interpretations and context
4. **Conversational** - Accessible yet authoritative tone
5. **Scoped** - Redirects non-Qur'anic questions appropriately

### Conversation Flow

```
User Question
    ↓
[Insert to DB] → [Fetch History] → [Call Gemini with context]
    ↓                                     ↓
              [AI Response]
                ↓
        [Insert to DB] → [Log interaction] → [Return to frontend]
```

## 🧪 Testing

### Manual Testing

1. Start dev server: `npm run dev`
2. Create a conversation
3. Send a test message
4. Check Supabase dashboard to verify messages are saved
5. Check `.claude-logs/` for agentic logging

### Check Logs

```bash
# Count log files
ls -1 .claude-logs/*.md | wc -l

# View latest log
cat .claude-logs/*.md | tail -50
```

## 📝 Agentic Logging

All AI interactions are automatically logged in `.claude-logs/`:

- Every prompt sent to the AI agent
- Every response received
- Timestamps and context
- Used for evaluation of how you worked with AI

**Important:** Do NOT gitignore `.claude-logs/` - these are part of your submission.

## 🐛 Troubleshooting

### "Missing VITE_SUPABASE_URL"
- Check `.env` file exists in root directory
- Verify all VITE_ variables are set
- Restart dev server after changing .env

### "RLS policy violation"
- Ensure you ran the full `schema.sql` in Supabase
- Check that users table has proper auth references
- Verify RLS policies are created

### "Gemini API error"
- Check `VITE_GEMINI_API_KEY` is correct
- Verify API key is valid in [Google AI Studio](https://aistudio.google.com)
- Check rate limits haven't been exceeded

### "Supabase connection refused"
- Verify `SUPABASE_URL` is correct
- Check internet connection
- Ensure Supabase project is active in dashboard

## 📦 Build & Submit

### For 8x Submission

1. **GitHub Repository** ✅
   - Push all code including `.claude-logs/`
   - Include this README
   - Add setup instructions

2. **Agentic Logs**
   ```bash
   zip -r claude-logs.zip .claude-logs/
   ```
   - Submit the zip file with your application

3. **Loom Video** (4 min max)
   - Show app running on real iOS device
   - Demonstrate chat functionality
   - Explain key design/code decisions
   - Your face visible throughout

## 📞 Support

For questions about the assignment, contact: theo@8x.social

## 📄 License

Private - 8x Application Project

---

**Built with ❤️ for the 8x Play Engineer program**
