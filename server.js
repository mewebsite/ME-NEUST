const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { syncTime } = require('./time-sync');
const { db } = require('./firebase-config');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'me_licensure_boardprep_secret_key_2026';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const QUIZZES_FILE = path.join(DATA_DIR, 'quizzes.json');
const ATTEMPTS_FILE = path.join(DATA_DIR, 'attempts.json');

const CSV_HEADERS = [
  'ID','Type','Module','Topic','Difficulty','DifficultyValue','QuestionText',
  'OptionA','OptionB','OptionC','OptionD','CorrectAnswer','CurriculumMapID',
  'CourseCode','Subtopic','Discrimination','Guessing','Active','ExposureCount',
  'AttemptCount','CorrectCount','AverageTimeSeconds','Explanation','LearningOutcome',
  'AIReviewStatus','FieldsChanged','CorrectionSummary','References','ConfidenceLevel',
  'HumanReviewRequired','HumanReviewReason','AIReviewedDate','BatchNumber'
];

function escapeCSVField(val) {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function jsonToCSV(questions) {
  const rows = [CSV_HEADERS.join(',')];
  for (const q of questions) {
    const row = CSV_HEADERS.map(h => escapeCSVField(q[h]));
    rows.push(row.join(','));
  }
  return rows.join('\r\n');
}

function syncCSV(questions) {
  try {
    const csvContent = jsonToCSV(questions);
    const localCsv = path.join(__dirname, 'QuestionBank_Reviewed.csv');
    fs.writeFileSync(localCsv, csvContent, 'utf8');
    const parentCsv = path.join(__dirname, '..', 'QuestionBank_Reviewed.csv');
    if (fs.existsSync(path.dirname(parentCsv))) {
      try { fs.writeFileSync(parentCsv, csvContent, 'utf8'); } catch (e) {}
    }
  } catch (e) {
    console.error('Error syncing CSV file:', e);
  }
}

// Helper to read/write JSON files safely

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/me-neust-website-v2/databases/(default)/documents';

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

function fromFirestoreDoc(doc) {
  if (!doc || !doc.fields) return null;
  const obj = {};
  for (const k of Object.keys(doc.fields)) {
    obj[k] = fromFirestoreValue(doc.fields[k]);
  }
  if (doc.name) {
    const parts = doc.name.split('/');
    obj.id = parts[parts.length - 1];
  }
  return obj;
}

async function fetchCollection(collectionName) {
  try {
    const res = await fetch(`${FIRESTORE_BASE}/${collectionName}?pageSize=1000`);
    if (!res.ok) throw new Error('Firestore REST fetch failed: ' + res.status);
    const data = await res.json();
    return (data.documents || []).map(fromFirestoreDoc).filter(Boolean);
  } catch (e) {
    try {
      const snapshot = await db.collection(collectionName).get();
      return snapshot.docs.map(doc => doc.data());
    } catch (err) {
      console.error('Error fetching collection ' + collectionName, err.message);
      return [];
    }
  }
}

async function saveToCollection(collectionName, data, idField = 'id') {
  try {
    for (const item of data) {
      const docId = item[idField] ? String(item[idField]) : String(Date.now());
      const fields = {};
      for (const k of Object.keys(item)) {
        fields[k] = toFirestoreValue(item[k]);
      }
      await fetch(`${FIRESTORE_BASE}/${collectionName}/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
    }
    if (collectionName === 'questions') {
      syncCSV(data);
    }
  } catch (e) {
    try {
      const CHUNK_SIZE = 450;
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        const batch = db.batch();
        chunk.forEach(item => {
          const docId = item[idField] ? String(item[idField]) : db.collection(collectionName).doc().id;
          const ref = db.collection(collectionName).doc(docId);
          batch.set(ref, item);
        });
        await batch.commit();
      }
      if (collectionName === 'questions') syncCSV(data);
    } catch (err) {
      console.error('Error saving collection ' + collectionName, err.message);
    }
  }
}

async function deleteDocFromCollection(collectionName, docId) {
  try {
    const res = await fetch(`${FIRESTORE_BASE}/${collectionName}/${docId}`, {
      method: 'DELETE'
    });
    console.log(`[Firestore REST] Deleted ${collectionName}/${docId} -> status ${res.status}`);
  } catch (e) {
    console.error(`[Firestore REST] Error deleting ${collectionName}/${docId}:`, e.message);
  }
  try {
    if (typeof db !== 'undefined' && db && db.collection) {
      await db.collection(collectionName).doc(docId).delete();
    }
  } catch (err) {}
}

async function saveDocToCollection(collectionName, docId, item) {
  try {
    const fields = {};
    for (const k of Object.keys(item)) {
      fields[k] = toFirestoreValue(item[k]);
    }
    const res = await fetch(`${FIRESTORE_BASE}/${collectionName}/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    console.log(`[Firestore REST] Saved doc ${collectionName}/${docId} -> status ${res.status}`);
  } catch (e) {
    console.error(`[Firestore REST] Error saving ${collectionName}/${docId}:`, e.message);
  }
  try {
    if (typeof db !== 'undefined' && db && db.collection) {
      await db.collection(collectionName).doc(docId).set(item, { merge: true });
    }
  } catch (err) {}
}


// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired session token' });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
}

// --- AUTHENTICATION ROUTES ---

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { fullName, email, password, role, school, adminCode } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }

  const users = await fetchCollection('users');
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const userRole = 'student';

  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser = {
    id: `usr_${Date.now()}`,
    fullName,
    email: email.toLowerCase(),
    passwordHash,
    role: userRole,
    status: 'pending', // Requires administrator approval before activation
    createdDate: new Date().toISOString().split('T')[0],
    school: school || 'N/A',
    targetExamDate: '2026-10-15'
  };

  users.push(newUser);
  await saveToCollection('users', users, 'id');

  const { passwordHash: _, ...userWithoutHash } = newUser;
  res.json({ 
    message: 'Registration submitted successfully! Your account is currently awaiting administrator approval. You will be able to log in once an administrator approves your registration.', 
    pending: true, 
    user: userWithoutHash 
  });
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = await fetchCollection('users');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Admin Approval Check: If student is pending approval, block login
  if (user.role === 'student' && user.status === 'pending') {
    return res.status(403).json({ 
      error: 'Your account is currently awaiting administrator approval. Please wait for an administrator to verify and activate your registration before logging in.',
      pending: true 
    });
  }

  if (user.status === 'deactivated' || user.status === 'rejected') {
    return res.status(403).json({ error: 'This account has been deactivated or rejected by an administrator. Please contact your instructor or administrator for assistance.' });
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { passwordHash: _, ...userWithoutHash } = user;
  res.json({ message: 'Login successful', token, user: userWithoutHash });
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const users = await fetchCollection('users');
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash: _, ...userWithoutHash } = user;
  res.json({ user: userWithoutHash });
});

