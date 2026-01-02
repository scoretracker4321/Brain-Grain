// Assessment State
const assessmentState = {
  currentQuestionIndex: 0,
  answers: [],
  scores: {
    SEL: [],
    CriticalThinking: [],
    Leadership: []
  },
  currentSkill: 'SEL',
  totalQuestions: 0,
  userName: '',
  totalScore: 0
};

// Question Bank with Interactive Types
const questionBank = [
  // SEL Questions (5 total)
  {
    skill: 'SEL',
    text: 'How do you feel when helping a friend?',
    type: 'emoji',
    options: [
      { emoji: '😰', label: 'Nervous', score: 4 },
      { emoji: '😐', label: 'Okay', score: 6 },
      { emoji: '😊', label: 'Good', score: 8 },
      { emoji: '🔥', label: 'Amazing', score: 10 }
    ]
  },
  {
    skill: 'SEL',
    // simplified for basic English
    text: 'Do you understand why people feel sad?',
    type: 'slider',
    min: 1,
    max: 10,
    labels: ['Still learning', 'Very good at it']
  },
  {
    skill: 'SEL',
    text: 'Friend is quiet and sad. You...',
    type: 'choice',
    options: [
      { text: 'Ask why', score: 10 },
      { text: 'Give space', score: 8 },
      { text: 'Make them laugh', score: 6 },
      { text: 'Tell teacher', score: 5 }
    ]
  },
  {
    skill: 'SEL',
    // simplified and clearer
    text: 'How good are you with your feelings?',
    type: 'stars',
    max: 5
  },
  {
    skill: 'SEL',
    text: 'I know how to help someone feel better',
    type: 'truefalse'
  },
  
  // Critical Thinking Questions (5 total)
  {
    skill: 'CriticalThinking',
    text: 'When facing a problem, how do you usually feel?',
    type: 'emoji',
    options: [
      { emoji: '😰', label: 'Confused', score: 4 },
      { emoji: '😐', label: 'Stuck', score: 6 },
      { emoji: '🤔', label: 'Curious', score: 8 },
      { emoji: '💪', label: 'Ready', score: 10 }
    ]
  },
  {
    skill: 'CriticalThinking',
    text: 'Best way to solve a big problem?',
    type: 'choice',
    options: [
      { text: 'Jump in', score: 5 },
      { text: 'Break it down', score: 10 },
      { text: 'Get help first', score: 8 },
      { text: 'Think it through', score: 9 }
    ]
  },

  {
    skill: 'CriticalThinking',
    text: 'I can think of creative solutions',
    type: 'truefalse'
  },
  {
    skill: 'CriticalThinking',
    // simplified
    text: 'How clear is your thinking?',
    type: 'slider',
    min: 1,
    max: 10,
    labels: ['Still learning', 'Very logical']
  },
  
  // Leadership Questions (5 total)
  {
    skill: 'Leadership',
    text: 'When leading a group, how do you feel?',
    type: 'emoji',
    options: [
      { emoji: '😰', label: 'Scared', score: 4 },
      { emoji: '😐', label: 'Unsure', score: 6 },
      { emoji: '😊', label: 'Confident', score: 8 },
      { emoji: '🔥', label: 'Ready', score: 10 }
    ]
  },
  {
    skill: 'Leadership',
    text: 'Best leader quality?',
    type: 'choice',
    options: [
      { text: 'Smart', score: 7 },
      { text: 'Listens well', score: 10 },
      { text: 'Confident', score: 8 },
      { text: 'Caring', score: 9 }
    ]
  },
  {
    skill: 'Leadership',
    text: 'Team disagrees. You...',
    type: 'choice',
    options: [
      { text: 'Decide for them', score: 5 },
      { text: 'Ask for ideas', score: 9 },
      { text: 'Listen fully', score: 10 },
      { text: 'Take vote', score: 8 }
    ]
  },
  {
    skill: 'Leadership',
    text: 'Can you influence others positively?',
    type: 'stars',
    max: 5
  },
  {
    skill: 'Leadership',
    // simpler phrasing
    text: 'People often listen to me when I lead',
    type: 'truefalse'
  }
];

// Start Assessment
function startAssessment() {
  const nameInput = document.getElementById('user-name');
  assessmentState.userName = nameInput ? nameInput.value.trim() || 'Friend' : 'Friend';

  // Make total questions reflect the current question bank (supports removals)
  assessmentState.totalQuestions = questionBank.length;

  // Reset state (fresh start)
  assessmentState.currentQuestionIndex = 0;
  assessmentState.answers = [];
  assessmentState.scores = { SEL: [], CriticalThinking: [], Leadership: [] };
  assessmentState.totalScore = 0;

  document.getElementById('welcome-screen').classList.remove('active');
  document.getElementById('welcome-screen').style.display = 'none';
  document.getElementById('assessment-screen').style.display = 'block';
  document.getElementById('current-score').textContent = '0';
  loadQuestion();
}

