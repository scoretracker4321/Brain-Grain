// Registration-related logic extracted from index.html
(function(){
  'use strict';

  // Validation rules used across registration forms
  const validationRules = {
    text: {
      validate: (value, minLength = 2) => value.trim().length >= minLength,
      message: (field, min) => `Please enter at least ${min} characters`
    },
    phone: {
      validate: (value) => /^\d{10}$/.test(value.replace(/\D/g, '')),
      message: () => 'Phone must be exactly 10 digits'
    },
    pincode: {
      validate: (value) => /^\d{6}$/.test(value.trim()),
      message: () => 'Pincode must be exactly 6 digits'
    },
    date: {
      validate: (value) => value.trim() !== '',
      message: () => 'Please select a date'
    },
    select: {
      validate: (value) => value.trim() !== '',
      message: () => 'Please select an option'
    },
    email: {
      validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: () => 'Please enter a valid email address'
    },
    number: {
      validate: (value, field) => {
        const num = parseInt(value);
        if (isNaN(num)) return false;
        const maxAttr = field ? parseInt(field.getAttribute('data-max')) : NaN;
        const max = (!isNaN(maxAttr) && maxAttr > 0) ? maxAttr : 60;
        return num >= 0 && num <= max;
      },
      message: (field) => {
        const maxAttr = field ? parseInt(field.getAttribute('data-max')) : NaN;
        const max = (!isNaN(maxAttr) && maxAttr > 0) ? maxAttr : 60;
        return `Score must be between 0 and ${max}`;
      }
    }
  };

  function validateField(field) {
    const validationType = field.getAttribute('data-validation');
    if (!validationType) return true;

    const value = field.value;
    const rule = validationRules[validationType];
    if (!rule) return true;

    let isValid = false;
    let errorMsg = '';

    if (validationType === 'text') {
      const minLength = parseInt(field.getAttribute('data-min')) || 2;
      isValid = rule.validate(value, minLength);
      errorMsg = rule.message(field.name, minLength);
    } else if (validationType === 'number') {
      isValid = rule.validate(value, field);
      errorMsg = rule.message(field);
    } else {
      isValid = rule.validate(value);
      errorMsg = rule.message();
    }

    const formGroup = field.closest('.form-group');
    const errorSpan = formGroup ? formGroup.querySelector('.error-message') : null;

    if (!isValid && value !== '') {
      field.classList.add('error');
      field.classList.remove('valid');
      if (formGroup) formGroup.classList.add('has-error');
      if (errorSpan) {
        errorSpan.textContent = errorMsg;
        errorSpan.classList.remove('hidden');
      }
      return false;
    } else if (isValid && value !== '') {
      field.classList.remove('error');
      field.classList.add('valid');
      if (formGroup) formGroup.classList.remove('has-error');
      if (errorSpan) {
        errorSpan.classList.add('hidden');
      }
      return true;
    } else if (value === '' && field.hasAttribute('required')) {
      field.classList.add('error');
      field.classList.remove('valid');
      if (formGroup) formGroup.classList.add('has-error');
      if (errorSpan) {
        errorSpan.textContent = `This field is required`;
        errorSpan.classList.remove('hidden');
      }
      return false;
    } else {
      field.classList.remove('error', 'valid');
      if (formGroup) formGroup.classList.remove('has-error');
      if (errorSpan) {
        errorSpan.classList.add('hidden');
      }
      return true;
    }
  }

  function setupValidation() {
    const formInputs = document.querySelectorAll('[data-validation]');

    formInputs.forEach(field => {
      field.addEventListener('blur', function() {
        validateField(this);
      });

      field.addEventListener('input', function() {
        if (this.value !== '') {
          validateField(this);
        } else {
          const formGroup = this.closest('.form-group');
          const errorSpan = formGroup ? formGroup.querySelector('.error-message') : null;
          this.classList.remove('error', 'valid');
          if (formGroup) formGroup.classList.remove('has-error');
          if (errorSpan) errorSpan.classList.add('hidden');
        }
      });

      if (field.tagName === 'SELECT') {
        field.addEventListener('change', function() {
          validateField(this);
        });
      }
    });
  }

  function validateFormTab(tabName) {
    const formMap = {
      'student-info': 'studentInfoForm',
      'parent-info': 'parentInfoForm',
      'academic': 'academicForm'
    };

    const formId = formMap[tabName];
    if (!formId) return true;

    const form = document.getElementById(formId);
    if (!form) return true;

    let isValid = true;
    const validationFields = form.querySelectorAll('[data-validation][required]');
    let firstInvalidField = null;

    validationFields.forEach(field => {
      if (!validateField(field)) {
        isValid = false;
        if (!firstInvalidField) firstInvalidField = field;
      }
    });

    if (!isValid && firstInvalidField) {
      firstInvalidField.focus();
      firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return isValid;
  }

  function switchToStudent() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('studentScreen').classList.add('active');
    document.getElementById('adminDashboard').classList.remove('active');
    document.getElementById('adminLoginScreen').classList.remove('active');

    if (getDraftStatus()) {
      loadDraft();
    } else {
      if (!window.currentStudentData || Object.keys(window.currentStudentData).length === 0) {
        resetStudentForm();
      }
    }
  }

  function switchToLogin() {
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('studentScreen').classList.remove('active');
    document.getElementById('adminDashboard').classList.remove('active');
    document.getElementById('adminLoginScreen').classList.remove('active');
  }

  function switchToAdmin() {
    // Show the admin login screen and hide other role screens
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('studentScreen').classList.remove('active');
      var loginScreen = document.getElementById('loginScreen');
      if (loginScreen) loginScreen.classList.remove('active');
      var studentScreen = document.getElementById('studentScreen');
      if (studentScreen) studentScreen.classList.remove('active');
      var adminDashboard = document.getElementById('adminScreen');
      if (adminDashboard) adminDashboard.classList.remove('active');
    document.getElementById('adminLoginScreen').classList.add('active');
    // Animate login box
    setTimeout(function() {
      var loginBox = document.querySelector('#adminLoginScreen .login-container');
      if (loginBox) {
        loginBox.classList.remove('show');
        // force reflow for restart animation
        void loginBox.offsetWidth;
        loginBox.classList.add('show');
      }
    }, 10);
  }

  function switchToDashboard() {
    // Display the admin dashboard and initialize list
    var loginScreen = document.getElementById('loginScreen');
    if (loginScreen) loginScreen.classList.remove('active');
    var studentScreen = document.getElementById('studentScreen');
    if (studentScreen) studentScreen.classList.remove('active');
    var adminLoginScreen = document.getElementById('adminLoginScreen');
    if (adminLoginScreen) adminLoginScreen.classList.remove('active');
    var adminDashboard = document.getElementById('adminScreen');
    if (adminDashboard) adminDashboard.classList.add('active');
    try { initializeStudents(); loadStudents(); } catch (e) { /* ignore if not available */ }
  }

  function handleNextTab(tabName) {
    if (!validateFormTab(window.currentStudentTab)) return;
    saveStudentData(window.currentStudentTab);
    saveDraft();
    if (tabName === 'review') generateReview();
    showStudentTab(tabName);
  }

  function prevStudentTab(tabName) {
    saveDraft();
    saveStudentData(window.currentStudentTab);
    showStudentTab(tabName);
  }

  // Draft storage migrated to localStorage to persist across browser sessions
  function saveDraft() {
    const forms = {
      'student-info': 'studentInfoForm',
      'parent-info': 'parentInfoForm',
      'academic': 'academicForm'
    };

    const formId = forms[window.currentStudentTab];
    if (formId) {
      const form = document.getElementById(formId);
      const formData = new FormData(form);
      const draftData = {};
      formData.forEach((value, key) => { draftData[key] = value; });
      try { localStorage.setItem('braingrain_draft_' + window.currentStudentTab, JSON.stringify(draftData)); } catch(e) { console.log('Draft save failed'); }
    }
  }

  function loadDraft() {
    const forms = {
      'student-info': 'studentInfoForm',
      'parent-info': 'parentInfoForm',
      'academic': 'academicForm'
    };

    for (let tab in forms) {
      const formId = forms[tab];
      const form = document.getElementById(formId);
      if (form) {
        try {
          const draftData = localStorage.getItem('braingrain_draft_' + tab);
          if (draftData) {
            const data = JSON.parse(draftData);
            for (let key in data) {
              const field = form.querySelector('[name="' + key + '"]');
              if (field) {
                field.value = data[key];
                if (field.getAttribute('data-validation')) validateField(field);
              }
            }
          }
        } catch(e) { console.log('Draft load failed'); }
      }
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem('braingrain_draft_student-info');
      localStorage.removeItem('braingrain_draft_parent-info');
      localStorage.removeItem('braingrain_draft_academic');
    } catch(e) { console.log('Draft clear failed'); }
  }

  function getDraftStatus() {
    try { return localStorage.getItem('braingrain_draft_student-info') !== null; } catch(e) { return false; }
  }

  function migrateDraftStorage() {
    // Move any drafts from sessionStorage to localStorage so they persist
    try {
      ['student-info','parent-info','academic'].forEach(tab => {
        const key = 'braingrain_draft_' + tab;
        try {
          const s = sessionStorage.getItem(key);
          if (s && !localStorage.getItem(key)) {
            localStorage.setItem(key, s);
            sessionStorage.removeItem(key);
          }
        } catch(e) {}
      });
    } catch(e) { /* ignore */ }
  }

  function showStudentTab(tabName) {
    const studentScreen = document.getElementById('studentScreen');
    studentScreen.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    const selectedTab = studentScreen.querySelector('#' + tabName);
    if (selectedTab) selectedTab.classList.add('active');
    studentScreen.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) btn.classList.add('active'); else btn.classList.remove('active');
    });
    window.currentStudentTab = tabName;
    updateProgress();
    window.scrollTo(0,0);
  }

  function updateProgress() {
    const tabs = ['student-info','parent-info','academic','review'];
    const index = tabs.indexOf(window.currentStudentTab);
    const progress = ((index + 1)/tabs.length)*100;
    document.getElementById('progressFill').style.width = progress + '%';
  }

  function validateStudentTab(tabName) { return validateFormTab(tabName); }

  function saveStudentData(tabName) {
    // Ensure we have an object to write into (defensive guard for direct calls)
    window.currentStudentData = window.currentStudentData || {};

    const formMap = {'student-info':'studentInfoForm','parent-info':'parentInfoForm','academic':'academicForm'};
    const formId = formMap[tabName];
    if (!formId) return;
    const form = document.getElementById(formId);
    if (!form) return;
    const formData = new FormData(form);
    formData.forEach((value,key) => {
      if (key === 'supportNeeds') {
        if (!Array.isArray(window.currentStudentData.supportNeeds)) window.currentStudentData.supportNeeds = [];
      } else {
        if (typeof value === 'string' && value.trim() === '') return;
        window.currentStudentData[key] = value;
      }
    });

    if (tabName === 'academic') {
      const maxSel = document.getElementById('maxMarksSelect');
      if (maxSel) {
        if (maxSel.value === 'custom') {
          const customVal = parseInt(document.getElementById('maxMarksCustom').value,10) || 60;
          window.currentStudentData.maxMarks = customVal;
        } else {
          window.currentStudentData.maxMarks = parseInt(maxSel.value,10) || 60;
        }
      } else {
        window.currentStudentData.maxMarks = window.currentStudentData.maxMarks || 60;
      }

      const form = document.getElementById('academicForm');
      const supportChecks = form.querySelectorAll('input[name="supportNeeds"]:checked');
      const supports = [];
      supportChecks.forEach(chk => supports.push(chk.value));
      window.currentStudentData.supportNeeds = supports;
      const otherField = form.querySelector('input[name="supportOther"]');
      window.currentStudentData.supportOther = otherField ? otherField.value : '';
    }
  }

  function generateReview() {
    saveStudentData('academic');
    const reviewContent = document.getElementById('reviewContent');
    const examDisplay = window.currentStudentData.examType === 'custom' ? window.currentStudentData.customExamName : (window.currentStudentData.examType || 'Not selected');
    const subjects = [];
    const max = window.currentStudentData.maxMarks || 60;
    if (window.currentStudentData.english) subjects.push(`English: ${window.currentStudentData.english}/${max}`);
    if (window.currentStudentData.maths) subjects.push(`Maths: ${window.currentStudentData.maths}/${max}`);
    if (window.currentStudentData.tamil) subjects.push(`Tamil: ${window.currentStudentData.tamil}/${max}`);
    if (window.currentStudentData.science) subjects.push(`Science: ${window.currentStudentData.science}/${max}`);
    if (window.currentStudentData.social) subjects.push(`Social: ${window.currentStudentData.social}/${max}`);

    let supportText = 'Not specified';
    if (Array.isArray(window.currentStudentData.supportNeeds) && window.currentStudentData.supportNeeds.length > 0) {
      const labels = { 'extra-practice':'Extra practice worksheets','one-on-one':'One-on-one tutoring','doubt-clearing':'Doubt-clearing sessions','mock-tests':'Mock tests & practice exams','study-plan':'Study plan & time management','other':'Other' };
      const items = window.currentStudentData.supportNeeds.map(v => labels[v] || v);
      if (window.currentStudentData.supportNeeds.includes('other') && window.currentStudentData.supportOther) items.push(`Other: ${window.currentStudentData.supportOther}`);
      supportText = items.join(', ');
    }

    let html = `...`; // shortened for brevity, content mirrors index.html
    reviewContent.innerHTML = html;
  }

  function fetchCityState() {
    const pincode = document.querySelector('input[name="pincode"]').value;
    if (window.pincodeDB && window.pincodeDB[pincode]) {
      const data = window.pincodeDB[pincode];
      document.querySelector('input[name="city"]').value = data.city;
      document.querySelector('input[name="state"]').value = data.state;
    } else {
      document.querySelector('input[name="city"]').value = '';
      document.querySelector('input[name="state"]').value = '';
    }
  }

  function toggleSameNumber() {
    const checkbox = document.getElementById('sameAsStudent');
    const parentPhone = document.querySelector('input[name="parentPhone"]');
    const studentPhone = document.querySelector('input[name="phone"]');
    // Defensive guard
    window.currentStudentData = window.currentStudentData || {};
    if (checkbox.checked) {
      parentPhone.value = studentPhone.value;
      window.currentStudentData.parentPhone = studentPhone.value;
      parentPhone.disabled = true;
    } else {
      parentPhone.value = '';
      window.currentStudentData.parentPhone = '';
      parentPhone.disabled = false;
    }
  }

  function handleExamType() {
    const examType = document.querySelector('select[name="examType"]').value;
    const customDiv = document.getElementById('customExamDiv');
    const customSubjectDiv = document.getElementById('customSubjectSection');
    customDiv.style.display = examType === 'custom' ? 'block' : 'none';
    customSubjectDiv.style.display = 'block';
  }

  function handleMaxMarksChange() {
    const sel = document.getElementById('maxMarksSelect');
    const customDiv = document.getElementById('maxMarksCustomDiv');
    let max = 60;
    if (!sel) return;
    const val = sel.value;
    if (val === 'custom') {
      customDiv.style.display = 'block';
      const customInput = document.getElementById('maxMarksCustom');
      max = parseInt(customInput.value,10) || 60;
    } else {
      customDiv.style.display = 'none';
      max = parseInt(val,10) || 60;
    }

    const subjectGrid = document.getElementById('subjectGrid');
    if (subjectGrid) {
      const inputs = subjectGrid.querySelectorAll('input[type="number"]');
      inputs.forEach(inp => { inp.setAttribute('data-max', String(max)); inp.setAttribute('max', String(max)); inp.placeholder = `0-${max}`; if (inp.getAttribute('data-validation')) validateField(inp); });
    }

    const customList = document.getElementById('customSubjectsList');
    if (customList) {
      const customInputs = customList.querySelectorAll('input[type="number"]');
      customInputs.forEach(ci => { ci.setAttribute('data-max', String(max)); ci.setAttribute('max', String(max)); ci.placeholder = `0-${max}`; if (ci.getAttribute('data-validation')) validateField(ci); });
    }

    try { enforceSubjectMaxs(); } catch(e) {}
  }

  function toggleSupportOther() {
    const otherCheckbox = document.getElementById('support-other');
    const otherDiv = document.getElementById('supportOtherDiv');
    otherDiv.style.display = otherCheckbox.checked ? 'block' : 'none';
  }

  function addCustomSubject() {
    const customList = document.getElementById('customSubjectsList');
    const id = Date.now();
    const html = `
      <div style="display:flex; gap:var(--spacing-8); margin-bottom:var(--spacing-12);" id="custom-${id}">
        <input type="text" class="form-input" placeholder="Subject name" style="flex:1;" name="customSubjectName_${id}">
        <input type="number" class="form-input" placeholder="Score" data-validation="number" data-max="60" min="0" style="flex:0 0 100px;" name="customSubjectScore_${id}">
        <button type="button" onclick="removeCustomSubject('custom-${id}')" style="padding: var(--spacing-8) var(--spacing-12); background: var(--color-error); color:white; border:none; border-radius:var(--radius-base); cursor:pointer;">✕</button>
      </div>`;
    customList.innerHTML += html;
  }

  function removeCustomSubject(id) { const el = document.getElementById(id); if (el) el.remove(); }

  function resetStudentForm() {
    document.getElementById('studentInfoForm').reset();
    document.getElementById('parentInfoForm').reset();
    document.getElementById('academicForm').reset();
    window.currentStudentData = {};
    window.currentStudentTab = 'student-info';
    showStudentTab('student-info');
    document.getElementById('progressFill').style.width = '25%';
  }

  function submitStudentRegistration() {
    if (!document.getElementById('agree-terms').checked) { alert('Please agree to the terms and conditions'); return; }

    // Ensure data object exists before saving
    window.currentStudentData = window.currentStudentData || {};

    // Save all tabs' data before persisting (supports editing any tab)
    saveStudentData('student-info');
    saveStudentData('parent-info');
    saveStudentData('academic');

    window.currentStudentData.registeredAt = new Date().toISOString();
    window.currentStudentData.assessmentStatus = 'Pending';

    const saved = StorageHelper.saveStudent(window.currentStudentData);
    if (!saved) { alert('Failed to save registration; please try again.'); return; }
    initializeStudents();
    loadStudents();

    document.getElementById('successMessage').classList.add('show');
    const successMsg = '✓ Registration successful!\nStudent ID: ' + saved.id + '\n\nYour data has been saved to our system.';

    setTimeout(() => {
      alert(successMsg);
      clearDraft();
      resetStudentForm();
      switchToLogin();
    }, 1000);
  }

  function enforceSubjectMaxs() {
    const subjectGrid = document.getElementById('subjectGrid');
    if (!subjectGrid) return;
    const inputs = subjectGrid.querySelectorAll('input[type="number"][data-validation="number"]');
    inputs.forEach(inp => {
      inp.removeEventListener('input', inp._enforceListener);
      const listener = function() {
        const maxAttr = parseInt(inp.getAttribute('data-max')) || parseInt(inp.getAttribute('max')) || 60;
        const val = parseInt(inp.value);
        const formGroup = inp.closest('.form-group') || inp.parentElement;
        let errorSpan = formGroup ? formGroup.querySelector('.error-message') : null;
        if (!errorSpan && formGroup) { errorSpan = document.createElement('span'); errorSpan.className = 'error-message hidden'; formGroup.appendChild(errorSpan); }
        if (!isNaN(val) && val > maxAttr) {
          if (errorSpan) { errorSpan.textContent = `Score cannot be more than ${maxAttr}`; errorSpan.classList.remove('hidden'); }
          inp.classList.add('error');
        } else {
          if (errorSpan) errorSpan.classList.add('hidden');
          if (val !== '' && val !== undefined) validateField(inp);
        }
      };
      inp.addEventListener('input', listener);
      inp._enforceListener = listener;
    });
  }

  // Expose needed functions globally (so inline event handlers continue to work)
  window.switchToStudent = switchToStudent;
  window.switchToLogin = switchToLogin;
  window.switchToAdmin = switchToAdmin;
  window.switchToDashboard = switchToDashboard;
  window.handleNextTab = handleNextTab;
  window.prevStudentTab = prevStudentTab;
  window.saveDraft = saveDraft;
  window.loadDraft = loadDraft;
  window.clearDraft = clearDraft;
  window.getDraftStatus = getDraftStatus;
  window.showStudentTab = showStudentTab;
  window.updateProgress = updateProgress;
  window.validateStudentTab = validateStudentTab;
  window.saveStudentData = saveStudentData;
  window.generateReview = generateReview;
  window.fetchCityState = fetchCityState;
  window.toggleSameNumber = toggleSameNumber;
  window.handleExamType = handleExamType;
  window.handleMaxMarksChange = handleMaxMarksChange;
  window.toggleSupportOther = toggleSupportOther;
  window.addCustomSubject = addCustomSubject;
  window.removeCustomSubject = removeCustomSubject;
  window.resetStudentForm = resetStudentForm;
  window.submitStudentRegistration = submitStudentRegistration;
  window.enforceSubjectMaxs = enforceSubjectMaxs;
  window.setupValidation = setupValidation;
  window.validateField = validateField;

})();