// PUT /api/auth/profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  const { fullName, school, targetExamDate, newPassword } = req.body;
  const users = await fetchCollection('users');
  const userIndex = users.findIndex(u => u.id === req.user.id);

  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

  if (fullName) users[userIndex].fullName = fullName;
  if (school) users[userIndex].school = school;
  if (targetExamDate) users[userIndex].targetExamDate = targetExamDate;
  if (newPassword) {
    users[userIndex].passwordHash = bcrypt.hashSync(newPassword, 10);
  }

  await saveToCollection('users', users, 'id');
  const { passwordHash: _, ...userWithoutHash } = users[userIndex];
  res.json({ message: 'Profile updated successfully', user: userWithoutHash });
});


// --- QUESTION BANK & REVIEW ROUTES ---

// GET /api/questions (Authenticated)
app.get('/api/questions', authenticateToken, async (req, res) => {
  const questions = await fetchCollection('questions');
  const { module: modFilter, status: statusFilter, search, batch, random, ids, limit = 50, page = 1 } = req.query;

  let filtered = questions.filter(q => q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');

  if (ids) {
    const idList = ids.split(',').map(i => String(i).trim());
    const matched = filtered.filter(q => idList.includes(String(q.ID)));
    return res.json({
      total: matched.length,
      page: 1,
      pageSize: matched.length,
      totalPages: 1,
      questions: matched
    });
  }

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

  if (statusFilter) {
    if (statusFilter === 'reviewed') {
      filtered = filtered.filter(q => q.AIReviewStatus && q.AIReviewStatus !== '');
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(q => !q.AIReviewStatus || q.AIReviewStatus === '');
    } else {
      filtered = filtered.filter(q => q.AIReviewStatus === statusFilter);
    }
  }

  if (batch) {
    filtered = filtered.filter(q => String(q.BatchNumber) === String(batch));
  }

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

  if (random === 'true') {
    filtered = [...filtered].sort(() => 0.5 - Math.random());
  }

  const pageSize = Math.max(1, parseInt(limit) || 50);
  const pageNum = Math.max(1, parseInt(page) || 1);
  const total = filtered.length;
  const startIdx = (pageNum - 1) * pageSize;
  const paginated = filtered.slice(startIdx, startIdx + pageSize);

  res.json({
    total,
    page: pageNum,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    questions: paginated
  });
});

// GET /api/questions/stats
app.get('/api/questions/stats', authenticateToken, async (req, res) => {
  const questions = (await fetchCollection('questions')).filter(q => q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');
  const users = await fetchCollection('users');
  const quizzes = await fetchCollection('quizzes');
  const attempts = await fetchCollection('attempts');

  const total = questions.length;
  const reviewed = questions.filter(q => q.AIReviewStatus && q.AIReviewStatus !== '').length;
  const pending = total - reviewed;

  const statusBreakdown = {};
  questions.forEach(q => {
    if (q.AIReviewStatus) {
      statusBreakdown[q.AIReviewStatus] = (statusBreakdown[q.AIReviewStatus] || 0) + 1;
    }
  });

  const batchBreakdown = {};
  questions.forEach(q => {
    if (q.BatchNumber) {
      batchBreakdown[q.BatchNumber] = (batchBreakdown[q.BatchNumber] || 0) + 1;
    }
  });

  const moduleBreakdown = {};
  questions.forEach(q => {
    const mod = q.Module || 'Unclassified';
    moduleBreakdown[mod] = (moduleBreakdown[mod] || 0) + 1;
  });

  const studentsCount = users.filter(u => u.role === 'student' && u.status === 'active').length;
  const adminsCount = users.filter(u => u.role === 'admin').length;
  const publishedQuizzesCount = quizzes.filter(qz => qz.status === 'published').length;
  const totalAttemptsCount = attempts.length;

  res.json({
    totalQuestions: total,
    reviewedQuestions: reviewed,
    batch1ReviewedCount: reviewed,
    pendingQuestions: pending,
    totalBatchesCompleted: Object.keys(batchBreakdown).length,
    statusBreakdown,
    batchBreakdown,
    moduleBreakdown,
    registeredStudents: studentsCount,
    registeredAdmins: adminsCount,
    publishedQuizzesCount,
    totalAttemptsCount
  });
});

// GET /api/download/csv (Dynamic CSV Export)
app.get('/api/download/csv', authenticateToken, async (req, res) => {
  const questions = (await fetchCollection('questions')).filter(q => q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');
  if (questions && questions.length > 0) {
    const csvContent = '\uFEFF' + jsonToCSV(questions);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="QuestionBank_Reviewed.csv"');
    return res.send(csvContent);
  }
  res.status(404).json({ error: 'Question bank data is empty or unavailable.' });
});

// POST /api/questions (Admin Only)
app.post('/api/questions', authenticateToken, requireAdmin, async (req, res) => {
  const newQ = req.body;
  if (!newQ.QuestionText || !newQ.OptionA || !newQ.OptionB || !newQ.CorrectAnswer) {
    return res.status(400).json({ error: 'Question text, Option A, Option B, and Correct Answer are required.' });
  }

  const questions = await fetchCollection('questions');
  const maxId = Math.max(...questions.map(q => parseInt(q.ID) || 0), 0);
  const createdQ = {
    ID: String(maxId + 1),
    Type: newQ.Type || 'Multiple Choice',
    Module: newQ.Module || 'Module 1 - Power Plant Elements',
    Topic: newQ.Topic || 'Power Plant Elements',
    Difficulty: newQ.Difficulty || 'Medium',
    DifficultyValue: newQ.DifficultyValue || '3',
    QuestionText: newQ.QuestionText,
    OptionA: newQ.OptionA,
    OptionB: newQ.OptionB,
    OptionC: newQ.OptionC || '',
    OptionD: newQ.OptionD || '',
    CorrectAnswer: newQ.CorrectAnswer,
    CurriculumMapID: newQ.CurriculumMapID || '',
    CourseCode: newQ.CourseCode || '',
    Subtopic: newQ.Subtopic || '',
    Discrimination: '0.45',
    Guessing: '0.25',
    Active: 'TRUE',
    ExposureCount: '0',
    AttemptCount: '0',
    CorrectCount: '0',
    AverageTimeSeconds: '45',
    Explanation: newQ.Explanation || '',
    LearningOutcome: newQ.LearningOutcome || '',
    AIReviewStatus: newQ.AIReviewStatus || 'Verified-No Change',
    FieldsChanged: newQ.FieldsChanged || 'Created by Admin',
    CorrectionSummary: newQ.CorrectionSummary || 'Added via Admin Console',
    References: newQ.References || '',
    ConfidenceLevel: newQ.ConfidenceLevel || 'High',
    HumanReviewRequired: newQ.HumanReviewRequired || 'No',
    HumanReviewReason: newQ.HumanReviewReason || '',
    AIReviewedDate: new Date().toISOString().split('T')[0],
    BatchNumber: newQ.BatchNumber || 'Manual'
  };

  questions.unshift(createdQ);
  await saveToCollection('questions', questions, 'ID');
  res.json({ message: 'Question created successfully', question: createdQ });
});

// PUT /api/questions/:id (Admin Only)
app.put('/api/questions/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const questions = await fetchCollection('questions');
  const idx = questions.findIndex(q => String(q.ID) === String(id));

  if (idx === -1) return res.status(404).json({ error: 'Question not found' });

  const protectedFields = ['ID', 'Type', 'Discrimination', 'Guessing', 'Active', 'ExposureCount', 'AttemptCount', 'CorrectCount', 'AverageTimeSeconds'];

  Object.keys(updates).forEach(key => {
    if (!protectedFields.includes(key)) {
      questions[idx][key] = updates[key];
    }
  });

  await saveToCollection('questions', questions, 'ID');
  res.json({ message: 'Question updated successfully', question: questions[idx] });
});

// DELETE /api/questions/:id (Admin Only)
app.delete('/api/questions/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  let questions = await fetchCollection('questions');
  const initialLength = questions.length;
  questions = questions.filter(q => String(q.ID) !== String(id));

  if (questions.length === initialLength) {
    return res.status(404).json({ error: 'Question not found' });
  }

  await deleteDocFromCollection('questions', id);
  await saveDocToCollection('deleted_questions', id, {
    id,
    deletedAt: new Date().toISOString(),
    deletedBy: req.user.email || 'admin'
  });
  syncCSV(questions);
  res.json({ message: 'Question deleted successfully' });
});


// --- ADMIN QUIZ CREATION & MANAGEMENT ROUTES ---

// GET /api/quizzes (Authenticated - Students get published only, Admins get all)
app.get('/api/quizzes', authenticateToken, async (req, res) => {
  let quizzes = await fetchCollection('quizzes');
  let deletedDocs = [];
  try {
    deletedDocs = await fetchCollection('deleted_quizzes');
  } catch (e) {}
  const deletedIds = (deletedDocs || []).map(d => d.id).filter(Boolean);
  if (deletedIds.length > 0) {
    quizzes = quizzes.filter(q => !deletedIds.includes(q.id));
  }
  const attempts = await fetchCollection('attempts');
  const myAttempts = attempts.filter(a => a.studentId === req.user.id);

  if (req.user.role === 'admin') {
    return res.json({ quizzes, myAttempts });
  }
  const published = quizzes.filter(qz => qz.status === 'published');
  res.json({ quizzes: published, myAttempts });
});

// POST /api/quizzes (Admin Only - Create and Post New Quiz)
app.post('/api/quizzes', authenticateToken, requireAdmin, async (req, res) => {
  const { title, description, module: modVal, questionCount, durationMins, passingScorePct, status, selectionMode, specificQuestionIds } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Quiz title is required.' });
  }

  const quizzes = await fetchCollection('quizzes');
  const newQuiz = {
    id: `qz_${Date.now()}`,
    title,
    description: description || '',
    module: modVal || '',
    questionCount: (specificQuestionIds && specificQuestionIds.length > 0) ? specificQuestionIds.length : (parseInt(questionCount) || 50),
    durationMins: parseInt(durationMins) || 50,
    passingScorePct: parseInt(passingScorePct) || 70,
    status: status || 'published',
    selectionMode: selectionMode || 'random',
    specificQuestionIds: Array.isArray(specificQuestionIds) ? specificQuestionIds : [],
    createdBy: req.user.fullName,
    createdDate: new Date().toISOString().split('T')[0]
  };

  quizzes.unshift(newQuiz);
  await saveToCollection('quizzes', quizzes, 'id');
  res.json({ message: 'Quiz created and posted successfully', quiz: newQuiz });
});

