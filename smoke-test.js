const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function loadAndInject(htmlPath, scriptPath) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  const script = fs.readFileSync(scriptPath, 'utf8');

  // Inline utils.js, registration.js, admin.js and assessment-app.js into the page for isolated testing
  const utils = fs.readFileSync(path.join(__dirname, 'utils.js'), 'utf8');
  html = html.replace(/<script src="utils.js"><\/script>/, `<script>${utils}</script>`);
  // Inline registration.js when present
  try {
    const registration = fs.readFileSync(path.join(__dirname, 'registration.js'), 'utf8');
    html = html.replace(/<script src="registration.js"><\/script>/, `<script>${registration}</script>`);
  } catch (e) {}
  // Inline admin.js when present
  try {
    const admin = fs.readFileSync(path.join(__dirname, 'admin.js'), 'utf8');
    html = html.replace(/<script src="admin.js"><\/script>/, `<script>${admin}</script>`);
  } catch (e) {}
  html = html.replace(/<script src="assessment-app.js"><\/script>/, `<script>${script}</script>`);
  return html;
}

async function runAdminReportTest() {
  const html = loadAndInject(path.join(__dirname, 'assessment.html'), path.join(__dirname, 'assessment-app.js'));

  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost:5500/assessment.html?studentId=test-student&view=report' });
  const { window } = dom;

  // Seed localStorage with a test student record
  const students = [{ id: 'test-student', firstName: 'Test', lastName: 'Student', grade: '5', assessmentScore: 42, assessmentBreakdown: { selPercent: 40, ctPercent: 50, leadPercent: 36 } }];
  window.localStorage.setItem('braingrain_students', JSON.stringify(students));

  // Wait for scripts to initialize
  await new Promise(r => setTimeout(r, 100));

  // Call showResults (report view should force display even without opener)
  try {
    if (typeof window.showResults === 'function') {
      window.showResults();
    }
  } catch (e) {
    console.error('showResults threw', e);
  }

  const resultsScreen = window.document.getElementById('results-screen');
  const studentThanks = window.document.getElementById('student-thanks');

  console.log('ADMIN REPORT TEST: resultsScreen visible =', resultsScreen && resultsScreen.classList.contains('active'));
  console.log('ADMIN REPORT TEST: studentThanks visible =', studentThanks && studentThanks.style.display !== 'none' && studentThanks.style.display !== '');

  // Check that saved breakdown was used to populate elements
  const selText = window.document.getElementById('sel-score') ? window.document.getElementById('sel-score').textContent : null;
  console.log('ADMIN REPORT TEST: sel-score text =', selText);
}

async function runStudentDirectTest() {
  const html = loadAndInject(path.join(__dirname, 'assessment.html'), path.join(__dirname, 'assessment-app.js'));

  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost:5500/assessment.html?studentId=test-student' });
  const { window } = dom;

  // Seed localStorage with a test student record
  const students = [{ id: 'test-student', firstName: 'Test', lastName: 'Student', grade: '5' }];
  window.localStorage.setItem('braingrain_students', JSON.stringify(students));

  await new Promise(r => setTimeout(r, 100));

  // Simulate completing the assessment by setting some scores in state, then calling showResults
  try {
      // Use page eval to mutate the in-page assessmentState object (const in page scope)
      try {
        window.eval("assessmentState.scores = { SEL: [8,8], CriticalThinking: [7,7], Leadership: [6,6] }; assessmentState.totalScore = 42;");
      } catch (e) {
        // fallback if eval isn't available
        if (window.assessmentState) {
          window.assessmentState.scores = { SEL: [8,8], CriticalThinking: [7,7], Leadership: [6,6] };
          window.assessmentState.totalScore = 42;
        }
      }

      if (typeof window.showResults === 'function') window.showResults();
    } catch (e) {
      console.error('showResults threw', e);
    }
  const resultsScreen = window.document.getElementById('results-screen');
  const studentThanks = window.document.getElementById('student-thanks');

  console.log('STUDENT DIRECT TEST: resultsScreen visible =', resultsScreen && resultsScreen.classList.contains('active'));
  console.log('STUDENT DIRECT TEST: studentThanks visible =', studentThanks && (studentThanks.style.display === 'block' || studentThanks.style.display === '' || studentThanks.style.display === undefined));

  // Check that localStorage got updated with assessment results
  const raw = window.localStorage.getItem('braingrain_students');
  const arr = raw ? JSON.parse(raw) : [];
  const st = arr.find(s => s.id === 'test-student');
  console.log('STUDENT DIRECT TEST: saved assessmentScore =', st ? st.assessmentScore : null);
}

(async function(){
  console.log('Starting smoke tests...');
  await runAdminReportTest();
  await runStudentDirectTest();
  await runRegistrationTest();
  await runAdminListReportCheck();
  console.log('Smoke tests finished.');
})();

