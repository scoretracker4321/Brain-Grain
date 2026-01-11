# 🚀 Quick Start Guide

Welcome to Brain Grain! Get started in 2 minutes:

## Step 1: Automated Setup

**Windows:** Double-click `setup.bat`  
**Mac/Linux:** Run `./setup.sh` in terminal  
**Any OS:** Run `npm run setup`

This installs everything automatically.

## Step 2: Get Free API Key

1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

## Step 3: Add Your Key

Open the `.env` file and replace:
```
AI_API_KEY=your_gemini_api_key_here
```
With:
```
AI_API_KEY=AIzaXXXXXXXXXXXXXX
```

## Step 4: Start Server

Run:
```bash
npm start
```

## Step 5: Open App

Visit: **http://localhost:3000**

---

## Default Login

**Admin Access:**
- Email: `admin@braingrain.com`
- Password: `admin123`

---

## Features

✅ Student registration & profiles  
✅ Assessment tracking (SEL, Critical Thinking, Leadership)  
✅ Pod management (group students)  
✅ AI-powered Day 1 session plans  
✅ Cloud sync with Firebase (optional)  
✅ Local backups & data export  

---

## Need Help?

- Setup issues: See [BACKEND_SETUP.md](BACKEND_SETUP.md)
- Architecture: See [CLOUD_SETUP_GUIDE.md](CLOUD_SETUP_GUIDE.md)
- Data storage: See [DATA_STORAGE_INFO.md](DATA_STORAGE_INFO.md)