// PUT /api/quizzes/:id (Admin Only - Update Quiz or Publish/Draft status)
app.put('/api/quizzes/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const quizzes = await fetchCollection('quizzes');
  const idx = quizzes.findIndex(qz => qz.id === id);

  if (idx === -1) return res.status(404).json({ error: 'Quiz not found' });

  if (updates.title) quizzes[idx].title = updates.title;
  if (updates.description !== undefined) quizzes[idx].description = updates.description;
  if (updates.module !== undefined) quizzes[idx].module = updates.module;
  if (updates.questionCount) quizzes[idx].questionCount = parseInt(updates.questionCount);
  if (updates.durationMins) quizzes[idx].durationMins = parseInt(updates.durationMins);
  if (updates.passingScorePct) quizzes[idx].passingScorePct = parseInt(updates.passingScorePct);
  if (updates.status) quizzes[idx].status = updates.status;
  if (updates.selectionMode) quizzes[idx].selectionMode = updates.selectionMode;
  if (updates.specificQuestionIds !== undefined) quizzes[idx].specificQuestionIds = updates.specificQuestionIds;

  await saveToCollection('quizzes', quizzes, 'id');
  res.json({ message: 'Quiz updated successfully', quiz: quizzes[idx] });
});

// DELETE /api/quizzes/:id (Admin Only - Delete Quiz)
app.delete('/api/quizzes/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  let quizzes = await fetchCollection('quizzes');
  const initialLength = quizzes.length;
  quizzes = quizzes.filter(qz => qz.id !== id);

  if (quizzes.length === initialLength) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  await deleteDocFromCollection('quizzes', id);
  await saveDocToCollection('deleted_quizzes', id, {
    id,
    deletedAt: new Date().toISOString(),
    deletedBy: req.user.email || req.user.fullName || 'admin'
  });
  await writeJsonFile(QUIZZES_FILE, quizzes);

  res.json({ message: 'Quiz deleted successfully' });
});


