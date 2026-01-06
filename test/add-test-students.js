// Script to add four test students with varying assessment scores
const StorageHelper = (typeof window !== 'undefined' && window.StorageHelper) ? window.StorageHelper : require('../utils.js').StorageHelper;

function addTestStudents() {
  const now = new Date().toISOString();
  const students = [
    {
      id: 'TEST_LOWEST',
      firstName: 'Alice',
      lastName: 'Low',
      grade: '5',
      assessmentScore: 10,
      assessmentBreakdown: { selPercent: 20, ctPercent: 15, leadPercent: 10 },
      assessmentStatus: 'Completed',
      assessmentDate: now,
      registeredAt: now
    },
    {
      id: 'TEST_LOW',
      firstName: 'Bob',
      lastName: 'BelowAvg',
      grade: '6',
      assessmentScore: 25,
      assessmentBreakdown: { selPercent: 35, ctPercent: 30, leadPercent: 40 },
      assessmentStatus: 'Completed',
      assessmentDate: now,
      registeredAt: now
    },
    {
      id: 'TEST_MED',
      firstName: 'Charlie',
      lastName: 'Mid',
      grade: '7',
      assessmentScore: 40,
      assessmentBreakdown: { selPercent: 60, ctPercent: 65, leadPercent: 55 },
      assessmentStatus: 'Completed',
      assessmentDate: now,
      registeredAt: now
    },
    {
      id: 'TEST_HIGH',
      firstName: 'Dana',
      lastName: 'High',
      grade: '8',
      assessmentScore: 55,
      assessmentBreakdown: { selPercent: 90, ctPercent: 85, leadPercent: 80 },
      assessmentStatus: 'Completed',
      assessmentDate: now,
      registeredAt: now
    }
  ];

  // Load existing students, add these (replace if same id), and save
  let existing = [];
  try {
    existing = StorageHelper.loadStudents ? StorageHelper.loadStudents() : [];
  } catch (e) {}
  // Remove any with same ids
  const ids = students.map(s => s.id);
  existing = existing.filter(s => !ids.includes(s.id));
  const all = existing.concat(students);
  if (StorageHelper.saveStudents) {
    StorageHelper.saveStudents(all);
    console.log('Test students added.');
  } else {
    console.error('StorageHelper.saveStudents not available');
  }
}

// If running in Node or test, export; if in browser, run directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { addTestStudents };
} else {
  addTestStudents();
}