// Get current question
function getCurrentQuestion() {
  return questionBank[assessmentState.currentQuestionIndex];
}

// Load Question
function loadQuestion() {
  if (assessmentState.currentQuestionIndex >= assessmentState.totalQuestions) {
    showResults();
    return;
  }
  
  const question = getCurrentQuestion();
  const progress = ((assessmentState.currentQuestionIndex + 1) / assessmentState.totalQuestions) * 100;
  
  // Update progress
  document.getElementById('progress-text').textContent = `Question ${assessmentState.currentQuestionIndex + 1} of ${assessmentState.totalQuestions}`;
  document.getElementById('progress-fill').style.width = `${progress}%`;
  
  // Update question number
  document.getElementById('question-number').textContent = `Question ${assessmentState.currentQuestionIndex + 1}`;
  
  // Update skill badge
  const skillBadge = document.getElementById('current-skill');
  const skillNames = {
    'SEL': '❤️ Feelings',
    'CriticalThinking': '🧠 Thinking',
    'Leadership': '👑 Leading'
  };
  skillBadge.textContent = skillNames[question.skill];
  skillBadge.className = 'skill-badge';
  if (question.skill === 'SEL') skillBadge.classList.add('sel');
  if (question.skill === 'CriticalThinking') skillBadge.classList.add('ct');
  if (question.skill === 'Leadership') skillBadge.classList.add('lead');
  
  // Update question text
  const qTextEl = document.getElementById('question-text');
  if (qTextEl) qTextEl.textContent = question.text;

  // Update hint for simpler language / guidance
  const hintEl = document.getElementById('question-hint');
  if (hintEl) {
    const hints = {
      'emoji': 'Tip: Tap the emoji that best matches how you feel.',
      'choice': 'Tip: Tap the choice that fits you best.',
      'truefalse': 'Tip: Tap TRUE if the sentence is true for you, otherwise FALSE.',
      'slider': 'Tip: Slide to the number that best fits (1 low, 10 high).',
      'stars': 'Tip: Tap how many stars (1–5) match you.',
      'sort': 'Tip: Drag to reorder or use the simple ordering button.'
    };
    hintEl.textContent = hints[question.type] || '';
  }

  // ensure the question text is large and centered for readability
  if (qTextEl) {
    qTextEl.style.textAlign = 'center';
    qTextEl.style.fontSize = '26px';
    qTextEl.style.lineHeight = '1.2';
  }

  // Create answer area based on type
  const answerArea = document.getElementById('answer-area');
  answerArea.innerHTML = '';
  
  if (question.type === 'emoji') {
    const optionsHTML = question.options.map((option, index) => 
      `<button class="emoji-btn" onclick="selectEmoji(${index})" data-index="${index}">
        <div>${option.emoji}</div>
        <div class="emoji-label">${option.label}</div>
      </button>`
    ).join('');
    answerArea.innerHTML = `<div class="emoji-options">${optionsHTML}</div>`;
  } else if (question.type === 'choice') {
    const optionsHTML = question.options.map((option, index) => 
      `<button class="choice-btn" onclick="selectChoice(${index})" data-index="${index}">${option.text}</button>`
    ).join('');
    answerArea.innerHTML = `<div class="choice-options">${optionsHTML}</div>`;
  } else if (question.type === 'truefalse') {
    answerArea.innerHTML = `
      <div class="tf-options">
        <button class="tf-btn true" onclick="selectTrueFalse(true)">TRUE</button>
        <button class="tf-btn false" onclick="selectTrueFalse(false)">FALSE</button>
      </div>
    `;
  } else if (question.type === 'slider') {
    const midValue = Math.floor((question.min + question.max) / 2);
    answerArea.innerHTML = `
      <div class="slider-container">
        <div class="slider-labels">
          <span>${question.labels[0]}</span>
          <span>${question.labels[1]}</span>
        </div>
        <input type="range" id="slider-input" min="${question.min}" max="${question.max}" value="${midValue}" oninput="updateSliderValue()">
        <div class="slider-value" id="slider-value">${midValue}</div>
        <div style="text-align: center; margin-top: 20px; font-size: 14px; color: var(--color-text-secondary);">Move the slider and wait 1 second</div>
      </div>
    `;
    
    // Clear any existing slider timer when loading new question
    if (sliderSubmitTimer) {
      clearTimeout(sliderSubmitTimer);
      sliderSubmitTimer = null;
    }
  } else if (question.type === 'stars') {
    // show unfilled stars initially (student sees empty stars then taps to fill)
    const starsHTML = Array.from({length: question.max}, (_, i) => 
      `<span class="star" onclick="selectStars(${i + 1})" data-value="${i + 1}">☆</span>`
    ).join('');
    answerArea.innerHTML = `<div class="star-rating" style="font-size:36px;display:flex;gap:12px;justify-content:center">${starsHTML}</div>`;
  } else if (question.type === 'sort') {
    const itemsHTML = question.items.map((item, index) => 
      `<div class="sort-item" draggable="true" data-index="${index}" data-correct="${item.correctOrder}">
        <span class="sort-number">${index + 1}</span>
        ${item.text}
      </div>`
    ).join('');

    // Provide simple preset orderings (whole-order radios) and a drag fallback
    const presets = [
      { label: question.items.map((_,i)=>i+1).join(','), order: question.items.map((_,i)=>i+1) },
      { label: question.items.map((_,i)=>question.items.length - i).join(','), order: question.items.map((_,i)=>question.items.length - i) },
      { label: (question.items.length>3? [2,1,3,4].slice(0, question.items.length).join(',') : null), order: (question.items.length>3? [2,1,3,4].slice(0, question.items.length) : null) },
      { label: (question.items.length>3? [1,3,2,4].slice(0, question.items.length).join(',') : null), order: (question.items.length>3? [1,3,2,4].slice(0, question.items.length) : null) }
    ].filter(p => !!p.label);

    const presetsHTML = presets.map(p => `
      <label style="margin-right:8px;font-weight:700"><input type='radio' name='sort_preset' value='${JSON.stringify(p.order)}'> ${p.label}</label>`).join('');

    answerArea.innerHTML = `
      <div class="sort-container">
        <div style="display:flex;justify-content:center;gap:10px;margin-bottom:8px">
          <button class="btn btn-secondary" id="use-drag">Use drag to reorder</button>
          <button class="btn btn-secondary" id="use-simple">Use preset orderings</button>
        </div>
        <div class="sort-instructions" style="text-align:center;margin-bottom:8px">Choose a preset order or drag to reorder (1 = first step)</div>
        <div class="sort-items" id="sort-items">${itemsHTML}</div>
        <div class="sort-presets" id="sort-presets" style="display:none;text-align:center">${presetsHTML}</div>
      </div>
    `;

    initializeDragAndDrop();

    // default to simple preset ordering for easier student input
    try { document.getElementById('sort-items').style.display = 'none'; } catch(e){}
    try { document.getElementById('sort-presets').style.display = 'block'; } catch(e){}
    try { document.getElementById('use-simple').classList.add('active'); } catch(e){}

    // attach handler to preset radios
    const presetRadios = document.querySelectorAll('input[name="sort_preset"]');
    presetRadios.forEach(r => r.addEventListener('change', (e) => {
      clearTimeout(window._presetSortTimer);
      window._presetSortTimer = setTimeout(() => {
        const selectedOrder = JSON.parse(e.target.value);
        const correctOrder = question.items.map(it => it.correctOrder);
        let correctCount = 0;
        for (let i = 0; i < selectedOrder.length; i++) {
          if (selectedOrder[i] === correctOrder[i]) correctCount++;
        }
        const score = Math.round((correctCount / selectedOrder.length) * 10);
        submitAnswer(score, question.skill);
      }, 600);
    }));

    document.getElementById('use-drag').addEventListener('click', () => {
      document.getElementById('sort-items').style.display = 'block';
      document.getElementById('sort-presets').style.display = 'none';
      document.getElementById('use-drag').classList.add('active');
      document.getElementById('use-simple').classList.remove('active');
    });
    document.getElementById('use-simple').addEventListener('click', () => {
      document.getElementById('sort-items').style.display = 'none';
      document.getElementById('sort-presets').style.display = 'block';
      document.getElementById('use-simple').classList.add('active');
      document.getElementById('use-drag').classList.remove('active');
    });
  }
  
  // Trigger animation
  const container = document.getElementById('question-container');
  container.style.animation = 'none';
  setTimeout(() => {
    container.style.animation = '';
  }, 10);
}

