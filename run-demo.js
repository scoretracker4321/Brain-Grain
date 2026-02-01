// Execute Demo Workflow via Node
const fs = require('fs');
const path = require('path');

// Load existing data
function loadData(key) {
  const filePath = path.join(__dirname, `${key}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return [];
}

function saveData(key, data) {
  const filePath = path.join(__dirname, `${key}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Create test students
function createTestStudents() {
  const now = new Date().toISOString();
  
  const students = [
    {
      id: 'DEMO_STU_1',
      firstName: 'Aarav',
      lastName: 'Mehta',
      grade: '6',
      school: 'Sunrise International School',
      phone: '9876543210',
      dob: '2013-04-15',
      doorNo: '12A',
      street: 'MG Road',
      area: 'Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560095',
      parentName: 'Rajesh Mehta',
      parentRelation: 'father',
      parentPhone: '9876543211',
      parentEmail: 'rajesh@example.com',
      childGoodAt: 'Math and problem-solving',
      wishForChild: 'Better communication skills',
      source: 'school-rec',
      examType: 'midterm',
      maxMarks: 60,
      english: 38,
      maths: 45,
      tamil: 35,
      science: 42,
      social: 40,
      behaviour: 'good',
      supportNeeds: ['doubt-clearing', 'study-plan'],
      enjoyDoing: 'Coding',
      findDifficult: 'Public speaking',
      assessmentScore: 65,
      assessmentBreakdown: {
        selPercent: 70,
        ctPercent: 75,
        leadPercent: 50,
        selScore: 28,
        ctScore: 22.5,
        leadScore: 15
      },
      assessmentStatus: 'Completed',
      registeredAt: now
    },
    {
      id: 'DEMO_STU_2',
      firstName: 'Priya',
      lastName: 'Sharma',
      grade: '6',
      school: 'Sunrise International School',
      phone: '9876543220',
      dob: '2013-07-22',
      doorNo: '45B',
      street: 'Brigade Road',
      area: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      parentName: 'Sunita Sharma',
      parentRelation: 'mother',
      parentPhone: '9876543221',
      parentEmail: 'sunita@example.com',
      childGoodAt: 'Creative writing and art',
      wishForChild: 'Improved focus in studies',
      source: 'friend',
      examType: 'midterm',
      maxMarks: 60,
      english: 48,
      maths: 32,
      tamil: 40,
      science: 35,
      social: 42,
      behaviour: 'excellent',
      supportNeeds: ['extra-practice', 'one-on-one'],
      enjoyDoing: 'Reading stories',
      findDifficult: 'Math word problems',
      assessmentScore: 72,
      assessmentBreakdown: {
        selPercent: 85,
        ctPercent: 65,
        leadPercent: 70,
        selScore: 34,
        ctScore: 19.5,
        leadScore: 21
      },
      assessmentStatus: 'Completed',
      registeredAt: now
    },
    {
      id: 'DEMO_STU_3',
      firstName: 'Arjun',
      lastName: 'Patel',
      grade: '7',
      school: 'Greenfield Academy',
      phone: '9876543230',
      dob: '2012-09-10',
      doorNo: '78C',
      street: 'Whitefield Road',
      area: 'Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560066',
      parentName: 'Amit Patel',
      parentRelation: 'father',
      parentPhone: '9876543231',
      parentEmail: 'amit@example.com',
      childGoodAt: 'Sports and teamwork',
      wishForChild: 'Better academic performance',
      source: 'social',
      examType: 'midterm',
      maxMarks: 60,
      english: 35,
      maths: 38,
      tamil: 32,
      science: 40,
      social: 36,
      behaviour: 'average',
      supportNeeds: ['study-plan', 'mock-tests'],
      enjoyDoing: 'Cricket',
      findDifficult: 'Sitting still',
      assessmentScore: 55,
      assessmentBreakdown: {
        selPercent: 60,
        ctPercent: 55,
        leadPercent: 50,
        selScore: 24,
        ctScore: 16.5,
        leadScore: 15
      },
      assessmentStatus: 'Completed',
      registeredAt: now
    },
    {
      id: 'DEMO_STU_4',
      firstName: 'Ananya',
      lastName: 'Reddy',
      grade: '7',
      school: 'Greenfield Academy',
      phone: '9876543240',
      dob: '2012-11-05',
      doorNo: '23D',
      street: 'Sarjapur Road',
      area: 'HSR Layout',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560102',
      parentName: 'Kavitha Reddy',
      parentRelation: 'mother',
      parentPhone: '9876543241',
      parentEmail: 'kavitha@example.com',
      childGoodAt: 'Science and experiments',
      wishForChild: 'Leadership development',
      source: 'other',
      examType: 'midterm',
      maxMarks: 60,
      english: 42,
      maths: 48,
      tamil: 38,
      science: 52,
      social: 45,
      behaviour: 'excellent',
      supportNeeds: ['doubt-clearing'],
      enjoyDoing: 'Science projects',
      findDifficult: 'Group presentations',
      assessmentScore: 80,
      assessmentBreakdown: {
        selPercent: 75,
        ctPercent: 85,
        leadPercent: 80,
        selScore: 30,
        ctScore: 25.5,
        leadScore: 24
      },
      assessmentStatus: 'Completed',
      registeredAt: now
    }
  ];

  const existing = loadData('students');
  const demoIds = students.map(s => s.id);
  const filtered = existing.filter(s => !demoIds.includes(s.id));
  const updated = filtered.concat(students);
  saveData('students', updated);
  
  console.log('✓ Created 4 test students');
  return students;
}

// Create demo pod
function createDemoPod(students) {
  const now = new Date().toISOString();
  
  const pod = {
    id: 'DEMO_POD_1',
    name: 'Demo Pod - Mixed Abilities',
    studentIds: students.map(s => s.id),
    createdAt: now,
    updatedAt: now
  };

  const existing = loadData('pods');
  const filtered = existing.filter(p => p.id !== pod.id);
  const updated = filtered.concat([pod]);
  saveData('pods', updated);
  
  console.log('✓ Created demo pod');
  return pod;
}

// Create 3 session plans
function createSessionPlans(pod) {
  const now = Date.now();
  const plans = [
    {
      id: 'DEMO_PLAN_1',
      name: 'Welcome Session',
      type: 'welcome',
      executedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      plan: {
        session_title: 'Welcome to Brain Grain - Building Trust & Connection',
        objective: 'Create a safe, inclusive environment where students feel comfortable sharing, establish group norms, and begin building trust through structured activities.',
        duration_minutes: 45,
        student_roles: {
          role_list: ['Time Keeper', 'Materials Helper', 'Energy Observer', 'Welcome Anchor'],
          instructions: [
            'Keep track of time for each activity (use timer)',
            'Distribute and collect materials',
            'Notice and share group energy levels',
            'Start each activity by welcoming the group'
          ],
          rotation_note: 'Roles will rotate in next session to ensure everyone participates in different ways'
        },
        activities: [
          {
            activity_title: 'Name Circle & Check-In',
            duration_minutes: 10,
            description: 'Students sit in a circle. Each shares their name, favorite hobby, and one word describing how they feel today. Facilitator models vulnerability by going first.',
            differentiation: [
              'Aarav (strong in logic): Ask him to identify patterns in everyone\'s feelings',
              'Priya (creative): Invite her to suggest creative ways to remember names',
              'Arjun (kinesthetic): Let him demonstrate his hobby physically if possible',
              'Ananya (analytical): Ask her to summarize common themes she notices'
            ],
            signals: 'Watch for: eye contact, body language (open/closed), voice volume, willingness to share. Note students who seem hesitant.'
          },
          {
            activity_title: 'Group Agreement Co-Creation',
            duration_minutes: 15,
            description: 'Facilitator introduces concept of agreements (not rules). Students brainstorm what they need to feel safe, respected, and able to learn. Write all ideas on chart paper. Group votes on top 5 agreements. Everyone signs the poster.',
            differentiation: [
              'Aarav: Challenge him to propose one agreement that addresses respect',
              'Priya: Ask her to suggest an agreement about creativity/expression',
              'Arjun: Encourage physical participation (writing on chart, arranging materials)',
              'Ananya: Ask her to facilitate the voting process fairly'
            ],
            signals: 'Look for: students proposing ideas, building on others\' suggestions, respectful disagreement. Red flags: dominating, withdrawing, negativity.'
          },
          {
            activity_title: 'Connection Web Activity',
            duration_minutes: 15,
            description: 'Students stand in circle. Using ball of yarn, first person shares something about themselves, holds yarn end, tosses ball to someone. That person shares, holds their section, tosses to another. Creates physical web. Discussion: "What happens if one person lets go? How are we connected?"',
            differentiation: [
              'Aarav: Ask him to explain the metaphor mathematically (network connections)',
              'Priya: Invite her to describe the web artistically or emotionally',
              'Arjun: Physical activity suits his learning style - let him go early',
              'Ananya: Ask her to draw conclusions about teamwork and interdependence'
            ],
            signals: 'Observe: who students choose to throw to, body language during sharing, engagement with metaphor. Note natural leaders and those who need support.'
          },
          {
            activity_title: 'Reflection & Commitment',
            duration_minutes: 5,
            description: 'Students write one personal goal for the pod on sticky note (anonymous or named). Post on "Our Goals" board. Close with gratitude circle: each says one thing they\'re grateful for today.',
            differentiation: [
              'Aarav: Encourage specific, measurable goal',
              'Priya: Support creative expression of goal',
              'Arjun: Accept brief, action-oriented goal',
              'Ananya: Invite reflection on long-term impact'
            ],
            signals: 'Check for: thoughtful goal-setting, genuine gratitude, positive energy. Celebrate first session success!'
          }
        ]
      }
    },
    {
      id: 'DEMO_PLAN_2',
      name: 'First Full Session - Skill Building',
      type: 'first',
      executedAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
      plan: {
        session_title: 'Building Core Skills - Problem Solving & Collaboration',
        objective: 'Introduce structured problem-solving framework, practice active listening and respectful disagreement, build confidence through achievable challenges.',
        duration_minutes: 45,
        student_roles: {
          role_list: ['Question Asker', 'Idea Recorder', 'Time Guardian', 'Encouragement Champion'],
          instructions: [
            'Ask clarifying questions when things are unclear',
            'Write down all ideas without judgment',
            'Keep activities on schedule',
            'Notice and appreciate others\' contributions'
          ],
          rotation_note: 'New roles today - check agreement poster before starting'
        },
        activities: [
          {
            activity_title: 'Energizer: Human Knot',
            duration_minutes: 8,
            description: 'Students stand in circle, reach across and hold hands with two different people. Goal: untangle without releasing hands. Debrief: "What strategies worked? How did you communicate?"',
            differentiation: [
              'Aarav: Ask him to identify the most efficient strategy',
              'Priya: Let her suggest creative solutions when stuck',
              'Arjun: Physical challenge suits his energy - ensure he stays safe',
              'Ananya: Invite her to lead verbal communication and coordinate'
            ],
            signals: 'Watch for: frustration management, collaboration vs. competition, communication clarity, support for struggling peers.'
          },
          {
            activity_title: 'Problem-Solving Framework Introduction',
            duration_minutes: 10,
            description: 'Teach 4-step framework: (1) Understand the Problem, (2) Brainstorm Solutions, (3) Try & Test, (4) Reflect & Improve. Use simple example: "How to fit 10 books in a small bag?" Practice each step together.',
            differentiation: [
              'Aarav: Challenge with complex problem variation',
              'Priya: Encourage visual/creative representation of framework',
              'Arjun: Use physical demonstration, hands-on practice',
              'Ananya: Ask her to explain "why" behind each step'
            ],
            signals: 'Check for: understanding of each step, ability to apply framework, questions indicating engagement. Adjust pace if needed.'
          },
          {
            activity_title: 'Collaborative Challenge: Tower Build',
            duration_minutes: 20,
            description: 'Groups of 2-3 build tallest free-standing tower using only: 20 straws, 30cm tape, 10 paper clips. Must stand for 10 seconds. After building, teams present their design and problem-solving process using the 4-step framework.',
            differentiation: [
              'Aarav: Pair with Arjun for balance of planning and action',
              'Priya: Pair with Ananya to blend creativity and analysis',
              'Arjun: Physical building suits his learning - ensure equal participation',
              'Ananya: Encourage her to lead presentation, explain scientific principles'
            ],
            signals: 'Observe: equal participation, respectful discussion, frustration tolerance, celebration of others\' success. Intervene if dominance or exclusion occurs.'
          },
          {
            activity_title: 'Reflection & Meta-Learning',
            duration_minutes: 7,
            description: 'Facilitator leads discussion: "What was hardest? What helped you succeed? How can you use this framework in school?" Students write one "aha moment" on exit ticket.',
            differentiation: [
              'Aarav: Ask for logical analysis of what worked',
              'Priya: Invite emotional/creative reflection',
              'Arjun: Accept verbal or drawing-based reflection',
              'Ananya: Challenge her to connect to real-world applications'
            ],
            signals: 'Listen for: genuine insights, connections to prior learning, growth mindset language. Celebrate specific examples of skill development.'
          }
        ]
      }
    },
    {
      id: 'DEMO_PLAN_3',
      name: 'Follow-up Session - Deepening Skills',
      type: 'followup',
      executedAt: new Date().toISOString(),
      plan: {
        session_title: 'Deepening Skills - Leadership & Peer Support',
        objective: 'Build on problem-solving foundation by introducing peer teaching, develop leadership skills through structured roles, strengthen group cohesion through shared challenges.',
        duration_minutes: 45,
        student_roles: {
          role_list: ['Discussion Leader', 'Peer Coach', 'Progress Tracker', 'Connection Builder'],
          instructions: [
            'Keep discussions inclusive and on-topic',
            'Help peers who are stuck without giving answers',
            'Track what we accomplish and what remains',
            'Notice and bridge gaps between quieter and louder voices'
          ],
          rotation_note: 'Advanced roles today - requires active listening and empathy'
        },
        activities: [
          {
            activity_title: 'Warm-Up: Appreciation Circle',
            duration_minutes: 8,
            description: 'Each student says one specific thing they appreciated about another pod member last session (not "you\'re nice" but "you helped me when I was stuck on the tower"). Builds culture of recognition.',
            differentiation: [
              'Aarav: Encourage specific, evidence-based appreciation',
              'Priya: Support emotional expression and creativity',
              'Arjun: Allow brief, genuine statements',
              'Ananya: Ask her to notice leadership she observed'
            ],
            signals: 'Watch for: genuine vs. superficial comments, who is mentioned most/least, comfort with giving/receiving praise. Ensure everyone is appreciated.'
          },
          {
            activity_title: 'Academic Challenge: Math Puzzle Stations',
            duration_minutes: 22,
            description: 'Set up 3 stations with different difficulty levels of math puzzles (visual, logic, word problems). Students rotate every 6-7 minutes. At each station, stronger students teach struggling students using framework from last session. Facilitator observes but doesn\'t solve puzzles.',
            differentiation: [
              'Aarav: Start at hardest station, then rotate to teach others',
              'Priya: Begin with visual puzzles, help Arjun with word problems',
              'Arjun: Start with logic puzzles (match his strength), receive support on word problems',
              'Ananya: Rotate through all levels, practice teaching at easier stations'
            ],
            signals: 'Observe: quality of peer teaching (asking questions vs. giving answers), patience, frustration tolerance, celebrating joint success. Note natural teachers.'
          },
          {
            activity_title: 'Group Challenge: Escape Room Scenario',
            duration_minutes: 12,
            description: 'Present scenario: "You\'re locked in a classroom (imaginary). To escape, solve 3 riddles together. You have 10 minutes." Riddles require teamwork (e.g., "If person A knows the first word, person B knows the second, how do you form the passcode?"). Debrief: leadership distribution, communication strategies.',
            differentiation: [
              'Aarav: Challenge him to step back and let others lead sometimes',
              'Priya: Encourage her to voice creative solutions confidently',
              'Arjun: Create physical component (moving to different areas for clues)',
              'Ananya: Invite her to coordinate the group without dominating'
            ],
            signals: 'Check for: distributed leadership, all voices heard, effective communication, celebrating progress. Red flags: frustration, giving up, blaming.'
          },
          {
            activity_title: 'Reflection & Goal Setting',
            duration_minutes: 3,
            description: 'Quick individual reflection: "One skill I\'ve improved" and "One skill I want to develop next." Share in pairs, then volunteers share with whole group. Facilitator highlights growth observed.',
            differentiation: [
              'Aarav: Encourage reflection on leadership and patience',
              'Priya: Validate emotional/creative growth alongside academic',
              'Arjun: Celebrate physical and active participation',
              'Ananya: Acknowledge balance of excellence and supporting others'
            ],
            signals: 'Listen for: specific examples, growth mindset, connection to future sessions. End on note of progress and anticipation for next time.'
          }
        ]
      }
    }
  ];
  
  plans.forEach((planData, idx) => {
    const plan = {
      id: planData.id,
      sessionType: planData.type,
      sessionName: planData.name,
      status: 'executed',
      acceptedAt: planData.executedAt,
      executedAt: planData.executedAt,
      plan: JSON.stringify(planData.plan),
      facilitatorHtml: generateFacilitatorHTML(planData.plan)
    };
    
    const key = `pod_plans_${pod.id}`;
    const existing = loadData(key);
    existing.unshift(plan);
    saveData(key, existing);
  });
  
  console.log('✓ Created 3 session plans (all executed)');
}

function generateFacilitatorHTML(planObj) {
  let html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">`;
  
  html += `<h2 style="color: #0b66d0; margin-bottom: 8px;">${planObj.session_title}</h2>`;
  html += `<div style="background: #f0f9ff; padding: 12px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #0ea5e9;">`;
  html += `<strong>Objective:</strong> ${planObj.objective}<br>`;
  html += `<strong>Duration:</strong> ${planObj.duration_minutes} minutes`;
  html += `</div>`;
  
  if (planObj.student_roles) {
    html += `<div style="background: #fef3c7; padding: 12px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #f59e0b;">`;
    html += `<strong>Student Roles:</strong><ul style="margin: 8px 0;">`;
    planObj.student_roles.role_list.forEach((role, i) => {
      html += `<li><strong>${role}:</strong> ${planObj.student_roles.instructions[i]}</li>`;
    });
    html += `</ul><em style="font-size: 12px;">${planObj.student_roles.rotation_note}</em></div>`;
  }
  
  planObj.activities.forEach((act, idx) => {
    html += `<div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">`;
    html += `<h3 style="color: #1e40af; margin: 0 0 8px 0;">${idx + 1}. ${act.activity_title} (${act.duration_minutes} min)</h3>`;
    html += `<p style="margin: 8px 0;"><strong>What to do:</strong> ${act.description}</p>`;
    
    if (act.differentiation && act.differentiation.length > 0) {
      html += `<div style="background: #f0fdf4; padding: 10px; border-radius: 6px; margin: 8px 0;">`;
      html += `<strong>Differentiation:</strong><ul style="margin: 4px 0; padding-left: 20px;">`;
      act.differentiation.forEach(d => html += `<li style="font-size: 13px;">${d}</li>`);
      html += `</ul></div>`;
    }
    
    html += `<div style="background: #fef3c7; padding: 10px; border-radius: 6px; margin-top: 8px;">`;
    html += `<strong>Watch for:</strong> ${act.signals}</div>`;
    html += `</div>`;
  });
  
  html += `</div>`;
  return html;
}

// Create feedback
function createFeedback(pod, students) {
  const feedback = students.map((s, idx) => ({
    sessionId: 'DEMO_PLAN_3',
    studentId: s.id,
    studentName: `${s.firstName} ${s.lastName}`,
    behaviour: ['😊', '🙂', '😐'][idx % 3],
    behaviourNote: 'Engaged during activities',
    participation: ['🙌', '✋', '🤔'][idx % 3],
    participationNote: 'Active contributor',
    interest: ['🤩', '😊', '😐'][idx % 3],
    interestNote: 'Curious learner',
    emotional: ['😄', '😌', '😬'][idx % 3],
    emotionalNote: 'Comfortable environment',
    strengths: 'Good collaboration',
    needs: 'Build confidence',
    nextSession: 'More hands-on activities',
    timestamp: new Date().toISOString()
  }));
  
  saveData(`session_feedback_${pod.id}`, feedback);
  console.log('✓ Added feedback for all students');
}

// Execute workflow
console.log('🎬 Running Demo Workflow...\n');

const students = createTestStudents();
const pod = createDemoPod(students);
createSessionPlans(pod);
createFeedback(pod, students);

console.log('\n✅ Demo workflow complete!');
console.log('\nCreated files:');
console.log('  - students.json (4 students)');
console.log('  - pods.json (1 pod)');
console.log('  - pod_plans_DEMO_POD_1.json (3 sessions)');
console.log('  - session_feedback_DEMO_POD_1.json (feedback)');
console.log('\nYou can now access https://brain-grain.vercel.app');
console.log('The data is ready to be synced to Firebase!');