// --- STUDENT QUIZ ATTEMPTS & ADMIN SCORE RECORDING ---

// POST /api/attempts (Save Student Quiz Attempt & Score - Enforce 1 Attempt per Quiz for Students)
app.post('/api/attempts', authenticateToken, async (req, res) => {
  const { quizId, quizTitle, score, totalQuestions, percentage, passed, timeSpentSeconds } = req.body;
  
  const attempts = await fetchCollection('attempts');

  // If student role taking a faculty posted quiz, enforce 1 attempt limit per quiz
  if (req.user.role === 'student' && quizId && quizId !== 'custom_quiz') {
    const existing = attempts.find(a => a.studentId === req.user.id && a.quizId === quizId);
    if (existing) {
      return res.status(400).json({ error: 'You have already completed this board quiz. Students are limited to 1 attempt per quiz.' });
    }
  }

  const users = await fetchCollection('users');
  const student = users.find(u => u.id === req.user.id);

  const newAttempt = {
    id: `att_${Date.now()}`,
    quizId: quizId || 'custom_quiz',
    quizTitle: quizTitle || 'Board Prep Quiz',
    studentId: req.user.id,
    studentName: req.user.fullName || (student ? student.fullName : 'Student'),
    studentEmail: req.user.email || (student ? student.email : 'N/A'),
    school: student ? (student.school || 'Mapúa University') : 'Mapúa University',
    score: parseInt(score) || 0,
    totalQuestions: parseInt(totalQuestions) || 50,
    percentage: String(percentage),
    passed: !!passed,
    timeSpentSeconds: parseInt(timeSpentSeconds) || 0,
    submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    moduleBreakdown: req.body.moduleBreakdown || null
  };

  attempts.unshift(newAttempt);
  await saveToCollection('attempts', attempts, 'id');
  res.json({ message: 'Quiz attempt recorded successfully', attempt: newAttempt });
});