// Selection Functions
function selectEmoji(index) {
  const question = getCurrentQuestion();
  const score = question.options[index].score;
  
  // Visual feedback
  const buttons = document.querySelectorAll('.emoji-btn');
  buttons.forEach(btn => btn.classList.remove('selected'));
  buttons[index].classList.add('selected');
  
  // Auto-submit after short delay
  setTimeout(() => {
    submitAnswer(score, question.skill);
  }, 600);
}

function selectChoice(index) {
  const question = getCurrentQuestion();
  const score = question.options[index].score;
  
  // Visual feedback
  const buttons = document.querySelectorAll('.choice-btn');
  buttons.forEach(btn => btn.classList.remove('selected'));
  buttons[index].classList.add('selected');
  
  // Auto-submit after short delay
  setTimeout(() => {
    submitAnswer(score, question.skill);
  }, 600);
}

function selectTrueFalse(value) {
  const question = getCurrentQuestion();
  // Simple scoring: true = 8, false = 5 (encourages positive self-assessment)
  const score = value ? 8 : 5;
  
  // Visual feedback: use explicit selectors in case DOM order changes
  try {
    const trueBtn = document.querySelector('.tf-btn.true');
    const falseBtn = document.querySelector('.tf-btn.false');
    if (trueBtn) trueBtn.classList.toggle('selected', !!value);
    if (falseBtn) falseBtn.classList.toggle('selected', !value);
  } catch (e) {
    const buttons = document.querySelectorAll('.tf-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    const selectedBtn = value ? buttons[0] : buttons[1];
    if (selectedBtn) selectedBtn.classList.add('selected');
  }
  
  // Auto-submit after short delay
  setTimeout(() => {
    submitAnswer(score, question.skill);
  }, 600);
}

function selectStars(rating) {
  const stars = document.querySelectorAll('.star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add('active');
      star.textContent = '⭐';
    } else {
      star.classList.remove('active');
      star.textContent = '☆';
    }
  });
  
  // Score: stars * 2 (max 10)
  const score = rating * 2;
  const question = getCurrentQuestion();
  
  // Auto-submit after short delay
  setTimeout(() => {
    submitAnswer(score, question.skill);
  }, 600);
}

