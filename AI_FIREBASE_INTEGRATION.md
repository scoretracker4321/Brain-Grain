# AI Configuration via Firebase

## Overview

AI configuration is now fully integrated with Firebase, allowing you to configure your API key once and use it across all devices automatically.

## How It Works

### Automatic Flow

1. **On Page Load:**
   - Firebase connects automatically
   - AI config is loaded from Firebase (if exists)
   - Backend server is updated with the config
   - AI features are ready to use

2. **On Configuration Save:**
   - Settings saved to Firebase
   - Backend server updated immediately
   - All devices sync automatically
   - No .env file editing required

### Configuration Priority

The system checks for AI configuration in this order:

1. **Server .env file** (highest priority)
   - If `AI_API_KEY` exists in `.env`, it takes precedence
   - Good for development/testing

2. **Firebase Cloud Storage** (automatic)
   - Configured through User Profile UI
   - Synced across all devices
   - Recommended for production

3. **Fallback Template** (lowest priority)
   - Used if no configuration found
   - Shows basic template plan

## Setup Instructions

### Option 1: Firebase (Recommended)

1. Open the app at `http://localhost:3000`
2. Click **👤 User Profile** (top-right)
3. Scroll to **🤖 AI Configuration** section
4. Enter your settings:
   - **API Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
   - **API Key:** Get free key from https://aistudio.google.com/app/apikey
   - **Model:** `gemini-1.5-flash`
5. Click **"Save to Firebase"**

✅ Done! Works on all devices automatically.

### Option 2: Server .env File

1. Edit `.env` file:
   ```
   AI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
   AI_API_KEY=AIza...your_key_here
   AI_MODEL=gemini-1.5-flash
   ```

2. Restart server: `npm start`

✅ Server config takes priority over Firebase.

## Features

### ✅ Automatic Sync
- Configure once in UI
- Works on all devices
- No manual file editing

### ✅ Secure
- API keys stored in Firebase (not exposed in browser)
- Backend makes actual AI calls
- Keys never sent to client

### ✅ Flexible
- Switch between Gemini and OpenAI easily
- Update config without restarting server
- Fallback to demo templates if API fails

## API Endpoints

### Get AI Configuration
```
POST /api/ai-config/get
```
Returns current AI configuration status.

### Set AI Configuration
```
POST /api/ai-config/set
Body: { endpoint, apiKey, model }
```
Updates backend AI configuration for current session.

### Generate Pod Plan
```
POST /api/generate-pod-plan
Body: { podSummary, prompt }
```
Generates AI-powered Day 1 session plan using configured AI.

## Troubleshooting

### "Backend not configured" Error

**Solution:** Configure AI in User Profile → AI Configuration section.

### AI Config Not Loading

1. Check Firebase connection (console logs)
2. Verify you've saved config in User Profile
3. Refresh the page (Ctrl+R)

### API Key Not Working

1. Verify key is correct at https://aistudio.google.com/app/apikey
2. Check quota hasn't been exceeded
3. Try the fallback template (works without API)

## Benefits Over .env File

| Feature | .env File | Firebase |
|---------|-----------|----------|
| Configure via UI | ❌ | ✅ |
| Multi-device sync | ❌ | ✅ |
| No server restart | ❌ | ✅ |
| Shareable config | ❌ | ✅ |
| Version control safe | ⚠️ (gitignored) | ✅ |

## Migration from .env

If you have an existing `.env` file:

1. Keep it as-is (it takes priority)
2. Or migrate to Firebase:
   - Copy your API key
   - Paste in User Profile → AI Configuration
   - Save to Firebase
   - Remove from `.env` file

Both methods work simultaneously!