async function runAdminListReportCheck() {
  // Load admin list and seed with a student that has assessmentBreakdown
  const html = loadAndInject(path.join(__dirname, 'index.html'), path.join(__dirname, 'assessment-app.js'));
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost:5500/index.html' });
  const { window } = dom;
  // stub alert/scrollTo used by page
  window.alert = () => {};
  window.scrollTo = () => {};

  const student = { id: 'report-student', firstName: 'Report', lastName: 'Person', grade: '9', phone: '9876543210', assessmentStatus: 'Completed', assessmentBreakdown: { selPercent: 50, ctPercent: 60, leadPercent: 70 } };
  window.localStorage.setItem('braingrain_students', JSON.stringify([student]));

  await new Promise(r => setTimeout(r, 100));

  try { window.loadStudents(); } catch (e) {}
  await new Promise(r => setTimeout(r, 50));

  const rows = window.document.querySelectorAll('#studentTableBody tr');
  let found = false;
  rows.forEach(r => {
    if (r.textContent.includes('Report') && r.textContent.includes('Person')) {
      found = true;
      const reportLink = r.querySelector('a[href*="assessment.html"][target]');
      const assessmentLink = r.querySelector('a[target="_blank"][href*="assessment.html"]');
      console.log('ADMIN LIST REPORT CHECK: report link present =', !!reportLink);
      console.log('ADMIN LIST REPORT CHECK: assessment link present =', !!assessmentLink);
    }
  });
  if (!found) console.log('ADMIN LIST REPORT CHECK: student row not found');
}

async function runRegistrationTest() {
  const html = loadAndInject(path.join(__dirname, 'index.html'), path.join(__dirname, 'assessment-app.js'));
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost:5500/index.html' });
  const { window } = dom;
  await new Promise(r => setTimeout(r, 100));

  // Provide missing window methods used by the page (stubs for jsdom)
  window.alert = () => {};
  window.scrollTo = () => {};

  // Prepare currentStudentData directly (bypassing full form navigation)
  try {
    window.eval("window.currentStudentData = " + JSON.stringify({
      firstName: 'Reg',
      lastName: 'Tester',
      dob: '2008-01-01',
      grade: '8',
      school: 'Test School',
      phone: '9876543210',
      doorNo: '12',
      street: 'Main St',
      area: 'Test Area',
      city: 'Test City',
      pincode: '600001',
      whenDontUnderstand: 'ask-help',
      enjoyDoing: 'Drawing',
      findDifficult: 'Fractions',
      parentName: 'Parent Test',
      parentPhone: '9876543210',
      parentPhoneAlt: '',
      parentEmail: '',
      childGoodAt: 'Maths',
      wishForChild: 'Gain confidence',
      examType: 'mid-term'
    }) + ";");
  } catch (e) {
    // fine to ignore in some runtimes
  }

  // Agree terms
  const agree = window.document.getElementById('agree-terms');
  if (agree) agree.checked = true;

  // Call submit and then verify storage
  try {
    if (typeof window.submitStudentRegistration === 'function') window.submitStudentRegistration();
    console.log('REGISTRATION TEST: allStudents length after submit =', (window.allStudents || []).length);
  } catch (e) {
    console.error('submitStudentRegistration threw', e);
  }

  // Wait briefly for storage to be written
  await new Promise(r => setTimeout(r, 50));

  // Ensure admin list is refreshed
  try { window.loadStudents(); } catch(e) {}

  const raw = window.localStorage.getItem('braingrain_students');
  const arr = raw ? JSON.parse(raw) : [];
  const st = arr.find(s => s.firstName === 'Reg' && s.lastName === 'Tester');
  console.log('REGISTRATION TEST: student saved =', !!st);
  console.log('REGISTRATION TEST: whenDontUnderstand =', st ? st.whenDontUnderstand : null);
  console.log('REGISTRATION TEST: enjoyDoing =', st ? st.enjoyDoing : null);
  console.log('REGISTRATION TEST: findDifficult =', st ? st.findDifficult : null);
  console.log('REGISTRATION TEST: childGoodAt =', st ? st.childGoodAt : null);
  console.log('REGISTRATION TEST: wishForChild =', st ? st.wishForChild : null);
  console.log('REGISTRATION TEST: parentEmail (should be empty) =', st ? st.parentEmail : null);

  // Check that the admin list shows new links in the right columns
  try {
    const rows = window.document.querySelectorAll('#studentTableBody tr');
    let found = false;
    rows.forEach(r => {
      if (r.textContent.includes('Reg') && r.textContent.includes('Tester')) {
        found = true;
        const viewLink = r.querySelector('a[onclick^="viewStudent"]');
        const assessmentLink = r.querySelector('a[href*="assessment.html"][target]');
        console.log('REGISTRATION TEST: view summary link present =', !!viewLink);
        console.log('REGISTRATION TEST: view assessment link present =', !!assessmentLink);
      }
    });
    if (!found) console.log('REGISTRATION TEST: could not find row in table for saved student');
  } catch (e) { console.error('REGISTRATION DOM check failed', e); }

  // Test archive API
  try {
    // archive the student we just saved
    const studentId = st ? st.id : null;
    if (studentId && window.StorageHelper && typeof window.StorageHelper.archiveStudent === 'function') {
      const arch = window.StorageHelper.archiveStudent(studentId, true);
      const reloaded = window.StorageHelper.getStudentById(studentId);
      console.log('ARCHIVE TEST: archive returned =', arch);
      console.log('ARCHIVE TEST: student.archived =', reloaded ? reloaded.archived : null);
      // unarchive
      window.StorageHelper.archiveStudent(studentId, false);
      const reloaded2 = window.StorageHelper.getStudentById(studentId);
      console.log('ARCHIVE TEST: after unarchive archived =', reloaded2 ? reloaded2.archived : null);
    }
  } catch (e) {
    console.error('ARCHIVE TEST failed', e);
  }

  // Test edit flow (populate + submit)
  try {
    const studentId = st ? st.id : null;
    if (studentId) {
      // ensure list loaded
      try { window.loadStudents(); } catch (e) {}
      try { window.editStudent(studentId); } catch (e) {}
      await new Promise(r => setTimeout(r, 50));
      const firstNameEl = window.document.querySelector('#studentInfoForm [name="firstName"]');
      if (firstNameEl) firstNameEl.value = 'EditedName';
      const agree2 = window.document.getElementById('agree-terms');
      if (agree2) agree2.checked = true;
      // Debug: show currentStudentData before submit
      try { console.log('EDIT TEST: before submit currentStudentData.firstName =', window.currentStudentData ? window.currentStudentData.firstName : null); } catch (e) {}
      try { if (typeof window.submitStudentRegistration === 'function') window.submitStudentRegistration(); } catch (e) { console.error('submitStudentRegistration threw during edit test', e); }
      await new Promise(r => setTimeout(r, 50));
      try { console.log('EDIT TEST: after submit currentStudentData.firstName =', window.currentStudentData ? window.currentStudentData.firstName : null); } catch (e) {}
      const raw2 = window.localStorage.getItem('braingrain_students');
      const arr2 = raw2 ? JSON.parse(raw2) : [];
      const st2 = arr2.find(s => s.id === studentId);
      console.log('EDIT TEST: firstName updated =', st2 ? st2.firstName : null);
    }
  } catch (e) {
    console.error('EDIT TEST failed', e);
  }
}