// Update Slider Value
let sliderSubmitTimer = null;

function updateSliderValue() {
  const value = document.getElementById('slider-input').value;
  document.getElementById('slider-value').textContent = value;
  
  // Clear existing timer
  if (sliderSubmitTimer) {
    clearTimeout(sliderSubmitTimer);
  }
  
  // Auto-submit after 1 second of no movement
  sliderSubmitTimer = setTimeout(() => {
    const question = getCurrentQuestion();
    const score = parseInt(value);
    submitAnswer(score, question.skill);
  }, 1000);
}

// Drag and Drop
let draggedElement = null;

function initializeDragAndDrop() {
  const sortItems = document.querySelectorAll('.sort-item');
  const sortContainer = document.getElementById('sort-items');
  
  sortItems.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
  });
  
  // Auto-submit after 3 seconds of no changes
  let submitTimer;
  sortContainer.addEventListener('dragend', () => {
    clearTimeout(submitTimer);
    submitTimer = setTimeout(() => {
      const score = calculateSortScore();
      const question = getCurrentQuestion();
      submitAnswer(score, question.skill);
    }, 2000);
  });
}

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  updateSortNumbers();
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  if (draggedElement !== this) {
    const sortItems = document.getElementById('sort-items');
    const allItems = [...sortItems.children];
    const draggedIndex = allItems.indexOf(draggedElement);
    const targetIndex = allItems.indexOf(this);
    
    if (draggedIndex < targetIndex) {
      this.parentNode.insertBefore(draggedElement, this.nextSibling);
    } else {
      this.parentNode.insertBefore(draggedElement, this);
    }
  }
  
  return false;
}

function updateSortNumbers() {
  const items = document.querySelectorAll('.sort-item');
  items.forEach((item, index) => {
    const numberSpan = item.querySelector('.sort-number');
    numberSpan.textContent = index + 1;
  });
}

function calculateSortScore() {
  const items = document.querySelectorAll('.sort-item');
  let correctCount = 0;
  
  items.forEach((item, index) => {
    const correctOrder = parseInt(item.dataset.correct);
    const currentOrder = index + 1;
    if (correctOrder === currentOrder) {
      correctCount++;
    }
  });
  
  // Score based on accuracy
  const accuracy = correctCount / items.length;
  return Math.round(accuracy * 10);
}

// Simple sort scoring for the fallback selects
function calculateSimpleSortScore() {
  const items = (getCurrentQuestion() && getCurrentQuestion().items) || [];
  if (!items.length) return 0;
  let correctCount = 0;
  for (let idx = 0; idx < items.length; idx++) {
    const sel = document.querySelector(`input[name="order_item_${idx}"]:checked`);
    const selectedPos = sel ? parseInt(sel.value) : 0;
    if (items[idx] && items[idx].correctOrder === selectedPos) correctCount++;
  }
  const accuracy = correctCount / items.length;
  if (!isFinite(accuracy)) return 0;
  return Math.round(accuracy * 10);
}