// GET /api/attempts (Admin Only - Access Student Scores & Quiz Record logs)
app.get('/api/attempts', authenticateToken, requireAdmin, async (req, res) => {
  const attempts = await fetchCollection('attempts');
  res.json({ attempts });
});


// --- ADAPTIVE LEARNING & EXAM READINESS ENGINE ---

const CORE_MODULES = [
  'Module 1 - Power Plant Elements',
  'Module 2 - Power Plant Design',
  'Module 3 - Industrial Plant Engineering',
  'Module 4 - Industrial Plant Design',
  'Module 5 - Refrigeration Engineering',
  'Module 6 - Air Conditioning'
];

function normalizeModuleName(rawModule) {
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

async function calculateAdaptiveAnalytics(studentId) {
  const users = await fetchCollection('users');
  const attempts = await fetchCollection('attempts');
  
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
          const normMod = normalizeModuleName(rawMod);
          if (!moduleStats[normMod]) moduleStats[normMod] = { totalAttempts: 0, correctCount: 0, percentage: 0 };
          const b = att.moduleBreakdown[rawMod];
          moduleStats[normMod].totalAttempts += (b.total || 0);
          moduleStats[normMod].correctCount += (b.correct || 0);
        });
      }
    }
  });

  let sumMastery = 0;
  const strengths = [];
  const weaknesses = [];

  CORE_MODULES.forEach(mod => {
    const stat = moduleStats[mod];
    if (stat.totalAttempts > 0) {
      stat.percentage = Math.round((stat.correctCount / stat.totalAttempts) * 100);
    } else {
      stat.percentage = (isDiagnosticCompleted && !lastSimFailed) ? 65 : 0;
    }
    sumMastery += stat.percentage;

    if (stat.percentage >= 75) {
      strengths.push({ module: mod, percentage: stat.percentage });
    } else {
      weaknesses.push({ module: mod, percentage: stat.percentage });
    }
  });

  weaknesses.sort((a, b) => a.percentage - b.percentage);
  strengths.sort((a, b) => b.percentage - a.percentage);

  const readinessIndex = Math.round(sumMastery / CORE_MODULES.length);
  const simulationUnlocked = isDiagnosticCompleted && readinessIndex >= 75;
  const simulationAttemptsCount = simAttempts.length;
  const lastSimulationScore = simAttempts.length > 0 ? simAttempts[0].score : (student ? (student.simulationScore || 0) : 0);
  const needsRemediation = lastSimFailed;
  
  const isReadyForBoard = simulationPassed;

  let readinessStatus = 'Step 1: Diagnostic Benchmark Assessment Required';
  if (isDiagnosticCompleted) {
    if (isReadyForBoard) {
      readinessStatus = 'Congratulations, you are now ready to take the board exam.';
    } else if (needsRemediation) {
      readinessStatus = `Simulation Failed (${lastSimulationScore}%). Readiness Index reset to ${readinessIndex}%. Rebuild to 75% via Smart-Quizzes to unlock retake.`;
    } else if (simulationUnlocked) {
      readinessStatus = 'Step 4: Simulated Board Exam Unlocked (Readiness ≥ 75%)';
    } else {
      readinessStatus = `Step 3: Adaptive Targeted Practice Required (Current: ${readinessIndex}%, Target: 75%)`;
    }
  }

  return {
    studentId,
    diagnosticCompleted: isDiagnosticCompleted,
    diagnosticDate: student ? student.diagnosticDate : null,
    readinessIndex,
    simulationUnlocked,
    simulationPassed,
    simulationAttemptsCount,
    lastSimulationScore,
    needsRemediation,
    isReadyForBoard,
    readinessStatus,
    moduleMastery: moduleStats,
    strengths,
    weaknesses,
    recommendedFocusModule: weaknesses.length > 0 ? weaknesses[0].module : 'All Modules Mastered'
  };
}

