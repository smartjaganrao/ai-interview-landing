import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase config - these are public client-side keys (NEXT_PUBLIC_*)
// Safe to hardcode as they're exposed in the client bundle anyway
// Real security comes from Firestore Security Rules, not hiding these keys
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBm_MFHfjHS7nL5fHYP9BiMMntgiiNi8pE',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'ai-interview-tutor.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ai-interview-tutor',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ai-interview-tutor.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '475876914174',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:475876914174:web:caceda87b97359476546af',
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  db = getFirestore(app);

  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[Firebase] Initialized for project:', firebaseConfig.projectId);
  }
} catch (error) {
  console.error('[Firebase] Initialization error:', error);
  throw error;
}

export { auth, db, app };
