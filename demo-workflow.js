// Demo Workflow Automation - Complete Pod Session Lifecycle
(function() {
  'use strict';

  // Helper to wait/delay
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper to show progress
  function showProgress(message, type = 'info') {
    console.log(`🎬 ${message}`);
    if (typeof showToast === 'function') {
      showToast(message, type === 'error' ? 'error' : 'success');
    }
  }

  /**
   * Load demo data from backend endpoint
   * Fetches pre-configured students, pods, and session plans
   */
  window.loadDemoDataFromBackend = async function() {
    try {
      if (!confirm('📦 Load Demo Data from Backend?\n\nThis will:\n• Load 4 demo students\n• Create 1 demo pod\n• Add 3 pre-configured session plans\n• Add session feedback\n\nContinue?')) {
        return;
      }

      showProgress('Loading demo data from backend...', 'info');

      // Fetch demo data from backend
      const backendUrl = window.location.origin;
      const response = await fetch(`${backendUrl}/api/load-demo-data`);
      
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Invalid response from backend');
      }

      const { students, pods } = result.data;

      showProgress(`✓ Received ${students.length} students and ${pods.length} pod(s) from backend`, 'success');

      // Save students to localStorage
      if (typeof StorageHelper !== 'undefined' && StorageHelper.saveStudents) {
        StorageHelper.saveStudents(students);
        showProgress(`✓ Saved ${students.length} students to storage`, 'success');
      } else {
        localStorage.setItem('braingrain_students', JSON.stringify(students));
        showProgress(`✓ Saved ${students.length} students to localStorage`, 'success');
      }

      // Save pods to localStorage
      if (typeof StorageHelper !== 'undefined' && StorageHelper.savePods) {
        StorageHelper.savePods(pods);
        showProgress(`✓ Saved ${pods.length} pod(s) to storage`, 'success');
      } else {
        localStorage.setItem('braingrain_pods', JSON.stringify(pods));
        showProgress(`✓ Saved ${pods.length} pod(s) to localStorage`, 'success');
      }

      // Generate session plans for the demo pod
      if (pods.length > 0) {
        const demoPod = pods[0];
        showProgress('Generating session plans...', 'info');
        await generateDemoSessionPlans(demoPod, students);
        showProgress('✓ Generated 3 session plans with feedback', 'success');
      }

      // Refresh UI
      showProgress('Refreshing UI...', 'info');
      if (typeof loadStudents === 'function') loadStudents();
      if (typeof loadPods === 'function') loadPods();
      await delay(500);

      showProgress('✅ Demo data loaded successfully! Check the Pods section.', 'success');

    } catch (error) {
      console.error('Load demo data error:', error);
      showProgress(`❌ Error: ${error.message}`, 'error');
      alert(`Failed to load demo data:\n${error.message}`);
    }
  };

  /**
   * Generate demo session plans with enhanced data
   */
  async function generateDemoSessionPlans(pod, students) {
    const podId = pod.id;

    // Session Plan 1: Welcome Session
    const plan1 = {
      id: 'DEMO_PLAN_1',
      sessionId: 'DEMO_PLAN_1',
      status: 'executed',
      acceptedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      executedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      sessionType: 'welcome',
      plan: {
        session_title: 'Welcome to Brain Grain - Building Trust & Connection',
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
          rotation_note: 'Roles rotate each session to avoid labeling and ensure everyone experiences different participation modes.'
        },
        activities: [
          {
            activity_title: 'Opening Name Circle - Who Am I?',
            duration_minutes: 8,
            description: 'Facilitator models first: share name, favorite snack, one emoji that describes you today. Go around circle (clockwise), everyone shares same format. Facilitator actively listens, repeats each name, asks one follow-up question per person to show genuine interest.',
            differentiation: [
              `${students[0].firstName}: Ask about favorite superhero instead of emoji if hesitant`,
              `${students[1].firstName}: Invite to draw emoji if verbal expression is challenging`,
              `${students[2].firstName}: Allow standing/stretching while sharing if needed`,
              `${students[3].firstName}: Ask to notice patterns in responses (leadership practice)`
            ],
            signals: 'Watch for: eye contact, voice volume, fidgeting, genuine smiles vs. forced. Red flags: silence, looking away, crossed arms.'
          },
          {
            activity_title: 'Group Agreement Co-Creation',
            duration_minutes: 12,
            description: 'Facilitator asks: "What helps you feel safe to try, fail, and learn?" Collect 4-6 ideas from group. Write on chart paper. Transform into simple rules using student language. Everyone signs/draws on agreement poster.',
            differentiation: [
              `${students[0].firstName}: Prompt with "When have you felt brave to try something new?"`,
              `${students[1].firstName}: Offer drawing option instead of writing words`,
              `${students[2].firstName}: Accept physical demonstrations of ideas`,
              `${students[3].firstName}: Invite to suggest organizing framework if discussion gets scattered`
            ],
            signals: 'Listen for: ownership language ("we should", "I need"), specific examples, consensus-building.'
          },
          {
            activity_title: 'Connection Web - Finding Commonalities',
            duration_minutes: 15,
            description: 'Stand in circle. Facilitator holds ball of yarn, shares "I love reading" - throws yarn to someone who also loves reading. That person holds strand, shares new statement, throws to next. Continue until web connects everyone. Visual metaphor: we\'re stronger connected than alone.',
            differentiation: [
              `${students[0].firstName}: Prompt academic interests ("I like solving puzzles") to validate strengths`,
              `${students[1].firstName}: Allow emotions/feelings ("I feel happy when...")`,
              `${students[2].firstName}: Let move around circle vs. standing still if restless`,
              `${students[3].firstName}: Challenge to find connection with quietest person first`
            ],
            signals: 'Observe: Who connects easily? Who struggles to find commonality? Web strength = how much we WANT to connect.'
          },
          {
            activity_title: 'Closing Reflection - One Word Check-Out',
            duration_minutes: 10,
            description: 'Quick round: everyone shares ONE WORD describing how they feel leaving today. Facilitator records words on board/paper (visual validation). Ask: "How do these words compare to when we started?" Optional homework: "Notice one time this week you feel [your word from today]."',
            differentiation: [
              `${students[0].firstName}: Validate specific thinking/contributions observed`,
              `${students[1].firstName}: Normalize emotional language - feelings are data, not weakness`,
              `${students[2].firstName}: Movement-based - walk to board to write/point at word`,
              `${students[3].firstName}: Ask to notice leadership moments seen in others`
            ],
            signals: 'Final check: positive shift from start? If words are negative (bored, tired), don\'t dismiss - acknowledge.'
          }
        ]
      }
    };

    // Session Plan 2: First Full Session
    const plan2 = {
      id: 'DEMO_PLAN_2',
      sessionId: 'DEMO_PLAN_2',
      status: 'executed',
      acceptedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      executedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      sessionType: 'first',
      plan: {
        session_title: 'First Full Session - Problem-Solving & Teamwork',
        objective: 'Develop collaborative problem-solving skills, introduce structured thinking frameworks, practice peer communication under time pressure, and reflect on metacognitive strategies that lead to success in group challenges.',
        duration_minutes: 45,
        student_roles: {
          role_list: ['Process Observer', 'Resource Manager', 'Time Tracker', 'Encourager'],
          instructions: [
            'Watch HOW the group works together - who speaks, who listens, what strategies emerge',
            'Keep track of materials used, suggest alternatives if stuck',
            'Monitor time remaining, give periodic updates to keep team on pace',
            'Celebrate progress, acknowledge effort, keep spirits high when frustrated'
          ],
          rotation_note: 'Today\'s roles focus on teamwork observation. Next time, different responsibilities to build diverse skills.'
        },
        activities: [
          {
            activity_title: 'Human Knot Warm-Up',
            duration_minutes: 8,
            description: 'Stand in circle, reach across to grab hands of two different people. Without letting go, untangle into a circle. Debrief: What strategies worked? Who took initiative? How did you communicate when stuck?',
            differentiation: [
              `${students[0].firstName}: Affirm verbal problem-solving contributions even if physical role is small`,
              `${students[1].firstName}: Validate creative solutions, even unconventional ones`,
              `${students[2].firstName}: Channel physical energy positively - leadership in movement coordination`,
              `${students[3].firstName}: Invite meta-commentary - what patterns do you see in how we solve this?`
            ],
            signals: 'Watch: Frustration tolerance, leadership emergence, who withdraws vs. engages, communication clarity under pressure.'
          },
          {
            activity_title: 'Introduce Problem-Solving Framework',
            duration_minutes: 10,
            description: 'Teach 4-step framework: 1) Understand the Problem, 2) Plan Strategy, 3) Execute, 4) Reflect. Write on board with icons. Practice with simple word problem as group: "How many ways can 4 people line up?" Walk through each step together.',
            differentiation: [
              `${students[0].firstName}: Provide visual diagram of framework, check understanding with examples`,
              `${students[1].firstName}: Connect to art/design thinking - same process, different context`,
              `${students[2].firstName}: Physical movement - act out different "line up" configurations`,
              `${students[3].firstName}: Challenge with extension: "Now add a 5th person - how does complexity change?"`
            ],
            signals: 'Check: Can students name all 4 steps? Do they jump to execution without planning? Who asks clarifying questions?'
          },
          {
            activity_title: 'Tower Build Challenge',
            duration_minutes: 20,
            description: 'Using only 20 straws, 30cm tape, and 10 paper clips, build the tallest free-standing tower in 15 minutes. Tower must stand for 10 seconds unassisted. Work in pairs. After build, each pair presents their design and explains their problem-solving strategy using the 4-step framework.',
            differentiation: [
              `${students[0].firstName}: Pair with confident partner; focus on planning phase (strength area)`,
              `${students[1].firstName}: Pair with patient partner; emphasize creative design freedom`,
              `${students[2].firstName}: Pair with detail-oriented partner; assign hands-on building role`,
              `${students[3].firstName}: Pair with less experienced partner; practice teaching/mentoring role`
            ],
            signals: 'Observe: Time management, frustration response when tower falls, peer support, strategic vs. trial-and-error approaches, presentation confidence.'
          },
          {
            activity_title: 'Meta-Learning Reflection',
            duration_minutes: 7,
            description: 'Circle up. Each person answers: "What was hardest about this challenge?" and "What did you learn about yourself as a problem-solver?" Facilitator highlights growth mindset language ("I struggled BUT I learned...") vs. fixed mindset ("I\'m just bad at...").',
            differentiation: [
              `${students[0].firstName}: Normalize struggle - "Everyone finds different parts hard, that\'s learning"`,
              `${students[1].firstName}: Validate emotional awareness - "It\'s okay to feel frustrated and proud at once"`,
              `${students[2].firstName}: Frame learning in action terms - "Your hands figured it out by trying"`,
              `${students[3].firstName}: Push deeper - "How will you apply this framework to math homework?"` 
            ],
            signals: 'Listen: Self-awareness, ability to name emotions and strategies, peer empathy, transfer thinking to other contexts.'
          }
        ]
      }
    };

    // Session Plan 3: Follow-up Session
    const plan3 = {
      id: 'DEMO_PLAN_3',
      sessionId: 'DEMO_PLAN_3',
      status: 'executed',
      acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      executedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      sessionType: 'followup',
      plan: {
        session_title: 'Deepening Skills - Leadership & Peer Support',
        objective: 'Build on established group trust to develop leadership capacity, practice peer teaching and support, apply problem-solving to academic content, and strengthen metacognitive reflection through structured goal-setting.',
        duration_minutes: 45,
        student_roles: {
          role_list: ['Equity Monitor', 'Question Asker', 'Summarizer', 'Energy Keeper'],
          instructions: [
            'Track who contributes - gently invite quiet voices, redirect dominators',
            'Ask "Why?" and "How do you know?" to deepen thinking',
            'At transitions, recap what we just learned in 1-2 sentences',
            'Read the room - suggest movement break if energy dips, refocus if chaotic'
          ],
          rotation_note: 'Advanced roles today - requires observation skills developed in previous sessions.'
        },
        activities: [
          {
            activity_title: 'Appreciation Circle Opening',
            duration_minutes: 7,
            description: 'Each person appreciates one peer for something specific from last session. Format: "[Name], I noticed you [specific action] and that helped me/us because [impact]." Facilitator models vulnerability first - appreciate a student for teaching YOU something.',
            differentiation: [
              `${students[0].firstName}: Prepare in advance if public speaking is hard - write it down first`,
              `${students[1].firstName}: Encourage emotional specificity - "I felt..." is valuable data`,
              `${students[2].firstName}: Allow movement - stand/gesture while sharing if needed`,
              `${students[3].firstName}: Challenge to appreciate someone for a non-academic quality (kindness, humor, perseverance)`
            ],
            signals: 'Watch: Specificity of observations, emotional authenticity, reciprocal appreciation, who struggles to receive praise.'
          },
          {
            activity_title: 'Math Puzzle Stations (Peer Teaching)',
            duration_minutes: 20,
            description: 'Set up 3 stations with grade-level math puzzles (logic grids, pattern completion, word problems). Students rotate every 6 minutes. At each station, the student who masters it first becomes the "expert" and teaches others. No direct teacher help - peer support only. Debrief: What makes a good teacher? What makes a good learner?',
            differentiation: [
              `${students[0].firstName}: Station 1 (logic) plays to strengths - build confidence, then teach`,
              `${students[1].firstName}: Station 2 (patterns/visual) matches learning style - celebrate creative solutions`,
              `${students[2].firstName}: Station 3 (kinesthetic/manipulatives) channels energy productively`,
              `${students[3].firstName}: Float between stations as "super-expert" - practice advanced teaching by helping strugglers`
            ],
            signals: 'Observe: Teaching patience, ability to explain vs. just give answers, asking for help, frustration management, leadership emergence.'
          },
          {
            activity_title: 'Escape Room Challenge (Academic Content)',
            duration_minutes: 13,
            description: 'Timed 10-minute challenge: solve 5 sequential clues that each require a different skill (reading comprehension, math calculation, creative thinking, memory, logic). Must work as team - only one "answer sheet" shared. Clues unlock next envelope. If stuck >2 minutes, facilitator offers hint. Success = completing all 5 before time expires.',
            differentiation: [
              `${students[0].firstName}: Assign reading comprehension clue - strength area, confidence boost`,
              `${students[1].firstName}: Assign creative thinking clue - divergent ideas valued here`,
              `${students[2].firstName}: Assign logic/sequencing clue - hands-on manipulation of pieces`,
              `${students[3].firstName}: Assign meta-role - when to use hint, when to pivot strategies`
            ],
            signals: 'High-stakes observation: Time pressure response, collaborative decision-making, leadership distribution, celebrating vs. blaming, strategic thinking.'
          },
          {
            activity_title: 'Goal Setting & Next Steps',
            duration_minutes: 5,
            description: 'Quick personal reflection on index cards: "One thing I\'m proud of from today" and "One skill I want to work on next session." Collect cards - facilitator reads anonymously next time as reminder. Close with group cheer/ritual (create one together if none exists yet).',
            differentiation: [
              `${students[0].firstName}: Prompt academic goal tied to confidence - "I want to raise my hand more"`,
              `${students[1].firstName}: Allow emotional goals - "I want to feel less worried about being wrong"`,
              `${students[2].firstName}: Frame behavioral goals positively - "I want to listen longer before acting"`,
              `${students[3].firstName}: Encourage leadership goals - "I want to help others feel included"`
            ],
            signals: 'Final pulse check: Realistic goals vs. vague wishes? Self-awareness? Looking forward to next session vs. relief it\'s over?'
          }
        ]
      }
    };

    // Generate facilitatorHtml for each plan
    [plan1, plan2, plan3].forEach(plan => {
      plan.facilitatorHtml = generateFacilitatorHTML(plan.plan);
    });

    // Save plans to localStorage
    const planHistory = [plan1, plan2, plan3];
    localStorage.setItem(`braingrain_pod_plans_${podId}`, JSON.stringify(planHistory));

    // Add session feedback for each executed plan
    const feedback = [];
    
    // Feedback for Session 1
    students.forEach((student, idx) => {
      const feedbackData = {
        sessionId: 'DEMO_PLAN_1',
        studentId: student.id,
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        behaviour: ['😊', '🙂', '😐', '🙂'][idx],
        behaviourNote: ['Calm and attentive', 'Engaged but quiet', 'Restless but focused', 'Confident and participative'][idx],
        participation: ['✋', '🤔', '🙌', '🙌'][idx],
        participationNote: ['Spoke when prompted', 'Hesitant at first', 'Very active', 'Natural leader'][idx],
        interest: ['😊', '🤩', '😐', '🤩'][idx],
        interestNote: ['Interested in activities', 'Loved the connection web', 'Warming up', 'Excited about everything'][idx],
        emotional: ['😌', '😬', '😠', '😄'][idx],
        emotionalNote: ['Relaxed and comfortable', 'Slightly anxious', 'Briefly frustrated', 'Very happy'][idx],
        strengths: ['Good listener, thoughtful responses', 'Creative ideas, artistic expression', 'Physical energy, hands-on learner', 'Strong verbal skills, helps others'][idx],
        needs: ['Needs encouragement to share', 'Needs confidence in academic areas', 'Needs structured movement breaks', 'Ready for leadership roles'][idx],
        nextSession: ['Pair with confident peer', 'Validate creative contributions', 'Include kinesthetic activities', 'Assign teaching/mentoring role'][idx]
      };
      feedback.push(feedbackData);
    });

    // Feedback for Session 2
    students.forEach((student, idx) => {
      const feedbackData = {
        sessionId: 'DEMO_PLAN_2',
        studentId: student.id,
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        behaviour: ['🙂', '😊', '😐', '😊'][idx],
        behaviourNote: ['More confident this time', 'Relaxed and engaged', 'Needed reminders to focus', 'Consistently positive'][idx],
        participation: ['✋', '✋', '🙌', '🙌'][idx],
        participationNote: ['Volunteered twice', 'Shared creative solution', 'Very hands-on with tower', 'Led team effectively'][idx],
        interest: ['😊', '🤩', '🤩', '😊'][idx],
        interestNote: ['Enjoyed problem-solving', 'Loved the building activity', 'Very engaged with challenge', 'Interested in framework'][idx],
        emotional: ['😌', '😄', '😬', '😄'][idx],
        emotionalNote: ['Calm under pressure', 'Happy and excited', 'Frustrated when tower fell', 'Proud of accomplishment'][idx],
        strengths: ['Strategic thinking, patience', 'Design creativity, visual learner', 'Quick execution, doesn\'t give up', 'Teaching others, explaining concepts'][idx],
        needs: ['Continue building confidence', 'Academic vocabulary support', 'Impulse control strategies', 'Challenge with complexity'][idx],
        nextSession: ['Lead planning phase', 'Visual/artistic challenges', 'Physical problem-solving', 'Mentor struggling peers'][idx]
      };
      feedback.push(feedbackData);
    });

    // Feedback for Session 3
    students.forEach((student, idx) => {
      const feedbackData = {
        sessionId: 'DEMO_PLAN_3',
        studentId: student.id,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        behaviour: ['😊', '😊', '🙂', '😊'][idx],
        behaviourNote: ['Visibly more comfortable', 'Smiling throughout', 'Much better focus', 'Mature and responsible'][idx],
        participation: ['🙌', '✋', '🙌', '🙌'][idx],
        participationNote: ['Taught peers confidently', 'Contributed ideas', 'Led escape room strategy', 'Facilitated group decisions'][idx],
        interest: ['🤩', '😊', '🤩', '😊'][idx],
        interestNote: ['Loved teaching role', 'Enjoyed appreciation circle', 'Escape room was thrilling', 'Engaged with all activities'][idx],
        emotional: ['😄', '😌', '😄', '😄'][idx],
        emotionalNote: ['Pride in teaching', 'Calm and happy', 'Excitement and joy', 'Confident and proud'][idx],
        strengths: ['Teaching patience, clear explanations', 'Emotional intelligence, kindness', 'Leadership under pressure', 'Meta-cognition, strategy'][idx],
        needs: ['Continue leadership development', 'Academic skill building', 'Sustained attention practice', 'Advanced challenges'][idx],
        nextSession: ['Student-led activity planning', 'One-on-one skill work', 'Complex multi-step problems', 'Design next session structure'][idx]
      };
      feedback.push(feedbackData);
    });

    localStorage.setItem(`braingrain_session_feedback_${podId}`, JSON.stringify(feedback));
  }

  /**
   * Generate facilitator-friendly HTML from plan JSON
   */
  function generateFacilitatorHTML(planObj) {
    if (!planObj) return '<p>No plan data available</p>';

    let html = '';

    // Session title and objective
    html += `<div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 16px; border-radius: 8px; margin-bottom: 16px; border-left: 5px solid #0ea5e9; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">`;
    html += `<h3 style="margin: 0 0 8px 0; color: #0c4a6e; font-size: 18px;">📋 ${planObj.session_title || 'Session Plan'}</h3>`;
    html += `<p style="margin: 0; color: #0c4a6e; font-size: 14px; line-height: 1.5;"><strong>Objective:</strong> ${planObj.objective || 'No objective provided'}</p>`;
    html += `<p style="margin: 8px 0 0 0; color: #0369a1; font-size: 13px;"><strong>Duration:</strong> ${planObj.duration_minutes || 45} minutes</p>`;
    html += `</div>`;

    // Student roles section
    if (planObj.student_roles) {
      html += `<div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 14px; border-radius: 8px; margin-bottom: 16px; border-left: 5px solid #f59e0b; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">`;
      html += `<h4 style="margin: 0 0 8px 0; color: #78350f; font-size: 16px;">👥 Student Roles</h4>`;
      if (planObj.student_roles.role_list && planObj.student_roles.role_list.length > 0) {
        html += `<ul style="margin: 0; padding-left: 20px; color: #78350f;">`;
        planObj.student_roles.role_list.forEach((role, idx) => {
          const instruction = planObj.student_roles.instructions && planObj.student_roles.instructions[idx] 
            ? ` - ${planObj.student_roles.instructions[idx]}` 
            : '';
          html += `<li style="margin-bottom: 6px; font-size: 14px;"><strong>${role}</strong>${instruction}</li>`;
        });
        html += `</ul>`;
      }
      if (planObj.student_roles.rotation_note) {
        html += `<p style="margin: 10px 0 0 0; padding: 8px; background: rgba(251, 191, 36, 0.2); border-radius: 4px; font-size: 13px; color: #78350f;"><em>${planObj.student_roles.rotation_note}</em></p>`;
      }
      html += `</div>`;
    }

    // Activities section
    if (planObj.activities && planObj.activities.length > 0) {
      planObj.activities.forEach((activity, idx) => {
        html += `<div style="background: white; padding: 14px; border-radius: 8px; margin-bottom: 14px; border-left: 5px solid #8b5cf6; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">`;
        
        // Activity header with number badge
        html += `<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">`;
        html += `<div style="background: #8b5cf6; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">${idx + 1}</div>`;
        html += `<h4 style="margin: 0; color: #5b21b6; font-size: 16px; flex: 1;">${activity.activity_title || `Activity ${idx + 1}`}</h4>`;
        html += `<span style="background: rgba(139, 92, 246, 0.1); padding: 4px 10px; border-radius: 6px; font-size: 13px; color: #5b21b6; font-weight: 600;">⏱ ${activity.duration_minutes || 10} min</span>`;
        html += `</div>`;
        
        // Description
        html += `<div style="background: rgba(139, 92, 246, 0.05); padding: 10px; border-radius: 6px; margin-bottom: 10px;">`;
        html += `<p style="margin: 0; color: #1e293b; font-size: 14px; line-height: 1.6;">${activity.description || 'No description provided'}</p>`;
        html += `</div>`;
        
        // Differentiation (per-student)
        if (activity.differentiation && activity.differentiation.length > 0) {
          html += `<div style="margin-top: 10px;">`;
          html += `<h5 style="margin: 0 0 8px 0; color: #059669; font-size: 14px; display: flex; align-items: center; gap: 6px;">🎯 Differentiation</h5>`;
          html += `<div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 10px; border-radius: 6px; border-left: 3px solid #10b981;">`;
          activity.differentiation.forEach(diff => {
            html += `<div style="padding: 6px 0; border-bottom: 1px dashed rgba(16, 185, 129, 0.2); font-size: 13px; color: #065f46;">• ${diff}</div>`;
          });
          html += `</div></div>`;
        }
        
        // Observation signals
        if (activity.signals) {
          html += `<div style="margin-top: 10px; background: rgba(239, 68, 68, 0.08); padding: 10px; border-radius: 6px; border-left: 3px solid #ef4444;">`;
          html += `<h5 style="margin: 0 0 6px 0; color: #991b1b; font-size: 14px; display: flex; align-items: center; gap: 6px;">👀 Watch For</h5>`;
          html += `<p style="margin: 0; color: #7f1d1d; font-size: 13px; line-height: 1.5;">${activity.signals}</p>`;
          html += `</div>`;
        }
        
        html += `</div>`;
      });
    }

    return html;
  }

  /**
   * Main demo workflow function
   * Creates students, pod, generates 3 sessions, executes, adds feedback, shows analytics
   */
  window.runDemoWorkflow = async function() {
    try {
      if (!confirm('🎬 Run complete demo workflow?\n\nThis will:\n• Create 4 test students\n• Create a demo pod\n• Generate 3 session plans\n• Execute plans with feedback\n• Show analytics\n\nContinue?')) {
        return;
      }

      showProgress('Starting demo workflow...', 'info');
      await delay(500);

      // Step 1: Create test students
      showProgress('Step 1/6: Creating test students...', 'info');
      const students = await createTestStudents();
      showProgress(`✓ Created ${students.length} students`, 'success');
      await delay(1000);

      // Step 2: Create demo pod
      showProgress('Step 2/6: Creating demo pod...', 'info');
      const pod = await createDemoPod(students);
      showProgress(`✓ Created pod: ${pod.name}`, 'success');
      await delay(1000);

      // Reload UI to show new data
      if (typeof loadStudents === 'function') loadStudents();
      if (typeof loadPods === 'function') loadPods();
      await delay(1000);

      // Step 3: Generate 3 session plans
      showProgress('Step 3/6: Generating 3 session plans...', 'info');
      const plans = await generateThreeSessionPlans(pod);
      showProgress(`✓ Generated ${plans.length} session plans`, 'success');
      await delay(1000);

      // Step 4: Execute each plan
      showProgress('Step 4/6: Executing session plans...', 'info');
      await executeAllPlans(pod, plans);
      showProgress('✓ All sessions executed', 'success');
      await delay(1000);

      // Step 5: Add session feedback
      showProgress('Step 5/6: Adding session feedback...', 'info');
      await addSessionFeedback(pod, students);
      showProgress('✓ Feedback recorded', 'success');
      await delay(1000);

      // Step 6: Show analytics
      showProgress('Step 6/6: Opening analytics...', 'info');
      await delay(1000);
      
      // Refresh UI one more time
      if (typeof loadStudents === 'function') loadStudents();
      if (typeof loadPods === 'function') loadPods();
      
      // Open analytics view
      if (typeof showAnalytics === 'function') {
        showAnalytics();
      }

      showProgress('🎉 Demo workflow complete! Check analytics dashboard.', 'success');

      // Show summary dialog
      setTimeout(() => {
        alert(`✅ Demo Workflow Complete!\n\n` +
              `Created:\n` +
              `• 4 test students with assessments\n` +
              `• 1 demo pod\n` +
              `• 3 session plans (Welcome, First, Follow-up)\n` +
              `• Session execution records\n` +
              `• Student feedback data\n\n` +
              `Check the Analytics dashboard for insights!`);
      }, 1500);

    } catch (error) {
      console.error('Demo workflow failed:', error);
      showProgress(`❌ Error: ${error.message}`, 'error');
      alert(`Demo workflow failed: ${error.message}\n\nCheck console for details.`);
    }
  };

  /**
   * Create 4 test students with full profiles
   */
  async function createTestStudents() {
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
        assessmentComments: 'Strong analytical skills, needs confidence building',
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
        assessmentComments: 'Excellent social skills, needs math support',
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
        assessmentComments: 'Energetic learner, benefits from active learning',
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
        assessmentComments: 'High achiever, ready for advanced challenges',
        registeredAt: now
      }
    ];

    // Save students
    const existing = StorageHelper.loadStudents();
    const demoIds = students.map(s => s.id);
    const filtered = existing.filter(s => !demoIds.includes(s.id));
    const updated = filtered.concat(students);
    StorageHelper.saveStudents(updated);

    return students;
  }

  /**
   * Create a demo pod with the test students
   */
  async function createDemoPod(students) {
    const now = new Date().toISOString();
    
    const pod = {
      id: 'DEMO_POD_1',
      name: 'Demo Pod - Mixed Abilities',
      studentIds: students.map(s => s.id),
      createdAt: now,
      updatedAt: now
    };

    // Save pod
    const existing = StorageHelper.loadPods();
    const filtered = existing.filter(p => p.id !== pod.id);
    const updated = filtered.concat([pod]);
    StorageHelper.savePods(updated);

    return pod;
  }

  /**
   * Generate 3 session plans (Welcome, First, Follow-up)
   */
  async function generateThreeSessionPlans(pod) {
    const plans = [];
    const sessionTypes = ['welcome', 'first', 'followup'];
    const sessionNames = ['Welcome Session', 'First Full Session', 'Follow-up Session'];

    for (let i = 0; i < 3; i++) {
      showProgress(`  Generating ${sessionNames[i]}...`, 'info');
      
      try {
        // Use the AI generation if available, otherwise create mock plan
        const plan = await generateAndAcceptPlan(pod, sessionTypes[i], sessionNames[i]);
        plans.push(plan);
        await delay(2000); // Wait between generations
      } catch (error) {
        console.warn(`Failed to generate plan ${i + 1}:`, error);
        // Create mock plan
        const mockPlan = createMockPlan(pod, sessionTypes[i], sessionNames[i]);
        plans.push(mockPlan);
      }
    }

    return plans;
  }

  /**
   * Generate and accept a single plan
   */
  async function generateAndAcceptPlan(pod, sessionType, sessionName) {
    // Check if requestPodPlan exists
    if (typeof window.requestPodPlan !== 'function') {
      return createMockPlan(pod, sessionType, sessionName);
    }

    try {
      // Generate plan via AI
      await window.requestPodPlan(pod.id, sessionType);
      await delay(3000); // Wait for AI response

      // Check if plan was generated
      if (!window.__lastPlanData || !window.__lastPlanData.raw) {
        return createMockPlan(pod, sessionType, sessionName);
      }

      // Accept the plan
      if (typeof window.acceptCurrentPlan === 'function') {
        await window.acceptCurrentPlan();
        await delay(500);
      }

      return {
        id: Date.now().toString(),
        sessionType: sessionType,
        sessionName: sessionName,
        plan: window.__lastPlanData.raw,
        acceptedAt: new Date().toISOString()
      };
    } catch (error) {
      console.warn('AI generation failed, using mock:', error);
      return createMockPlan(pod, sessionType, sessionName);
    }
  }

  /**
   * Create a mock session plan
   */
  function createMockPlan(pod, sessionType, sessionName) {
    const now = new Date().toISOString();
    const planId = `PLAN_${Date.now()}`;

    const mockPlan = {
      session_title: sessionName,
      objective: `Build ${sessionType === 'welcome' ? 'trust and connection' : sessionType === 'first' ? 'foundational skills' : 'on previous learning'}`,
      duration_minutes: 45,
      student_roles: {
        role_list: ['Time Keeper', 'Materials Helper', 'Observer', 'Anchor'],
        instructions: [
          'Watch the timer and announce time remaining',
          'Distribute materials to the group',
          'Notice and share group energy levels',
          'Start each activity with a question'
        ],
        rotation_note: 'Roles will rotate each session'
      },
      activities: [
        {
          activity_title: 'Warm-Up Circle',
          duration_minutes: 10,
          description: 'Students share one word about how they feel today',
          differentiation: pod.studentIds.map((_, i) => `Student ${i + 1}: Encourage participation with visual cues`),
          signals: 'Watch for engagement and comfort levels'
        },
        {
          activity_title: 'Main Activity',
          duration_minutes: 25,
          description: 'Collaborative problem-solving exercise',
          differentiation: pod.studentIds.map((_, i) => `Student ${i + 1}: Provide scaffolded support as needed`),
          signals: 'Observe collaboration and critical thinking'
        },
        {
          activity_title: 'Reflection & Closing',
          duration_minutes: 10,
          description: 'Share one thing learned today',
          differentiation: pod.studentIds.map((_, i) => `Student ${i + 1}: Offer multiple ways to express learning`),
          signals: 'Check for understanding and emotional state'
        }
      ]
    };

    // Store in pod plans history
    const historyKey = `braingrain_pod_plans_${pod.id}`;
    let history = [];
    try {
      const raw = localStorage.getItem(historyKey);
      history = raw ? JSON.parse(raw) : [];
    } catch (e) {}

    const planEntry = {
      id: planId,
      plan: JSON.stringify(mockPlan),
      facilitatorHtml: formatPlanAsHTML(mockPlan),
      sessionType: sessionType,
      status: 'accepted',
      acceptedAt: now
    };

    history.unshift(planEntry);
    localStorage.setItem(historyKey, JSON.stringify(history));

    return planEntry;
  }

  /**
   * Format plan as HTML
   */
  function formatPlanAsHTML(plan) {
    let html = `<div style="padding:16px;">`;
    html += `<h3>${plan.session_title}</h3>`;
    html += `<p><strong>Objective:</strong> ${plan.objective}</p>`;
    html += `<p><strong>Duration:</strong> ${plan.duration_minutes} minutes</p>`;
    
    if (plan.activities) {
      html += `<h4>Activities:</h4>`;
      plan.activities.forEach((act, i) => {
        html += `<div style="margin:12px 0; padding:12px; background:#f5f5f5; border-radius:8px;">`;
        html += `<strong>${i + 1}. ${act.activity_title}</strong> (${act.duration_minutes} min)<br>`;
        html += `${act.description}`;
        html += `</div>`;
      });
    }
    
    html += `</div>`;
    return html;
  }

  /**
   * Execute all plans
   */
  async function executeAllPlans(pod, plans) {
    for (let i = 0; i < plans.length; i++) {
      showProgress(`  Executing session ${i + 1}/${plans.length}...`, 'info');
      
      // Mark plan as executed
      const historyKey = `braingrain_pod_plans_${pod.id}`;
      let history = [];
      try {
        const raw = localStorage.getItem(historyKey);
        history = raw ? JSON.parse(raw) : [];
      } catch (e) {}

      const planIndex = history.findIndex(p => p.id === plans[i].id);
      if (planIndex !== -1) {
        history[planIndex].status = 'executed';
        history[planIndex].executedAt = new Date().toISOString();
        localStorage.setItem(historyKey, JSON.stringify(history));
      }

      await delay(500);
    }
  }

  /**
   * Add session feedback for each student
   */
  async function addSessionFeedback(pod, students) {
    const feedbackKey = `braingrain_session_feedback_${pod.id}`;
    const feedback = [];

    students.forEach((student, idx) => {
      const behaviours = ['😊', '🙂', '😐'];
      const participations = ['🙌', '✋', '🤔'];
      const interests = ['🤩', '😊', '😐'];
      const emotions = ['😄', '😌', '😬'];

      feedback.push({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        behaviour: behaviours[idx % 3],
        behaviourNote: 'Engaged and focused during activities',
        participation: participations[idx % 3],
        participationNote: 'Actively contributed to discussions',
        interest: interests[idx % 3],
        interestNote: 'Showed curiosity in problem-solving',
        emotional: emotions[idx % 3],
        emotionalNote: 'Comfortable and relaxed',
        strengths: 'Good collaboration skills',
        needs: 'Continue building confidence',
        nextSession: 'More hands-on activities',
        timestamp: new Date().toISOString()
      });
    });

    localStorage.setItem(feedbackKey, JSON.stringify(feedback));
    showProgress(`  Added feedback for ${students.length} students`, 'info');
  }

  console.log('✓ Demo workflow module loaded');
})();
