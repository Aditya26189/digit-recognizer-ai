// Firebase v9+ modular SDK imports
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let auth = null;
let storage = null;
let db = null;
let googleProvider = null;

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  // Initialize Firebase services
  auth = getAuth(app);
  storage = getStorage(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();

} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Export Firebase services
export { auth, storage, db, googleProvider };
