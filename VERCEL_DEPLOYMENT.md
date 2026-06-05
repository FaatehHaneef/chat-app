# Vercel Deployment Guide

## Step 1: Connect GitHub to Vercel

1. Go to https://vercel.com
2. Click **"New Project"**
3. Select **"Import Git Repository"**
4. Search for `FaatehHaneef/chat-app`
5. Click **Import**

## Step 2: Add Environment Variables

In the Vercel dashboard for your project:

1. Go to **Settings** → **Environment Variables**
2. Add each variable below by clicking **"Add New"**

### Required Environment Variables

Add these 5 variables for **Production** (or all environments if preferred):

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://ltjsiywjcjfjzbcimnwc.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | *(your-service-role-key from Supabase dashboard)* |
| `VITE_SUPABASE_URL` | `https://ltjsiywjcjfjzbcimnwc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *(your-anon-key from Supabase dashboard)* |
| `VITE_GEMINI_API_KEY` | *(your-gemini-api-key from Google AI Studio)* |

## Step 3: Deploy

1. Click **"Deploy"** in Vercel
2. Wait for build to complete (should take 2-3 minutes)
3. You'll get a URL like: `https://chat-app-xxxxx.vercel.app`

## Step 4: Update Frontend API URL

If deployment succeeds, update your frontend `.env`:

```env
VITE_API_URL=https://chat-app-xxxxx.vercel.app
```

Then push the change:

```bash
git add .env
git commit -m "Update Vercel API URL"
git push
```

## Troubleshooting

### Build fails with "frontend/dist not found"
- Make sure `frontend` folder exists
- Check that `npm run build` runs locally: `cd frontend && npm run build`

### "Cannot find module @supabase/supabase-js"
- Run `npm install` in root: `cd frontend && npm install`

### API returns 500 errors
- Check that all 5 environment variables are set
- Verify Supabase schema was created (ran `schema.sql`)
- Check Vercel Function logs in dashboard

## Accessing Your App

Once deployed:
- **Frontend**: `https://chat-app-xxxxx.vercel.app`
- **API**: `https://chat-app-xxxxx.vercel.app/api/chat`
- **Logs**: Vercel Dashboard → Functions

---

**Done!** Your Qur'an Chat App should now be live. 🚀
