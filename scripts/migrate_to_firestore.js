const { syncTime } = require('../time-sync');

async function main() {
  await syncTime();
  const { db } = require('../firebase-config');
  const fs = require('fs');
  const path = require('path');

  const dataDir = path.join(__dirname, '../data');

  async function migrateCollection(collectionName, fileName, idField = 'id') {
    const filePath = path.join(dataDir, fileName);
    if (!fs.existsSync(filePath)) {
      console.log(`File ${fileName} not found. Skipping...`);
      return;
    }

    console.log(`Migrating ${fileName} to Firestore collection '${collectionName}'...`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Firestore allows batch writes (up to 500 per batch)
    const CHUNK_SIZE = 450;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      const batch = db.batch();
      chunk.forEach(item => {
        const docId = item[idField] ? String(item[idField]) : db.collection(collectionName).doc().id;
        const docRef = db.collection(collectionName).doc(docId);
        batch.set(docRef, item);
      });
      await batch.commit();
      console.log(`Committed chunk ${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} items) for ${collectionName}`);
    }
    
    console.log(`Finished migrating ${data.length} records to ${collectionName}.`);
  }

  try {
    console.log('Starting migration to Firestore...');
    await migrateCollection('users', 'users.json');
    await migrateCollection('questions', 'questions.json', 'ID');
    await migrateCollection('quizzes', 'quizzes.json');
    await migrateCollection('attempts', 'attempts.json');
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

main();
