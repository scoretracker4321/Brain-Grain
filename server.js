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
  apiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '',
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
    const systemInstruction = `You are an expert educational mentor and session planner for the 'Brain Grain' learning pod. You create DETAILED, SPECIFIC, and ACTIONABLE 45-minute session plans with RICH CONTENT that mentors can execute immediately.`;

    // Enhanced prompt with structured data and clear instructions
    const enhancedPrompt = `${systemInstruction}

${prompt}

Student Data:
${studentsData || podSummary}

MANDATORY REQUIREMENTS - YOUR PLAN WILL BE REJECTED IF THESE ARE NOT MET:

1. SESSION STRUCTURE:
   - Must include 4-5 detailed activities (NOT 3 generic ones)
   - Total duration must equal 45 minutes exactly
   - Each activity must have 6-20 minutes duration (not 5 min, not 25 min)
   - Activities must build on each other progressively

2. ACTIVITY DESCRIPTIONS - MUST BE DETAILED:
   ❌ BAD: "Students share one word about how they feel today"
   ✅ GOOD: "Each student takes turns sharing one word describing their current emotion. Facilitator models first with 'curious'. Go around circle - no judgment, just acknowledgment. Takes 6-8 minutes for 4 students."
   
   ❌ BAD: "Collaborative problem-solving exercise"
   ✅ GOOD: "Present the Tower Challenge: using only 20 straws, 30cm tape, and 10 paper clips, build the tallest free-standing tower in 15 minutes. Tower must stand for 10 seconds unassisted. Groups of 2-3 work together, then present their design and explain their problem-solving strategy."

   - Each description must be 2-4 sentences minimum
   - Include specific materials, time limits, success criteria
   - Explain HOW to facilitate, not just WHAT to do

3. DIFFERENTIATION - MUST BE STUDENT-SPECIFIC:
   - Create one instruction for EACH student by name
   - Reference their actual needs from the student data
   - Be specific about HOW to adapt for each student
   
   ❌ BAD: ["Support struggling students", "Challenge advanced learners"]
   ✅ GOOD: [
     "Aarav (low academic): Start with visual fraction bars, then transition to numeric problems",
     "Priya (developing): Pair with Aarav to teach - explaining helps solidify understanding",
     "Arjun (progressing): Challenge with multi-step problems, celebrate strategic thinking",
     "Ananya (advanced): Invite to create her own challenging problem for the group"
   ]

4. OBSERVATION SIGNALS - MUST BE SPECIFIC:
   ❌ BAD: "Monitor student engagement"
   ✅ GOOD: "Watch for: eye contact during discussions, asking clarifying questions, helping peers without taking over, celebrating others' success. Red flags: disengagement, dominating conversation, frustration without asking for help, giving up quickly."

5. STUDENT ROLES (MANDATORY):
   - Must include student_roles object with role_list and instructions arrays
   - Number of roles must match number of students
   - Roles must be participation-based, not academic (Time Keeper, Materials Helper, Observer, Anchor, Bridge)
   - Include rotation_note explaining why roles matter

6. JSON OUTPUT STRUCTURE:
{
  "session_title": "Engaging title (not generic like 'Follow-up Session')",
  "objective": "Detailed objective with specific skills/outcomes (30-50 words)",
  "duration_minutes": 45,
  "student_roles": {
    "role_list": ["Role 1", "Role 2", "Role 3", "Role 4"],
    "instructions": ["Specific instruction 1", "Specific instruction 2", "Specific instruction 3", "Specific instruction 4"],
    "rotation_note": "Why we rotate and how it helps (20-40 words)"
  },
  "activities": [
    {
      "activity_title": "Specific Activity Name (not 'Warm-Up Circle')",
      "duration_minutes": 8,
      "description": "DETAILED 2-4 sentence description with materials, process, and success criteria",
      "differentiation": [
        "Student 1 Name: Specific adaptation for their needs",
        "Student 2 Name: Specific adaptation for their needs",
        "Student 3 Name: Specific adaptation for their needs",
        "Student 4 Name: Specific adaptation for their needs"
      ],
      "signals": "SPECIFIC observable behaviors to watch for and red flags to notice (40-60 words)"
    }
  ]
}

GENERATE A RICH, DETAILED, FACILITATOR-READY SESSION PLAN NOW:`;

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
        error: 'AI service rate limit reached (429). Please wait 1 minute before trying again.',
        useFallback: true
      });
    }

    if (aiResponse.status === 503) {
      const errorText = await aiResponse.text();
      console.error('AI API overloaded:', errorText);
      return res.status(503).json({
        success: false,
        error: 'AI service temporarily overloaded. Please try again in a few moments.',
        details: errorText,
        useFallback: true
      });
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return res.status(aiResponse.status).json({
        success: false,
        error: `AI request failed: ${aiResponse.status}`,
        details: errorText,
        useFallback: true
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

// Test plan generation endpoint - returns enhanced plan directly
app.get('/api/test-plan', (req, res) => {
  const enhancedPlan = {
    session_title: 'Welcome Circle - Building Trust & Connection',
    objective: 'Establish emotional safety, introduce Brain Grain approach, build initial peer connections through structured name-sharing, create a visual group agreement, and practice active listening skills that will be foundational for all future sessions.',
    duration_minutes: 45,
    student_roles: {
      role_list: ['Time Keeper', 'Materials Helper', 'Energy Observer', 'Connection Builder'],
      instructions: [
        'Watch timer, give 2-minute and 30-second warnings during activities',
        'Distribute markers, paper, or any materials needed for activities',
        'Notice group energy (quiet/loud, engaged/distracted) and share observations',
        'Help connect ideas between speakers, notice who hasn\'t spoken yet'
      ],
      rotation_note: 'Roles rotate each session to avoid labeling and ensure everyone experiences different participation modes. Today is just practice - don\'t stress perfection.'
    },
    activities: [
      {
        activity_title: 'Opening Name Circle - Who Am I?',
        duration_minutes: 8,
        description: 'Facilitator models first: share name, favorite snack, one emoji that describes you today. Go around circle (clockwise), everyone shares same format. Facilitator actively listens, repeats each name, asks one follow-up question per person to show genuine interest.',
        differentiation: [
          'Aarav: Ask about favorite superhero instead of emoji if he seems hesitant',
          'Priya: Invite her to draw her emoji if verbal expression is challenging',
          'Arjun: Physical movement - let him stand/stretch while sharing if needed',
          'Ananya: Ask her to notice patterns in responses (leadership practice)'
        ],
        signals: 'Watch for: eye contact, voice volume, fidgeting, genuine smiles vs. forced. Red flags: silence, looking away, crossed arms. Adjust pace if anyone shows discomfort - this is safety-building, not performance.'
      },
      {
        activity_title: 'Group Agreement Co-Creation',
        duration_minutes: 12,
        description: 'Facilitator asks: "What helps you feel safe to try, fail, and learn?" Collect 4-6 ideas from group (one per student if possible). Write on chart paper. Transform into simple rules using student language. Everyone signs/draws on agreement poster. This is THEIR agreement, not teacher-imposed.',
        differentiation: [
          'Aarav: Prompt with "When have you felt brave to try something new?"',
          'Priya: Offer drawing option instead of writing words',
          'Arjun: Accept physical demonstrations of ideas (e.g., showing "no interrupting")',
          'Ananya: Invite her to suggest organizing framework if discussion gets scattered'
        ],
        signals: 'Listen for: ownership language ("we should", "I need"), specific examples, consensus-building. Intervene if ideas conflict - guide negotiation, don\'t impose. Success = genuine buy-in, not perfect rules.'
      },
      {
        activity_title: 'Connection Web - Finding Commonalities',
        duration_minutes: 15,
        description: 'Stand in circle. Facilitator holds ball of yarn, shares "I love reading" - throws yarn to someone who also loves reading. That person holds strand, shares new statement, throws to next. Continue until web connects everyone. Visual metaphor: we\'re stronger connected than alone. End with "gently place web on floor" - discuss interdependence.',
        differentiation: [
          'Aarav: Prompt academic interests ("I like solving puzzles") to validate strengths',
          'Priya: Allow emotions/feelings ("I feel happy when..." statements)',
          'Arjun: Let him move around circle vs. standing still if restless',
          'Ananya: Challenge her to find connection with quietest person first'
        ],
        signals: 'Observe: Who connects easily? Who struggles to find commonality (may need prompting)? Who throws gently vs. forcefully? Web strength = how much we WANT to connect, not just doing activity. Celebrate "small" connections.'
      },
      {
        activity_title: 'Closing Reflection - One Word Check-Out',
        duration_minutes: 10,
        description: 'Quick round: everyone shares ONE WORD describing how they feel leaving today. Facilitator records words on board/paper (visual validation). Ask: "How do these words compare to when we started?" Homework (optional): "Notice one time this week you feel [your word from today]. Tell us next time." End with appreciation: "Thank you for your courage today."',
        differentiation: [
          'Aarav: Validate specific thinking/contributions observed',
          'Priya: Normalize emotional language - feelings are data, not weakness',
          'Arjun: Movement-based - let him walk to board to write/point at word',
          'Ananya: Ask her to notice leadership moments she saw in others'
        ],
        signals: 'Final check: positive shift from start? If words are negative (bored, tired), don\'t dismiss - acknowledge, ask what would help next time. Success = honest expression, not fake positivity. Note who opts out - needs 1:1 later.'
      }
    ]
  };

  res.json({
    success: true,
    plan: JSON.stringify(enhancedPlan),
    note: 'This is a test enhanced plan structure'
  });
});

// Load demo data endpoint
app.get('/api/load-demo-data', (req, res) => {
  try {
    const demoData = require('./load-demo-data.json');
    res.json({
      success: true,
      data: demoData
    });
  } catch (error) {
    // If JSON file doesn't exist, return inline demo data
    const inlineDemo = {
      students: [
        {
          id: 'DEMO_STU_1',
          firstName: 'Aarav',
          lastName: 'Mehta',
          grade: '6',
          school: 'Sunrise International School',
          phone: '9876543210',
          dob: '2013-04-15',
          doorNo: '12/A',
          street: 'MG Road',
          area: 'Koramangala',
          city: 'Bangalore',
          pincode: '560034',
          parentName: 'Rajesh Mehta',
          parentRelation: 'Father',
          parentPhone: '9876543210',
          parentEmail: 'rajesh@example.com',
          childGoodAt: 'Solving puzzles and logic games',
          wishForChild: 'Build communication confidence',
          source: 'School recommendation',
          examType: 'midterm',
          maxMarks: 60,
          english: 32,
          maths: 28,
          tamil: 30,
          science: 35,
          social: 27,
          behaviour: 'Calm but hesitant to speak in groups',
          supportNeeds: ['one-on-one', 'confidence-building'],
          enjoyDoing: 'Reading comics',
          findDifficult: 'Public speaking',
          assessmentScore: 45,
          assessmentBreakdown: { selPercent: 35, ctPercent: 50, leadPercent: 40 },
          assessmentStatus: 'Completed',
          registeredAt: new Date().toISOString()
        },
        {
          id: 'DEMO_STU_2',
          firstName: 'Priya',
          lastName: 'Sharma',
          grade: '6',
          school: 'Greenfield Academy',
          phone: '9876543211',
          dob: '2013-07-22',
          doorNo: '45',
          street: 'Lake View Road',
          area: 'Indiranagar',
          city: 'Bangalore',
          pincode: '560038',
          parentName: 'Meena Sharma',
          parentRelation: 'Mother',
          parentPhone: '9876543211',
          parentEmail: 'meena@example.com',
          childGoodAt: 'Creative arts and storytelling',
          wishForChild: 'Improve math skills',
          source: 'Friend referral',
          examType: 'midterm',
          maxMarks: 60,
          english: 38,
          maths: 25,
          tamil: 35,
          science: 30,
          social: 34,
          behaviour: 'Expressive and creative',
          supportNeeds: ['math-practice', 'confidence-building'],
          enjoyDoing: 'Drawing and painting',
          findDifficult: 'Word problems in math',
          assessmentScore: 52,
          assessmentBreakdown: { selPercent: 55, ctPercent: 45, leadPercent: 50 },
          assessmentStatus: 'Completed',
          registeredAt: new Date().toISOString()
        },
        {
          id: 'DEMO_STU_3',
          firstName: 'Arjun',
          lastName: 'Patel',
          grade: '7',
          school: 'Riverdale High',
          phone: '9876543212',
          dob: '2012-01-10',
          doorNo: '78/B',
          street: 'Brigade Road',
          area: 'Shanthinagar',
          city: 'Bangalore',
          pincode: '560027',
          parentName: 'Amit Patel',
          parentRelation: 'Father',
          parentPhone: '9876543212',
          parentEmail: 'amit@example.com',
          childGoodAt: 'Sports and physical activities',
          wishForChild: 'Better focus in academics',
          source: 'Social media',
          examType: 'midterm',
          maxMarks: 60,
          english: 30,
          maths: 32,
          tamil: 28,
          science: 34,
          social: 30,
          behaviour: 'Energetic, needs movement breaks',
          supportNeeds: ['focus-techniques', 'study-plan'],
          enjoyDoing: 'Playing cricket',
          findDifficult: 'Sitting still for long periods',
          assessmentScore: 58,
          assessmentBreakdown: { selPercent: 50, ctPercent: 55, leadPercent: 65 },
          assessmentStatus: 'Completed',
          registeredAt: new Date().toISOString()
        },
        {
          id: 'DEMO_STU_4',
          firstName: 'Ananya',
          lastName: 'Reddy',
          grade: '7',
          school: 'Blue Ridge Academy',
          phone: '9876543213',
          dob: '2012-11-05',
          doorNo: '23',
          street: 'Residency Road',
          area: 'Richmond Town',
          city: 'Bangalore',
          pincode: '560025',
          parentName: 'Sanjay Reddy',
          parentRelation: 'Father',
          parentPhone: '9876543213',
          parentEmail: 'sanjay@example.com',
          childGoodAt: 'Science and logical reasoning',
          wishForChild: 'Develop leadership skills',
          source: 'Website',
          examType: 'midterm',
          maxMarks: 60,
          english: 52,
          maths: 50,
          tamil: 45,
          science: 54,
          social: 48,
          behaviour: 'Focused and helps peers',
          supportNeeds: ['leadership-development'],
          enjoyDoing: 'Science experiments',
          findDifficult: 'Group dynamics sometimes',
          assessmentScore: 72,
          assessmentBreakdown: { selPercent: 70, ctPercent: 75, leadPercent: 72 },
          assessmentStatus: 'Completed',
          registeredAt: new Date().toISOString()
        }
      ],
      pods: [
        {
          id: 'DEMO_POD_1',
          name: 'Demo Pod - Mixed Abilities',
          studentIds: ['DEMO_STU_1', 'DEMO_STU_2', 'DEMO_STU_3', 'DEMO_STU_4'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };

    res.json({
      success: true,
      data: inlineDemo,
      note: 'Using inline demo data'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Brain Grain server running on http://localhost:${PORT}`);
  console.log(`📊 AI configured: ${AI_CONFIG.apiKey ? '✓ Yes' : '✗ No - Set AI_API_KEY in .env'}`);
  console.log(`🤖 AI Provider: ${AI_CONFIG.endpoint.includes('generativelanguage') ? 'Gemini' : 'OpenAI'}`);
});