// Submit Answer
function submitAnswer(score, skill) {
  // sanitize score to avoid NaN or non-number values
  if (typeof score !== 'number' || !isFinite(score)) {
    const parsed = Number(score);
    if (!isFinite(parsed)) score = 0; else score = parsed;
  }
  score = Math.round(score);

  // Store score
  if (!assessmentState.scores[skill]) assessmentState.scores[skill] = [];
  assessmentState.scores[skill].push(score);
  assessmentState.totalScore += score;
  
  // Update score display with animation
  const scoreElement = document.getElementById('current-score');
  scoreElement.textContent = assessmentState.totalScore;
  scoreElement.parentElement.style.animation = 'pulse 0.5s';
  setTimeout(() => {
    scoreElement.parentElement.style.animation = '';
  }, 500);
  
  // Show feedback
  showFeedback(score);
  
  // Celebrate milestones
  if ((assessmentState.currentQuestionIndex + 1) % 5 === 0) {
    createConfetti();
  }
  
  // Move to next question after delay
  setTimeout(() => {
    assessmentState.currentQuestionIndex++;
    hideFeedback();
    loadQuestion();
  }, 1800);
}

// Feedback Display
function showFeedback(score) {
  const popup = document.getElementById('feedback-popup');
  const emoji = document.getElementById('feedback-emoji');
  const text = document.getElementById('feedback-text');
  const points = document.getElementById('feedback-points');
  
  // Determine feedback based on score
  if (score >= 9) {
    emoji.textContent = '🎉';
    text.textContent = 'Awesome!';
  } else if (score >= 7) {
    emoji.textContent = '😊';
    text.textContent = 'Great job!';
  } else if (score >= 5) {
    emoji.textContent = '👍';
    text.textContent = 'Nice!';
  } else {
    emoji.textContent = '💪';
    text.textContent = 'Keep going!';
  }
  
  points.textContent = `+${score} points`;
  
  popup.classList.remove('hidden');
  popup.classList.add('show');
}

function hideFeedback() {
  const popup = document.getElementById('feedback-popup');
  popup.classList.remove('show');
  setTimeout(() => {
    popup.classList.add('hidden');
  }, 300);
}

// Confetti Animation
function createConfetti() {
  const container = document.getElementById('confetti-container');
  const emojis = ['🎉', '⭐', '✨', '🎊', '💫', '🌟'];
  
  for (let i = 0; i < 15; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    container.appendChild(confetti);
    
    setTimeout(() => {
      confetti.remove();
    }, 3000);
  }
}