// POST /api/adaptive/diagnostic/start (Generate 100-Item Diagnostic Benchmark)
app.post('/api/adaptive/diagnostic/start', authenticateToken, async (req, res) => {
  const questions = (await fetchCollection('questions')).filter(q => q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');
  
  let diagnosticQuestions = [];
  CORE_MODULES.forEach(mod => {
    const modQuestions = questions.filter(q => q.Module && q.Module.toLowerCase().includes(mod.toLowerCase().substring(0, 8)));
    const shuffled = [...modQuestions].sort(() => 0.5 - Math.random());
    diagnosticQuestions.push(...shuffled.slice(0, 17));
  });

  if (diagnosticQuestions.length < 100) {
    const existingIds = new Set(diagnosticQuestions.map(q => q.ID));
    const remaining = questions.filter(q => !existingIds.has(q.ID)).sort(() => 0.5 - Math.random());
    diagnosticQuestions.push(...remaining.slice(0, 100 - diagnosticQuestions.length));
  }

  diagnosticQuestions = diagnosticQuestions.sort(() => 0.5 - Math.random()).slice(0, 100);

  res.json({
    title: 'Step 1: Diagnostic Benchmark Assessment (100 Items)',
    durationMins: 90,
    totalQuestions: diagnosticQuestions.length,
    questions: diagnosticQuestions
  });
});

// POST /api/adaptive/diagnostic/submit (Record Diagnostic Benchmark Results)
app.post('/api/adaptive/diagnostic/submit', authenticateToken, async (req, res) => {
  const { userAnswers, timeSpentSeconds, questionDetails } = req.body;
  const users = await fetchCollection('users');
  const attempts = await fetchCollection('attempts');

  let score = 0;
  const moduleBreakdown = {};

  CORE_MODULES.forEach(m => {
    moduleBreakdown[m] = { total: 0, correct: 0 };
  });

  const detailedQuestions = questionDetails || [];
  detailedQuestions.forEach(q => {
    const mod = normalizeModuleName(q.Module);
    if (!moduleBreakdown[mod]) moduleBreakdown[mod] = { total: 0, correct: 0 };

    moduleBreakdown[mod].total++;
    const isCorrect = userAnswers[q.ID] === q.CorrectAnswer;
    if (isCorrect) {
      score++;
      moduleBreakdown[mod].correct++;
    }
  });

  const totalQs = detailedQuestions.length || 100;
  const pct = Math.round((score / totalQs) * 100);
  const passed = pct >= 70;

  const attemptRecord = {
    id: `att_diag_${Date.now()}`,
    quizId: 'diagnostic_benchmark',
    quizTitle: 'Diagnostic Benchmark Assessment',
    studentId: req.user.id,
    studentName: req.user.fullName,
    score,
    totalQuestions: totalQs,
    percentage: String(pct),
    passed,
    timeSpentSeconds: parseInt(timeSpentSeconds) || 0,
    submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    moduleBreakdown
  };

  attempts.unshift(attemptRecord);
  await saveToCollection('attempts', attempts, 'id');

  const userIdx = users.findIndex(u => u.id === req.user.id);
  if (userIdx !== -1) {
    users[userIdx].diagnosticCompleted = true;
    users[userIdx].diagnosticScore = pct;
    users[userIdx].diagnosticDate = new Date().toISOString().split('T')[0];
    await saveToCollection('users', users, 'id');
  }

  const analytics = await calculateAdaptiveAnalytics(req.user.id);
  res.json({
    message: 'Diagnostic Benchmark completed successfully!',
    score,
    totalQuestions: totalQs,
    percentage: pct,
    passed,
    moduleBreakdown,
    analytics
  });
});

// POST /api/adaptive/simulation/start (Step 4: Generate 100-Item Simulated Board Exam)
app.post('/api/adaptive/simulation/start', authenticateToken, async (req, res) => {
  const analytics = await calculateAdaptiveAnalytics(req.user.id);
  if (!analytics.simulationUnlocked) {
    return res.status(403).json({ 
      error: `Simulated Board Exam is locked. You must reach an Adaptive Board Readiness Index of at least 75% to unlock it. (Current Readiness Index: ${analytics.readinessIndex}%)` 
    });
  }

  const questions = (await fetchCollection('questions')).filter(q => q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');
  const simulationQuestions = [...questions].sort(() => 0.5 - Math.random()).slice(0, 100);

  res.json({
    title: 'Step 4: Simulated Board Exam (100 Items)',
    durationMins: 240,
    totalQuestions: simulationQuestions.length,
    questions: simulationQuestions
  });
});

// POST /api/adaptive/simulation/submit (Step 5: Record Simulation & Readiness Loop)
app.post('/api/adaptive/simulation/submit', authenticateToken, async (req, res) => {
  const { userAnswers, timeSpentSeconds, questionDetails } = req.body;
  const users = await fetchCollection('users');
  const attempts = await fetchCollection('attempts');

  let score = 0;
  const moduleBreakdown = {};

  CORE_MODULES.forEach(m => {
    moduleBreakdown[m] = { total: 0, correct: 0 };
  });

  const detailedQuestions = questionDetails || [];
  detailedQuestions.forEach(q => {
    const mod = normalizeModuleName(q.Module);
    if (!moduleBreakdown[mod]) moduleBreakdown[mod] = { total: 0, correct: 0 };

    moduleBreakdown[mod].total++;
    const isCorrect = userAnswers[q.ID] === q.CorrectAnswer;
    if (isCorrect) {
      score++;
      moduleBreakdown[mod].correct++;
    }
  });

  const totalQs = detailedQuestions.length || 100;
  const pct = Math.round((score / totalQs) * 100);
  const passed = pct >= 75;

  const attemptRecord = {
    id: `att_sim_${Date.now()}`,
    quizId: 'board_exam_simulation',
    quizTitle: 'Simulated Board Exam (Final Assessment)',
    studentId: req.user.id,
    studentName: req.user.fullName,
    score,
    totalQuestions: totalQs,
    percentage: String(pct),
    passed,
    timeSpentSeconds: parseInt(timeSpentSeconds) || 0,
    submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    moduleBreakdown
  };

  attempts.unshift(attemptRecord);
  await saveToCollection('attempts', attempts, 'id');

  const userIdx = users.findIndex(u => u.id === req.user.id);
  if (userIdx !== -1) {
    users[userIdx].simulationPassed = passed;
    users[userIdx].simulationScore = pct;
    users[userIdx].simulationAttemptsCount = (users[userIdx].simulationAttemptsCount || 0) + 1;
    await saveToCollection('users', users, 'id');
  }

  const analytics = await calculateAdaptiveAnalytics(req.user.id);
  res.json({
    message: passed 
      ? 'Congratulations, you are now ready to take the board exam.' 
      : 'Simulation score recorded. Continuous Feedback Loop engaged for Unlimited Remediation.',
    score,
    totalQuestions: totalQs,
    percentage: pct,
    passed,
    moduleBreakdown,
    analytics
  });
});

// GET /api/adaptive/analytics (Fetch Knowledge Gap & Readiness Data)
app.get('/api/adaptive/analytics', authenticateToken, async (req, res) => {
  const analytics = await calculateAdaptiveAnalytics(req.user.id);
  res.json(analytics);
});

// GET /api/adaptive/smart-quiz (Generate Targeted Practice Quiz for Weak Spots)
app.get('/api/adaptive/smart-quiz', authenticateToken, async (req, res) => {
  const analytics = await calculateAdaptiveAnalytics(req.user.id);
  const questions = (await fetchCollection('questions')).filter(q => q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');

  const weakModules = analytics.weaknesses.map(w => w.module);
  const targetWeakness = weakModules.length > 0 ? weakModules[0] : CORE_MODULES[0];

  const weakQuestions = questions.filter(q => q.Module && q.Module.toLowerCase().includes(targetWeakness.toLowerCase().substring(0, 8)));
  const shuffledWeak = [...weakQuestions].sort(() => 0.5 - Math.random());
  
  const selectedWeak = shuffledWeak.slice(0, 18);
  const weakIds = new Set(selectedWeak.map(q => q.ID));

  const remainingMixed = questions.filter(q => !weakIds.has(q.ID)).sort(() => 0.5 - Math.random()).slice(0, 7);
  const smartQuiz = [...selectedWeak, ...remainingMixed].sort(() => 0.5 - Math.random());

  res.json({
    title: `Adaptive Smart-Quiz: ${targetWeakness}`,
    targetModule: targetWeakness,
    totalQuestions: smartQuiz.length,
    questions: smartQuiz
  });
});

// POST /api/adaptive/smart-quiz/submit (Record Smart-Quiz Attempt & Instantly Update Module Statistics)
app.post('/api/adaptive/smart-quiz/submit', authenticateToken, async (req, res) => {
  const { userAnswers, timeSpentSeconds, questionDetails, targetModule } = req.body;
  const attempts = await fetchCollection('attempts');

  let score = 0;
  const moduleBreakdown = {};

  CORE_MODULES.forEach(m => {
    moduleBreakdown[m] = { total: 0, correct: 0 };
  });

  const detailedQuestions = questionDetails || [];
  detailedQuestions.forEach(q => {
    const mod = normalizeModuleName(q.Module);
    if (!moduleBreakdown[mod]) moduleBreakdown[mod] = { total: 0, correct: 0 };

    moduleBreakdown[mod].total++;
    const isCorrect = userAnswers[q.ID] === q.CorrectAnswer;
    if (isCorrect) {
      score++;
      moduleBreakdown[mod].correct++;
    }
  });

  const totalQs = detailedQuestions.length || 25;
  const pct = Math.round((score / totalQs) * 100);
  const passed = pct >= 75;

  const attemptRecord = {
    id: `att_smart_${Date.now()}`,
    quizId: 'adaptive_smart_quiz',
    quizTitle: `Adaptive Smart-Quiz (${targetModule || 'Weak Spot Practice'})`,
    studentId: req.user.id,
    studentName: req.user.fullName,
    score,
    totalQuestions: totalQs,
    percentage: String(pct),
    passed,
    timeSpentSeconds: parseInt(timeSpentSeconds) || 0,
    submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    moduleBreakdown
  };

  attempts.unshift(attemptRecord);
  await saveToCollection('attempts', attempts, 'id');

  const analytics = await calculateAdaptiveAnalytics(req.user.id);
  res.json({
    message: 'Smart-Quiz attempt recorded and statistics automatically updated!',
    score,
    totalQuestions: totalQs,
    percentage: pct,
    passed,
    moduleBreakdown,
    analytics
  });
});


// --- ADMIN USER MANAGEMENT ROUTES ---

// GET /api/users/full (Admin Only - Complete Master User Directory with Quiz Stats & Attempt Logs)
app.get('/api/users/full', authenticateToken, requireAdmin, async (req, res) => {
  let users = await fetchCollection('users');
  let deletedDocs = [];
  try {
    deletedDocs = await fetchCollection('deleted_users');
  } catch (e) {}
  const deletedIds = (deletedDocs || []).map(d => d.id).filter(Boolean);
  if (deletedIds.length > 0) {
    users = users.filter(u => !deletedIds.includes(u.id));
  }

  const attempts = await fetchCollection('attempts');

  const fullUserData = users.map(u => {
    const { passwordHash, ...userInfo } = u;
    const userAttempts = attempts.filter(a => a.studentId === u.id);
    const totalAttempts = userAttempts.length;
    const passedCount = userAttempts.filter(a => a.passed).length;
    const failedCount = totalAttempts - passedCount;
    const avgScore = totalAttempts > 0 
      ? (userAttempts.reduce((acc, a) => acc + parseFloat(a.percentage || 0), 0) / totalAttempts).toFixed(1)
      : '0.0';

    return {
      ...userInfo,
      stats: {
        totalAttempts,
        passedCount,
        failedCount,
        avgScore: parseFloat(avgScore)
      },
      attempts: userAttempts
    };
  });

  res.json({ users: fullUserData });
});

// GET /api/users (Admin Only)
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  let users = await fetchCollection('users');
  let deletedDocs = [];
  try {
    deletedDocs = await fetchCollection('deleted_users');
  } catch (e) {}
  const deletedIds = (deletedDocs || []).map(d => d.id).filter(Boolean);
  if (deletedIds.length > 0) {
    users = users.filter(u => !deletedIds.includes(u.id));
  }
  const sanitized = users.map(({ passwordHash, ...rest }) => rest);
  res.json({ users: sanitized });
});

// POST /api/users (Admin Create User)
app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  const { fullName, email, password, role, school } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }

  const users = await fetchCollection('users');
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Email is already registered.' });
  }

  const assignedRole = role === 'admin' ? 'admin' : 'student';
  if (assignedRole === 'admin') {
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (adminCount >= 4) {
      return res.status(400).json({ error: 'Maximum limit of 4 administrators reached. Only 4 admin accounts are allowed on this platform.' });
    }
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser = {
    id: `usr_${Date.now()}`,
    fullName,
    email: email.toLowerCase(),
    passwordHash,
    role: assignedRole,
    status: 'active',
    createdDate: new Date().toISOString().split('T')[0],
    school: school || 'N/A',
    targetExamDate: '2026-10-15'
  };

  users.push(newUser);
  await saveToCollection('users', users, 'id');

  const { passwordHash: _, ...sanitized } = newUser;
  res.json({ message: 'User created successfully', user: sanitized });
});

