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
   * Clear old demo data from localStorage
   */
  function clearOldDemoData() {
    console.log('🧹 Clearing old demo data...');
    
    // Clear demo students
    const students = StorageHelper.loadStudents();
    const nonDemoStudents = students.filter(s => !s.id.startsWith('DEMO_STU_'));
    StorageHelper.saveStudents(nonDemoStudents);
    
    // Clear demo pods
    const pods = StorageHelper.loadPods();
    const nonDemoPods = pods.filter(p => !p.id.startsWith('DEMO_POD_'));
    StorageHelper.savePods(nonDemoPods);
    
    // Clear demo pod plans
    localStorage.removeItem('braingrain_pod_plans_DEMO_POD_1');
    localStorage.removeItem('braingrain_pod_plan_DEMO_POD_1');
    
    // Clear demo feedback
    localStorage.removeItem('braingrain_session_feedback_DEMO_POD_1');
    
    console.log('✓ Old demo data cleared');
  }

  /**
   * Load demo data from backend endpoint
   * Fetches pre-configured students, pods, and session plans
   */
  window.loadDemoDataFromBackend = async function() {
    try {
      if (!confirm('📦 Load Demo Data from Backend?\n\nThis will:\n• Load 4 demo students\n• Create 1 demo pod\n• Add 6 detailed session plans\n• Add session feedback\n\nContinue?')) {
        return;
      }

      showProgress('Clearing old demo data...', 'info');
      clearOldDemoData();
      await delay(300);

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
        showProgress('Generating 6 detailed session plans...', 'info');
        await generateDemoSessionPlans(demoPod, students);
        showProgress('✓ Generated 6 session plans with feedback', 'success');
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

    // Session Plan 4: Emotional Intelligence & Self-Awareness
    const plan4 = {
      id: 'DEMO_PLAN_4',
      sessionId: 'DEMO_PLAN_4',
      status: 'executed',
      acceptedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      executedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      sessionType: 'followup',
      plan: {
        session_title: 'Emotional Intelligence - Understanding Our Feelings',
        objective: 'Develop emotional literacy through naming and validating feelings, practice self-regulation strategies using the "feelings thermometer," build empathy by perspective-taking, and create personal emotion toolkits for managing strong feelings in academic and social contexts.',
        duration_minutes: 45,
        student_roles: {
          role_list: ['Feelings Monitor', 'Examples Collector', 'Strategy Suggester', 'Practice Leader'],
          instructions: [
            'Notice emotional language used - tally how many feeling words the group uses',
            'Write down real-life examples shared by peers for later discussion',
            'When someone shares a problem, suggest one coping strategy we\'ve learned',
            'Lead practice of deep breathing or other calming techniques when needed'
          ],
          rotation_note: 'Emotional intelligence roles help normalize feelings as data to understand, not problems to fix.'
        },
        activities: [
          {
            activity_title: 'Feelings Check-In with Thermometer',
            duration_minutes: 10,
            description: 'Introduce "Feelings Thermometer" poster (0-10 scale: 0=calm, 5=ok, 10=overwhelmed). Each student places their name on the scale for how they feel RIGHT NOW. No judgment, just data. Facilitator shares first: "I\'m at a 6 today because I\'m excited but also nervous about trying something new." Debrief: What do different numbers mean to different people?',
            differentiation: [
              `${students[0].firstName}: Validate that being nervous (6-7) is normal and shows you care`,
              `${students[1].firstName}: Offer color-coding instead of numbers if that feels clearer`,
              `${students[2].firstName}: Physical placement - walk to poster and move your name marker`,
              `${students[3].firstName}: Ask to identify patterns - why might we all be at similar or different levels today?`
            ],
            signals: 'Watch: Who avoids sharing? Who downplays strong feelings? Do students use specific feeling words or just "good/bad"? Validate ALL emotions as acceptable.'
          },
          {
            activity_title: 'Emotion Scenarios - What Would You Do?',
            duration_minutes: 15,
            description: 'Present 4 age-appropriate scenarios (missed goal in sports, bad test grade, friend excluded you, proud of accomplishment). For each: 1) Name the feeling (anger, disappointment, hurt, pride), 2) Rate intensity on thermometer, 3) Suggest 2 healthy coping strategies, 4) Role-play one strategy as group. Facilitator models: "I feel _____ because _____. To help myself, I could _____."',
            differentiation: [
              `${students[0].firstName}: Academic scenarios resonate - focus on test anxiety, homework stress`,
              `${students[1].firstName}: Include scenarios about creativity/art - frustration when project doesn\'t turn out as imagined`,
              `${students[2].firstName}: Physical/sports scenarios - energy management when hyper or tired`,
              `${students[3].firstName}: Social scenarios - navigating peer dynamics, being the responsible one`
            ],
            signals: 'Listen for: Problem-solving vs. blame, self-compassion vs. self-criticism, ability to name specific emotions beyond "mad/sad/happy," willingness to try coping strategies.'
          },
          {
            activity_title: 'Build Your Emotion Toolkit',
            duration_minutes: 12,
            description: 'Each student creates personal "toolkit" on index card. Draw/write 5 strategies that help when feelings get big: deep breathing (box breathing demo), count to 10, walk away and come back, talk to trusted person, draw/write about it, physical movement, etc. Decorate cards, laminate if possible, keep in pocket/backpack. Practice one strategy together as group.',
            differentiation: [
              `${students[0].firstName}: Include cognitive strategies - "positive self-talk," "remind myself of past success"`,
              `${students[1].firstName}: Visual/artistic toolkit - use colors, symbols, drawings instead of just words`,
              `${students[2].firstName}: Kinesthetic strategies emphasized - jumping jacks, wall push-ups, stretching`,
              `${students[3].firstName}: Include helping-others strategies - "teach a peer," "be the calm leader"`
            ],
            signals: 'Observe: Engagement with toolkit creation, whether strategies are realistic (not just "calm down"), ownership of personalized tools, willingness to practice in safe space.'
          },
          {
            activity_title: 'Empathy Circle - Walking in Others\' Shoes',
            duration_minutes: 8,
            description: 'Quick empathy exercise: Each person shares one time they felt misunderstood. Others respond with: "That must have felt _____" (naming the emotion). No fixing, no advice, just validation. Facilitator emphasizes: Understanding ≠ Agreeing. We can understand someone\'s feelings without experiencing the same situation. Close with appreciation for vulnerability.',
            differentiation: [
              `${students[0].firstName}: Allow written sharing first if speaking feels vulnerable`,
              `${students[1].firstName}: Connect to art/stories - "Characters in books feel misunderstood too"`,
              `${students[2].firstName}: Keep it brief if sitting still is hard - one sentence max per person`,
              `${students[3].firstName}: Challenge to name complex emotions - frustration + sadness, excited + nervous`
            ],
            signals: 'Watch: Ability to validate without minimizing, use of empathetic language, comfort with vulnerability, tendency to share personal vs. hypothetical examples.'
          }
        ]
      }
    };

    // Session Plan 5: Communication & Conflict Resolution
    const plan5 = {
      id: 'DEMO_PLAN_5',
      sessionId: 'DEMO_PLAN_5',
      status: 'executed',
      acceptedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      executedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      sessionType: 'followup',
      plan: {
        session_title: 'Communication Skills - Speaking Up & Listening Well',
        objective: 'Master "I statements" for expressing needs without blame, practice active listening with reflection and clarification, role-play conflict scenarios using problem-solving framework, and build confidence in advocating for self and others in academic and social settings.',
        duration_minutes: 45,
        student_roles: {
          role_list: ['Body Language Watcher', 'I-Statement Counter', 'Clarifier', 'Peacekeeper'],
          instructions: [
            'Observe non-verbal communication - posture, eye contact, gestures - share what you notice',
            'Tally when people use "I feel..." vs. "You always..." statements',
            'When confusion arises, ask "Can you explain what you mean by...?"',
            'If tension builds, suggest break or reframe conversation positively'
          ],
          rotation_note: 'Communication roles make invisible skills visible - we learn by observing ourselves and others.'
        },
        activities: [
          {
            activity_title: 'I-Statements vs. You-Statements Practice',
            duration_minutes: 12,
            description: 'Teach formula: "I feel _____ when _____ because _____, and I need _____." Contrast with blaming: "You always _____!" Present 5 conflict situations (partner not sharing materials, someone cut in line, group member not contributing, etc.). For each, students rewrite "You" statement as "I" statement. Practice saying them out loud with confident tone.',
            differentiation: [
              `${students[0].firstName}: Academic conflicts - "I feel frustrated when I don\'t understand directions because I want to do well, and I need clearer examples"`,
              `${students[1].firstName}: Emotional conflicts - "I feel hurt when my ideas are dismissed because I worked hard on them, and I need to be heard"`,
              `${students[2].firstName}: Behavioral conflicts - "I feel overwhelmed when I\'m expected to sit still for long periods because I learn better when moving, and I need movement breaks"`,
              `${students[3].firstName}: Leadership conflicts - "I feel stressed when I\'m always the one organizing because it\'s a lot of responsibility, and I need others to step up sometimes"`
            ],
            signals: 'Listen: Use of formula vs. reverting to blame, ability to name specific feelings and needs, tone (assertive vs. aggressive vs. passive), willingness to practice publicly.'
          },
          {
            activity_title: 'Active Listening Challenge',
            duration_minutes: 10,
            description: 'Pairs take turns: Speaker shares 1-minute story about their day. Listener cannot interrupt, must maintain eye contact, nod/show engagement. After speaker finishes, listener reflects back: "What I heard you say is..." and asks ONE clarifying question. Switch roles. Debrief: What made you feel heard? What was hardest about just listening?',
            differentiation: [
              `${students[0].firstName}: Cognitive listening - focus on content, details, logical sequence`,
              `${students[1].firstName}: Emotional listening - tune into feelings behind words, validate emotions`,
              `${students[2].firstName}: Physical listening - may need fidget tool to help focus, that\'s ok`,
              `${students[3].firstName}: Strategic listening - notice what\'s NOT being said, read between lines`
            ],
            signals: 'Observe: Interrupting behavior, body language of engagement, quality of reflection (surface vs. deep understanding), comfort with silence, empathy in questions asked.'
          },
          {
            activity_title: 'Conflict Role-Play with Framework',
            duration_minutes: 18,
            description: 'Present realistic peer conflict: Two students want to be team leader, or group can\'t agree on project topic, or someone feels left out. Apply 5-step conflict resolution: 1) Each person uses I-statement, 2) Active listening - reflect back, 3) Find common ground, 4) Brainstorm solutions together, 5) Try one solution. Role-play with 2 volunteers, class observes and gives feedback. Switch and try second scenario.',
            differentiation: [
              `${students[0].firstName}: Assign reflector role - listen carefully and summarize both perspectives`,
              `${students[1].firstName}: Assign feelings identifier - name emotions underlying conflict`,
              `${students[2].firstName}: Assign solution generator - brainstorm creative compromise ideas`,
              `${students[3].firstName}: Assign facilitator role - keep group on track through 5 steps`
            ],
            signals: 'Critical watch: Power dynamics (who dominates), win-win vs. win-lose thinking, genuine empathy vs. performative, ability to separate person from problem, persistence when first solution doesn\'t work.'
          },
          {
            activity_title: 'Assertiveness Skill Practice',
            duration_minutes: 5,
            description: 'Quick scenarios where students practice assertive (not aggressive, not passive) responses: Saying "no" to peer pressure, asking teacher for help, correcting someone who mispronounced your name, advocating for fair group roles. Practice body language: stand tall, calm voice, direct eye contact. Emphasize: Being assertive means respecting yourself AND others.',
            differentiation: [
              `${students[0].firstName}: Academic assertiveness - "Could you explain that a different way? I want to understand"`,
              `${students[1].firstName}: Creative assertiveness - "I have a different idea. Can I share it?"`,
              `${students[2].firstName}: Physical space assertiveness - "I need more room to work comfortably"`,
              `${students[3].firstName}: Leadership assertiveness - "I\'d like to try leading this time, not always following"`
            ],
            signals: 'Watch: Comfort level with assertiveness (cultural/gender considerations), distinguishing assertive from rude, ability to say "no" without guilt, confidence in voice and posture.'
          }
        ]
      }
    };

    // Session Plan 6: Growth Mindset & Celebrating Progress
    const plan6 = {
      id: 'DEMO_PLAN_6',
      sessionId: 'DEMO_PLAN_6',
      status: 'executed',
      acceptedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      executedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      sessionType: 'followup',
      plan: {
        session_title: 'Growth Mindset - From "I Can\'t" to "I Can\'t YET"',
        objective: 'Transform fixed mindset beliefs into growth mindset perspectives, document personal progress across sessions using concrete evidence, practice reframing failure as feedback, set SMART goals for continued development, and celebrate both academic and social-emotional growth achievements.',
        duration_minutes: 45,
        student_roles: {
          role_list: ['Progress Tracker', 'Reframe Helper', 'Evidence Collector', 'Celebration Leader'],
          instructions: [
            'Document examples of growth mindset language used during session',
            'When someone says "I can\'t," gently add "...YET!" and ask what they need to learn',
            'Collect specific evidence of progress - quotes, examples, observations',
            'Lead group in celebrating wins - both big milestones and tiny improvements'
          ],
          rotation_note: 'Growth mindset roles help us see progress that\'s easy to miss when we\'re too close to our own journey.'
        },
        activities: [
          {
            activity_title: 'Then vs. Now - Progress Showcase',
            duration_minutes: 15,
            description: 'Facilitator shares evidence from Session 1: "In week 1, Aarav said 3 words in Name Circle. Today, he led a full conflict role-play." Each student reviews their goal cards from previous sessions. Create "Then vs. Now" poster: Draw line down middle. LEFT side = "When I started Brain Grain," RIGHT side = "Now I can..." Include academic skills (problem-solving) AND social-emotional skills (speaking up, managing frustration, helping others).',
            differentiation: [
              `${students[0].firstName}: Academic progress highlighted - confidence in participation, understanding concepts faster`,
              `${students[1].firstName}: Creative/emotional progress - expressing feelings, contributing ideas without fear`,
              `${students[2].firstName}: Behavioral progress - focus improvement, leadership in physical activities`,
              `${students[3].firstName}: Leadership progress - teaching peers, strategic thinking, empathy development`
            ],
            signals: 'Watch: Ability to self-assess accurately (not overly harsh or inflated), recognition of small wins, pride in non-academic growth, specific examples vs. vague claims.'
          },
          {
            activity_title: 'Failure = Feedback Activity',
            duration_minutes: 12,
            description: 'Share famous failure stories: Michael Jordan cut from team, J.K. Rowling rejected 12 times, Einstein struggled in school. Then: Each student shares one "failure" from past year. Reframe together: What did you LEARN? What would you do differently? How did it make you stronger? Write new narrative: "I tried _____, it didn\'t work because _____, so next time I\'ll _____." Burn/crumple old "I failed" paper, keep new "I learned" paper.',
            differentiation: [
              `${students[0].firstName}: Academic failure reframe - bad test grade taught me to ask for help sooner`,
              `${students[1].firstName}: Creative failure reframe - art project that "failed" taught me to try new techniques`,
              `${students[2].firstName}: Behavioral failure reframe - getting in trouble taught me about consequences and self-control`,
              `${students[3].firstName}: Social failure reframe - friend conflict taught me about communication and compromise`
            ],
            signals: 'Critical observation: Willingness to be vulnerable about failure, shift from shame to curiosity, ownership vs. blame, specificity of learning, emotional regulation when discussing painful memories.'
          },
          {
            activity_title: 'SMART Goals for Next Phase',
            duration_minutes: 10,
            description: 'Teach SMART framework: Specific, Measurable, Achievable, Relevant, Time-bound. Bad goal: "Be better at math." SMART goal: "Complete 10 practice problems per week for next month, aiming to improve fractions score by 15%." Each student creates ONE academic goal and ONE social-emotional goal for next 6 weeks. Share with partner for accountability. Exchange contact info (with facilitator as backup) for check-ins.',
            differentiation: [
              `${students[0].firstName}: Academic SMART goal - "Raise hand at least twice per class next week" (participation confidence)`,
              `${students[1].firstName}: Artistic SMART goal - "Submit one creative project to class competition by end of month"`,
              `${students[2].firstName}: Behavioral SMART goal - "Use 3 deep breaths before reacting when frustrated, track daily for 2 weeks"`,
              `${students[3].firstName}: Leadership SMART goal - "Mentor one younger student weekly, help with homework for 4 weeks"`
            ],
            signals: 'Check: Are goals truly SMART or still vague? Ambitious but achievable vs. impossible? Internal motivation vs. external pressure? Excitement vs. dread about goals?'
          },
          {
            activity_title: 'Celebration & Gratitude Circle',
            duration_minutes: 8,
            description: 'Final circle: Each person shares ONE thing they\'re proud of from entire Brain Grain experience AND ONE person they want to thank (can be peer, facilitator, or even themselves). Facilitator gives each student personalized "certificate of growth" highlighting specific observed progress. Group cheer/chant. End with: "What you learned here doesn\'t stay here - take it everywhere you go. You\'ve got this!"',
            differentiation: [
              `${students[0].firstName}: Proud of academic courage - "I\'m proud I asked questions even when scared"`,
              `${students[1].firstName}: Proud of emotional growth - "I\'m proud I shared my feelings and didn\'t hide"`,
              `${students[2].firstName}: Proud of behavioral change - "I\'m proud I learned to focus better"`,
              `${students[3].firstName}: Proud of impact on others - "I\'m proud I helped my teammates succeed"`
            ],
            signals: 'Final assessment: Genuine pride vs. obligatory participation, gratitude specificity, emotional tone (joyful, bittersweet, excited for future), peer support visible, facilitator-student rapport, readiness to apply skills independently.'
          }
        ]
      }
    };

    // Generate facilitatorHtml for each plan
    [plan1, plan2, plan3, plan4, plan5, plan6].forEach(plan => {
      plan.facilitatorHtml = generateFacilitatorHTML(plan.plan);
    });

    // Save plans to localStorage
    const planHistory = [plan1, plan2, plan3, plan4, plan5, plan6];
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

    // Feedback for Session 4
    students.forEach((student, idx) => {
      const feedbackData = {
        sessionId: 'DEMO_PLAN_4',
        studentId: student.id,
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        behaviour: ['😊', '😊', '🙂', '😊'][idx],
        behaviourNote: ['Opening up emotionally', 'Comfortable sharing feelings', 'Engaged with emotion talk', 'Insightful observations'][idx],
        participation: ['✋', '🙌', '🙌', '🙌'][idx],
        participationNote: ['Shared personal example', 'Very active in toolkit creation', 'Physical strategies resonated', 'Led empathy exercise'][idx],
        interest: ['😊', '🤩', '😊', '🤩'][idx],
        interestNote: ['Interested in coping strategies', 'Loved artistic toolkit', 'Thermometer made sense', 'Fascinated by emotional patterns'][idx],
        emotional: ['😌', '😄', '😌', '😄'][idx],
        emotionalNote: ['More self-aware', 'Expressed joy freely', 'Calmer overall', 'Emotionally intelligent'][idx],
        strengths: ['Named specific emotions, self-reflection', 'Creative expression, empathy', 'Physical self-regulation tools', 'Meta-awareness of emotions'][idx],
        needs: ['Continue building feeling vocabulary', 'Bridge emotions to academics', 'Practice strategies at home', 'Advanced emotion concepts'][idx],
        nextSession: ['Role-play emotion scenarios', 'Art-based emotion work', 'Movement-based regulation', 'Teach emotion concepts to peers'][idx]
      };
      feedback.push(feedbackData);
    });

    // Feedback for Session 5
    students.forEach((student, idx) => {
      const feedbackData = {
        sessionId: 'DEMO_PLAN_5',
        studentId: student.id,
        timestamp: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        behaviour: ['🙂', '😊', '😊', '😊'][idx],
        behaviourNote: ['More assertive communication', 'Confident in expressing self', 'Better impulse control', 'Natural facilitator'][idx],
        participation: ['🙌', '✋', '🙌', '🙌'][idx],
        participationNote: ['Used I-statements naturally', 'Great active listener', 'Role-played conflict well', 'Modeled assertiveness'][idx],
        interest: ['😊', '😊', '🤩', '😊'][idx],
        interestNote: ['Interested in communication', 'Appreciated listening skills', 'Loved conflict role-play', 'Engaged with all concepts'][idx],
        emotional: ['😄', '😌', '😄', '😄'][idx],
        emotionalNote: ['Proud of new skills', 'Peaceful and confident', 'Energized by activity', 'Emotionally mature'][idx],
        strengths: ['Clear communication, assertiveness', 'Empathetic listening, validation', 'Creative problem-solving', 'Conflict mediation skills'][idx],
        needs: ['Practice in real conflicts', 'Build on communication base', 'Channel energy appropriately', 'Advanced negotiation skills'][idx],
        nextSession: ['Real-world conflict practice', 'Peer mediation role', 'Physical communication games', 'Lead communication workshop'][idx]
      };
      feedback.push(feedbackData);
    });

    // Feedback for Session 6
    students.forEach((student, idx) => {
      const feedbackData = {
        sessionId: 'DEMO_PLAN_6',
        studentId: student.id,
        timestamp: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        behaviour: ['😊', '😊', '😊', '😊'][idx],
        behaviourNote: ['Confident and proud', 'Joyful and expressive', 'Focused and mature', 'Leadership shining'][idx],
        participation: ['🙌', '🙌', '🙌', '🙌'][idx],
        participationNote: ['Shared progress authentically', 'Emotional in gratitude circle', 'Set ambitious goals', 'Inspired the group'][idx],
        interest: ['🤩', '🤩', '😊', '🤩'][idx],
        interestNote: ['Excited about growth journey', 'Loved celebrating progress', 'Proud of achievements', 'Ready for next challenge'][idx],
        emotional: ['😄', '😄', '😄', '😄'][idx],
        emotionalNote: ['Deeply proud', 'Grateful and happy', 'Confident in abilities', 'Transformative experience'][idx],
        strengths: ['Academic confidence, growth mindset', 'Emotional intelligence, creativity', 'Self-regulation, leadership', 'Meta-cognition, mentorship'][idx],
        needs: ['Continue challenging self', 'Share gifts with others', 'Maintain healthy practices', 'Set bigger goals'][idx],
        nextSession: ['Advanced problem-solving', 'Mentor younger students', 'Complex team challenges', 'Design own learning projects'][idx]
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
