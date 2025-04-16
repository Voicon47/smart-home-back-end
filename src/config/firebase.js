// /src/config/firebase.js
import admin from 'firebase-admin';
// import serviceAccount from './firebase-service-account.json'; // download from Firebase Console
import { env } from './environment';

admin.initializeApp({
  credential: admin.credential.cert({
    "projectId": env.FIREBASE_PROJECT_ID,
    "private_key": env.FIREBASE_PRIVATE_KEY,
    "client_email": env.FIREBASE_CLIENT_EMAIL,
  }),
  databaseURL: ""
});

export default admin;
