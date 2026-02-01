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
