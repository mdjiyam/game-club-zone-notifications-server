const admin = require('firebase-admin');

let app = null;

function initializeFirebase() {
  if (app) return app;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!projectId || !databaseURL || !serviceAccountJson) {
    throw new Error(
      'Missing required Firebase environment variables: FIREBASE_PROJECT_ID, FIREBASE_DATABASE_URL, FIREBASE_SERVICE_ACCOUNT'
    );
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch (err) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT must be a valid JSON string');
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL,
    projectId: projectId,
  });

  console.log('✅ Firebase Admin initialized successfully');
  return app;
}

function getDatabase() {
  if (!app) initializeFirebase();
  return admin.database();
}

function getMessaging() {
  if (!app) initializeFirebase();
  return admin.messaging();
}

module.exports = {
  initializeFirebase,
  getDatabase,
  getMessaging,
  admin,
};
