# 🧠 Brain Grain One Platform

**The Operating System for Learning** - Measuring readiness, behavior & emotional safety before marks appear.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/brain-grain)

## 🌐 Live Demo

- **Landing Page**: [brain-grain-one.html](https://brain-grain.vercel.app/brain-grain-one.html)
- **Main Platform**: [index.html](https://brain-grain.vercel.app/index.html)
- **Demo Login**: admin@braingrain.com / admin123

## 📚 What's Included

### 1. **Brain Grain One** (Landing Page)
Unified entry point to all showcase materials with animated cards and professional design.

### 2. **Main Platform** (index.html)
Full operational system with:
- Student registration & management
- Pod-based learning management
- AI-powered session planning (Gemini API)
- Interactive assessments (SEL, Critical Thinking, Leadership)
- Deep analytics with correlations
- Firebase cloud sync

### 3. **Showcase Materials**
- **Journey Map**: Student development roadmap (ages 12-22)
- **Platform Showcase**: Feature walkthrough presentation
- **Impact Dashboard**: Metrics, case studies, unit economics

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
# Copy .env.example to .env and add your keys
AI_API_KEY=your_gemini_api_key_here

# Start the server
npm start

# Open in browser
# http://localhost:3000
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Or click the "Deploy with Vercel" button above!

## 📁 Project Structure

```
brain-grain/
├── brain-grain-one.html      # Landing page (NEW!)
├── index.html                 # Main platform
├── Brain Grain Journey.html   # Journey map presentation
├── Brain Grain Platform (2).html  # Feature showcase
├── Impact Dashboard.html      # Impact metrics
├── server.js                  # Backend API (Express + Gemini)
├── firebase-config.js         # Cloud sync configuration
├── utils.js                   # Storage helpers
├── admin.js                   # Admin functions
├── analytics.js               # Analytics engine
├── deep-analytics.js          # Statistical analysis
├── assessment-app.js          # Interactive assessment
├── config.js                  # Centralized configuration
├── vercel.json               # Deployment configuration
└── assets/                    # Images and resources
```

## 🔑 Environment Variables

Required for deployment:

```env
AI_API_KEY=your_gemini_api_key
NODE_ENV=production
```

Optional (for Firebase):
```env
FIREBASE_API_KEY=your_firebase_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
```

## 🎯 Features

### Student Management
- Comprehensive registration forms
- Academic tracking (subject-wise scores)
- Parent/guardian information
- Custom exam types and scoring

### Pod-Based Learning
- Create learning groups
- AI-generated session plans
- Differentiation strategies
- Student roles and observation signals

### Assessment System
- Interactive SEL assessment
- Critical thinking evaluation
- Leadership measurement
- Instant feedback and recommendations

### Analytics
- Cohort statistics
- Correlation analysis
- At-risk student identification
- Behavioral trend tracking

### Cloud Sync
- Firebase Realtime Database integration
- Auto-sync across devices
- Backup and recovery
- Multi-device support

## 📊 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express
- **AI**: Google Gemini API
- **Database**: localStorage + Firebase
- **Deployment**: Vercel
- **Analytics**: Custom statistical engine

## 🔒 Security

- API keys stored securely in environment variables
- Firebase security rules (recommended setup)
- CORS configured for specific origins
- Input validation and sanitization

## 📱 Responsive Design

Fully responsive and optimized for:
- Desktop (1920x1080)
- Laptop (1366x768)
- Tablet (768x1024)
- Mobile (375x667)

## 🧪 Testing

```bash
# Run tests
npm test

# Quick smoke test
node smoke-test.js
```

## 📖 Documentation

- [START_HERE.md](START_HERE.md) - First-time setup guide
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Detailed deployment instructions
- [COMPLETE_WORKFLOW_GUIDE.md](COMPLETE_WORKFLOW_GUIDE.md) - Pod plan workflow
- [DEEP_ANALYTICS_GUIDE.md](DEEP_ANALYTICS_GUIDE.md) - Analytics documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - See LICENSE file for details

## 👥 Team

**Brain Grain** - Chennai, Tamil Nadu, India

## 🌟 Support

- **Issues**: Create a GitHub issue
- **Email**: support@braingrain.com (if available)
- **Documentation**: Check the `/docs` folder

## 🗺️ Roadmap

- [x] Core platform functionality
- [x] AI session planning
- [x] Cloud sync with Firebase
- [x] Deep analytics engine
- [x] Showcase presentations
- [x] Unified landing page
- [ ] Parent portal
- [ ] Mobile app
- [ ] Advanced ML predictions
- [ ] Multi-language support

## 📞 Contact

For demos, partnerships, or inquiries:
- Website: [brain-grain.vercel.app](https://brain-grain.vercel.app)
- Location: Chennai, Tamil Nadu, India

---

Built with ❤️ by the Brain Grain team | 2026
