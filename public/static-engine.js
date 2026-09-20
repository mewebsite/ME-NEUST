/**
 * ME BoardPrep - Offline / Static GitHub Pages Engine
 * Intercepts /api/* requests and executes full Adaptive Exam Engine directly in the browser.
 */

(function() {
  const STORAGE_KEYS = {
    USERS: 'me_users_data',
    ATTEMPTS: 'me_attempts_data',
    QUIZZES: 'me_quizzes_data',
    QUESTIONS: 'me_questions_data',
    CURRENT_USER: 'me_current_user'
  };

  const CORE_MODULES = [
    'Module 1 - Power Plant Elements',
    'Module 2 - Power Plant Design',
    'Module 3 - Industrial Plant Engineering',
    'Module 4 - Industrial Plant Design',
    'Module 5 - Refrigeration Engineering',
    'Module 6 - Air Conditioning'
  ];

  // Initialize Local Storage data from bundled data if not already initialized
  function getQuestions() {
    const stored = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return window.INITIAL_QUESTIONS || [];
  }

  function saveQuestions(data) {
    try { localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(data)); } catch (e) {}
  }

  function getUsers() {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return [];
  }

  function saveUsers(data) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data));
  }

  function getAttempts() {
    const stored = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return [];
  }

  function saveAttempts(data) {
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(data));
  }

  function getQuizzes() {
    const stored = localStorage.getItem(STORAGE_KEYS.QUIZZES);
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return window.INITIAL_QUIZZES || [];
  }

  function saveQuizzes(data) {
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(data));
  }

  function normalizeModule(rawModule) {
    if (!rawModule) return CORE_MODULES[0];
    const mStr = String(rawModule).toLowerCase();
    if (mStr.includes('module 1')) return 'Module 1 - Power Plant Elements';
    if (mStr.includes('module 2')) return 'Module 2 - Power Plant Design';
    if (mStr.includes('module 3')) return 'Module 3 - Industrial Plant Engineering';
    if (mStr.includes('module 4')) return 'Module 4 - Industrial Plant Design';
    if (mStr.includes('module 5')) return 'Module 5 - Refrigeration Engineering';
    if (mStr.includes('module 6')) return 'Module 6 - Air Conditioning';
    return CORE_MODULES[0];
  }

  function calculateAdaptiveAnalytics(studentId) {
    const users = getUsers();
    const attempts = getAttempts();
    
    const student = users.find(u => u.id === studentId);
    const studentAttempts = attempts.filter(a => a.studentId === studentId);
    const simAttempts = studentAttempts.filter(a => a.quizId === 'board_exam_simulation');
    
    const isDiagnosticCompleted = !!(student && student.diagnosticCompleted);
    const simulationPassed = !!(student && student.simulationPassed);
    const latestSimAttempt = simAttempts.length > 0 ? simAttempts[0] : null;
    const lastSimFailed = latestSimAttempt && !latestSimAttempt.passed;
    const failedSimTime = lastSimFailed ? new Date(latestSimAttempt.submittedAt).getTime() : 0;

    const moduleStats = {};
    CORE_MODULES.forEach(mod => {
      moduleStats[mod] = { totalAttempts: 0, correctCount: 0, percentage: 0 };
    });

    studentAttempts.forEach(att => {
      if (att.moduleBreakdown && att.quizId !== 'board_exam_simulation') {
        const attTime = new Date(att.submittedAt).getTime();
        if (!lastSimFailed || attTime > failedSimTime) {
          Object.keys(att.moduleBreakdown).forEach(rawMod => {
            const normalized = normalizeModule(rawMod);
            if (moduleStats[normalized]) {
              moduleStats[normalized].totalAttempts += att.moduleBreakdown[rawMod].total || 0;
              moduleStats[normalized].correctCount += att.moduleBreakdown[rawMod].correct || 0;
            }
          });
        }
      }
    });

    let sumPercentages = 0;
    let countedModules = 0;
    const moduleList = [];
    const weaknesses = [];

    CORE_MODULES.forEach(mod => {
      const stat = moduleStats[mod];
      const pct = stat.totalAttempts > 0 ? Math.round((stat.correctCount / stat.totalAttempts) * 100) : 0;
      stat.percentage = pct;
      sumPercentages += pct;
      countedModules++;

      moduleList.push({
        module: mod,
        percentage: pct,
        totalAttempts: stat.totalAttempts,
        correctCount: stat.correctCount
      });

      if (pct < 75) {
        weaknesses.push({
          module: mod,
          proficiencyScore: pct,
          suggestedAction: pct === 0 ? 'Needs Initial Diagnostic / Practice' : 'Requires Targeted Remediation'
        });
      }
    });

    weaknesses.sort((a, b) => a.proficiencyScore - b.proficiencyScore);

    let readinessIndex = 0;
    if (simulationPassed) {
      readinessIndex = 100;
    } else if (lastSimFailed) {
      let postFailSmartQuizzes = studentAttempts.filter(a => {
        const t = new Date(a.submittedAt).getTime();
        return t > failedSimTime && a.quizId.startsWith('smart_quiz_');
      });

      if (postFailSmartQuizzes.length === 0) {
        readinessIndex = 0;
      } else {
        readinessIndex = Math.min(74, Math.round(sumPercentages / (countedModules || 1)));
      }
    } else if (isDiagnosticCompleted) {
      readinessIndex = Math.round(sumPercentages / (countedModules || 1));
    }

    const canTakeSimulation = isDiagnosticCompleted && readinessIndex >= 75;

    return {
      studentId,
      readinessIndex,
      isDiagnosticCompleted,
      simulationPassed,
      canTakeSimulation,
      lastSimFailed,
      modules: moduleList,
      weaknesses,
      totalQuizzesTaken: studentAttempts.length
    };
  }

  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = async function(url, options = {}) {
    const urlStr = typeof url === 'string' ? url : (url.url || '');
    
    // Only intercept /api/* calls
    if (!urlStr.includes('/api/')) {
      return originalFetch(url, options);
    }

    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers || {};
    const authHeader = headers['Authorization'] || headers['authorization'] || '';
    const token = authHeader.replace('Bearer ', '').trim();
    
    let currentUserId = token;
    let currentUser = getUsers().find(u => u.id === currentUserId);
    if (!currentUser && token) {
      try {
        currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
      } catch (e) {}
    }

    let body = {};
    if (options.body) {
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      } catch (e) {}
    }

    function jsonResponse(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // AUTH ROUTES
    if (urlStr.includes('/api/auth/register') && method === 'POST') {
      const { fullName, email, password, role, school } = body;
      const users = getUsers();
      if (users.find(u => u.email.toLowerCase() === (email || '').toLowerCase())) {
        return jsonResponse({ error: 'An account with this email already exists.' }, 400);
      }
      const newUser = {
        id: `usr_${Date.now()}`,
        fullName,
        email: email.toLowerCase(),
        password,
        role: role === 'admin' ? 'admin' : 'student',
        status: 'active',
        createdDate: new Date().toISOString().split('T')[0],
        school: school || 'N/A',
        targetExamDate: '2026-10-15'
      };
      users.push(newUser);
      saveUsers(users);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
      return jsonResponse({ message: 'Account created successfully', token: newUser.id, user: newUser });
    }

    if (urlStr.includes('/api/auth/login') && method === 'POST') {
      const { email, password } = body;
      const users = getUsers();
      const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase() && u.password === password);
      if (!user) {
        return jsonResponse({ error: 'Invalid email or password.' }, 401);
      }
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return jsonResponse({ message: 'Login successful', token: user.id, user });
    }

    if (urlStr.includes('/api/auth/me')) {
      if (!currentUser) return jsonResponse({ error: 'User not found' }, 404);
      return jsonResponse({ user: currentUser });
    }

    // QUESTIONS ROUTES
    if (urlStr.includes('/api/questions/stats')) {
      const questions = getQuestions().filter(q => q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');
      const users = getUsers();
      const quizzes = getQuizzes();
      const attempts = getAttempts();
      const modules = [...new Set(questions.map(q => q.Module).filter(Boolean))];
      return jsonResponse({
        totalQuestions: questions.length,
        totalModules: modules.length,
        totalQuizzes: quizzes.length,
        totalUsers: users.length,
        totalAttempts: attempts.length,
        modules
      });
    }

    if (urlStr.includes('/api/questions') && method === 'GET') {
      const questions = getQuestions().filter(q => q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');
      return jsonResponse({ questions, total: questions.length, page: 1, limit: questions.length });
    }

    if (urlStr.includes('/api/quizzes') && method === 'GET') {
      const quizzes = getQuizzes();
      const attempts = getAttempts();
      const enriched = quizzes.map(q => {
        const quizAtts = attempts.filter(a => a.quizId === q.id);
        const total = quizAtts.length;
        const avg = total > 0 ? Math.round(quizAtts.reduce((acc, a) => acc + (a.scorePct || 0), 0) / total) : 0;
        return { ...q, totalAttempts: total, avgScorePct: avg };
      });
      return jsonResponse({ quizzes: enriched });
    }

    if (urlStr.includes('/api/attempts') && method === 'POST') {
      const attempts = getAttempts();
      const newAttempt = {
        id: `att_${Date.now()}`,
        studentId: currentUser ? currentUser.id : 'usr_anon',
        studentName: currentUser ? currentUser.fullName : 'Student',
        quizId: body.quizId,
        quizTitle: body.quizTitle,
        totalQuestions: body.totalQuestions,
        correctAnswers: body.correctAnswers,
        scorePct: body.scorePct,
        passed: body.passed,
        timeSpentSeconds: body.timeSpentSeconds,
        submittedAt: new Date().toISOString(),
        moduleBreakdown: body.moduleBreakdown || {}
      };
      attempts.unshift(newAttempt);
      saveAttempts(attempts);
      return jsonResponse({ message: 'Quiz submitted successfully', attempt: newAttempt });
    }

    // ADAPTIVE ENGINE ROUTES
    if (urlStr.includes('/api/adaptive/diagnostic/start') && method === 'POST') {
      const questions = getQuestions().filter(q => q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');
      let diagnosticQuestions = [];
      CORE_MODULES.forEach(mod => {
        const modQuestions = questions.filter(q => normalizeModule(q.Module) === mod);
        const sample = [...modQuestions].sort(() => 0.5 - Math.random()).slice(0, 17);
        diagnosticQuestions = diagnosticQuestions.concat(sample);
      });
      diagnosticQuestions = diagnosticQuestions.slice(0, 100);
      return jsonResponse({
        quizId: 'diagnostic_assessment',
        title: 'Diagnostic Benchmark Exam (100 Questions)',
        durationMins: 90,
        passingScorePct: 75,
        totalQuestions: diagnosticQuestions.length,
        questions: diagnosticQuestions
      });
    }

    if (urlStr.includes('/api/adaptive/diagnostic/submit') && method === 'POST') {
      const { userAnswers, timeSpentSeconds, questionDetails } = body;
      const questions = questionDetails || [];
      let correct = 0;
      const moduleBreakdown = {};

      questions.forEach(q => {
        const isCorrect = String(userAnswers[q.ID] || '').trim().toUpperCase() === String(q.CorrectAnswer || '').trim().toUpperCase();
        if (isCorrect) correct++;
        const mod = normalizeModule(q.Module);
        if (!moduleBreakdown[mod]) moduleBreakdown[mod] = { total: 0, correct: 0 };
        moduleBreakdown[mod].total++;
        if (isCorrect) moduleBreakdown[mod].correct++;
      });

      const total = questions.length || 100;
      const scorePct = Math.round((correct / total) * 100);
      const passed = scorePct >= 75;

      const attempts = getAttempts();
      const attempt = {
        id: `att_diag_${Date.now()}`,
        studentId: currentUser ? currentUser.id : 'usr_anon',
        studentName: currentUser ? currentUser.fullName : 'Student',
        quizId: 'diagnostic_assessment',
        quizTitle: 'Comprehensive Licensure Diagnostic Exam',
        totalQuestions: total,
        correctAnswers: correct,
        scorePct,
        passed,
        timeSpentSeconds: timeSpentSeconds || 60,
        submittedAt: new Date().toISOString(),
        moduleBreakdown
      };
      attempts.unshift(attempt);
      saveAttempts(attempts);

      if (currentUser) {
        const users = getUsers();
        const u = users.find(x => x.id === currentUser.id);
        if (u) {
          u.diagnosticCompleted = true;
          saveUsers(users);
        }
      }

      return jsonResponse({ message: 'Diagnostic Exam submitted successfully', attempt });
    }

    if (urlStr.includes('/api/adaptive/analytics')) {
      const studentId = currentUser ? currentUser.id : 'usr_anon';
      const analytics = calculateAdaptiveAnalytics(studentId);
      return jsonResponse(analytics);
    }

    if (urlStr.includes('/api/adaptive/smart-quiz/submit') && method === 'POST') {
      const { userAnswers, timeSpentSeconds, questionDetails, targetModule } = body;
      const questions = questionDetails || [];
      let correct = 0;
      const moduleBreakdown = {};

      questions.forEach(q => {
        const isCorrect = String(userAnswers[q.ID] || '').trim().toUpperCase() === String(q.CorrectAnswer || '').trim().toUpperCase();
        if (isCorrect) correct++;
        const mod = normalizeModule(q.Module);
        if (!moduleBreakdown[mod]) moduleBreakdown[mod] = { total: 0, correct: 0 };
        moduleBreakdown[mod].total++;
        if (isCorrect) moduleBreakdown[mod].correct++;
      });

      const total = questions.length || 15;
      const scorePct = Math.round((correct / total) * 100);
      const passed = scorePct >= 75;

      const attempts = getAttempts();
      const attempt = {
        id: `att_smart_${Date.now()}`,
        studentId: currentUser ? currentUser.id : 'usr_anon',
        studentName: currentUser ? currentUser.fullName : 'Student',
        quizId: `smart_quiz_${Date.now()}`,
        quizTitle: `Targeted Smart Quiz - ${targetModule || 'Remediation'}`,
        totalQuestions: total,
        correctAnswers: correct,
        scorePct,
        passed,
        timeSpentSeconds: timeSpentSeconds || 60,
        submittedAt: new Date().toISOString(),
        moduleBreakdown
      };
      attempts.unshift(attempt);
      saveAttempts(attempts);

      const analytics = calculateAdaptiveAnalytics(currentUser ? currentUser.id : 'usr_anon');
      return jsonResponse({ message: 'Smart-Quiz evaluated and Board Readiness Index recalculated.', attempt, analytics });
    }

    if (urlStr.includes('/api/adaptive/smart-quiz')) {
      const studentId = currentUser ? currentUser.id : 'usr_anon';
      const analytics = calculateAdaptiveAnalytics(studentId);
      const questions = getQuestions().filter(q => q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');
      const weakModules = analytics.weaknesses.map(w => w.module);
      const targetWeakness = weakModules.length > 0 ? weakModules[0] : CORE_MODULES[0];
      const targetQuestions = questions.filter(q => normalizeModule(q.Module) === targetWeakness);
      const quizQuestions = [...targetQuestions].sort(() => 0.5 - Math.random()).slice(0, 15);

      return jsonResponse({
        quizId: `smart_quiz_${Date.now()}`,
        title: `Targeted Remediation Smart Quiz: ${targetWeakness}`,
        targetModule: targetWeakness,
        durationMins: 20,
        passingScorePct: 75,
        totalQuestions: quizQuestions.length,
        questions: quizQuestions
      });
    }

    if (urlStr.includes('/api/adaptive/simulation/start') && method === 'POST') {
      const studentId = currentUser ? currentUser.id : 'usr_anon';
      const analytics = calculateAdaptiveAnalytics(studentId);
      if (!analytics.canTakeSimulation) {
        return jsonResponse({ error: 'You must attain a minimum 75% Board Readiness Index to unlock the Simulated Licensure Exam.' }, 403);
      }
      const questions = getQuestions().filter(q => q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');
      const simQuestions = [...questions].sort(() => 0.5 - Math.random()).slice(0, 100);
      return jsonResponse({
        quizId: 'board_exam_simulation',
        title: 'Full Licensure Examination Simulation',
        durationMins: 240,
        passingScorePct: 70,
        totalQuestions: simQuestions.length,
        questions: simQuestions
      });
    }

    if (urlStr.includes('/api/adaptive/simulation/submit') && method === 'POST') {
      const { userAnswers, timeSpentSeconds, questionDetails } = body;
      const questions = questionDetails || [];
      let correct = 0;
      const moduleBreakdown = {};

      questions.forEach(q => {
        const isCorrect = String(userAnswers[q.ID] || '').trim().toUpperCase() === String(q.CorrectAnswer || '').trim().toUpperCase();
        if (isCorrect) correct++;
        const mod = normalizeModule(q.Module);
        if (!moduleBreakdown[mod]) moduleBreakdown[mod] = { total: 0, correct: 0 };
        moduleBreakdown[mod].total++;
        if (isCorrect) moduleBreakdown[mod].correct++;
      });

      const total = questions.length || 100;
      const scorePct = Math.round((correct / total) * 100);
      const passed = scorePct >= 70;

      const attempts = getAttempts();
      const attempt = {
        id: `att_sim_${Date.now()}`,
        studentId: currentUser ? currentUser.id : 'usr_anon',
        studentName: currentUser ? currentUser.fullName : 'Student',
        quizId: 'board_exam_simulation',
        quizTitle: 'Full Licensure Exam Simulation',
        totalQuestions: total,
        correctAnswers: correct,
        scorePct,
        passed,
        timeSpentSeconds: timeSpentSeconds || 60,
        submittedAt: new Date().toISOString(),
        moduleBreakdown
      };
      attempts.unshift(attempt);
      saveAttempts(attempts);

      if (currentUser) {
        const users = getUsers();
        const u = users.find(x => x.id === currentUser.id);
        if (u) {
          u.simulationPassed = passed;
          saveUsers(users);
        }
      }

      const msg = passed
        ? 'Congratulations! You have passed the Licensure Exam Simulation!'
        : 'Simulation score recorded. Continuous Feedback Loop engaged for Unlimited Remediation.';

      return jsonResponse({ message: msg, attempt });
    }

    // Default fallback for any other route
    return jsonResponse({ message: 'OK' });
  };
})();