// New focused test: edit persistence (create -> edit -> submit -> verify)
async function runEditPersistenceTest() {
  const html = loadAndInject(path.join(__dirname, 'index.html'), path.join(__dirname, 'assessment-app.js'));
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost:5500/index.html' });
  const { window } = dom;
  window.alert = () => {};
  window.scrollTo = () => {};
  await new Promise(r => setTimeout(r, 100));

  const student = { firstName: 'EditCheck', lastName: 'User', grade: '6' };
  const saved = window.StorageHelper.saveStudent(student);
  const studentId = saved && saved.id;
  if (!studentId) { console.log('EDIT PERSISTENCE TEST: failed to create student'); return; }

  try { window.loadStudents(); } catch(e) {}
  try { window.editStudent(studentId); } catch(e) {}
  await new Promise(r => setTimeout(r, 50));
  const fn = window.document.querySelector('#studentInfoForm [name="firstName"]');
  if (fn) fn.value = 'EditedPersist';
  const agree = window.document.getElementById('agree-terms');
  if (agree) agree.checked = true;
  try { if (typeof window.submitStudentRegistration === 'function') window.submitStudentRegistration(); } catch(e) {}
  await new Promise(r => setTimeout(r, 50));
  const reloaded = window.StorageHelper.getStudentById(studentId);
  console.log('EDIT PERSISTENCE TEST: firstName updated =', reloaded ? reloaded.firstName : null);
}

