// Browser Console Snippet: Add Test Students Without Overwriting Existing Data
// Copy and paste this entire code block into your browser console

(function() {
  const now = new Date().toISOString();
  
  // First, backup current data to file automatically
  console.log('Creating automatic backup before adding test students...');
  try {
    StorageHelper.exportStudentsToFile();
    console.log('✓ Backup created successfully');
  } catch (e) {
    console.warn('Could not create automatic backup:', e);
  }
  
  // Define test students with varying assessment levels
  const testStudents = [
    {
      id: 'TEST_VERY_LOW',
      firstName: 'Alice',
      lastName: 'Beginner',
      grade: '5',
      phone: '9876543210',
      school: 'Test School',
      assessmentScore: 12,
      assessmentBreakdown: { 
        selPercent: 10,      // Very low SEL
        ctPercent: 15,       // Very low Critical Thinking
        leadPercent: 12      // Very low Leadership
      },
      assessmentStatus: 'Completed',
      assessmentDate: now,
      registeredAt: now
    },
    {
      id: 'TEST_LOW',
      firstName: 'Bob',
      lastName: 'Developing',
      grade: '6',
      phone: '9876543211',
      school: 'Test School',
      assessmentScore: 28,
      assessmentBreakdown: { 
        selPercent: 30,      // Low SEL
        ctPercent: 25,       // Low Critical Thinking
        leadPercent: 28      // Low Leadership
      },
      assessmentStatus: 'Completed',
      assessmentDate: now,
      registeredAt: now
    },
    {
      id: 'TEST_MEDIUM',
      firstName: 'Charlie',
      lastName: 'Progressing',
      grade: '7',
      phone: '9876543212',
      school: 'Test School',
      assessmentScore: 42,
      assessmentBreakdown: { 
        selPercent: 55,      // Medium SEL
        ctPercent: 65,       // Medium Critical Thinking
        leadPercent: 60      // Medium Leadership
      },
      assessmentStatus: 'Completed',
      assessmentDate: now,
      registeredAt: now
    },
    {
      id: 'TEST_HIGH',
      firstName: 'Dana',
      lastName: 'Advanced',
      grade: '8',
      phone: '9876543213',
      school: 'Test School',
      assessmentScore: 56,
      assessmentBreakdown: { 
        selPercent: 92,      // High SEL
        ctPercent: 88,       // High Critical Thinking
        leadPercent: 85      // High Leadership
      },
      assessmentStatus: 'Completed',
      assessmentDate: now,
      registeredAt: now
    }
  ];
  
  // Load existing students
  let existingStudents = [];
  try {
    existingStudents = StorageHelper.loadStudents();
    console.log(`Found ${existingStudents.length} existing students`);
  } catch (e) {
    console.error('Error loading existing students:', e);
    existingStudents = [];
  }
  
  // Remove any old test students with same IDs
  const testIds = testStudents.map(s => s.id);
  existingStudents = existingStudents.filter(s => !testIds.includes(s.id));
  console.log(`Removed ${testIds.length} old test students (if any existed)`);
  
  // Add new test students
  const allStudents = existingStudents.concat(testStudents);
  
  // Save
  try {
    const success = StorageHelper.saveStudents(allStudents);
    if (success) {
      console.log('✓ Test students added successfully!');
      console.log(`Total students now: ${allStudents.length}`);
      console.log('\nTest Students Added:');
      testStudents.forEach(s => {
        console.log(`  - ${s.firstName} ${s.lastName}: Score ${s.assessmentScore} (SEL: ${s.assessmentBreakdown.selPercent}%, CT: ${s.assessmentBreakdown.ctPercent}%, Lead: ${s.assessmentBreakdown.leadPercent}%)`);
      });
      alert(`✓ Test students added successfully!\n\nTotal students: ${allStudents.length}\n\nRefreshing page...`);
      setTimeout(() => location.reload(), 1000);
    } else {
      throw new Error('Save operation returned false');
    }
  } catch (e) {
    console.error('✗ Failed to save students:', e);
    alert('Failed to add test students. Check console for details.');
  }
})();