// PUT /api/users/:id (Admin Update User)
app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { fullName, role, status, school, targetExamDate } = req.body;
  const users = await fetchCollection('users');
  const idx = users.findIndex(u => u.id === id);

  if (idx === -1) return res.status(404).json({ error: 'User not found' });

  if (role === 'admin' && users[idx].role !== 'admin') {
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (adminCount >= 4) {
      return res.status(400).json({ error: 'Maximum limit of 4 administrators reached. Only 4 admin accounts are allowed on this platform.' });
    }
  }

  if (fullName) users[idx].fullName = fullName;
  if (role) users[idx].role = role;
  if (status) users[idx].status = status;
  if (school) users[idx].school = school;
  if (targetExamDate) users[idx].targetExamDate = targetExamDate;

  await saveToCollection('users', users, 'id');
  const { passwordHash: _, ...sanitized } = users[idx];
  res.json({ message: 'User updated successfully', user: sanitized });
});

// DELETE /api/users/:id (Admin Permanently Delete User)
app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  let users = await fetchCollection('users');
  const idx = users.findIndex(u => u.id === id);

  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  if (users[idx].id === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own active administrator account.' });
  }
  if (users[idx].role === 'admin') {
    return res.status(400).json({ error: 'System Protection: Administrator accounts cannot be deleted directly.' });
  }

  await deleteDocFromCollection('users', id);
  await saveDocToCollection('deleted_users', id, {
    id,
    deletedAt: new Date().toISOString(),
    deletedBy: req.user.email || 'admin'
  });

  users = users.filter(u => u.id !== id);
  await writeJsonFile(USERS_FILE, users);
  res.json({ message: 'User account permanently deleted successfully' });
});


// Serve Single Page Application Fallback
app.get('*', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function startServer() {
  await syncTime();
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`ME Licensure Board Prep Platform active on port ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

startServer();
