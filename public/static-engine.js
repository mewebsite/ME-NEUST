/**
 * ME BoardPrep - Real-Time Cloud Firestore Engine
 * Synchronizes User Logins, Profiles, Quiz Attempts & Scores directly with Google Cloud Firestore
 * Project ID: mechanical-neust
 */

(function() {
  const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/mechanical-neust/databases/(default)/documents';

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

  // Helper: Convert JS object to Firestore Value format
  function toFirestoreValue(val) {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (typeof val === 'number') {
      return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    }
    if (typeof val === 'string') return { stringValue: val };
    if (Array.isArray(val)) {
      return { arrayValue: { values: val.map(toFirestoreValue) } };
    }
    if (typeof val === 'object') {
      const fields = {};
      for (const k of Object.keys(val)) {
        fields[k] = toFirestoreValue(val[k]);
      }
      return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
  }

  // Helper: Convert Firestore Value to JS value
  function fromFirestoreValue(val) {
    if (!val) return null;
    if ('stringValue' in val) return val.stringValue;
    if ('integerValue' in val) return parseInt(val.integerValue, 10);
    if ('doubleValue' in val) return val.doubleValue;
    if ('booleanValue' in val) return val.booleanValue;
    if ('nullValue' in val) return null;
    if ('arrayValue' in val) return (val.arrayValue.values || []).map(fromFirestoreValue);
    if ('mapValue' in val) {
      const obj = {};
      const fields = val.mapValue.fields || {};
      for (const k of Object.keys(fields)) {
        obj[k] = fromFirestoreValue(fields[k]);
      }
      return obj;
    }
    return null;
  }

  // Helper: Convert full Firestore document to clean JS object
  function fromFirestoreDoc(doc) {
    if (!doc || !doc.fields) return null;
    const obj = {};
    for (const k of Object.keys(doc.fields)) {
      obj[k] = fromFirestoreValue(doc.fields[k]);
    }
    if (doc.name) {
      const parts = doc.name.split('/');
      obj._id = parts[parts.length - 1];
      if (!obj.id) obj.id = obj._id;
    }
    return obj;
  }

  // Cloud Firestore API Helpers
  async function cloudFetchCollection(collectionName) {
    try {
      const res = await originalFetch(`${FIRESTORE_BASE}/${collectionName}?pageSize=1000`);
      if (!res.ok) throw new Error('Firestore fetch status ' + res.status);
      const data = await res.json();
      return (data.documents || []).map(fromFirestoreDoc).filter(Boolean);
    } catch (e) {
      console.warn(`[Firestore Cloud] Fallback to cache for ${collectionName}:`, e.message);
      return [];
    }
  }

  async function cloudSaveDoc(collectionName, docId, data) {
    try {
      const fields = {};
      for (const k of Object.keys(data)) {
        fields[k] = toFirestoreValue(data[k]);
      }
      await originalFetch(`${FIRESTORE_BASE}/${collectionName}/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
      console.log(`[Firestore Cloud] Saved ${collectionName}/${docId}`);
    } catch (e) {
      console.error(`[Firestore Cloud] Error saving ${collectionName}/${docId}:`, e);
    }
  }

  // Local Storage Synchronizers
  function getLocal(key, fallback = []) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (e) { return fallback; }
  }

  function setLocal(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
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

  async function getAllUsers() {
    const cloudUsers = await cloudFetchCollection('users');
    if (cloudUsers.length > 0) {
      setLocal(STORAGE_KEYS.USERS, cloudUsers);
      return cloudUsers;
    }
    return getLocal(STORAGE_KEYS.USERS, []);
  }

  async function getAllAttempts() {
    const cloudAttempts = await cloudFetchCollection('attempts');
    if (cloudAttempts.length > 0) {
      // Sort newest first
      cloudAttempts.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
      setLocal(STORAGE_KEYS.ATTEMPTS, cloudAttempts);
      return cloudAttempts;
    }
    return getLocal(STORAGE_KEYS.ATTEMPTS, []);
  }

  function calculateAdaptiveAnalyticsSync(studentId, users, attempts) {
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

  // Intercept window.fetch to direct all requests to Cloud Firestore
  const originalFetch = window.fetch;
  window.fetch = async function(url, options = {}) {
    const urlStr = typeof url === 'string' ? url : (url.url || '');
    
    // Only intercept /api/*
    if (!urlStr.includes('/api/')) {
      return originalFetch(url, options);
    }

    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers || {};
    const authHeader = headers['Authorization'] || headers['authorization'] || '';
    const token = authHeader.replace('Bearer ', '').trim();

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

    // 1. REGISTER
    if (urlStr.includes('/api/auth/register') && method === 'POST') {
      const { fullName, email, password, role, school } = body;
      const users = await getAllUsers();
      if (users.find(u => (u.email || '').toLowerCase() === (email || '').toLowerCase())) {
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
        targetExamDate: '2026-10-15',
        diagnosticCompleted: false,
        simulationPassed: false
      };
      
      // Save to Cloud Firestore
      await cloudSaveDoc('users', newUser.id, newUser);
      
      // Update local storage cache
      users.push(newUser);
      setLocal(STORAGE_KEYS.USERS, users);
      setLocal(STORAGE_KEYS.CURRENT_USER, newUser);

      return jsonResponse({ message: 'Account created successfully', token: newUser.id, user: newUser });
    }

    // 2. LOGIN
    if (urlStr.includes('/api/auth/login') && method === 'POST') {
      const { email, password } = body;
      const users = await getAllUsers();
      const user = users.find(u => 
        (u.email || '').toLowerCase() === (email || '').toLowerCase() && 
        (u.password === password || u.passwordHash)
      );

      if (!user) {
        return jsonResponse({ error: 'Invalid email or password.' }, 401);
      }
      setLocal(STORAGE_KEYS.CURRENT_USER, user);
      return jsonResponse({ message: 'Login successful', token: user.id, user });
    }

    // 3. ME
    if (urlStr.includes('/api/auth/me')) {
      const currentUser = getLocal(STORAGE_KEYS.CURRENT_USER, null);
      if (!currentUser) return jsonResponse({ error: 'User not found' }, 404);
      return jsonResponse({ user: currentUser });
    }

    // 4. ADMIN USER LIST (GET /api/users/full)
    if (urlStr.includes('/api/users/full') || (urlStr.includes('/api/users') && method === 'GET')) {
      const users = await getAllUsers();
      const attempts = await getAllAttempts();
      const enrichedUsers = users.map(u => {
        const uAttempts = attempts.filter(a => a.studentId === u.id);
        const lastAtt = uAttempts[0];
        const analytics = calculateAdaptiveAnalyticsSync(u.id, users, attempts);
        return {
          ...u,
          readinessIndex: analytics.readinessIndex,
          totalQuizzesTaken: uAttempts.length,
          lastActive: lastAtt ? lastAtt.submittedAt : u.createdDate || 'Never'
        };
      });
      return jsonResponse({ users: enrichedUsers });
    }

    // 5. ATTEMPTS LIST (GET /api/attempts)
    if (urlStr.includes('/api/attempts') && method === 'GET') {
      const attempts = await getAllAttempts();
      return jsonResponse({ attempts });
    }

    // 6. RECORD ATTEMPT (POST /api/attempts)
    if (urlStr.includes('/api/attempts') && method === 'POST') {
      const currentUser = getLocal(STORAGE_KEYS.CURRENT_USER, {});
      const newAttempt = {
        id: `att_${Date.now()}`,
        studentId: currentUser.id || 'usr_anon',
        studentName: currentUser.fullName || 'Student',
        studentEmail: currentUser.email || '',
        quizId: body.quizId,
        quizTitle: body.quizTitle,
        totalQuestions: body.totalQuestions,
        correctAnswers: body.correctAnswers,
        scorePct: body.scorePct,
        passed: body.passed,
        timeSpentSeconds: body.timeSpentSeconds || 60,
        submittedAt: new Date().toISOString(),
        moduleBreakdown: body.moduleBreakdown || {}
      };

      // Save to Cloud Firestore
      await cloudSaveDoc('attempts', newAttempt.id, newAttempt);

      // Cache locally
      const localAttempts = getLocal(STORAGE_KEYS.ATTEMPTS, []);
      localAttempts.unshift(newAttempt);
      setLocal(STORAGE_KEYS.ATTEMPTS, localAttempts);

      return jsonResponse({ message: 'Quiz attempt recorded in Cloud Database', attempt: newAttempt });
    }

    // 7. DIAGNOSTIC START
    if (urlStr.includes('/api/adaptive/diagnostic/start') && method === 'POST') {
      const questions = (window.INITIAL_QUESTIONS || []).filter(q => q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');
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

    // 8. DIAGNOSTIC SUBMIT
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

      const currentUser = getLocal(STORAGE_KEYS.CURRENT_USER, {});
      const attempt = {
        id: `att_diag_${Date.now()}`,
        studentId: currentUser.id || 'usr_anon',
        studentName: currentUser.fullName || 'Student',
        studentEmail: currentUser.email || '',
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

      // Save Attempt & User to Cloud Firestore
      await cloudSaveDoc('attempts', attempt.id, attempt);
      if (currentUser && currentUser.id) {
        currentUser.diagnosticCompleted = true;
        await cloudSaveDoc('users', currentUser.id, currentUser);
        setLocal(STORAGE_KEYS.CURRENT_USER, currentUser);
      }

      const localAtts = getLocal(STORAGE_KEYS.ATTEMPTS, []);
      localAtts.unshift(attempt);
      setLocal(STORAGE_KEYS.ATTEMPTS, localAtts);

      return jsonResponse({ message: 'Diagnostic Exam recorded in Cloud Database', attempt });
    }

    // 9. ADAPTIVE ANALYTICS
    if (urlStr.includes('/api/adaptive/analytics')) {
      const currentUser = getLocal(STORAGE_KEYS.CURRENT_USER, {});
      const users = await getAllUsers();
      const attempts = await getAllAttempts();
      const analytics = calculateAdaptiveAnalyticsSync(currentUser.id || 'usr_anon', users, attempts);
      return jsonResponse(analytics);
    }

    // 10. SMART QUIZ FETCH
    if (urlStr.includes('/api/adaptive/smart-quiz') && method === 'GET') {
      const currentUser = getLocal(STORAGE_KEYS.CURRENT_USER, {});
      const users = await getAllUsers();
      const attempts = await getAllAttempts();
      const analytics = calculateAdaptiveAnalyticsSync(currentUser.id || 'usr_anon', users, attempts);
      
      const questions = (window.INITIAL_QUESTIONS || []).filter(q => q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');
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

    // 11. SMART QUIZ SUBMIT
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

      const currentUser = getLocal(STORAGE_KEYS.CURRENT_USER, {});
      const attempt = {
        id: `att_smart_${Date.now()}`,
        studentId: currentUser.id || 'usr_anon',
        studentName: currentUser.fullName || 'Student',
        studentEmail: currentUser.email || '',
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

      // Save to Cloud Firestore
      await cloudSaveDoc('attempts', attempt.id, attempt);
      const localAtts = getLocal(STORAGE_KEYS.ATTEMPTS, []);
      localAtts.unshift(attempt);
      setLocal(STORAGE_KEYS.ATTEMPTS, localAtts);

      const users = await getAllUsers();
      const attempts = await getAllAttempts();
      const analytics = calculateAdaptiveAnalyticsSync(currentUser.id || 'usr_anon', users, attempts);

      return jsonResponse({ message: 'Smart-Quiz saved to Cloud Database and Readiness Recalculated.', attempt, analytics });
    }

    // 12. SIMULATION START
    if (urlStr.includes('/api/adaptive/simulation/start') && method === 'POST') {
      const currentUser = getLocal(STORAGE_KEYS.CURRENT_USER, {});
      const users = await getAllUsers();
      const attempts = await getAllAttempts();
      const analytics = calculateAdaptiveAnalyticsSync(currentUser.id || 'usr_anon', users, attempts);

      if (!analytics.canTakeSimulation) {
        return jsonResponse({ error: 'You must attain a minimum 75% Board Readiness Index to unlock the Simulated Licensure Exam.' }, 403);
      }
      const questions = (window.INITIAL_QUESTIONS || []).filter(q => q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');
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

    // 13. SIMULATION SUBMIT
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

      const currentUser = getLocal(STORAGE_KEYS.CURRENT_USER, {});
      const attempt = {
        id: `att_sim_${Date.now()}`,
        studentId: currentUser.id || 'usr_anon',
        studentName: currentUser.fullName || 'Student',
        studentEmail: currentUser.email || '',
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

      // Save to Cloud Firestore
      await cloudSaveDoc('attempts', attempt.id, attempt);
      if (currentUser && currentUser.id) {
        currentUser.simulationPassed = passed;
        await cloudSaveDoc('users', currentUser.id, currentUser);
        setLocal(STORAGE_KEYS.CURRENT_USER, currentUser);
      }

      const localAtts = getLocal(STORAGE_KEYS.ATTEMPTS, []);
      localAtts.unshift(attempt);
      setLocal(STORAGE_KEYS.ATTEMPTS, localAtts);

      const msg = passed
        ? 'Congratulations! You have passed the Licensure Exam Simulation!'
        : 'Simulation score recorded. Continuous Feedback Loop engaged for Unlimited Remediation.';

      return jsonResponse({ message: msg, attempt });
    }

    // 14. STATS
    if (urlStr.includes('/api/questions/stats')) {
      const questions = (window.INITIAL_QUESTIONS || []).filter(q => q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');
      const users = await getAllUsers();
      const quizzes = window.INITIAL_QUIZZES || [];
      const attempts = await getAllAttempts();
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

    // 15. QUESTIONS
    if (urlStr.includes('/api/questions') && method === 'GET') {
      const questions = (window.INITIAL_QUESTIONS || []).filter(q => q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');
      return jsonResponse({ questions, total: questions.length, page: 1, limit: questions.length });
    }

    // 16. QUIZZES
    if (urlStr.includes('/api/quizzes') && method === 'GET') {
      const quizzes = window.INITIAL_QUIZZES || [];
      const attempts = await getAllAttempts();
      const enriched = quizzes.map(q => {
        const quizAtts = attempts.filter(a => a.quizId === q.id);
        const total = quizAtts.length;
        const avg = total > 0 ? Math.round(quizAtts.reduce((acc, a) => acc + (a.scorePct || 0), 0) / total) : 0;
        return { ...q, totalAttempts: total, avgScorePct: avg };
      });
      return jsonResponse({ quizzes: enriched });
    }

    return jsonResponse({ message: 'OK' });
  };
})();