// Show Results
function showResults() {
  const forceShow = (function(){ try { const p = new URLSearchParams(window.location.search); return p.get('view') === 'report' || p.get('view') === 'full'; } catch(e){ return false; } })();

  // If opened directly by a student (no opener) and not forced, persist results but show short thank-you only
  if (!window.opener && !forceShow) {
    try { if (typeof saveInteractiveResultsToStudent === 'function') saveInteractiveResultsToStudent(); } catch(e){}
    try { createConfetti(); } catch(e){}
    try {
      const assessmentPane = document.getElementById('assessment-screen');
      const resultsPane = document.getElementById('results-screen');
      const thanks = document.getElementById('student-thanks');
      if (assessmentPane) assessmentPane.style.display = 'none';
      if (resultsPane) resultsPane.style.display = 'none';
      if (thanks) thanks.style.display = 'block';
    } catch (e) {}
    return;
  }

  // Otherwise, show the full results pane (admin with forceShow OR direct view requested)
  document.getElementById('assessment-screen').classList.remove('active');
  document.getElementById('assessment-screen').style.display = 'none';
  document.getElementById('results-screen').classList.add('active');
  document.getElementById('results-screen').style.display = 'block';
  
  // Celebrate!
  createConfetti();
  setTimeout(createConfetti, 1000);
  
  // Calculate scores (max 50 points per skill)
  const selScore = assessmentState.scores.SEL.reduce((a, b) => a + b, 0);
  const ctScore = assessmentState.scores.CriticalThinking.reduce((a, b) => a + b, 0);
  const leadScore = assessmentState.scores.Leadership.reduce((a, b) => a + b, 0);
  
  // Convert to percentages
  let selPercent = Math.round((selScore / 50) * 100);
  let ctPercent = Math.round((ctScore / 50) * 100);
  let leadPercent = Math.round((leadScore / 50) * 100);

  // If no in-memory scores (this session) but there's a stored record for the student, use stored breakdown
  try {
    const studentId = window.currentAssessmentStudentId || (function(){ try{ const p = new URLSearchParams(window.location.search); return p.get('studentId'); } catch(e){ return null; } })();
    if (studentId) {
      const arr = StorageHelper.loadStudents();
      const st = arr.find(s => s.id === studentId);
      if (st && st.assessmentBreakdown) {
        if (!selScore && typeof st.assessmentBreakdown.selPercent === 'number') selPercent = st.assessmentBreakdown.selPercent;
        if (!ctScore && typeof st.assessmentBreakdown.ctPercent === 'number') ctPercent = st.assessmentBreakdown.ctPercent;
        if (!leadScore && typeof st.assessmentBreakdown.leadPercent === 'number') leadPercent = st.assessmentBreakdown.leadPercent;
        if ((!assessmentState.totalScore || assessmentState.totalScore === 0) && typeof st.assessmentScore === 'number') assessmentState.totalScore = st.assessmentScore;
      }
    }
  } catch (e) {}

  
  // Update overall score emoji
  const scoreEmoji = document.getElementById('score-emoji-big');
  if (assessmentState.totalScore >= 120) scoreEmoji.textContent = '🏆';
  else if (assessmentState.totalScore >= 100) scoreEmoji.textContent = '⭐';
  else if (assessmentState.totalScore >= 80) scoreEmoji.textContent = '💪';
  else scoreEmoji.textContent = '😊';
  
  // Update overall score
  document.getElementById('overall-score').textContent = assessmentState.totalScore;
  
  // Determine skill level
  const level = getSkillLevel(assessmentState.totalScore);
  document.getElementById('skill-level').textContent = level;
  
  // Update skill breakdown
  document.getElementById('sel-score').textContent = `${selPercent}%`;
  document.getElementById('ct-score').textContent = `${ctPercent}%`;
  document.getElementById('lead-score').textContent = `${leadPercent}%`;
  
  setTimeout(() => {
    document.getElementById('sel-bar').style.width = `${selPercent}%`;
    document.getElementById('ct-bar').style.width = `${ctPercent}%`;
    document.getElementById('lead-bar').style.width = `${leadPercent}%`;
  }, 300);
  
  // Generate insights
  generateInsights(selPercent, ctPercent, leadPercent);
  
  // Generate 6-month plan
  generate6MonthPlan(selPercent, ctPercent, leadPercent);
  
  // Generate next step
  generateNextStep(selPercent, ctPercent, leadPercent);

  // Persist interactive assessment results to student record
  try {
    if (typeof saveInteractiveResultsToStudent === 'function') {
      saveInteractiveResultsToStudent(selPercent, ctPercent, leadPercent);
    }
  } catch (e) {
    console.error('Error saving interactive assessment results:', e);
  }

  // If not forcing show (i.e. admin just saved), show admin-done message and hide other panes
  if (window.opener && !forceShow) {
    try { if (typeof window.opener.loadStudents === 'function') window.opener.loadStudents(); } catch (e) {}

    try {
      const adminDone = document.getElementById('admin-done');
      if (adminDone) {
        adminDone.style.display = 'block';
      }
      const assessmentPane = document.getElementById('assessment-screen');
      if (assessmentPane) assessmentPane.style.display = 'none';
      const resultsPane = document.getElementById('results-screen');
      if (resultsPane) resultsPane.style.display = 'none';
    } catch (e) {}

    return;
  }
}

function getSkillLevel(totalScore) {
  // Max score is 150 (15 questions × 10 points)
  const percentage = (totalScore / 150) * 100;
  if (percentage <= 40) return '🌱 Beginner';
  if (percentage <= 60) return '🌿 Emerging';
  if (percentage <= 80) return '🌳 Proficient';
  return '🏆 Advanced';
}

function generateInsights(selScore, ctScore, leadScore) {
  const scores = { 'Feelings': selScore, 'Thinking': ctScore, 'Leading': leadScore };
  const sortedSkills = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  
  // Strengths
  const topSkill = sortedSkills[0];
  document.getElementById('strengths-text').textContent = 
    `Your strongest area is ${topSkill[0]}! You scored ${topSkill[1]}% here. This is your superpower - use it to help others and keep building on it!`;
  
  // Growth Areas
  const growthSkill = sortedSkills[2];
  const growthText = {
    'Feelings': 'Try talking about emotions more with friends. Notice how people feel and practice being kind when someone is upset.',
    'Thinking': 'When you face a problem, take time to break it down into steps. Ask yourself "what do I know?" and "what can I try?"',
    'Leading': 'Look for small ways to help your group or team. Listen to everyone\'s ideas and help make decisions together.'
  };
  document.getElementById('growth-text').textContent = growthText[growthSkill[0]];
}

