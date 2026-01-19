# Deploy Brain Grain Backend to Vercel

## Steps to Deploy

### 1. Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### 2. Deploy via Vercel Dashboard (Easiest)

1. **Go to**: https://vercel.com/
2. **Sign up/Login** with your GitHub account
3. **Click "Add New"** → "Project"
4. **Import** your GitHub repository: `scoretracker4321/Brain-Grain`
5. **Configure**:
   - Framework Preset: Other
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Install Command: `npm install`
6. **Environment Variables** - Add these:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   (Or add OPENAI_API_KEY if using OpenAI)
7. **Click "Deploy"**
8. **Wait 2-3 minutes** for deployment

### 3. Get Your Backend URL

After deployment, you'll get a URL like:
```
https://brain-grain.vercel.app
```

### 4. Update Frontend Configuration

Edit `ai-config.js` line ~805 and replace:
```javascript
backendUrl = 'https://YOUR-PROJECT-NAME.vercel.app/api/generate-pod-plan';
```

With your actual Vercel URL:
```javascript
backendUrl = 'https://brain-grain.vercel.app/api/generate-pod-plan';
```

### 5. Commit and Push

```bash
git add ai-config.js
git commit -m "Update backend URL to use Vercel deployment"
git push
```

### 6. Test on GitHub Pages

Visit: https://scoretracker4321.github.io/Brain-Grain/

AI plan generation should now work!

---

## Alternative: Deploy via CLI

```bash
cd "a:\Brain Grain"
vercel login
vercel --prod
```

Follow the prompts and copy the deployment URL.

---

## Environment Variables

Your backend needs these environment variables in Vercel:

- **GEMINI_API_KEY** (if using Gemini) - Get from: https://aistudio.google.com/apikey
- **OPENAI_API_KEY** (if using OpenAI) - Get from: https://platform.openai.com/api-keys

Add them in: Vercel Dashboard → Your Project → Settings → Environment Variables

---

## Troubleshooting

### CORS Errors
If you get CORS errors, the backend already has CORS enabled. Check that:
1. Your Vercel deployment is successful
2. The URL in `ai-config.js` is correct
3. Environment variables are set in Vercel

### 404 Errors
Make sure the URL ends with `/api/generate-pod-plan`

### 500 Errors
Check Vercel logs: Dashboard → Your Project → Logs
Usually means missing API key environment variable.

---

## Cost

Vercel Free Tier includes:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless Functions
- ✅ Custom domain support

This is **free** for personal projects!
