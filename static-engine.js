/**
 * ME BoardPrep - Secure Firebase Authentication & Real-Time Cloud Firestore Engine
 * Powered by Firebase Auth + Cloud Firestore SDK + Firestore Security Rules
 * Project ID: me-neust-website-v2
 */

(function() {
  const originalFetch = (typeof window !== 'undefined' && window.fetch) ? window.fetch.bind(window) : fetch;

  const FIREBASE_CONFIG = {
    projectId: "me-neust-website-v2",
    appId: "1:358554783327:web:0fd5fd7aa7aca7c93a15ea",
    storageBucket: "me-neust-website-v2.firebasestorage.app",
    apiKey: "AIzaSyDh1Mz-H59ERmcf2-ndKoFWd0gy7OafU4k",
    authDomain: "me-neust-website-v2.firebaseapp.com",
    messagingSenderId: "358554783327",
    measurementId: "G-0GB77M7X4G"
  };

  const STORAGE_KEYS = {
    USERS: 'me_users_data',
    ATTEMPTS: 'me_attempts_data',
    QUIZZES: 'me_quizzes_data',
    QUESTIONS: 'me_questions_data',
    CURRENT_USER: 'me_current_user',
    DELETED_QUIZZES: 'me_deleted_quiz_ids',
    DELETED_USERS: 'me_deleted_user_ids',
    DELETED_QUESTIONS: 'me_deleted_question_ids'
  };

  const CORE_MODULES = [
    'Module 1 - Power Plant Elements',
    'Module 2 - Power Plant Design',
    'Module 3 - Industrial Plant Engineering',
    'Module 4 - Industrial Plant Design',
    'Module 5 - Refrigeration Engineering',
    'Module 6 - Air Conditioning'
  ];

  // Baseline licensure board prep assessments
  const SEED_QUIZZES = [
    {
      id: "qz_01",
      title: "Module 1: Power Plant Engineering Comprehensive Quiz",
      description: "Official faculty assessment covering Thermodynamics, Heat Transfer, Steam/Gas Turbines, and Boilers.",
      module: "Module 1 - Power Plant Elements",
      questionCount: 50,
      durationMins: 50,
      passingScorePct: 70,
      status: "published",
      selectionMode: "random",
      specificQuestionIds: [],
      createdBy: "Dr. Roberto Santos, PE",
      createdDate: "2026-07-28"
    },
    {
      id: "qz_02",
      title: "Module 2: Thermal Cycles & Power Plant Design Quiz",
      description: "Assessment on Rankine, Brayton, and Combined Cycles, Hydroelectric systems, and Chimney Sizing.",
      module: "Module 2 - Power Plant Design",
      questionCount: 50,
      durationMins: 50,
      passingScorePct: 70,
      status: "published",
      selectionMode: "random",
      specificQuestionIds: [],
      createdBy: "Dr. Roberto Santos, PE",
      createdDate: "2026-07-30"
    },
    {
      id: "qz_03",
      title: "Refrigeration & Air Conditioning Board Exam Practice Quiz",
      description: "Vapor compression cycles, Absorption systems, Psychrometric chart analysis, and COP calculations.",
      module: "Module 5 - Refrigeration Engineering",
      questionCount: 30,
      durationMins: 30,
      passingScorePct: 75,
      status: "published",
      selectionMode: "random",
      specificQuestionIds: [],
      createdBy: "Dr. Roberto Santos, PE",
      createdDate: "2026-08-01"
    },
    {
      id: "qz_04",
      title: "Full Licensure Exam Simulation Mock Board Quiz",
      description: "Comprehensive 100-question mixed assessment across all 6 Mechanical Engineering Licensure modules.",
      module: "",
      questionCount: 100,
      durationMins: 100,
      passingScorePct: 70,
      status: "published",
      selectionMode: "random",
      specificQuestionIds: [],
      createdBy: "Dr. Roberto Santos, PE",
      createdDate: "2026-08-02"
    },
    {
      id: "qz_1785725408616",
      title: "Combined Power Plant & Refrigeration Block Exam",
      description: "Faculty quiz combining Module 1 (Power Plant) and Module 5 (Refrigeration)",
      module: "Module 1 - Power Plant Elements, Module 5 - Refrigeration Engineering",
      questionCount: 30,
      durationMins: 30,
      passingScorePct: 75,
      status: "published",
      selectionMode: "random",
      specificQuestionIds: [],
      createdBy: "Dr. Roberto Santos, PE",
      createdDate: "2026-08-03"
    },
    {
      id: "qz_1785726123836",
      title: "Hand-Picked Special Exam Paper",
      description: "Faculty selected exact items #1, #5, #10, #15",
      module: "Module 1 - Power Plant Elements",
      questionCount: 4,
      durationMins: 20,
      passingScorePct: 75,
      status: "published",
      selectionMode: "manual",
      specificQuestionIds: ["1", "5", "10", "15"],
      createdBy: "Dr. Roberto Santos, PE",
      createdDate: "2026-08-03"
    }
  ];

  if (typeof window !== 'undefined') {
    window.INITIAL_QUIZZES = SEED_QUIZZES;
  }

  // --- FIREBASE SDK INITIALIZATION ---
  let firebaseApp = null;
  let auth = null;
  let db = null;
  let authReadyPromise = Promise.resolve(null);

  function initFirebase() {
    if (typeof firebase === 'undefined' || !firebase.initializeApp) {
      console.error('[Firebase Security] Firebase SDK not loaded.');
      return;
    }
    firebaseApp = firebase.apps.length > 0 ? firebase.app() : firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth(firebaseApp);
    db = firebase.firestore(firebaseApp);

    try {
      db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
    } catch (e) {}

    authReadyPromise = new Promise((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(auth.currentUser);
        }
      }, 4000);
      const unsub = auth.onAuthStateChanged((u) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          unsub();
          resolve(u);
        }
      });
    });

    auth.onAuthStateChanged((fbUser) => {
      if (!fbUser) {
        stopRealtimeListeners();
      }
    });
  }

  initFirebase();

  function getSecondaryAuth() {
    const secondaryName = 'AdminUserProvisioner';
    const existing = firebase.apps.find(a => a.name === secondaryName);
    const secApp = existing || firebase.initializeApp(FIREBASE_CONFIG, secondaryName);
    return firebase.auth(secApp);
  }

  // --- LOCAL STORAGE & SANITIZATION HELPERS ---
  function getLocal(key, fallback = []) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function setLocal(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  function clearSessionCaches() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    } catch (e) {}
  }

  // Never allow password or passwordHash in memory, localStorage, or Firestore writes
  function sanitizeUser(u) {
    if (!u || typeof u !== 'object') return null;
    const { password, passwordHash, _id, ...safe } = u;
    if (!safe.id && _id) safe.id = _id;
    return safe;
  }

  function normalizeLoginEmail(rawEmail) {
    const e = String(rawEmail || '').toLowerCase().trim();
    if (e === 'admin1@boardprep.edu.ph') return 'admin@me-prep.edu.ph';
    if (e === 'admin3@boardprep.edu.ph') return 'admin2@me-prep.edu.ph';
    if (e === 'admin4@boardprep.edu.ph') return 'admin3@me-prep.edu.ph';
    return e;
  }

  function mapAuthError(err) {
    const code = (err && err.code) || '';
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found' ||
      code === 'auth/invalid-login-credentials'
    ) {
      return 'Invalid email or password.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists.';
    }
    if (code === 'auth/weak-password') {
      return 'Password must be at least 6 characters long.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many failed attempts. Please wait a moment and try again.';
    }
    if (code === 'auth/requires-recent-login') {
      return 'For security, please sign out and sign back in before changing your password.';
    }
    return (err && err.message) || 'Authentication request failed.';
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

  function isTestUser(u) {
    if (!u) return true;
    const email = (u.email || '').toLowerCase().trim();
    const id = u.id || '';
    if (id === 'usr_admin_1' || id === 'usr_admin_3' || id === 'usr_admin_4') return true;
    if (email === 'admin1@boardprep.edu.ph' || email === 'admin3@boardprep.edu.ph' || email === 'admin4@boardprep.edu.ph') return true;
    return (
      email.includes('teststudent') ||
      email.includes('test_') ||
      email === 'dsds@gmail.com'
    );
  }

  function isTestAttempt(a) {
    if (!a) return true;
    const email = (a.studentEmail || '').toLowerCase().trim();
    return (
      email.includes('teststudent') ||
      email.includes('test_') ||
      email === 'dsds@gmail.com'
    );
  }

  function extractAttemptScore(a) {
    if (!a) return 0;
    if (a.score !== undefined && a.score !== null && !isNaN(parseInt(a.score, 10))) {
      return parseInt(a.score, 10);
    }
    if (a.correctAnswers !== undefined && a.correctAnswers !== null && !isNaN(parseInt(a.correctAnswers, 10))) {
      return parseInt(a.correctAnswers, 10);
    }
    if (a.moduleBreakdown && typeof a.moduleBreakdown === 'object') {
      let sum = 0;
      let found = false;
      Object.values(a.moduleBreakdown).forEach(m => {
        if (m && typeof m === 'object') {
          const val = m.correct !== undefined ? m.correct : m.score;
          if (val !== undefined && val !== null && !isNaN(parseInt(val, 10))) {
            sum += parseInt(val, 10);
            found = true;
          }
        }
      });
      if (found) return sum;
    }
    return 0;
  }

  function extractAttemptTotal(a) {
    if (!a) return 0;
    if (a.totalQuestions !== undefined && a.totalQuestions !== null && !isNaN(parseInt(a.totalQuestions, 10))) {
      return parseInt(a.totalQuestions, 10);
    }
    if (a.total !== undefined && a.total !== null && !isNaN(parseInt(a.total, 10))) {
      return parseInt(a.total, 10);
    }
    if (a.moduleBreakdown && typeof a.moduleBreakdown === 'object') {
      let sum = 0;
      let found = false;
      Object.values(a.moduleBreakdown).forEach(m => {
        if (m && typeof m === 'object' && m.total !== undefined && m.total !== null && !isNaN(parseInt(m.total, 10))) {
          sum += parseInt(m.total, 10);
          found = true;
        }
      });
      if (found && sum > 0) return sum;
    }
    return 0;
  }

  function extractAttemptPercentage(a, scoreVal, totalVal) {
    if (a && a.percentage !== undefined && a.percentage !== null && !isNaN(parseFloat(a.percentage))) {
      return Math.round(parseFloat(a.percentage));
    }
    if (a && a.scorePct !== undefined && a.scorePct !== null && !isNaN(parseFloat(a.scorePct))) {
      return Math.round(parseFloat(a.scorePct));
    }
    return totalVal > 0 ? Math.round((scoreVal / totalVal) * 100) : 0;
  }

  function normalizeAttempt(a, users = []) {
    if (!a) return null;
    const scoreVal = extractAttemptScore(a);
    const totalVal = extractAttemptTotal(a);
    const pct = extractAttemptPercentage(a, scoreVal, totalVal);

    const matchingUser = users.find(u => u.id === a.studentId || (u.email && a.studentEmail && u.email.toLowerCase() === a.studentEmail.toLowerCase()));
    const studentName = (a.studentName && a.studentName !== 'Student')
      ? a.studentName
      : (matchingUser ? matchingUser.fullName : (a.studentName || 'Student Reviewee'));
    const studentEmail = a.studentEmail || (matchingUser ? matchingUser.email : '');
    const school = a.school || (matchingUser ? matchingUser.school : 'NEUST');

    return {
      ...a,
      score: scoreVal,
      correctAnswers: scoreVal,
      totalQuestions: totalVal,
      percentage: pct,
      scorePct: pct,
      passed: a.passed !== undefined && a.passed !== null ? !!a.passed : (pct >= 70),
      studentName,
      studentEmail,
      school,
      timeSpentSeconds: a.timeSpentSeconds || 60,
      submittedAt: a.submittedAt || new Date().toISOString()
    };
  }

  function computeMergedQuizzes(cloudQuizzes, deletedIds, role) {
    const deletedSet = new Set(deletedIds || []);
    const active = [];
    const seen = new Set();

    (cloudQuizzes || []).forEach(q => {
      if (q && q.id && !deletedSet.has(q.id)) {
        if (role === 'admin' || q.status === 'published') {
          active.push(q);
          seen.add(q.id);
        }
      }
    });

    SEED_QUIZZES.forEach(sq => {
      if (!deletedSet.has(sq.id) && !seen.has(sq.id)) {
        if (role === 'admin' || sq.status === 'published') {
          active.push(sq);
          seen.add(sq.id);
        }
      }
    });

    return active;
  }

  // --- AUTHENTICATED REAL-TIME CLOUD FIRESTORE LISTENERS ---
  let activeListenerUid = null;
  let activeListenerRole = null;
  let unsubscribeFns = [];

  function stopRealtimeListeners() {
    unsubscribeFns.forEach(fn => {
      try { fn(); } catch (e) {}
    });
    unsubscribeFns = [];
    activeListenerUid = null;
    activeListenerRole = null;
  }

  function startRealtimeListeners(currentUser) {
    if (!db || !currentUser || !currentUser.id) return;
    if (activeListenerUid === currentUser.id && activeListenerRole === currentUser.role && unsubscribeFns.length > 0) {
      return;
    }

    stopRealtimeListeners();
    activeListenerUid = currentUser.id;
    activeListenerRole = currentUser.role;

    const isAdmin = currentUser.role === 'admin';
    let latestCloudQuizzes = null;
    let latestDeletedQuizIds = getLocal(STORAGE_KEYS.DELETED_QUIZZES, []);

    const syncQuizCacheAndNotify = () => {
      if (latestCloudQuizzes === null) return;
      const merged = computeMergedQuizzes(latestCloudQuizzes, latestDeletedQuizIds, currentUser.role);
      setLocal(STORAGE_KEYS.QUIZZES, merged);
      window.dispatchEvent(new CustomEvent('me_live_update', { detail: { type: 'QUIZ_UPDATE' } }));
    };

    // 1. Deleted Quizzes Listener
    unsubscribeFns.push(
      db.collection('deleted_quizzes').onSnapshot(snap => {
        latestDeletedQuizIds = snap.docs.map(d => d.id);
        setLocal(STORAGE_KEYS.DELETED_QUIZZES, latestDeletedQuizIds);
        syncQuizCacheAndNotify();
      }, err => console.warn('[Firestore Live] deleted_quizzes listener error:', err.message))
    );

    // 2. Quizzes Listener (Admins watch all; students watch published)
    const quizzesQuery = isAdmin
      ? db.collection('quizzes')
      : db.collection('quizzes').where('status', '==', 'published');

    unsubscribeFns.push(
      quizzesQuery.onSnapshot(snap => {
        latestCloudQuizzes = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        syncQuizCacheAndNotify();
      }, err => console.warn('[Firestore Live] quizzes listener error:', err.message))
    );

    // 3. Attempts Listener (Admins watch all; students watch only their own)
    const attemptsQuery = isAdmin
      ? db.collection('attempts')
      : db.collection('attempts').where('studentId', '==', currentUser.id);

    unsubscribeFns.push(
      attemptsQuery.onSnapshot(snap => {
        const users = getLocal(STORAGE_KEYS.USERS, [currentUser]);
        const list = snap.docs
          .map(d => ({ ...d.data(), id: d.id }))
          .filter(a => !isTestAttempt(a))
          .map(a => normalizeAttempt(a, users))
          .filter(Boolean)
          .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
        setLocal(STORAGE_KEYS.ATTEMPTS, list);
        window.dispatchEvent(new CustomEvent('me_live_update', { detail: { type: 'ATTEMPT_UPDATE' } }));
      }, err => console.warn('[Firestore Live] attempts listener error:', err.message))
    );

    // 4. Users Listener (Admins watch all users; students watch only their own profile doc)
    if (isAdmin) {
      unsubscribeFns.push(
        db.collection('users').onSnapshot(snap => {
          const users = snap.docs
            .map(d => sanitizeUser({ ...d.data(), id: d.id }))
            .filter(u => u && !isTestUser(u));
          setLocal(STORAGE_KEYS.USERS, users);
          const me = users.find(u => u.id === currentUser.id);
          if (me) setLocal(STORAGE_KEYS.CURRENT_USER, me);
          window.dispatchEvent(new CustomEvent('me_live_update', { detail: { type: 'USER_UPDATE' } }));
        }, err => console.warn('[Firestore Live] users listener error:', err.message))
      );
    } else {
      unsubscribeFns.push(
        db.collection('users').doc(currentUser.id).onSnapshot(docSnap => {
          if (!docSnap.exists) return;
          const me = sanitizeUser({ ...docSnap.data(), id: docSnap.id });
          if (me.status !== 'active') {
            auth.signOut().catch(() => {});
            clearSessionCaches();
            return;
          }
          setLocal(STORAGE_KEYS.CURRENT_USER, me);
          setLocal(STORAGE_KEYS.USERS, [me]);
        }, err => console.warn('[Firestore Live] profile listener error:', err.message))
      );
    }
  }

  // --- AUTHORITATIVE FIRESTORE DATA ACCESSORS ---
  async function getAuthenticatedProfile() {
    await authReadyPromise;
    if (!auth || !auth.currentUser || !db) return null;
    try {
      const snap = await db.collection('users').doc(auth.currentUser.uid).get();
      if (!snap.exists) return null;
      const user = sanitizeUser({ ...snap.data(), id: snap.id });
      if (user.status !== 'active') return null;
      setLocal(STORAGE_KEYS.CURRENT_USER, user);
      startRealtimeListeners(user);
      return user;
    } catch (e) {
      console.warn('[Firestore Auth] Could not fetch user profile:', e.message);
      return getLocal(STORAGE_KEYS.CURRENT_USER, null);
    }
  }

  async function fetchUsersForAdmin(forceServer = false) {
    const opts = forceServer ? { source: 'server' } : undefined;
    try {
      const [usersSnap, delSnap] = await Promise.all([
        opts ? db.collection('users').get(opts) : db.collection('users').get(),
        opts ? db.collection('deleted_users').get(opts) : db.collection('deleted_users').get()
      ]);
      const deletedIds = new Set(delSnap.docs.map(d => d.id));
      setLocal(STORAGE_KEYS.DELETED_USERS, Array.from(deletedIds));

      const users = usersSnap.docs
        .map(d => sanitizeUser({ ...d.data(), id: d.id }))
        .filter(u => u && !isTestUser(u) && !deletedIds.has(u.id));
      setLocal(STORAGE_KEYS.USERS, users);
      return users;
    } catch (e) {
      console.warn('[Firestore] Fallback to cached users:', e.message);
      return getLocal(STORAGE_KEYS.USERS, []);
    }
  }

  async function fetchAttemptsForUser(currentUser, forceServer = false) {
    if (!currentUser || !currentUser.id) return [];
    const opts = forceServer ? { source: 'server' } : undefined;
    const isAdmin = currentUser.role === 'admin';
    try {
      const q = isAdmin
        ? db.collection('attempts')
        : db.collection('attempts').where('studentId', '==', currentUser.id);
      const snap = opts ? await q.get(opts) : await q.get();
      const users = isAdmin ? getLocal(STORAGE_KEYS.USERS, [currentUser]) : [currentUser];
      const list = snap.docs
        .map(d => ({ ...d.data(), id: d.id }))
        .filter(a => !isTestAttempt(a))
        .map(a => normalizeAttempt(a, users))
        .filter(Boolean)
        .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
      setLocal(STORAGE_KEYS.ATTEMPTS, list);
      return list;
    } catch (e) {
      console.warn('[Firestore] Fallback to cached attempts:', e.message);
      const cached = getLocal(STORAGE_KEYS.ATTEMPTS, []);
      return isAdmin ? cached : cached.filter(a => a.studentId === currentUser.id);
    }
  }

  async function fetchQuizzesForUser(currentUser, forceServer = false) {
    const role = (currentUser && currentUser.role) || 'student';
    const isAdmin = role === 'admin';
    const opts = forceServer ? { source: 'server' } : undefined;
    try {
      const q = isAdmin
        ? db.collection('quizzes')
        : db.collection('quizzes').where('status', '==', 'published');
      const [quizSnap, delSnap] = await Promise.all([
        opts ? q.get(opts) : q.get(),
        opts ? db.collection('deleted_quizzes').get(opts) : db.collection('deleted_quizzes').get()
      ]);
      const deletedIds = delSnap.docs.map(d => d.id);
      setLocal(STORAGE_KEYS.DELETED_QUIZZES, deletedIds);
      const cloudQuizzes = quizSnap.docs.map(d => ({ ...d.data(), id: d.id }));
      const merged = computeMergedQuizzes(cloudQuizzes, deletedIds, role);
      setLocal(STORAGE_KEYS.QUIZZES, merged);
      return merged;
    } catch (e) {
      console.warn('[Firestore] Fallback to cached quizzes:', e.message);
      const deletedIds = getLocal(STORAGE_KEYS.DELETED_QUIZZES, []);
      const cached = getLocal(STORAGE_KEYS.QUIZZES, SEED_QUIZZES);
      return computeMergedQuizzes(cached, deletedIds, role);
    }
  }

  function calculateAdaptiveAnalyticsSync(student, studentAttempts) {
    const studentId = (student && student.id) || 'usr_anon';
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
      const postFailSmartQuizzes = studentAttempts.filter(a => {
        const t = new Date(a.submittedAt).getTime();
        return t > failedSimTime && a.quizId && a.quizId.startsWith('smart_quiz_');
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

  function buildValidatedAttemptDoc(id, currentUser, body, overrides = {}) {
    const totalVal = Math.min(500, Math.max(1, parseInt(overrides.totalQuestions !== undefined ? overrides.totalQuestions : extractAttemptTotal(body), 10) || 1));
    const rawScore = parseInt(overrides.score !== undefined ? overrides.score : extractAttemptScore(body), 10) || 0;
    const scoreVal = Math.min(totalVal, Math.max(0, rawScore));
    const pct = Math.min(100, Math.max(0, Number(overrides.percentage !== undefined ? overrides.percentage : extractAttemptPercentage(body, scoreVal, totalVal)) || 0));
    const passed = overrides.passed !== undefined ? !!overrides.passed : (body.passed !== undefined && body.passed !== null ? !!body.passed : (pct >= 70));
    const timeSecs = Math.min(86400, Math.max(0, parseInt(overrides.timeSpentSeconds !== undefined ? overrides.timeSpentSeconds : (body.timeSpentSeconds || 60), 10) || 60));

    return {
      id: String(id).slice(0, 128),
      studentId: currentUser.id,
      studentName: String((currentUser.fullName && currentUser.fullName !== 'Student') ? currentUser.fullName : (body.studentName || 'Student Reviewee')).slice(0, 200),
      studentEmail: String(currentUser.email || body.studentEmail || '').slice(0, 254),
      school: String(currentUser.school || body.school || 'NEUST').slice(0, 250),
      quizId: String(overrides.quizId || body.quizId || 'custom_quiz').slice(0, 128),
      quizTitle: String(overrides.quizTitle || body.quizTitle || 'Board Prep Quiz').slice(0, 300),
      totalQuestions: totalVal,
      score: scoreVal,
      correctAnswers: scoreVal,
      percentage: pct,
      scorePct: pct,
      passed,
      timeSpentSeconds: timeSecs,
      submittedAt: new Date().toISOString(),
      moduleBreakdown: overrides.moduleBreakdown || body.moduleBreakdown || {}
    };
  }

  // Force live sync trigger from UI Refresh Live Data button
  if (typeof window !== 'undefined') {
    window.addEventListener('me_force_live_sync', async () => {
      const currentUser = await getAuthenticatedProfile();
      if (!currentUser) return;
      await Promise.all([
        fetchQuizzesForUser(currentUser, true),
        fetchAttemptsForUser(currentUser, true),
        currentUser.role === 'admin' ? fetchUsersForAdmin(true) : Promise.resolve()
      ]);
      window.dispatchEvent(new CustomEvent('me_live_update', { detail: { type: 'FORCED_SERVER_SYNC' } }));
    });

    // Offline Service Worker Registration (moved from inline HTML for strict CSP compliance)
    if ('serviceWorker' in navigator) {
      const hadController = !!navigator.serviceWorker.controller;
      let updateNotified = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController || updateNotified) return;
        updateNotified = true;
        console.log('[Service Worker] New version installed — it will be used on the next visit.');
        if (window.showToast) window.showToast('A new version is ready and will apply on your next visit.', 'info');
      });

      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('[Service Worker] Active & Registered:', reg.scope))
          .catch(err => console.warn('[Service Worker] Registration error:', err));
      });
    }

    // Global Anti-Copy / Anti-Paste / Anti-Selection Protection
    const blockClipboardEvent = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.clipboardData && typeof e.clipboardData.setData === 'function') {
        try { e.clipboardData.setData('text/plain', ''); } catch (_) {}
      }
      return false;
    };

    ['copy', 'cut', 'paste', 'contextmenu', 'dragstart'].forEach((evtName) => {
      document.addEventListener(evtName, blockClipboardEvent, true);
      window.addEventListener(evtName, blockClipboardEvent, true);
    });

    document.addEventListener('selectstart', (e) => {
      const tag = e.target && e.target.tagName ? e.target.tagName.toUpperCase() : '';
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    document.addEventListener('keydown', (e) => {
      const key = (e.key || '').toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      if (
        (ctrlOrCmd && ['c', 'x', 'v', 'a', 's', 'u', 'p'].includes(key)) ||
        (e.ctrlKey && e.key === 'Insert') ||
        (e.shiftKey && (e.key === 'Insert' || e.key === 'Delete'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  }

  // --- INTERCEPT /api/* REQUESTS WITH FIREBASE AUTH & FIRESTORE ---
  window.fetch = async function(url, options = {}) {
    const urlStr = typeof url === 'string' ? url : (url.url || '');

    if (!urlStr.includes('/api/')) {
      return originalFetch(url, options);
    }

    const method = (options.method || 'GET').toUpperCase();
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

    // 0. LOGOUT
    if (urlStr.includes('/api/auth/logout') && method === 'POST') {
      stopRealtimeListeners();
      clearSessionCaches();
      if (auth) {
        try { await auth.signOut(); } catch (e) {}
      }
      return jsonResponse({ message: 'Signed out successfully' });
    }

    // 1. REGISTER (Firebase Authentication + Pending Student Profile)
    if (urlStr.includes('/api/auth/register') && method === 'POST') {
      const { fullName, email, password, school } = body;
      const cleanName = String(fullName || '').trim();
      const cleanEmail = String(email || '').toLowerCase().trim();
      if (!cleanName || !cleanEmail || !password) {
        return jsonResponse({ error: 'Full name, email, and password are required.' }, 400);
      }
      if (String(password).length < 6) {
        return jsonResponse({ error: 'Password must be at least 6 characters long.' }, 400);
      }

      try {
        stopRealtimeListeners();
        const cred = await auth.createUserWithEmailAndPassword(cleanEmail, password);
        try {
          await cred.user.updateProfile({ displayName: cleanName.slice(0, 200) });
        } catch (e) {}

        const newUser = {
          id: cred.user.uid,
          fullName: cleanName.slice(0, 200),
          email: cleanEmail,
          role: 'student',
          status: 'pending',
          createdDate: new Date().toISOString().split('T')[0],
          school: String(school || 'NEUST').trim().slice(0, 250) || 'NEUST',
          targetExamDate: '2026-10-15',
          diagnosticCompleted: false,
          simulationPassed: false
        };

        await db.collection('users').doc(cred.user.uid).set(newUser);
        await auth.signOut();
        clearSessionCaches();

        return jsonResponse({
          message: 'Registration submitted successfully! Your account is currently awaiting administrator approval. You will be able to log in once an administrator approves your registration.',
          pending: true,
          user: newUser
        });
      } catch (err) {
        return jsonResponse({ error: mapAuthError(err) }, 400);
      }
    }

    // 2. LOGIN (Firebase Authentication + Active Approval Enforcement)
    if (urlStr.includes('/api/auth/login') && method === 'POST') {
      const { email, password } = body;
      const cleanEmail = normalizeLoginEmail(email);
      if (!cleanEmail || !password) {
        return jsonResponse({ error: 'Email and password are required.' }, 400);
      }

      try {
        stopRealtimeListeners();
        const cred = await auth.signInWithEmailAndPassword(cleanEmail, password);
        const snap = await db.collection('users').doc(cred.user.uid).get();

        if (!snap.exists) {
          await auth.signOut();
          clearSessionCaches();
          return jsonResponse({ error: 'Account profile not found or has been removed by an administrator.' }, 403);
        }

        const user = sanitizeUser({ ...snap.data(), id: snap.id });

        if (user.role === 'student' && user.status === 'pending') {
          await auth.signOut();
          clearSessionCaches();
          return jsonResponse({
            error: 'Your account is currently awaiting administrator approval. Please wait for an administrator to verify and activate your registration before logging in.',
            pending: true
          }, 403);
        }

        if (user.status === 'deactivated' || user.status === 'rejected') {
          await auth.signOut();
          clearSessionCaches();
          return jsonResponse({
            error: 'This account has been deactivated or rejected by an administrator. Please contact your instructor or administrator for assistance.',
            deactivated: true
          }, 403);
        }

        setLocal(STORAGE_KEYS.CURRENT_USER, user);
        startRealtimeListeners(user);
        const idToken = await cred.user.getIdToken();

        return jsonResponse({ message: 'Login successful', token: idToken, user });
      } catch (err) {
        return jsonResponse({ error: mapAuthError(err) }, 401);
      }
    }

    // 3. CURRENT SESSION (GET /api/auth/me)
    if (urlStr.includes('/api/auth/me')) {
      const user = await getAuthenticatedProfile();
      if (!user) {
        clearSessionCaches();
        return jsonResponse({ error: 'Session expired or unauthorized' }, 401);
      }
      return jsonResponse({ user });
    }

    // All remaining endpoints require an active Firebase-authenticated user
    const currentUser = await getAuthenticatedProfile();
    if (!currentUser) {
      return jsonResponse({ error: 'Unauthorized. Please sign in to continue.' }, 401);
    }

    // 3.5 PROFILE UPDATE (PUT /api/auth/profile)
    if (urlStr.includes('/api/auth/profile') && method === 'PUT') {
      const { fullName, school, targetExamDate, newPassword } = body;

      if (newPassword) {
        if (String(newPassword).length < 6) {
          return jsonResponse({ error: 'New password must be at least 6 characters long.' }, 400);
        }
        try {
          await auth.currentUser.updatePassword(String(newPassword));
        } catch (err) {
          return jsonResponse({ error: mapAuthError(err) }, 400);
        }
      }

      const updates = { updatedAt: new Date().toISOString() };
      if (fullName && String(fullName).trim()) updates.fullName = String(fullName).trim().slice(0, 200);
      if (school !== undefined) updates.school = String(school || '').trim().slice(0, 250);
      if (targetExamDate) updates.targetExamDate = String(targetExamDate).trim().slice(0, 40);

      try {
        await db.collection('users').doc(currentUser.id).update(updates);
        const updatedUser = sanitizeUser({ ...currentUser, ...updates });
        setLocal(STORAGE_KEYS.CURRENT_USER, updatedUser);
        return jsonResponse({ message: 'Profile updated successfully', user: updatedUser });
      } catch (err) {
        return jsonResponse({ error: 'Failed to update profile: ' + err.message }, 500);
      }
    }

    // 4. ADMIN USER MANAGEMENT (/api/users)
    if (urlStr.includes('/api/users')) {
      if (currentUser.role !== 'admin') {
        return jsonResponse({ error: 'Access denied. Administrator privileges required.' }, 403);
      }

      const cleanUrl = urlStr.split('?')[0].replace(/\/+$/, '');
      const parts = cleanUrl.split('/api/users');
      const subPath = parts[1] ? parts[1].replace(/^\//, '') : '';
      const userId = subPath && subPath !== 'full' ? decodeURIComponent(subPath.split('/')[0]) : (body && body.id);

      if (method === 'GET') {
        const [users, attempts] = await Promise.all([
          fetchUsersForAdmin(),
          fetchAttemptsForUser(currentUser)
        ]);
        const enrichedUsers = users.map(u => {
          const uAttempts = attempts.filter(a => a && (a.studentId === u.id || (u.email && a.studentEmail && u.email.toLowerCase() === a.studentEmail.toLowerCase())));
          const lastAtt = uAttempts[0];
          const analytics = calculateAdaptiveAnalyticsSync(u, uAttempts);
          const passedCount = uAttempts.filter(a => a.passed).length;
          const failedCount = uAttempts.length - passedCount;
          const avgScore = uAttempts.length > 0
            ? Math.round(uAttempts.reduce((acc, a) => acc + (a.percentage !== undefined ? a.percentage : (a.scorePct || a.score || 0)), 0) / uAttempts.length)
            : 0;

          return {
            ...u,
            attempts: uAttempts,
            stats: {
              totalAttempts: uAttempts.length,
              passedCount,
              failedCount,
              avgScore
            },
            readinessIndex: analytics.readinessIndex,
            totalQuizzesTaken: uAttempts.length,
            lastActive: lastAtt ? lastAtt.submittedAt : u.createdDate || 'Never'
          };
        });
        return jsonResponse({ users: enrichedUsers });
      }

      if (method === 'POST') {
        const { fullName, email, password, school, targetExamDate } = body;
        const cleanName = String(fullName || '').trim();
        const cleanEmail = String(email || '').toLowerCase().trim();
        if (!cleanName || !cleanEmail || !password) {
          return jsonResponse({ error: 'Full name, email, and password are required.' }, 400);
        }
        if (String(password).length < 6) {
          return jsonResponse({ error: 'Password must be at least 6 characters long.' }, 400);
        }

        try {
          const secAuth = getSecondaryAuth();
          const cred = await secAuth.createUserWithEmailAndPassword(cleanEmail, String(password));
          try { await cred.user.updateProfile({ displayName: cleanName.slice(0, 200) }); } catch (e) {}
          const newUid = cred.user.uid;
          await secAuth.signOut();

          const newUser = {
            id: newUid,
            fullName: cleanName.slice(0, 200),
            email: cleanEmail,
            role: 'student',
            status: 'active',
            school: String(school || 'NEUST').trim().slice(0, 250) || 'NEUST',
            createdDate: new Date().toISOString().split('T')[0],
            targetExamDate: String(targetExamDate || '2026-10-15').slice(0, 40),
            diagnosticCompleted: false,
            simulationPassed: false
          };

          await db.collection('users').doc(newUid).set(newUser);
          return jsonResponse({ message: 'User account created successfully', user: newUser });
        } catch (err) {
          return jsonResponse({ error: mapAuthError(err) }, 400);
        }
      }

      if (method === 'PUT') {
        const id = userId;
        if (!id) return jsonResponse({ error: 'User ID is required' }, 400);

        const users = await fetchUsersForAdmin();
        const target = users.find(u => u.id === id);
        if (!target) return jsonResponse({ error: 'User not found' }, 404);

        if (body.role === 'admin' && target.role !== 'admin') {
          const adminCount = users.filter(u => u.role === 'admin').length;
          if (adminCount >= 4) {
            return jsonResponse({ error: 'Maximum limit of 4 administrators reached. Only 4 admin accounts are allowed on this platform.' }, 400);
          }
        }

        const updates = { updatedAt: new Date().toISOString() };
        if (body.fullName && String(body.fullName).trim()) updates.fullName = String(body.fullName).trim().slice(0, 200);
        if (body.role && ['student', 'admin'].includes(body.role)) updates.role = body.role;
        if (body.status && ['pending', 'active', 'deactivated', 'rejected'].includes(body.status)) updates.status = body.status;
        if (body.school !== undefined) updates.school = String(body.school || '').trim().slice(0, 250);
        if (body.targetExamDate) updates.targetExamDate = String(body.targetExamDate).trim().slice(0, 40);

        try {
          await db.collection('users').doc(id).update(updates);
          const updatedUser = sanitizeUser({ ...target, ...updates });
          return jsonResponse({ message: 'User updated successfully', user: updatedUser });
        } catch (err) {
          return jsonResponse({ error: 'Failed to update user: ' + err.message }, 500);
        }
      }

      if (method === 'DELETE') {
        const id = userId;
        if (!id) return jsonResponse({ error: 'User ID is required' }, 400);
        if (currentUser.id === id) {
          return jsonResponse({ error: 'You cannot delete your own active administrator account.' }, 400);
        }
        const users = await fetchUsersForAdmin();
        const targetUser = users.find(u => u.id === id);
        if (targetUser && targetUser.role === 'admin') {
          return jsonResponse({ error: 'System Protection: Administrator accounts cannot be deleted directly to maintain platform stability.' }, 400);
        }

        try {
          await db.collection('deleted_users').doc(id).set({
            id: String(id).slice(0, 128),
            deletedAt: new Date().toISOString(),
            deletedBy: String(currentUser.email || currentUser.fullName || 'admin').slice(0, 254)
          });
          await db.collection('users').doc(id).delete();
          return jsonResponse({ message: 'User account permanently deleted successfully' });
        } catch (err) {
          return jsonResponse({ error: 'Failed to delete user: ' + err.message }, 500);
        }
      }
    }

    // 5. ATTEMPTS LIST (GET /api/attempts)
    if (urlStr.includes('/api/attempts') && method === 'GET') {
      const attempts = await fetchAttemptsForUser(currentUser);
      return jsonResponse({ attempts });
    }

    // 6. RECORD ATTEMPT (POST /api/attempts)
    if (urlStr.includes('/api/attempts') && method === 'POST') {
      const attemptId = `att_${Date.now()}`;
      const newAttempt = buildValidatedAttemptDoc(attemptId, currentUser, body);

      try {
        await db.collection('attempts').doc(attemptId).set(newAttempt);
        const localAttempts = getLocal(STORAGE_KEYS.ATTEMPTS, []);
        localAttempts.unshift(newAttempt);
        setLocal(STORAGE_KEYS.ATTEMPTS, localAttempts);
        return jsonResponse({ message: 'Quiz attempt recorded in Cloud Database', attempt: newAttempt });
      } catch (err) {
        return jsonResponse({ error: 'Failed to save attempt: ' + err.message }, 500);
      }
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
      const { userAnswers = {}, timeSpentSeconds, questionDetails } = body;
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
      const attemptId = `att_diag_${Date.now()}`;

      const attempt = buildValidatedAttemptDoc(attemptId, currentUser, body, {
        quizId: 'diagnostic_assessment',
        quizTitle: 'Comprehensive Licensure Diagnostic Exam',
        totalQuestions: total,
        score: correct,
        percentage: scorePct,
        passed,
        timeSpentSeconds,
        moduleBreakdown
      });

      try {
        await db.collection('attempts').doc(attemptId).set(attempt);
        await db.collection('users').doc(currentUser.id).update({
          diagnosticCompleted: true,
          diagnosticScore: correct,
          diagnosticDate: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString()
        });
        setLocal(STORAGE_KEYS.CURRENT_USER, { ...currentUser, diagnosticCompleted: true, diagnosticScore: correct });
        return jsonResponse({ message: 'Diagnostic Exam recorded in Cloud Database', attempt });
      } catch (err) {
        return jsonResponse({ error: 'Failed to record diagnostic exam: ' + err.message }, 500);
      }
    }

    // 9. ADAPTIVE ANALYTICS
    if (urlStr.includes('/api/adaptive/analytics')) {
      const myAttempts = (await fetchAttemptsForUser(currentUser)).filter(a => a.studentId === currentUser.id);
      const analytics = calculateAdaptiveAnalyticsSync(currentUser, myAttempts);
      return jsonResponse(analytics);
    }

    // 10. SMART QUIZ FETCH
    if (urlStr.includes('/api/adaptive/smart-quiz') && method === 'GET') {
      const myAttempts = (await fetchAttemptsForUser(currentUser)).filter(a => a.studentId === currentUser.id);
      const analytics = calculateAdaptiveAnalyticsSync(currentUser, myAttempts);

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
      const { userAnswers = {}, timeSpentSeconds, questionDetails, targetModule } = body;
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
      const attemptId = `att_smart_${Date.now()}`;

      const attempt = buildValidatedAttemptDoc(attemptId, currentUser, body, {
        quizId: `smart_quiz_${Date.now()}`,
        quizTitle: `Targeted Smart Quiz - ${targetModule || 'Remediation'}`,
        totalQuestions: total,
        score: correct,
        percentage: scorePct,
        passed,
        timeSpentSeconds,
        moduleBreakdown
      });

      try {
        await db.collection('attempts').doc(attemptId).set(attempt);
        const myAttempts = [attempt, ...(await fetchAttemptsForUser(currentUser)).filter(a => a.studentId === currentUser.id && a.id !== attemptId)];
        const analytics = calculateAdaptiveAnalyticsSync(currentUser, myAttempts);
        return jsonResponse({ message: 'Smart-Quiz saved to Cloud Database and Readiness Recalculated.', attempt, analytics });
      } catch (err) {
        return jsonResponse({ error: 'Failed to save Smart-Quiz: ' + err.message }, 500);
      }
    }

    // 12. SIMULATION START
    if (urlStr.includes('/api/adaptive/simulation/start') && method === 'POST') {
      const myAttempts = (await fetchAttemptsForUser(currentUser)).filter(a => a.studentId === currentUser.id);
      const analytics = calculateAdaptiveAnalyticsSync(currentUser, myAttempts);

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
      const { userAnswers = {}, timeSpentSeconds, questionDetails } = body;
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
      const attemptId = `att_sim_${Date.now()}`;

      const attempt = buildValidatedAttemptDoc(attemptId, currentUser, body, {
        quizId: 'board_exam_simulation',
        quizTitle: 'Full Licensure Exam Simulation',
        totalQuestions: total,
        score: correct,
        percentage: scorePct,
        passed,
        timeSpentSeconds,
        moduleBreakdown
      });

      try {
        await db.collection('attempts').doc(attemptId).set(attempt);
        await db.collection('users').doc(currentUser.id).update({
          simulationPassed: passed,
          simulationScore: scorePct,
          updatedAt: new Date().toISOString()
        });
        setLocal(STORAGE_KEYS.CURRENT_USER, { ...currentUser, simulationPassed: passed });
        const msg = passed
          ? 'Congratulations! You have passed the Licensure Exam Simulation!'
          : 'Simulation score recorded. Continuous Feedback Loop engaged for Unlimited Remediation.';
        return jsonResponse({ message: msg, attempt });
      } catch (err) {
        return jsonResponse({ error: 'Failed to save simulation exam: ' + err.message }, 500);
      }
    }

    // 14. STATS (GET /api/questions/stats)
    if (urlStr.includes('/api/questions/stats')) {
      const deletedQIds = new Set(getLocal(STORAGE_KEYS.DELETED_QUESTIONS, []));
      const questions = (window.INITIAL_QUESTIONS || []).filter(q => q && q.ID !== 'Total' && !deletedQIds.has(String(q.ID)) && q.QuestionText && q.QuestionText.trim() !== '');
      const [quizzes, attempts] = await Promise.all([
        fetchQuizzesForUser(currentUser),
        fetchAttemptsForUser(currentUser)
      ]);
      const modules = [...new Set(questions.map(q => q.Module).filter(Boolean))];
      const batches = new Set(questions.map(q => q.BatchNumber).filter(Boolean));
      const publishedCount = quizzes.filter(q => q && q.status === 'published').length;

      return jsonResponse({
        totalQuestions: questions.length,
        reviewedQuestions: questions.length,
        totalBatchesCompleted: batches.size || 63,
        totalModules: modules.length,
        totalQuizzes: quizzes.length,
        publishedQuizzesCount: publishedCount,
        totalAttempts: attempts.length,
        totalAttemptsCount: attempts.length,
        modules
      });
    }

    // 15. QUESTIONS (GET, POST, PUT, DELETE /api/questions)
    if (urlStr.includes('/api/questions')) {
      const deletedQIds = new Set(getLocal(STORAGE_KEYS.DELETED_QUESTIONS, []));

      if (method === 'GET') {
        const allQuestions = (window.INITIAL_QUESTIONS || []).filter(
          q => q && q.ID !== 'Total' && !deletedQIds.has(String(q.ID)) && q.QuestionText && q.QuestionText.trim() !== ''
        );

        const params = {};
        const qIndex = urlStr.indexOf('?');
        if (qIndex !== -1) {
          const queryStr = urlStr.slice(qIndex + 1);
          const pairs = queryStr.split('&');
          for (const p of pairs) {
            if (!p) continue;
            const eqIdx = p.indexOf('=');
            const k = eqIdx !== -1 ? p.slice(0, eqIdx) : p;
            const v = eqIdx !== -1 ? p.slice(eqIdx + 1) : '';
            try {
              params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
            } catch (e) {
              params[k] = v;
            }
          }
        }

        let filtered = [...allQuestions];

        if (params.ids) {
          const idList = params.ids.split(',').map(i => String(i).trim());
          const matched = filtered.filter(q => idList.includes(String(q.ID)));
          return jsonResponse({
            total: matched.length,
            page: 1,
            pageSize: matched.length,
            totalPages: 1,
            questions: matched
          });
        }

        if (params.module) {
          const targetModules = params.module.split(',').map(m => m.toLowerCase().trim()).filter(Boolean);
          if (targetModules.length > 0) {
            filtered = filtered.filter(q => {
              if (!q.Module) return false;
              const qMod = q.Module.toLowerCase();
              return targetModules.some(tm => qMod.includes(tm) || tm.includes(qMod));
            });
          }
        }

        if (params.status) {
          if (params.status === 'reviewed') {
            filtered = filtered.filter(q => q.AIReviewStatus && q.AIReviewStatus !== '');
          } else if (params.status === 'pending') {
            filtered = filtered.filter(q => !q.AIReviewStatus || q.AIReviewStatus === '');
          } else {
            filtered = filtered.filter(q => q.AIReviewStatus === params.status);
          }
        }

        if (params.batch) {
          filtered = filtered.filter(q => String(q.BatchNumber) === String(params.batch));
        }

        if (params.search) {
          const s = params.search.toLowerCase().trim();
          filtered = filtered.filter(q =>
            (q.QuestionText && q.QuestionText.toLowerCase().includes(s)) ||
            (q.ID && String(q.ID).includes(s)) ||
            (q.Topic && q.Topic.toLowerCase().includes(s)) ||
            (q.Subtopic && q.Subtopic.toLowerCase().includes(s)) ||
            (q.Module && q.Module.toLowerCase().includes(s)) ||
            (q.Explanation && q.Explanation.toLowerCase().includes(s)) ||
            (q.CompleteSolution && q.CompleteSolution.toLowerCase().includes(s)) ||
            (q.References && q.References.toLowerCase().includes(s))
          );
        }

        if (params.random === 'true') {
          filtered = [...filtered].sort(() => 0.5 - Math.random());
        }

        const total = filtered.length;
        if (params.limit) {
          const pageSize = Math.max(1, parseInt(params.limit, 10) || 50);
          const pageNum = Math.max(1, parseInt(params.page, 10) || 1);
          const startIdx = (pageNum - 1) * pageSize;
          const paginated = filtered.slice(startIdx, startIdx + pageSize);
          return jsonResponse({
            total,
            page: pageNum,
            pageSize,
            totalPages: Math.ceil(total / pageSize) || 1,
            questions: paginated
          });
        }

        return jsonResponse({
          total,
          page: 1,
          pageSize: total,
          totalPages: 1,
          questions: filtered
        });
      }

      // Admin Question Mutations
      if (currentUser.role !== 'admin') {
        return jsonResponse({ error: 'Access denied. Administrator privileges required.' }, 403);
      }

      const cleanUrl = urlStr.split('?')[0].replace(/\/+$/, '');
      const qParts = cleanUrl.split('/api/questions');
      const qSub = qParts[1] ? qParts[1].replace(/^\//, '') : '';
      const qId = qSub ? decodeURIComponent(qSub.split('/')[0]) : (body && body.ID);

      if (method === 'POST') {
        if (!body.QuestionText || !body.OptionA || !body.OptionB || !body.CorrectAnswer) {
          return jsonResponse({ error: 'Question text, Option A, Option B, and Correct Answer are required.' }, 400);
        }
        const list = window.INITIAL_QUESTIONS || [];
        const maxId = list.reduce((max, item) => Math.max(max, parseInt(item && item.ID, 10) || 0), 0);
        const newId = String(maxId + 1);
        const createdQ = {
          ID: newId,
          Type: String(body.Type || 'Multiple Choice'),
          Module: String(body.Module || CORE_MODULES[0]),
          Topic: String(body.Topic || 'Power Plant Elements'),
          Difficulty: String(body.Difficulty || 'Medium'),
          DifficultyValue: String(body.DifficultyValue || '3'),
          QuestionText: String(body.QuestionText).slice(0, 10000),
          OptionA: String(body.OptionA),
          OptionB: String(body.OptionB),
          OptionC: String(body.OptionC || ''),
          OptionD: String(body.OptionD || ''),
          CorrectAnswer: String(body.CorrectAnswer).slice(0, 50),
          Explanation: String(body.Explanation || ''),
          CompleteSolution: String(body.CompleteSolution || body.Explanation || ''),
          References: String(body.References || ''),
          AIReviewStatus: 'Verified-No Change',
          AIReviewedDate: new Date().toISOString().split('T')[0],
          BatchNumber: String(body.BatchNumber || 'Manual')
        };
        await db.collection('questions').doc(newId).set(createdQ);
        if (Array.isArray(window.INITIAL_QUESTIONS)) {
          window.INITIAL_QUESTIONS.unshift(createdQ);
        }
        return jsonResponse({ message: 'Question created successfully', question: createdQ });
      }

      if (method === 'PUT' && qId) {
        const list = window.INITIAL_QUESTIONS || [];
        const idx = list.findIndex(item => item && String(item.ID) === String(qId));
        const existing = idx !== -1 ? list[idx] : { ID: String(qId) };
        const updatedQ = {
          ...existing,
          ...body,
          ID: String(qId),
          QuestionText: String(body.QuestionText || existing.QuestionText || '').slice(0, 10000),
          CorrectAnswer: String(body.CorrectAnswer || existing.CorrectAnswer || 'A').slice(0, 50)
        };
        await db.collection('questions').doc(String(qId)).set(updatedQ);
        if (idx !== -1) window.INITIAL_QUESTIONS[idx] = updatedQ;
        return jsonResponse({ message: 'Question updated successfully', question: updatedQ });
      }

      if (method === 'DELETE' && qId) {
        await db.collection('deleted_questions').doc(String(qId)).set({
          id: String(qId).slice(0, 64),
          deletedAt: new Date().toISOString(),
          deletedBy: String(currentUser.email || 'admin').slice(0, 254)
        });
        try { await db.collection('questions').doc(String(qId)).delete(); } catch (e) {}
        deletedQIds.add(String(qId));
        setLocal(STORAGE_KEYS.DELETED_QUESTIONS, Array.from(deletedQIds));
        return jsonResponse({ message: 'Question deleted successfully' });
      }
    }

    // 16. QUIZZES SECTION (/api/quizzes)
    if (urlStr.includes('/api/quizzes')) {
      const cleanUrl = urlStr.split('?')[0].replace(/\/+$/, '');
      const parts = cleanUrl.split('/api/quizzes');
      const subPath = parts[1] ? parts[1].replace(/^\//, '') : '';
      const quizId = subPath ? decodeURIComponent(subPath.split('/')[0]) : (body && body.id);

      if (method === 'GET') {
        const [quizzes, attempts] = await Promise.all([
          fetchQuizzesForUser(currentUser),
          fetchAttemptsForUser(currentUser)
        ]);
        const myAttempts = attempts.filter(a => a && a.studentId === currentUser.id);

        const enriched = quizzes.map(q => {
          const quizAtts = attempts.filter(a => a.quizId === q.id);
          const total = quizAtts.length;
          const avg = total > 0 ? Math.round(quizAtts.reduce((acc, a) => acc + (a.scorePct || a.percentage || 0), 0) / total) : 0;
          return { ...q, totalAttempts: total, avgScorePct: avg };
        });
        return jsonResponse({ quizzes: enriched, myAttempts });
      }

      if (currentUser.role !== 'admin') {
        return jsonResponse({ error: 'Access denied. Administrator privileges required.' }, 403);
      }

      if (method === 'POST') {
        const { title, description, module: modVal, questionCount, durationMins, passingScorePct, status, selectionMode, specificQuestionIds } = body;
        if (!title || !String(title).trim()) {
          return jsonResponse({ error: 'Quiz title is required.' }, 400);
        }
        const safeIds = Array.isArray(specificQuestionIds) ? specificQuestionIds.slice(0, 500).map(String) : [];
        const newId = `qz_${Date.now()}`;
        const newQuiz = {
          id: newId,
          title: String(title).trim().slice(0, 300),
          description: String(description || '').trim().slice(0, 2000),
          module: String(modVal || '').slice(0, 500),
          questionCount: Math.min(500, Math.max(1, safeIds.length > 0 ? safeIds.length : (parseInt(questionCount, 10) || 50))),
          durationMins: Math.min(600, Math.max(1, parseInt(durationMins, 10) || 50)),
          passingScorePct: Math.min(100, Math.max(1, parseInt(passingScorePct, 10) || 70)),
          status: status === 'draft' ? 'draft' : 'published',
          selectionMode: selectionMode === 'manual' ? 'manual' : 'random',
          specificQuestionIds: safeIds,
          createdBy: String(currentUser.fullName || 'Administrator').slice(0, 200),
          createdDate: new Date().toISOString().split('T')[0]
        };

        try {
          await db.collection('quizzes').doc(newId).set(newQuiz);
          try { await db.collection('deleted_quizzes').doc(newId).delete(); } catch (e) {}
          return jsonResponse({ message: 'Quiz created and published live across all devices.', quiz: newQuiz });
        } catch (err) {
          return jsonResponse({ error: 'Failed to create quiz: ' + err.message }, 500);
        }
      }

      if (method === 'PUT') {
        const id = quizId;
        if (!id) return jsonResponse({ error: 'Quiz ID is required' }, 400);

        const quizzes = await fetchQuizzesForUser(currentUser);
        const existing = quizzes.find(q => q.id === id);
        if (!existing) return jsonResponse({ error: 'Quiz not found' }, 404);

        const safeIds = body.specificQuestionIds !== undefined
          ? (Array.isArray(body.specificQuestionIds) ? body.specificQuestionIds.slice(0, 500).map(String) : [])
          : (existing.specificQuestionIds || []);

        const updatedQuiz = {
          id: String(id).slice(0, 128),
          title: String(body.title !== undefined ? body.title : existing.title).trim().slice(0, 300),
          description: String(body.description !== undefined ? body.description : (existing.description || '')).trim().slice(0, 2000),
          module: String(body.module !== undefined ? body.module : (existing.module || '')).slice(0, 500),
          questionCount: Math.min(500, Math.max(1, parseInt(body.questionCount !== undefined ? body.questionCount : existing.questionCount, 10) || 50)),
          durationMins: Math.min(600, Math.max(1, parseInt(body.durationMins !== undefined ? body.durationMins : existing.durationMins, 10) || 50)),
          passingScorePct: Math.min(100, Math.max(1, parseInt(body.passingScorePct !== undefined ? body.passingScorePct : existing.passingScorePct, 10) || 70)),
          status: (body.status || existing.status) === 'draft' ? 'draft' : 'published',
          selectionMode: (body.selectionMode || existing.selectionMode) === 'manual' ? 'manual' : 'random',
          specificQuestionIds: safeIds,
          createdBy: String(existing.createdBy || currentUser.fullName || 'Administrator').slice(0, 200),
          createdDate: String(existing.createdDate || new Date().toISOString().split('T')[0]).slice(0, 40),
          updatedAt: new Date().toISOString()
        };

        try {
          await db.collection('quizzes').doc(id).set(updatedQuiz);
          return jsonResponse({ message: 'Quiz updated live across all devices.', quiz: updatedQuiz });
        } catch (err) {
          return jsonResponse({ error: 'Failed to update quiz: ' + err.message }, 500);
        }
      }

      if (method === 'DELETE') {
        const id = quizId;
        if (!id) return jsonResponse({ error: 'Quiz ID required for deletion' }, 400);

        try {
          await db.collection('deleted_quizzes').doc(id).set({
            id: String(id).slice(0, 128),
            deletedAt: new Date().toISOString(),
            deletedBy: String(currentUser.email || currentUser.fullName || 'admin').slice(0, 254)
          });
          try { await db.collection('quizzes').doc(id).delete(); } catch (e) {}
          return jsonResponse({ message: 'Quiz permanently deleted across all devices and accounts.', quizId: id });
        } catch (err) {
          return jsonResponse({ error: 'Failed to delete quiz: ' + err.message }, 500);
        }
      }
    }

    return jsonResponse({ message: 'OK' });
  };
})();
