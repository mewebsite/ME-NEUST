/**
 * ME BoardPrep - Real-Time Cloud Firestore Engine
 * Synchronizes User Logins, Profiles, Quiz Attempts & Scores directly with Google Cloud Firestore
 * Project ID: me-neust-website-v2
 */

(function() {
  const originalFetch = (typeof window !== 'undefined' && window.fetch) ? window.fetch.bind(window) : fetch;
  const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/me-neust-website-v2/databases/(default)/documents';

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
      return null;
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

  async function cloudDeleteDoc(collectionName, docId) {
    try {
      const res = await originalFetch(`${FIRESTORE_BASE}/${collectionName}/${docId}`, {
        method: 'DELETE'
      });
      console.log(`[Firestore Cloud] Deleted ${collectionName}/${docId} -> status ${res.status}`);
      return res.ok;
    } catch (e) {
      console.error(`[Firestore Cloud] Error deleting ${collectionName}/${docId}:`, e);
      return false;
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

  // --- SEED USERS (Always available baseline including all administrators) ---
  const SEED_USERS = [
    {
      id: "usr_admin_01",
      fullName: "Dean / Lead Admin",
      email: "admin@me-prep.edu.ph",
      password: "admin123",
      role: "admin",
      status: "active",
      createdDate: "2026-08-01",
      school: "NEUST College of Engineering"
    },
    {
      id: "usr_1785127116553",
      fullName: "John Lorenz Castro",
      email: "castrojohnlorenz015@gmail.com",
      password: "admin123",
      role: "admin",
      status: "active",
      createdDate: "2026-08-01",
      school: "NEUST College of Engineering",
      diagnosticCompleted: true,
      diagnosticScore: 14,
      diagnosticDate: "2026-08-11"
    },
    {
      id: "usr_admin_03",
      fullName: "Faculty Admin 2",
      email: "admin2@me-prep.edu.ph",
      password: "admin123",
      role: "admin",
      status: "active",
      createdDate: "2026-08-01",
      school: "NEUST College of Engineering"
    },
    {
      id: "usr_admin_04",
      fullName: "Review Coordinator Admin 3",
      email: "admin3@me-prep.edu.ph",
      password: "admin123",
      role: "admin",
      status: "active",
      createdDate: "2026-08-01",
      school: "NEUST College of Engineering"
    }
  ];

  function isTestUser(u) {
    if (!u) return true;
    const email = (u.email || '').toLowerCase();
    const name = (u.fullName || '').toLowerCase();
    const id = u.id || '';

    // Filter old duplicate admin seed IDs from previous versions
    if (id === 'usr_admin_1' || id === 'usr_admin_3' || id === 'usr_admin_4') return true;
    if (email === 'admin1@boardprep.edu.ph' || email === 'admin3@boardprep.edu.ph' || email === 'admin4@boardprep.edu.ph') return true;

    return (
      email.includes('teststudent') ||
      email.includes('test_') ||
      email === 'dsds@gmail.com' ||
      email === 'lorenz@gmail.com' ||
      name.includes('test student') ||
      name === 'maria santos' ||
      name === 'renz' ||
      name.includes('jerico') ||
      email.includes('jerico') ||
      name.includes('kenneth') ||
      email.includes('matutino') ||
      name.includes('fran') ||
      email.includes('frans') ||
      email.includes('talapstore001') ||
      (name === 'lorenz' && email !== 'castrojohnlorenz015@gmail.com') ||
      id === 'usr_1787791492377' ||
      id === 'usr_1785723259255' ||
      id === 'usr_1786429568399' ||
      id === 'usr_1786435508595' ||
      id === 'usr_1791158752028' ||
      id === 'usr_1791158752041' ||
      id === 'usr_1791158752460' ||
      id === 'usr_1791158752849' ||
      id === 'usr_1786434961655' ||
      id === 'usr_1790821984469' ||
      id === 'usr_1790854935333'
    );
  }

  function isTestAttempt(a) {
    if (!a) return true;
    const email = (a.studentEmail || '').toLowerCase();
    const name = (a.studentName || '').toLowerCase();
    const sid = a.studentId || '';
    return (
      email.includes('teststudent') ||
      email.includes('test_') ||
      email === 'dsds@gmail.com' ||
      email === 'lorenz@gmail.com' ||
      name.includes('test student') ||
      name === 'maria santos' ||
      name === 'renz' ||
      name.includes('jerico') ||
      email.includes('jerico') ||
      name.includes('kenneth') ||
      email.includes('matutino') ||
      name.includes('fran') ||
      email.includes('frans') ||
      email.includes('talapstore001') ||
      (name === 'lorenz' && email !== 'castrojohnlorenz015@gmail.com') ||
      sid === 'usr_1787791492377' ||
      sid === 'usr_1785723259255' ||
      sid === 'usr_1786429568399' ||
      sid === 'usr_1786435508595' ||
      sid === 'usr_1791158752028' ||
      sid === 'usr_1791158752041' ||
      sid === 'usr_1791158752460' ||
      sid === 'usr_1791158752849' ||
      sid === 'usr_1786434961655' ||
      sid === 'usr_1790821984469' ||
      sid === 'usr_1790854935333'
    );
  }

  function mergeUsers(existing, incoming) {
    const map = new Map();
    (existing || []).forEach(u => {
      if (u && !isTestUser(u)) {
        const k = (u.id || u.email || '').toLowerCase();
        if (k) map.set(k, u);
      }
    });
    (incoming || []).forEach(u => {
      if (u && !isTestUser(u)) {
        const k = (u.id || u.email || '').toLowerCase();
        if (k) {
          if (map.has(k)) {
            map.set(k, { ...map.get(k), ...u });
          } else {
            map.set(k, u);
          }
        }
      }
    });
    return Array.from(map.values());
  }

  // --- REAL-TIME WEBSOCKET SYNCHRONIZATION ENGINE ---
  const SYNC_TOPIC_EVENTS = 'neust/me-boardprep/v2/events';
  const SYNC_TOPIC_STATE = 'neust/me-boardprep/v2/state';
  const SYNC_TOPIC_SNAPSHOT = 'neust/me-boardprep/v2/snapshot';
  const LIVE_CLIENT_ID = 'me_client_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

  let pahoClient = null;
  let isMqttConnected = false;
  let snapshotDebounceTimer = null;

  function initLiveSyncEngine() {
    if (typeof Paho === 'undefined' || !Paho.MQTT || !Paho.MQTT.Client) {
      setTimeout(initLiveSyncEngine, 500);
      return;
    }
    if (pahoClient && isMqttConnected) return;

    try {
      pahoClient = new Paho.MQTT.Client('broker.emqx.io', 8084, '/mqtt', LIVE_CLIENT_ID);

      pahoClient.onConnectionLost = function(resp) {
        isMqttConnected = false;
        console.warn('[Live Sync] Disconnected:', resp.errorMessage, 'Reconnecting in 4s...');
        setTimeout(initLiveSyncEngine, 4000);
      };

      pahoClient.onMessageArrived = function(message) {
        try {
          const payload = JSON.parse(message.payloadString);
          if (payload.sender === LIVE_CLIENT_ID) return; // Ignore own echo
          handleIncomingLiveEvent(payload);
        } catch (e) {
          console.error('[Live Sync] Failed to parse message:', e);
        }
      };

      pahoClient.connect({
        useSSL: true,
        timeout: 10,
        keepAliveInterval: 30,
        cleanSession: true,
        onSuccess: function() {
          isMqttConnected = true;
          console.log('[Live Sync] Connected to global real-time synchronization broker!');
          pahoClient.subscribe(SYNC_TOPIC_EVENTS, { qos: 1 });
          pahoClient.subscribe(SYNC_TOPIC_STATE, { qos: 1 });
          // Subscribe to 24/7 Cloud Retained Snapshot (Broker immediately delivers latest data even if host computer was offline)
          pahoClient.subscribe(SYNC_TOPIC_SNAPSHOT, { qos: 1 });

          // Request state from active peers so newly opened browsers get all users and activities immediately
          broadcastLiveEvent('REQUEST_STATE', { requester: LIVE_CLIENT_ID });
        },
        onFailure: function(err) {
          isMqttConnected = false;
          console.warn('[Live Sync] Connect failure:', err.errorMessage, 'Retrying in 5s...');
          setTimeout(initLiveSyncEngine, 5000);
        }
      });
    } catch (e) {
      console.error('[Live Sync] Init error:', e);
    }
  }

  function publishRetainedSnapshot() {
    if (!pahoClient || !isMqttConnected) return;
    try {
      const localUsers = getLocal(STORAGE_KEYS.USERS, []);
      const localAttempts = getLocal(STORAGE_KEYS.ATTEMPTS, []);
      const localQuizzes = getLocal(STORAGE_KEYS.QUIZZES, []);
      const localDeleted = getLocal('me_deleted_quiz_ids', []);

      const payload = JSON.stringify({
        type: 'SNAPSHOT',
        data: {
          users: localUsers,
          attempts: localAttempts.slice(0, 100),
          quizzes: localQuizzes,
          deletedQuizIds: localDeleted
        },
        sender: LIVE_CLIENT_ID,
        timestamp: Date.now()
      });

      const message = new Paho.MQTT.Message(payload);
      message.destinationName = SYNC_TOPIC_SNAPSHOT;
      message.qos = 1;
      message.retained = true; // Retain on broker 24/7 so offline admin/host computer catches up automatically
      pahoClient.send(message);
      console.log('[Live Sync] Published 24/7 Cloud Retained Snapshot to broker!');
    } catch (e) {
      console.error('[Live Sync] Error publishing retained snapshot:', e);
    }
  }

  function triggerSnapshotPublish() {
    clearTimeout(snapshotDebounceTimer);
    snapshotDebounceTimer = setTimeout(() => {
      publishRetainedSnapshot();
    }, 1200);
  }

  function broadcastLiveEvent(type, data) {
    if (!pahoClient || !isMqttConnected) {
      setTimeout(() => broadcastLiveEvent(type, data), 1500);
      return;
    }
    try {
      const payload = JSON.stringify({
        type,
        data,
        sender: LIVE_CLIENT_ID,
        timestamp: Date.now()
      });
      const message = new Paho.MQTT.Message(payload);
      message.destinationName = SYNC_TOPIC_EVENTS;
      message.qos = 1;
      pahoClient.send(message);
      console.log(`[Live Sync] Broadcasted event: ${type}`);

      // Schedule updated 24/7 cloud retained snapshot
      if (type !== 'REQUEST_STATE' && type !== 'STATE_RESPONSE' && type !== 'SNAPSHOT') {
        triggerSnapshotPublish();
      }
    } catch (e) {
      console.error(`[Live Sync] Error broadcasting ${type}:`, e);
    }
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

    // Resolve student name/email/school if missing
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

  function handleIncomingLiveEvent(event) {
    const { type, data } = event;
    console.log(`[Live Sync] Incoming event: ${type}`, data);

    if (type === 'USER_REGISTERED' || type === 'NEW_USER' || type === 'UPDATE_USER') {
      const incomingUser = data;
      if (incomingUser && (incomingUser.id || incomingUser.email)) {
        let currentUsers = getLocal(STORAGE_KEYS.USERS, []);
        currentUsers = mergeUsers(currentUsers, [incomingUser]);
        setLocal(STORAGE_KEYS.USERS, currentUsers);
        window.dispatchEvent(new CustomEvent('me_live_update', { detail: { type: 'USER_UPDATE', user: incomingUser } }));
      }
    }

    if (type === 'DELETE_USER') {
      const { id } = data || {};
      if (id) {
        let currentUsers = getLocal(STORAGE_KEYS.USERS, []);
        currentUsers = currentUsers.filter(u => u.id !== id);
        setLocal(STORAGE_KEYS.USERS, currentUsers);
        window.dispatchEvent(new CustomEvent('me_live_update', { detail: { type: 'USER_DELETE', id } }));
      }
    }

    if (type === 'NEW_ATTEMPT') {
      const incomingAttempt = data;
      if (incomingAttempt && incomingAttempt.id) {
        const users = getLocal(STORAGE_KEYS.USERS, []);
        const normalized = normalizeAttempt(incomingAttempt, users);

        let currentAttempts = getLocal(STORAGE_KEYS.ATTEMPTS, []);
        const existingIdx = currentAttempts.findIndex(a => a.id === normalized.id);
        if (existingIdx !== -1) {
          currentAttempts[existingIdx] = normalized;
        } else {
          currentAttempts.unshift(normalized);
        }
        setLocal(STORAGE_KEYS.ATTEMPTS, currentAttempts);
        window.dispatchEvent(new CustomEvent('me_live_update', { detail: { type: 'ATTEMPT_UPDATE', attempt: normalized } }));
      }
    }

    if (type === 'NEW_QUIZ' || type === 'UPDATE_QUIZ') {
      const incomingQuiz = data;
      if (incomingQuiz && incomingQuiz.id) {
        let deletedIds = getLocal('me_deleted_quiz_ids', []);
        if (deletedIds.includes(incomingQuiz.id)) return; // Do not revive if locally or globally deleted!

        let currentQuizzes = getLocal(STORAGE_KEYS.QUIZZES, []);
        const idx = currentQuizzes.findIndex(q => q.id === incomingQuiz.id);
        if (idx !== -1) {
          currentQuizzes[idx] = incomingQuiz;
        } else {
          currentQuizzes.unshift(incomingQuiz);
        }
        setLocal(STORAGE_KEYS.QUIZZES, currentQuizzes);
        window.dispatchEvent(new CustomEvent('me_live_update', { detail: { type: 'QUIZ_UPDATE', quiz: incomingQuiz } }));
      }
    }

    if (type === 'DELETE_QUIZ') {
      const { quizId } = data || {};
      if (quizId) {
        let currentQuizzes = getLocal(STORAGE_KEYS.QUIZZES, []);
        currentQuizzes = currentQuizzes.filter(q => q && q.id !== quizId);
        setLocal(STORAGE_KEYS.QUIZZES, currentQuizzes);

        let deletedIds = getLocal('me_deleted_quiz_ids', []);
        if (!deletedIds.includes(quizId)) {
          deletedIds.push(quizId);
          setLocal('me_deleted_quiz_ids', deletedIds);
        }
        window.dispatchEvent(new CustomEvent('me_live_update', { detail: { type: 'QUIZ_DELETE', quizId } }));
      }
    }

    if (type === 'REQUEST_STATE') {
      const localUsers = getLocal(STORAGE_KEYS.USERS, []);
      const localAttempts = getLocal(STORAGE_KEYS.ATTEMPTS, []);
      const localQuizzes = getLocal(STORAGE_KEYS.QUIZZES, []);
      const localDeleted = getLocal('me_deleted_quiz_ids', []);
      if (localUsers.length > 0 || localAttempts.length > 0 || localQuizzes.length > 0) {
        try {
          const payload = JSON.stringify({
            type: 'STATE_RESPONSE',
            data: { 
              users: localUsers, 
              attempts: localAttempts.slice(0, 50), 
              quizzes: localQuizzes,
              deletedQuizIds: localDeleted
            },
            sender: LIVE_CLIENT_ID,
            timestamp: Date.now()
          });
          const message = new Paho.MQTT.Message(payload);
          message.destinationName = SYNC_TOPIC_STATE;
          message.qos = 0;
          pahoClient.send(message);
        } catch (e) {}
      }
    }

    if (type === 'STATE_RESPONSE' || type === 'SNAPSHOT') {
      const { users, attempts, quizzes, deletedQuizIds } = data || {};
      let changed = false;

      if (Array.isArray(deletedQuizIds) && deletedQuizIds.length > 0) {
        let currentDeleted = getLocal('me_deleted_quiz_ids', []);
        const mergedDeleted = Array.from(new Set([...currentDeleted, ...deletedQuizIds]));
        setLocal('me_deleted_quiz_ids', mergedDeleted);
      }
      const allDeleted = getLocal('me_deleted_quiz_ids', []);

      if (Array.isArray(users) && users.length > 0) {
        let currentUsers = getLocal(STORAGE_KEYS.USERS, []);
        const merged = mergeUsers(currentUsers, users);
        if (merged.length !== currentUsers.length) {
          setLocal(STORAGE_KEYS.USERS, merged);
          changed = true;
        }
      }
      if (Array.isArray(attempts) && attempts.length > 0) {
        let currentAttempts = getLocal(STORAGE_KEYS.ATTEMPTS, []);
        const map = new Map();
        currentAttempts.forEach(a => map.set(a.id, a));
        attempts.forEach(a => map.set(a.id, a));
        const mergedAtt = Array.from(map.values()).sort((a,b) => (new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)));
        if (mergedAtt.length !== currentAttempts.length) {
          setLocal(STORAGE_KEYS.ATTEMPTS, mergedAtt);
          changed = true;
        }
      }
      if (Array.isArray(quizzes) && quizzes.length > 0) {
        let currentQuizzes = getLocal(STORAGE_KEYS.QUIZZES, []);
        const map = new Map();
        currentQuizzes.forEach(q => { if (q && q.id && !allDeleted.includes(q.id)) map.set(q.id, q); });
        quizzes.forEach(q => { if (q && q.id && !allDeleted.includes(q.id)) map.set(q.id, q); });
        setLocal(STORAGE_KEYS.QUIZZES, Array.from(map.values()));
        changed = true;
      }
      if (changed) {
        window.dispatchEvent(new CustomEvent('me_live_update', { detail: { type: type === 'SNAPSHOT' ? 'SNAPSHOT_APPLIED' : 'STATE_MERGED' } }));
      }
    }
  }

  // Start Real-Time WebSocket Synchronization immediately
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', initLiveSyncEngine);
    } else {
      setTimeout(initLiveSyncEngine, 100);
    }
  }

  async function getAllUsers() {
    let users = [];
    try {
      const cloudUsers = await cloudFetchCollection('users');
      if (cloudUsers && cloudUsers.length > 0) {
        users = cloudUsers.filter(u => !isTestUser(u));
        const merged = mergeUsers(SEED_USERS, users);
        setLocal(STORAGE_KEYS.USERS, merged);
        return merged;
      }
    } catch (e) {
      console.warn('[Firestore Cloud] Error fetching users:', e);
    }
    const local = getLocal(STORAGE_KEYS.USERS, []).filter(u => !isTestUser(u));
    users = mergeUsers(SEED_USERS, local);
    setLocal(STORAGE_KEYS.USERS, users);
    return users;
  }

  async function getAllAttempts() {
    let cloudAttempts = null;
    try {
      cloudAttempts = await cloudFetchCollection('attempts');
    } catch (e) {
      console.warn('[Firestore Cloud] Error fetching attempts:', e);
    }

    const localAttempts = getLocal(STORAGE_KEYS.ATTEMPTS, []).filter(a => !isTestAttempt(a));
    const map = new Map();

    // 1. Add all local attempts (including ones received via MQTT Live Sync or Retained Snapshots)
    localAttempts.forEach(a => {
      if (a && a.id && !isTestAttempt(a)) map.set(a.id, a);
    });

    // 2. Merge cloud attempts safely by ID so local attempts are NEVER lost
    if (cloudAttempts !== null && Array.isArray(cloudAttempts)) {
      cloudAttempts.forEach(a => {
        if (a && a.id && !isTestAttempt(a)) {
          const existing = map.get(a.id) || {};
          map.set(a.id, { ...existing, ...a });
        }
      });
    }

    const allRawAttempts = Array.from(map.values()).filter(a => !isTestAttempt(a));
    const users = getLocal(STORAGE_KEYS.USERS, []).filter(u => !isTestUser(u));

    const normalized = allRawAttempts.map(a => normalizeAttempt(a, users)).filter(Boolean);

    normalized.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
    setLocal(STORAGE_KEYS.ATTEMPTS, normalized);
    return normalized;
  }

  async function getAllQuizzes() {
    // 1. Retrieve all known locally deleted quiz IDs
    const localDeletedIds = getLocal('me_deleted_quiz_ids', []);

    // 2. Fetch deleted quizzes from Cloud Firestore (if available)
    let cloudDeletedDocs = null;
    try {
      cloudDeletedDocs = await cloudFetchCollection('deleted_quizzes');
    } catch (e) {
      console.warn('[Firestore Cloud] Error fetching deleted_quizzes:', e);
    }
    const cloudDeletedIds = (cloudDeletedDocs || []).map(d => d.id || d._id).filter(Boolean);
    const allDeletedIds = Array.from(new Set([...cloudDeletedIds, ...localDeletedIds]));
    setLocal('me_deleted_quiz_ids', allDeletedIds);

    // 3. Retrieve local quizzes from local storage
    let localQuizzes = getLocal(STORAGE_KEYS.QUIZZES, []);
    if (localQuizzes.length === 0 && window.INITIAL_QUIZZES && Array.isArray(window.INITIAL_QUIZZES)) {
      localQuizzes = [...window.INITIAL_QUIZZES];
    }

    // 4. Fetch active quizzes from Cloud Firestore (if available)
    let cloudQuizzes = null;
    try {
      cloudQuizzes = await cloudFetchCollection('quizzes');
    } catch (e) {
      console.warn('[Firestore Cloud] Error fetching quizzes:', e);
    }

    // 5. Merge Cloud and Local Quizzes safely:
    // If cloudQuizzes is an array: merge cloud and local by ID so neither is lost
    // If cloudQuizzes is null (e.g. 429 quota or offline): retain localQuizzes safely intact!
    let mergedQuizzes = [];
    if (cloudQuizzes !== null && Array.isArray(cloudQuizzes)) {
      const map = new Map();
      localQuizzes.forEach(q => { if (q && q.id) map.set(q.id, q); });
      cloudQuizzes.forEach(q => { if (q && q.id) map.set(q.id, q); });
      mergedQuizzes = Array.from(map.values());
    } else {
      mergedQuizzes = localQuizzes;
    }

    // 6. Absolute Guarantee: Exclude any quiz in allDeletedIds
    const sanitized = mergedQuizzes.filter(q => q && q.id && !allDeletedIds.includes(q.id));

    // 7. Update local cache with sanitized, live active quizzes
    setLocal(STORAGE_KEYS.QUIZZES, sanitized);
    return sanitized;
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

    function resolveCurrentUser(tok) {
      let u = getLocal(STORAGE_KEYS.CURRENT_USER, null);
      if (tok) {
        const users = getLocal(STORAGE_KEYS.USERS, []);
        const tokenUser = users.find(x => x.id === tok);
        if (tokenUser) u = tokenUser;
      }
      return u || {};
    }

    // 1. REGISTER
    if (urlStr.includes('/api/auth/register') && method === 'POST') {
      const { fullName, email, password, school } = body;
      const users = await getAllUsers();
      if (users.find(u => (u.email || '').toLowerCase() === (email || '').toLowerCase())) {
        return jsonResponse({ error: 'An account with this email already exists.' }, 400);
      }
      const newUser = {
        id: `usr_${Date.now()}`,
        fullName,
        email: email.toLowerCase(),
        password,
        role: 'student', // Strict: Public registration is always student; 4 admins are pre-assigned
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

      // Broadcast live to all connected devices in real time!
      broadcastLiveEvent('USER_REGISTERED', newUser);

      return jsonResponse({ message: 'Account created successfully', token: newUser.id, user: newUser });
    }

    // 2. LOGIN
    if (urlStr.includes('/api/auth/login') && method === 'POST') {
      const { email, password } = body;
      const inputEmail = (email || '').toLowerCase().trim();
      const users = await getAllUsers();
      const user = users.find(u => {
        const uEmail = (u.email || '').toLowerCase().trim();
        const matchesEmail = uEmail === inputEmail ||
          (inputEmail === 'admin1@boardprep.edu.ph' && uEmail === 'admin@me-prep.edu.ph') ||
          (inputEmail === 'admin3@boardprep.edu.ph' && uEmail === 'admin2@me-prep.edu.ph') ||
          (inputEmail === 'admin4@boardprep.edu.ph' && uEmail === 'admin3@me-prep.edu.ph');
        return matchesEmail && (u.password === password || u.passwordHash);
      });

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

    // 4. ADMIN USER MANAGEMENT
    if (urlStr.includes('/api/users')) {
      const cleanUrl = urlStr.split('?')[0].replace(/\/+$/, '');
      const parts = cleanUrl.split('/api/users');
      const subPath = parts[1] ? parts[1].replace(/^\//, '') : '';
      const userId = subPath && subPath !== 'full' ? decodeURIComponent(subPath.split('/')[0]) : (body && body.id);

      // GET /api/users/full or GET /api/users
      if (method === 'GET') {
        const users = await getAllUsers();
        const attempts = await getAllAttempts();
        const enrichedUsers = users.map(u => {
          const uAttempts = attempts.filter(a => a && (a.studentId === u.id || (u.email && a.studentEmail && u.email.toLowerCase() === a.studentEmail.toLowerCase())));
          const lastAtt = uAttempts[0];
          const analytics = calculateAdaptiveAnalyticsSync(u.id, users, attempts);
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

      // POST /api/users
      if (method === 'POST') {
        const { fullName, email, password, role, school, targetExamDate } = body;
        if (!fullName || !email || !password) {
          return jsonResponse({ error: 'Full name, email, and password are required.' }, 400);
        }
        const users = await getAllUsers();
        if (users.find(u => (u.email || '').toLowerCase() === (email || '').toLowerCase())) {
          return jsonResponse({ error: 'Email is already registered.' }, 400);
        }

        const assignedRole = 'student';

        const newUser = {
          id: `usr_${Date.now()}`,
          fullName,
          email: email.toLowerCase(),
          password,
          role: assignedRole,
          status: 'active',
          school: school || 'NEUST',
          createdDate: new Date().toISOString().split('T')[0],
          targetExamDate: targetExamDate || '2026-10-15',
          diagnosticCompleted: false,
          simulationPassed: false
        };

        users.push(newUser);
        setLocal(STORAGE_KEYS.USERS, users);
        cloudSaveDoc('users', newUser.id, newUser).catch(console.error);
        broadcastLiveEvent('NEW_USER', newUser);

        return jsonResponse({ message: 'User account created successfully', user: newUser });
      }

      // PUT /api/users/:id
      if (method === 'PUT') {
        const id = userId;
        const users = await getAllUsers();
        const idx = users.findIndex(u => u.id === id);
        if (idx === -1) return jsonResponse({ error: 'User not found' }, 404);

        const updates = body;
        if (updates.role === 'admin' && users[idx].role !== 'admin') {
          const adminCount = users.filter(u => u.role === 'admin').length;
          if (adminCount >= 4) {
            return jsonResponse({ error: 'Maximum limit of 4 administrators reached. Only 4 admin accounts are allowed on this platform.' }, 400);
          }
        }

        if (updates.fullName) users[idx].fullName = updates.fullName;
        if (updates.role) users[idx].role = updates.role;
        if (updates.status) users[idx].status = updates.status;
        if (updates.school) users[idx].school = updates.school;
        if (updates.targetExamDate) users[idx].targetExamDate = updates.targetExamDate;

        setLocal(STORAGE_KEYS.USERS, users);
        cloudSaveDoc('users', id, users[idx]).catch(console.error);
        broadcastLiveEvent('UPDATE_USER', users[idx]);

        return jsonResponse({ message: 'User updated successfully', user: users[idx] });
      }

      // DELETE /api/users/:id
      if (method === 'DELETE') {
        const id = userId;
        const currentUser = getLocal(STORAGE_KEYS.CURRENT_USER, {});
        if (currentUser.id === id) {
          return jsonResponse({ error: 'You cannot delete your own active administrator account.' }, 400);
        }
        const users = await getAllUsers();
        const targetUser = users.find(u => u.id === id);
        if (targetUser && targetUser.role === 'admin') {
          return jsonResponse({ error: 'System Protection: Administrator accounts cannot be deleted directly to maintain platform stability.' }, 400);
        }

        const filteredUsers = users.filter(u => u.id !== id);
        setLocal(STORAGE_KEYS.USERS, filteredUsers);
        await cloudDeleteDoc('users', id);
        broadcastLiveEvent('DELETE_USER', { id });

        return jsonResponse({ message: 'User account permanently deleted successfully' });
      }
    }

    // 5. ATTEMPTS LIST (GET /api/attempts)
    if (urlStr.includes('/api/attempts') && method === 'GET') {
      const attempts = await getAllAttempts();
      return jsonResponse({ attempts });
    }

    // 6. RECORD ATTEMPT (POST /api/attempts)
    if (urlStr.includes('/api/attempts') && method === 'POST') {
      const currentUser = resolveCurrentUser(token);
      const scoreVal = extractAttemptScore(body);
      const totalVal = extractAttemptTotal(body);
      const pct = extractAttemptPercentage(body, scoreVal, totalVal);

      const newAttempt = {
        id: `att_${Date.now()}`,
        studentId: currentUser.id || token || 'usr_anon',
        studentName: (currentUser.fullName && currentUser.fullName !== 'Student') ? currentUser.fullName : (body.studentName || 'Student Reviewee'),
        studentEmail: currentUser.email || body.studentEmail || '',
        school: currentUser.school || body.school || 'NEUST',
        quizId: body.quizId || 'custom_quiz',
        quizTitle: body.quizTitle || 'Board Prep Quiz',
        totalQuestions: totalVal,
        score: scoreVal,
        correctAnswers: scoreVal,
        percentage: pct,
        scorePct: pct,
        passed: body.passed !== undefined && body.passed !== null ? !!body.passed : (pct >= 70),
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

      // Broadcast live to all connected devices in real time!
      broadcastLiveEvent('NEW_ATTEMPT', newAttempt);

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

      const currentUser = resolveCurrentUser(token);
      const attempt = {
        id: `att_diag_${Date.now()}`,
        studentId: currentUser.id || token || 'usr_anon',
        studentName: (currentUser.fullName && currentUser.fullName !== 'Student') ? currentUser.fullName : (body.studentName || 'Student Reviewee'),
        studentEmail: currentUser.email || body.studentEmail || '',
        school: currentUser.school || body.school || 'NEUST',
        quizId: 'diagnostic_assessment',
        quizTitle: 'Comprehensive Licensure Diagnostic Exam',
        totalQuestions: total,
        score: correct,
        correctAnswers: correct,
        percentage: scorePct,
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
      broadcastLiveEvent('NEW_ATTEMPT', attempt);
      if (currentUser && currentUser.id) {
        broadcastLiveEvent('UPDATE_USER', currentUser);
      }

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

      const currentUser = resolveCurrentUser(token);
      const attempt = {
        id: `att_smart_${Date.now()}`,
        studentId: currentUser.id || token || 'usr_anon',
        studentName: (currentUser.fullName && currentUser.fullName !== 'Student') ? currentUser.fullName : (body.studentName || 'Student Reviewee'),
        studentEmail: currentUser.email || body.studentEmail || '',
        school: currentUser.school || body.school || 'NEUST',
        quizId: `smart_quiz_${Date.now()}`,
        quizTitle: `Targeted Smart Quiz - ${targetModule || 'Remediation'}`,
        totalQuestions: total,
        score: correct,
        correctAnswers: correct,
        percentage: scorePct,
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
      broadcastLiveEvent('NEW_ATTEMPT', attempt);

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

      const currentUser = resolveCurrentUser(token);
      const attempt = {
        id: `att_sim_${Date.now()}`,
        studentId: currentUser.id || token || 'usr_anon',
        studentName: (currentUser.fullName && currentUser.fullName !== 'Student') ? currentUser.fullName : (body.studentName || 'Student Reviewee'),
        studentEmail: currentUser.email || body.studentEmail || '',
        school: currentUser.school || body.school || 'NEUST',
        quizId: 'board_exam_simulation',
        quizTitle: 'Full Licensure Exam Simulation',
        totalQuestions: total,
        score: correct,
        correctAnswers: correct,
        percentage: scorePct,
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
      broadcastLiveEvent('NEW_ATTEMPT', attempt);
      if (currentUser && currentUser.id) {
        broadcastLiveEvent('UPDATE_USER', currentUser);
      }

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

    // 14b. DYNAMIC CSV EXPORT (GET /api/download/csv)
    if (urlStr.includes('/api/download/csv')) {
      const CSV_HEADERS = [
        'ID','Type','Module','Topic','Difficulty','DifficultyValue','QuestionText',
        'OptionA','OptionB','OptionC','OptionD','CorrectAnswer','CurriculumMapID',
        'CourseCode','Subtopic','Discrimination','Guessing','Active','ExposureCount',
        'AttemptCount','CorrectCount','AverageTimeSeconds','Explanation','LearningOutcome',
        'AIReviewStatus','FieldsChanged','CorrectionSummary','References','ConfidenceLevel',
        'HumanReviewRequired','HumanReviewReason','AIReviewedDate','BatchNumber'
      ];

      function escapeCSV(val) {
        if (val === undefined || val === null) return '';
        const str = String(val);
        if (/[",\r\n]/.test(str)) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }

      const questions = (window.INITIAL_QUESTIONS || []).filter(q => q && q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');
      const rows = [CSV_HEADERS.join(',')];
      for (const q of questions) {
        const row = CSV_HEADERS.map(h => escapeCSV(q[h]));
        rows.push(row.join(','));
      }
      const csvContent = '\uFEFF' + rows.join('\r\n');

      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="QuestionBank_Reviewed.csv"'
        }
      });
    }

    // 15. QUESTIONS (GET /api/questions with module, search, status, batch, random, ids, limit, page)
    if (urlStr.includes('/api/questions') && method === 'GET') {
      const allQuestions = (window.INITIAL_QUESTIONS || []).filter(q => q && q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');
      
      // Parse query parameters
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

      const ids = params.ids;
      const modFilter = params.module;
      const statusFilter = params.status;
      const batch = params.batch;
      const search = params.search;
      const random = params.random;
      const limit = params.limit;
      const page = params.page;

      let filtered = [...allQuestions];

      // 1. If specific IDs requested:
      if (ids) {
        const idList = ids.split(',').map(i => String(i).trim());
        const matched = filtered.filter(q => idList.includes(String(q.ID)));
        return jsonResponse({
          total: matched.length,
          page: 1,
          pageSize: matched.length,
          totalPages: 1,
          questions: matched
        });
      }

      // 2. Filter by Module (supports comma-separated multiple modules)
      if (modFilter) {
        const targetModules = modFilter.split(',').map(m => m.toLowerCase().trim()).filter(Boolean);
        if (targetModules.length > 0) {
          filtered = filtered.filter(q => {
            if (!q.Module) return false;
            const qMod = q.Module.toLowerCase();
            return targetModules.some(tm => qMod.includes(tm) || tm.includes(qMod));
          });
        }
      }

      // 3. Filter by Status
      if (statusFilter) {
        if (statusFilter === 'reviewed') {
          filtered = filtered.filter(q => q.AIReviewStatus && q.AIReviewStatus !== '');
        } else if (statusFilter === 'pending') {
          filtered = filtered.filter(q => !q.AIReviewStatus || q.AIReviewStatus === '');
        } else {
          filtered = filtered.filter(q => q.AIReviewStatus === statusFilter);
        }
      }

      // 4. Filter by Batch
      if (batch) {
        filtered = filtered.filter(q => String(q.BatchNumber) === String(batch));
      }

      // 5. Search query
      if (search) {
        const s = search.toLowerCase().trim();
        filtered = filtered.filter(q =>
          (q.QuestionText && q.QuestionText.toLowerCase().includes(s)) ||
          (q.ID && String(q.ID).includes(s)) ||
          (q.Topic && q.Topic.toLowerCase().includes(s)) ||
          (q.Subtopic && q.Subtopic.toLowerCase().includes(s)) ||
          (q.Module && q.Module.toLowerCase().includes(s)) ||
          (q.Explanation && q.Explanation.toLowerCase().includes(s)) ||
          (q.References && q.References.toLowerCase().includes(s))
        );
      }

      // 6. Randomize / Shuffle
      if (random === 'true') {
        filtered = [...filtered].sort(() => 0.5 - Math.random());
      }

      // 7. Paginate / Slice by limit and page
      const total = filtered.length;
      if (limit) {
        const pageSize = Math.max(1, parseInt(limit) || 50);
        const pageNum = Math.max(1, parseInt(page) || 1);
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

    // 16. QUIZZES SECTION (GET, POST, PUT, DELETE)
    if (urlStr.includes('/api/quizzes')) {
      const cleanUrl = urlStr.split('?')[0].replace(/\/+$/, '');
      const parts = cleanUrl.split('/api/quizzes');
      const subPath = parts[1] ? parts[1].replace(/^\//, '') : '';
      const quizId = subPath ? decodeURIComponent(subPath.split('/')[0]) : (body && body.id);

      // 16a. GET QUIZZES
      if (method === 'GET') {
        const quizzes = await getAllQuizzes();
        const attempts = await getAllAttempts();
        const currentUser = getLocal(STORAGE_KEYS.CURRENT_USER, {});
        const myAttempts = attempts.filter(a => a && (a.studentId === currentUser.id || (currentUser.email && a.studentEmail && currentUser.email.toLowerCase() === a.studentEmail.toLowerCase())));
        
        let filteredQuizzes = quizzes;
        if (currentUser.role !== 'admin') {
          filteredQuizzes = quizzes.filter(q => q.status === 'published');
        }

        const enriched = filteredQuizzes.map(q => {
          const quizAtts = attempts.filter(a => a.quizId === q.id);
          const total = quizAtts.length;
          const avg = total > 0 ? Math.round(quizAtts.reduce((acc, a) => acc + (a.scorePct || a.percentage || 0), 0) / total) : 0;
          return { ...q, totalAttempts: total, avgScorePct: avg };
        });
        return jsonResponse({ quizzes: enriched, myAttempts });
      }

      // 16b. POST / CREATE QUIZ
      if (method === 'POST') {
        const { title, description, module: modVal, questionCount, durationMins, passingScorePct, status, selectionMode, specificQuestionIds } = body;
        if (!title || !title.trim()) {
          return jsonResponse({ error: 'Quiz title is required.' }, 400);
        }
        const currentUser = getLocal(STORAGE_KEYS.CURRENT_USER, {});
        const newQuiz = {
          id: `qz_${Date.now()}`,
          title: title.trim(),
          description: (description || '').trim(),
          module: modVal || '',
          questionCount: (specificQuestionIds && specificQuestionIds.length > 0) ? specificQuestionIds.length : (parseInt(questionCount) || 50),
          durationMins: parseInt(durationMins) || 50,
          passingScorePct: parseInt(passingScorePct) || 70,
          status: status || 'published',
          selectionMode: selectionMode || 'random',
          specificQuestionIds: Array.isArray(specificQuestionIds) ? specificQuestionIds : [],
          createdBy: currentUser.fullName || 'Administrator',
          createdDate: new Date().toISOString().split('T')[0]
        };

        // Remove from deleted list if present locally
        let deletedIds = getLocal('me_deleted_quiz_ids', []);
        deletedIds = deletedIds.filter(id => id !== newQuiz.id);
        setLocal('me_deleted_quiz_ids', deletedIds);

        // Immediately update local storage so UI renders new quiz without waiting
        let currentQuizzes = getLocal(STORAGE_KEYS.QUIZZES, []);
        if (currentQuizzes.length === 0 && window.INITIAL_QUIZZES && Array.isArray(window.INITIAL_QUIZZES)) {
          currentQuizzes = [...window.INITIAL_QUIZZES];
        }
        currentQuizzes = currentQuizzes.filter(q => q && q.id !== newQuiz.id);
        currentQuizzes.unshift(newQuiz);
        setLocal(STORAGE_KEYS.QUIZZES, currentQuizzes);

        // Broadcast to all connected devices in real time via WebSockets
        broadcastLiveEvent('NEW_QUIZ', newQuiz);

        // Save to Cloud Firestore in background (non-blocking)
        cloudSaveDoc('quizzes', newQuiz.id, newQuiz).catch(console.error);

        return jsonResponse({ message: 'Quiz created and published live across all devices.', quiz: newQuiz });
      }

      // 16c. PUT / UPDATE QUIZ
      if (method === 'PUT') {
        const id = quizId;
        if (!id) return jsonResponse({ error: 'Quiz ID is required' }, 400);

        let quizzes = await getAllQuizzes();
        const idx = quizzes.findIndex(q => q.id === id);
        if (idx === -1) return jsonResponse({ error: 'Quiz not found' }, 404);

        const updates = body;
        if (updates.title) quizzes[idx].title = updates.title;
        if (updates.description !== undefined) quizzes[idx].description = updates.description;
        if (updates.module !== undefined) quizzes[idx].module = updates.module;
        if (updates.questionCount) quizzes[idx].questionCount = parseInt(updates.questionCount);
        if (updates.durationMins) quizzes[idx].durationMins = parseInt(updates.durationMins);
        if (updates.passingScorePct) quizzes[idx].passingScorePct = parseInt(updates.passingScorePct);
        if (updates.status) quizzes[idx].status = updates.status;
        if (updates.selectionMode) quizzes[idx].selectionMode = updates.selectionMode;
        if (updates.specificQuestionIds !== undefined) quizzes[idx].specificQuestionIds = updates.specificQuestionIds;

        setLocal(STORAGE_KEYS.QUIZZES, quizzes);
        broadcastLiveEvent('UPDATE_QUIZ', quizzes[idx]);
        cloudSaveDoc('quizzes', id, quizzes[idx]).catch(console.error);

        return jsonResponse({ message: 'Quiz updated live across all devices.', quiz: quizzes[idx] });
      }

      // 16d. DELETE QUIZ
      if (method === 'DELETE') {
        const id = quizId;
        if (!id) return jsonResponse({ error: 'Quiz ID required for deletion' }, 400);

        // 1. Mark in permanent deleted IDs locally
        let deletedIds = getLocal('me_deleted_quiz_ids', []);
        if (!deletedIds.includes(id)) {
          deletedIds.push(id);
          setLocal('me_deleted_quiz_ids', deletedIds);
        }

        // 2. Immediately remove from local cache
        let quizzes = getLocal(STORAGE_KEYS.QUIZZES, []);
        if (quizzes.length === 0 && window.INITIAL_QUIZZES && Array.isArray(window.INITIAL_QUIZZES)) {
          quizzes = [...window.INITIAL_QUIZZES];
        }
        quizzes = quizzes.filter(q => q && q.id !== id);
        setLocal(STORAGE_KEYS.QUIZZES, quizzes);

        // 3. Broadcast deletion event to all connected devices in real time!
        broadcastLiveEvent('DELETE_QUIZ', { quizId: id });

        // 4. Persist deletion to Cloud Firestore in background (non-blocking)
        const currentUser = getLocal(STORAGE_KEYS.CURRENT_USER, {});
        cloudSaveDoc('deleted_quizzes', id, {
          id,
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser.email || currentUser.fullName || 'admin'
        }).catch(console.error);
        cloudDeleteDoc('quizzes', id).catch(console.error);

        return jsonResponse({ message: 'Quiz permanently deleted across all devices and accounts.', quizId: id });
      }
    }

    return jsonResponse({ message: 'OK' });
  };
})();