// New focused test: Retake label on openAssessment fallback (embedded UI)
async function runRetakeLabelTest() {
  const html = loadAndInject(path.join(__dirname, 'index.html'), path.join(__dirname, 'assessment-app.js'));
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost:5500/index.html' });
  const { window } = dom;
  window.alert = () => {};
  window.scrollTo = () => {};
  await new Promise(r => setTimeout(r, 100));

  // Case A: student with assessmentBreakdown -> Retake
  const studA = { id: 'retake-stu', firstName: 'R', lastName: 'A', grade: '5', assessmentBreakdown: { selPercent: 10, ctPercent: 20, leadPercent: 30 }, assessmentScore: 50 };
  window.localStorage.setItem('braingrain_students', JSON.stringify([studA]));
  try { window.loadStudents(); } catch(e){}
  window.open = undefined; // force fallback embedded UI
  try { window.openAssessment('retake-stu'); } catch(e){}
  await new Promise(r => setTimeout(r, 50));
  const startBtnA = window.document.getElementById('start-assessment-btn');
  console.log('RETAKE LABEL TEST: student with breakdown label =', startBtnA ? startBtnA.textContent : null);

  // Case B: student without assessment -> Start assessment
  const studB = { id: 'start-stu', firstName: 'S', lastName: 'B', grade: '5' };
  window.localStorage.setItem('braingrain_students', JSON.stringify([studB]));
  try { window.loadStudents(); } catch(e){}
  try { window.openAssessment('start-stu'); } catch(e){}
  await new Promise(r => setTimeout(r, 50));
  const startBtnB = window.document.getElementById('start-assessment-btn');
  console.log('RETAKE LABEL TEST: student without breakdown label =', startBtnB ? startBtnB.textContent : null);
}

(async function(){
  console.log('Starting smoke tests...');
  await runAdminReportTest();
  await runStudentDirectTest();
  await runRegistrationTest();
  await runAdminListReportCheck();
  await runEditPersistenceTest();
  await runRetakeLabelTest();
  await runArchiveMenuTest();
  await runBackupRestoreTest();
  console.log('Smoke tests finished.');

async function runArchiveMenuTest() {
  const html = loadAndInject(path.join(__dirname, 'index.html'), path.join(__dirname, 'assessment-app.js'));
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost:5500/index.html' });
  const { window } = dom;
  window.alert = () => {};
  window.scrollTo = () => {};
  await new Promise(r => setTimeout(r, 100));

  const saved = window.StorageHelper.saveStudent({ firstName: 'Menu', lastName: 'User' });
  const studentId = saved && saved.id;
  if (!studentId) { console.log('ARCHIVE MENU TEST: failed to create student'); return; }
  try { window.loadStudents(); } catch(e) {}
  await new Promise(r => setTimeout(r, 50));

  // Click overflow button
  const rowBtn = window.document.querySelector(`button[onclick^="toggleRowMenu('${studentId}')"]`);
  if (!rowBtn) { console.log('ARCHIVE MENU TEST: overflow button not found'); return; }
  try { rowBtn.click(); } catch(e) {}
  await new Promise(r => setTimeout(r, 20));
  const menu = window.document.getElementById('row-menu-' + studentId);
  if (!menu) { console.log('ARCHIVE MENU TEST: menu not found'); return; }

  // Stub confirm to auto-accept
  window.confirm = () => true;
  // Click archive button inside menu (find button labeled Archive or Restore)
  const allBtns = Array.from(menu.querySelectorAll('button'));
  const archiveBtn = allBtns.find(b => /Archive|Restore/.test(b.textContent));
  if (!archiveBtn) { console.log('ARCHIVE MENU TEST: archive button not found in menu'); return; }
  try { archiveBtn.click(); } catch(e) {}
  await new Promise(r => setTimeout(r, 50));
  const re = window.StorageHelper.getStudentById(studentId);
  console.log('ARCHIVE MENU TEST: archived =', re ? re.archived : null);
}

// New focused test: Backup & Restore
async function runBackupRestoreTest() {
  const html = loadAndInject(path.join(__dirname, 'index.html'), path.join(__dirname, 'assessment-app.js'));
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost:5500/index.html' });
  const { window } = dom;
  window.alert = () => {};
  window.confirm = () => true;
  await new Promise(r => setTimeout(r, 100));

  // Clear any existing backups for test isolation
  try { window.localStorage.removeItem('braingrain_students_backups'); } catch(e) {}

  // Create a student which should trigger a backup
  const saved = window.StorageHelper.saveStudent({ firstName: 'BackupTest', lastName: 'User' });
  const backupsRaw = window.localStorage.getItem('braingrain_students_backups');
  const backups = backupsRaw ? JSON.parse(backupsRaw) : [];
  console.log('BACKUP TEST: backups count =', backups.length);

  // Now clear students and restore latest backup
  window.localStorage.setItem('braingrain_students', JSON.stringify([]));
  try { if (typeof window.restoreLatestBackup === 'function') window.restoreLatestBackup(); } catch(e) { console.error('restoreLatestBackup threw', e); }
  await new Promise(r => setTimeout(r, 50));
  const arr = window.StorageHelper.loadStudents();
  console.log('BACKUP TEST: restored students count =', arr.length);
}
})();
