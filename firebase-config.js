const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

// Path to your local service account key
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

let app;
if (getApps().length === 0) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || 'me-neust-website-v2'
      });
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', e);
      app = initializeApp({ projectId: 'me-neust-website-v2' });
    }
  } else if (fs.existsSync(serviceAccountPath)) {
    // Use service account for local development
    const serviceAccount = require(serviceAccountPath);
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || 'me-neust-website-v2'
    });
  } else {
    // Use Application Default Credentials for Cloud Run deployment
    app = initializeApp({
      projectId: 'me-neust-website-v2'
    });
  }
} else {
  app = getApps()[0];
}

const db = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });

module.exports = { app, db };
