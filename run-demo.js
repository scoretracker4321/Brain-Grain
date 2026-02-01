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
  const plans = ['Welcome Session', 'First Full Session', 'Follow-up Session'];
  const types = ['welcome', 'first', 'followup'];
  
  plans.forEach((name, idx) => {
    const plan = {
      id: `PLAN_${Date.now()}_${idx}`,
      sessionType: types[idx],
      sessionName: name,
      status: 'executed',
      acceptedAt: new Date().toISOString(),
      executedAt: new Date().toISOString(),
      plan: JSON.stringify({
        session_title: name,
        objective: `Build ${types[idx] === 'welcome' ? 'trust' : types[idx] === 'first' ? 'skills' : 'momentum'}`,
        duration_minutes: 45,
        activities: [
          { activity_title: 'Warm-Up', duration_minutes: 10, description: 'Ice breaker activity' },
          { activity_title: 'Main Activity', duration_minutes: 25, description: 'Core learning' },
          { activity_title: 'Reflection', duration_minutes: 10, description: 'Share learnings' }
        ]
      })
    };
    
    const key = `pod_plans_${pod.id}`;
    const existing = loadData(key);
    existing.unshift(plan);
    saveData(key, existing);
  });
  
  console.log('✓ Created 3 session plans (all executed)');
}

// Create feedback
function createFeedback(pod, students) {
  const feedback = students.map((s, idx) => ({
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