function generate6MonthPlan(selScore, ctScore, leadScore) {
  const scores = { 'SEL': selScore, 'CriticalThinking': ctScore, 'Leadership': leadScore };
  const weakestSkill = Object.entries(scores).sort((a, b) => a[1] - b[1])[0][0];
  
  const plans = {
    SEL: {
      phase1: [
        'Notice your feelings 3 times a day',
        'Help one friend who seems sad',
        'Say thank you when people help you'
      ],
      phase2: [
        'Start conversations about feelings',
        'Be the calm person when things go wrong',
        'Learn what makes your friends happy'
      ],
      phase3: [
        'Help others solve friendship problems',
        'Be known as someone who cares',
        'Teach others about emotions'
      ]
    },
    CriticalThinking: {
      phase1: [
        'Ask "why?" 5 times before giving up',
        'Try one puzzle or brain game per week',
        'Make a list before making decisions'
      ],
      phase2: [
        'Explain your thinking to others',
        'Find two sides to every argument',
        'Test your ideas with small experiments'
      ],
      phase3: [
        'Solve a real problem in your school/home',
        'Help others think through tough choices',
        'Create something that helps people think'
      ]
    },
    Leadership: {
      phase1: [
        'Volunteer for one group task per week',
        'Share ideas even when nervous',
        'Encourage someone every day'
      ],
      phase2: [
        'Lead one small group project',
        'Listen to everyone before deciding',
        'Help solve team disagreements'
      ],
      phase3: [
        'Start something new that helps others',
        'Teach your leadership skills to friends',
        'Be the person others turn to'
      ]
    }
  };
  
  const selectedPlan = plans[weakestSkill];
  document.getElementById('phase1-plan').innerHTML = selectedPlan.phase1.map(item => `<li>${item}</li>`).join('');
  document.getElementById('phase2-plan').innerHTML = selectedPlan.phase2.map(item => `<li>${item}</li>`).join('');
  document.getElementById('phase3-plan').innerHTML = selectedPlan.phase3.map(item => `<li>${item}</li>`).join('');
}

function generateNextLevelGoals(currentScore, currentLevel) {
  const nextLevelScore = currentScore + 25;
  const nextLevel = getSkillLevel(nextLevelScore);
  
  const levelDescriptions = {
    'Emerging': 'developing foundational skills and building consistency in applying them',
    'Proficient': 'demonstrating strong capabilities and beginning to mentor others',
    'Advanced': 'mastering complex situations and becoming a role model for peers'
  };
  
  let goalText = `With consistent practice over the next 6 months, you can realistically advance to the ${nextLevel} level (${nextLevelScore}+ score). `;
  goalText += `This means ${levelDescriptions[nextLevel] || 'achieving excellence across all three skill areas'}. `;
  goalText += `Focus on deliberate practice, seek feedback regularly, and challenge yourself with progressively complex situations.`;
  
  document.getElementById('next-level-text').textContent = goalText;
}

function generateActionSteps(selScore, ctScore, leadScore) {
  const steps = [
    {
      title: 'This Week',
      desc: 'Start your daily reflection journal. Spend 5 minutes each evening writing about your emotions and interactions.'
    },
    {
      title: 'This Month',
      desc: 'Take on one leadership opportunity, even if small. Volunteer to organize something or help coordinate a group activity.'
    },
    {
      title: 'This Quarter',
      desc: 'Complete a structured learning program or workshop in your weakest skill area to build confidence and competence.'
    }
  ];
  
  const stepsHTML = steps.map(step => `
    <div class="action-step">
      <div class="action-step-title">${step.title}</div>
      <div class="action-step-desc">${step.desc}</div>
    </div>
  `).join('');
  
  const container = document.getElementById('action-steps');
  if (container) container.innerHTML = stepsHTML;
}

// Helper: read query param
function getQueryParam(name) {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  } catch(e) { return null; }
}

