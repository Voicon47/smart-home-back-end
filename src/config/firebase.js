// /src/config/firebase.js
import admin from 'firebase-admin';
import serviceAccount from './firebase-service-account.json'; // download from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export default admin;
