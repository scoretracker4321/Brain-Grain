// Backend server for Brain Grain - handles AI requests securely
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS configured to allow GitHub Pages
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://scoretracker4321.github.io'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// AI Configuration - reads from .env or can be fetched from Firebase
let AI_CONFIG = {
  endpoint: process.env.AI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  apiKey: process.env.AI_API_KEY || '',
  model: process.env.AI_MODEL || 'gemini-1.5-flash',
  source: 'env' // 'env' or 'firebase'
};

// In-memory cache for Firebase AI config (to avoid repeated calls)
let firebaseAIConfig = null;
let lastConfigFetch = 0;
const CONFIG_CACHE_MS = 60000; // Cache for 1 minute

function isGeminiEndpoint(url) {
  return typeof url === 'string' && url.includes('generativelanguage.googleapis.com');
}

// Generate Day 1 Pod Plan - AI endpoint
app.post('/api/generate-pod-plan', async (req, res) => {
  try {
    const { podSummary, prompt, studentsData } = req.body;

    if (!podSummary || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: podSummary and prompt'
      });
    }

    if (!AI_CONFIG.apiKey) {
      return res.status(503).json({
        success: false,
        error: 'AI API key not configured on server. Set AI_API_KEY in .env file.',
        useFallback: true
      });
    }

    const usingGemini = isGeminiEndpoint(AI_CONFIG.endpoint);
    const url = usingGemini
      ? `${AI_CONFIG.endpoint}?key=${AI_CONFIG.apiKey}`
      : AI_CONFIG.endpoint;

    // System instruction for AI persona
    const systemInstruction = `You are an expert educational mentor and session planner for the 'Brain Grain' learning pod. Your goal is to generate a detailed, highly engaging, and differentiated 45-minute Day 1 session plan. The plan must be specifically tailored to the individual learning needs, Social Emotional Learning (SEL) status, and academic gaps of each student provided in the input data. Your output must be a single, valid JSON object.`;

    // Enhanced prompt with structured data and clear instructions
    const enhancedPrompt = `${systemInstruction}

${prompt}

Student Data:
${studentsData || podSummary}

CRITICAL INSTRUCTIONS:
1. For the 'differentiation' section in each activity, you MUST reference and utilize the academic_status, sel_status, and intervention_tags for EVERY student provided.
2. Ensure the total activity time sums to 45 minutes.
3. Output ONLY valid JSON matching this exact schema:

{
  "session_title": "string (catchy, relevant title)",
  "objective": "string (main goal of the session)",
  "duration_minutes": 45,
  "student_roles": {
    "role_list": ["Role 1", "Role 2", "Role 3", ...],
    "instructions": ["Simple instruction for Role 1", "Simple instruction for Role 2", ...],
    "rotation_note": "string (reminder about rotating roles)"
  },
  "activities": [
    {
      "activity_title": "string",
      "duration_minutes": number,
      "description": "string (purpose and execution)",
      "differentiation": ["specific instruction for Student 1", "specific instruction for Student 2", ...],
      "signals": "string (what mentor should observe)"
    }
  ]
}

ROLE_DISTRIBUTION_RULES (MANDATORY):
- EACH session MUST include clearly defined student roles.
- EVERY student in the pod MUST be assigned exactly one role.
- Roles MUST guarantee participation without requiring speaking or writing.
- Roles MUST be simple, neutral, and non-hierarchical.
- Roles MUST rotate across sessions to avoid fixed identity or labelling.
- The student_roles section MUST include:
  - a short list of roles (matching the number of students in the pod),
  - one simple instruction per role,
  - wording that allows the mentor to assign roles verbally on the spot.
- Roles MUST support regulation, observation, connection, or task movement, NOT academic performance.
- Examples of good roles: "Time Keeper" (watches timer), "Materials Helper" (hands out items), "Observer" (notices group energy), "Anchor" (starts each activity), "Bridge" (connects ideas between activities).

Generate the complete Day 1 session plan now:`;

    const body = usingGemini
      ? { 
          contents: [{ parts: [{ text: enhancedPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            responseMimeType: "application/json"
          }
        }
      : {
          model: AI_CONFIG.model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: enhancedPrompt }
          ],
          temperature: 0.7,
          max_tokens: 8192,
          response_format: { type: "json_object" }
        };

    const headers = usingGemini
      ? { 'Content-Type': 'application/json' }
      : {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`
        };

    const aiResponse = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (aiResponse.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests (429). Please wait 1 minute before trying again.'
      });
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return res.status(aiResponse.status).json({
        success: false,
        error: `AI request failed: ${aiResponse.status}`,
        details: errorText
      });
    }

    const data = await aiResponse.json();
    let text = usingGemini
      ? (data?.candidates?.[0]?.content?.parts?.[0]?.text)
      : (data?.choices?.[0]?.message?.content);

    if (text && usingGemini) {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    res.json({
      success: true,
      plan: text || 'AI response was empty',
      model: AI_CONFIG.model,
      provider: usingGemini ? 'Gemini' : 'OpenAI'
    });

  } catch (error) {
    console.error('Server error generating pod plan:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      useFallback: true
    });
  }
});

// Get AI config status
app.post('/api/ai-config/get', (req, res) => {
  res.json({
    success: true,
    config: {
      endpoint: AI_CONFIG.endpoint,
      hasApiKey: !!AI_CONFIG.apiKey,
      model: AI_CONFIG.model,
      source: AI_CONFIG.source
    }
  });
});

// Update AI config from Firebase
app.post('/api/ai-config/set', (req, res) => {
  try {
    const { endpoint, apiKey, model } = req.body;

    if (!endpoint || !apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing endpoint or apiKey'
      });
    }

    // Update in-memory config
    AI_CONFIG.endpoint = endpoint;
    AI_CONFIG.apiKey = apiKey;
    AI_CONFIG.model = model || 'gemini-1.5-flash';
    AI_CONFIG.source = 'firebase';

    console.log('✓ AI config updated from Firebase:', {
      provider: isGeminiEndpoint(endpoint) ? 'Gemini' : 'OpenAI',
      model: AI_CONFIG.model
    });

    res.json({
      success: true,
      message: 'AI config updated successfully'
    });
  } catch (error) {
    console.error('Error updating AI config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiConfigured: !!AI_CONFIG.apiKey,
    endpoint: AI_CONFIG.endpoint.includes('generativelanguage') ? 'Gemini' : 'OpenAI',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Brain Grain server running on http://localhost:${PORT}`);
  console.log(`📊 AI configured: ${AI_CONFIG.apiKey ? '✓ Yes' : '✗ No - Set AI_API_KEY in .env'}`);
  console.log(`🤖 AI Provider: ${AI_CONFIG.endpoint.includes('generativelanguage') ? 'Gemini' : 'OpenAI'}`);
});