// Persist interactive assessment results into the students in localStorage
function saveInteractiveResultsToStudent(selPercent, ctPercent, leadPercent) {
  const studentId = window.currentAssessmentStudentId || getQueryParam('studentId');
  if (!studentId) return false;
  try {
    // Compute percentages from in-memory scores if not provided
    const selScores = (assessmentState && assessmentState.scores && assessmentState.scores.SEL) ? assessmentState.scores.SEL : [];
    const ctScores = (assessmentState && assessmentState.scores && assessmentState.scores.CriticalThinking) ? assessmentState.scores.CriticalThinking : [];
    const leadScores = (assessmentState && assessmentState.scores && assessmentState.scores.Leadership) ? assessmentState.scores.Leadership : [];

    const selTotal = selScores.reduce((a,b)=>a+b,0);
    const ctTotal = ctScores.reduce((a,b)=>a+b,0);
    const leadTotal = leadScores.reduce((a,b)=>a+b,0);

    const selMax = Math.max(1, selScores.length * 10);
    const ctMax = Math.max(1, ctScores.length * 10);
    const leadMax = Math.max(1, leadScores.length * 10);

    if (typeof selPercent === 'undefined' || selPercent === null) selPercent = Math.round((selTotal / selMax) * 100);
    if (typeof ctPercent === 'undefined' || ctPercent === null) ctPercent = Math.round((ctTotal / ctMax) * 100);
    if (typeof leadPercent === 'undefined' || leadPercent === null) leadPercent = Math.round((leadTotal / leadMax) * 100);

    // Compute totalScore from state if possible
    let totalScore = (assessmentState && typeof assessmentState.totalScore === 'number') ? assessmentState.totalScore : 0;
    if (!totalScore) totalScore = selTotal + ctTotal + leadTotal;

    const existing = StorageHelper.getStudentById(studentId) || { id: studentId, firstName: (assessmentState && assessmentState.userName) ? assessmentState.userName : '' };
    existing.assessmentScore = totalScore;
    existing.assessmentBreakdown = { selPercent, ctPercent, leadPercent };
    existing.assessmentStatus = 'Completed';
    existing.assessmentDate = new Date().toISOString();

    const saved = StorageHelper.saveStudent(existing);
    if (!saved) throw new Error('Failed to persist assessment');

    // Notify opener if present
    if (window.opener && typeof window.opener.loadStudents === 'function') {
      try { window.opener.loadStudents(); } catch(e){}
    }
    return true;
  } catch (e) {
    console.error('saveInteractiveResultsToStudent failed', e);
    return false;
  }
}

// Backwards-compatible wrapper to prevent ReferenceError from showResults
function generateNextStep(selPercent, ctPercent, leadPercent) {
  try {
    const avgPercent = Math.round(((selPercent || 0) + (ctPercent || 0) + (leadPercent || 0)) / 3);
    const totalPossible = questionBank.length * 10;
    const currentScore = Math.round((avgPercent / 100) * totalPossible);
    generateNextLevelGoals(currentScore, getSkillLevel(currentScore));
  } catch (e) {
    // ignore
  }
}

// Download Results
function downloadResults() {
  const userName = assessmentState.userName;
  const level = getSkillLevel(assessmentState.totalScore);
  
  const results = `
${userName}'S SKILLS ASSESSMENT RESULTS
${'='.repeat(40)}
Date: ${new Date().toLocaleDateString()}

TOTAL SCORE: ${assessmentState.totalScore} points
LEVEL: ${level}

SKILL BREAKDOWN:
❤️  Feelings (SEL): ${Math.round((assessmentState.scores.SEL.reduce((a,b)=>a+b,0)/50)*100)}%
🧠 Thinking: ${Math.round((assessmentState.scores.CriticalThinking.reduce((a,b)=>a+b,0)/50)*100)}%
👑 Leading: ${Math.round((assessmentState.scores.Leadership.reduce((a,b)=>a+b,0)/50)*100)}%

Your 6-month game plan is ready on your results page!

Keep growing! 🌟
  `;
  
  const blob = new Blob([results], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${userName}-skills-results.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// Share Results
function shareResults() {
  const userName = assessmentState.userName;
  const level = getSkillLevel(assessmentState.totalScore);
  const text = `I just completed a fun skills assessment! I scored ${assessmentState.totalScore} points and reached ${level} level! 🎉`;
  
  if (navigator.share) {
    navigator.share({
      title: 'My Skills Assessment Results',
      text: text
    }).catch(() => {
      // Fallback: copy to clipboard
      copyToClipboard(text);
    });
  } else {
    copyToClipboard(text);
  }
}

function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  alert('Results copied to clipboard! 📋');
}

// Retake Assessment
function retakeAssessment() {
  // Reset state
  assessmentState.currentQuestionIndex = 0;
  assessmentState.answers = [];
  assessmentState.scores = {
    SEL: [],
    CriticalThinking: [],
    Leadership: []
  };
  assessmentState.totalScore = 0;
  
  document.getElementById('current-score').textContent = '0';
  
  // Go back to welcome
  document.getElementById('results-screen').classList.remove('active');
  document.getElementById('results-screen').style.display = 'none';
  document.getElementById('welcome-screen').classList.add('active');
  document.getElementById('welcome-screen').style.display = 'block';
}
