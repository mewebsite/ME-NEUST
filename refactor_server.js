const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
let code = fs.readFileSync(serverFile, 'utf8');

// 1. Add firebase-config import
code = code.replace(
  "const cors = require('cors');",
  "const cors = require('cors');\nconst { db } = require('./firebase-config');"
);

// 2. Remove readJSON and writeJSON logic
code = code.replace(/function readJSON[\s\S]*?function writeJSON[\s\S]*?\}\n/m, 
`
async function fetchCollection(collectionName) {
  try {
    const snapshot = await db.collection(collectionName).get();
    return snapshot.docs.map(doc => doc.data());
  } catch (e) {
    console.error('Error fetching collection ' + collectionName, e);
    return [];
  }
}

async function saveToCollection(collectionName, data, idField = 'id') {
  try {
    const batch = db.batch();
    // For simplicity of migration, we overwrite the whole collection (not ideal for production but matches current JSON replace behavior)
    data.forEach(item => {
      const ref = db.collection(collectionName).doc(String(item[idField]));
      batch.set(ref, item);
    });
    await batch.commit();
    if (collectionName === 'questions') {
      syncCSV(data);
    }
  } catch (e) {
    console.error('Error saving collection ' + collectionName, e);
  }
}
`
);

// 3. Make all routes async
code = code.replace(/app\.(get|post|put|delete)\('([^']+)',\s*(?:(?:authenticateToken|requireAdmin|authenticateToken,\s*requireAdmin),\s*)?\(\s*req,\s*res\s*\)\s*=>\s*\{/g, (match) => {
  return match.replace('(req, res) => {', 'async (req, res) => {');
});

// 4. Replace readJSON calls with await fetchCollection
code = code.replace(/readJSON\(USERS_FILE\)/g, "await fetchCollection('users')");
code = code.replace(/readJSON\(QUESTIONS_FILE\)/g, "await fetchCollection('questions')");
code = code.replace(/readJSON\(QUIZZES_FILE\)/g, "await fetchCollection('quizzes')");
code = code.replace(/readJSON\(ATTEMPTS_FILE\)/g, "await fetchCollection('attempts')");

// 5. Replace writeJSON calls with await saveToCollection
code = code.replace(/writeJSON\(USERS_FILE,\s*([^\)]+)\)/g, "await saveToCollection('users', $1, 'id')");
code = code.replace(/writeJSON\(QUESTIONS_FILE,\s*([^\)]+)\)/g, "await saveToCollection('questions', $1, 'ID')");
code = code.replace(/writeJSON\(QUIZZES_FILE,\s*([^\)]+)\)/g, "await saveToCollection('quizzes', $1, 'id')");
code = code.replace(/writeJSON\(ATTEMPTS_FILE,\s*([^\)]+)\)/g, "await saveToCollection('attempts', $1, 'id')");

// Also replace writeJSON(QUESTIONS_FILE, questions) to await saveToCollection('questions', questions, 'ID')
// Note: $1 already captures the variable name.

// 6. Any stray `calculateAdaptiveAnalytics` which isn't async but uses file read:
// Wait, calculateAdaptiveAnalytics doesn't read files directly, the caller passes the data.
// Let's verify this manually later.

fs.writeFileSync(path.join(__dirname, 'server-firestore.js'), code, 'utf8');
console.log('Refactored server.js into server-firestore.js');
