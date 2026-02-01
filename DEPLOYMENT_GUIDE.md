# Brain Grain One - Deployment Guide

## 🚀 Deploy to Vercel (Recommended)

Your Brain Grain platform is ready to deploy! Follow these steps to make it accessible to anyone with a link.

### Prerequisites
- Git installed on your computer
- GitHub account
- Vercel account (free tier works perfectly)

### Step 1: Push to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Brain Grain One - Complete Platform"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/brain-grain.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Website (Easiest)
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your `brain-grain` repository
5. Configure:
   - **Framework Preset**: Other
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
   - **Install Command**: `npm install`
6. Add Environment Variables:
   - `AI_API_KEY` = Your Gemini API key (get from https://aistudio.google.com/app/apikey)
   - `NODE_ENV` = `production`
7. Click "Deploy"

#### Option B: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - What's your project's name? brain-grain
# - In which directory is your code located? ./
# - Want to override settings? N

# Deploy to production
vercel --prod
```

### Step 3: Access Your Platform

After deployment, Vercel will give you URLs like:
- **Main Landing**: `https://brain-grain.vercel.app`
- **Platform**: `https://brain-grain.vercel.app/index.html`
- **Journey**: `https://brain-grain.vercel.app/Brain%20Grain%20Journey.html`
- **Showcase**: `https://brain-grain.vercel.app/Brain%20Grain%20Platform%20(2).html`
- **Impact**: `https://brain-grain.vercel.app/Impact%20Dashboard.html`

### Step 4: Configure Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain (e.g., `app.braingrain.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (automatic)

## 📱 Access URLs

Once deployed, share these links:

### For Investors/Stakeholders
- **Landing Page**: `https://brain-grain.vercel.app/brain-grain-one.html`
- Start here for the full overview

### For Demos
- **Operational Platform**: `https://brain-grain.vercel.app/index.html`
- Login: admin@braingrain.com / admin123

### For Presentations
- **Journey Map**: `https://brain-grain.vercel.app/Brain%20Grain%20Journey.html`
- **Feature Showcase**: `https://brain-grain.vercel.app/Brain%20Grain%20Platform%20(2).html`
- **Impact Metrics**: `https://brain-grain.vercel.app/Impact%20Dashboard.html`

## 🔒 Security Notes

### Environment Variables (CRITICAL)
Never commit these to GitHub:
- `AI_API_KEY` - Your Gemini API key
- `FIREBASE_API_KEY` - Your Firebase credentials (if using)

These should be set in:
1. Vercel Dashboard → Settings → Environment Variables
2. Local `.env` file (already gitignored)

### Public Access
All HTML pages are publicly accessible. If you need authentication:
1. Add Vercel Password Protection (Settings → Deployment Protection)
2. Or implement custom authentication in server.js

## 🔄 Continuous Deployment

Once connected to GitHub:
1. Push changes: `git push`
2. Vercel auto-deploys your changes
3. Preview deployments for branches
4. Production deployment on `main` branch

## 🐛 Troubleshooting

### Issue: 404 on HTML files
- **Fix**: Ensure vercel.json routes are correct (already configured)

### Issue: API calls fail
- **Fix**: Check environment variables in Vercel dashboard
- Verify `AI_API_KEY` is set correctly

### Issue: Firebase not syncing
- **Fix**: Add Firebase config to Vercel environment variables
- Or update firebase-config.js with production credentials

### Issue: Large file uploads failing
- **Fix**: Vercel has 100MB limit for free tier
- Consider using CDN for large assets

## 📊 Monitoring

### Vercel Dashboard
- **Analytics**: View page visits, performance
- **Logs**: Check serverless function logs
- **Deployments**: View deployment history

### Usage Limits (Free Tier)
- 100GB bandwidth/month
- 100 deployments/day
- Serverless function execution time: 10 seconds

## 🎯 Next Steps

1. ✅ Deploy to Vercel
2. ✅ Share landing page link
3. ✅ Test all showcase pages
4. ✅ Verify demo login works
5. ✅ Monitor analytics
6. 🔜 Consider custom domain
7. 🔜 Set up monitoring/alerts

## 💡 Pro Tips

1. **Preview Deployments**: Create a branch, push changes, get a preview URL
2. **Rollback**: Instant rollback to any previous deployment
3. **Edge Caching**: Static files cached at edge locations worldwide
4. **HTTPS**: Automatic SSL certificates
5. **GitHub Integration**: Auto-deploy on every push

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- GitHub Issues: Create issues in your repository
- Community: Vercel Discord, GitHub Discussions

---

**Ready to deploy?** Just run `vercel` in your project directory! 🚀
