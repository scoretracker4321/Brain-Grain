# Brain Grain Backend Setup

## Automated Setup (Recommended)

**Windows:**
```bash
setup.bat
```
Or: `npm run setup`

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```
Or: `npm run setup`

This will:
- Create `.env` file from template
- Install all dependencies
- Verify configuration

Then:
1. Edit `.env` and add your API key
2. Run `npm start`
3. Open http://localhost:3000

## Manual Setup (Alternative)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure AI (choose one):**

   **Option A: Gemini (Recommended - Free)**
   - Get key: https://aistudio.google.com/app/apikey
   - Copy `.env.example` to `.env`
   - Set `AI_API_KEY=AIza...your_key`

   **Option B: OpenAI**
   - Get key: https://platform.openai.com/api-keys
   - Copy `.env.example` to `.env`
   - Update endpoint and key in `.env`

3. **Start server:**
   ```bash
   npm start
   ```

4. **Access app:**
   Open http://localhost:3000 in your browser

## Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
PORT=3000
AI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
AI_API_KEY=your_api_key_here
AI_MODEL=gemini-1.5-flash
```

## API Endpoints

- `GET /api/health` - Check server and AI configuration status
- `POST /api/generate-pod-plan` - Generate Day 1 session plan for a pod
  - Body: `{ podSummary: {...}, prompt: "..." }`
  - Returns: `{ success: true, plan: "...", provider: "Gemini" }`

## Security

✅ API keys are now stored server-side in `.env` (never exposed to browser)  
✅ `.gitignore` prevents committing `.env` to version control  
✅ CORS enabled for local development  

## Troubleshooting

**Port already in use:**
```bash
# Change PORT in .env file
PORT=3001
```

**AI not working:**
```bash
# Check configuration
curl http://localhost:3000/api/health
```
