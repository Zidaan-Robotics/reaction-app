import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

console.log('Firebase config file loaded');

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase config is properly loaded
const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;
console.log('Firebase config check:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasProjectId: !!firebaseConfig.projectId,
  hasAuthDomain: !!firebaseConfig.authDomain,
  apiKeyPreview: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING',
  projectId: firebaseConfig.projectId || 'MISSING',
});

if (!hasConfig) {
  const errorMsg = '❌ Firebase configuration is missing! Environment variables not found.';
  console.error(errorMsg);
  console.error('Expected environment variables:');
  console.error('  VITE_FIREBASE_API_KEY');
  console.error('  VITE_FIREBASE_AUTH_DOMAIN');
  console.error('  VITE_FIREBASE_PROJECT_ID');
  console.error('  VITE_FIREBASE_STORAGE_BUCKET');
  console.error('  VITE_FIREBASE_MESSAGING_SENDER_ID');
  console.error('  VITE_FIREBASE_APP_ID');
  console.error('\nFor production builds, make sure your .env file exists when running "npm run build"');
  console.error('Or create a .env.production file with your Firebase config values.');
  
  // Show user-friendly error in production
  if (import.meta.env.PROD) {
    throw new Error('Firebase configuration is missing. Please check your environment variables.');
  }
}

let app;
let auth;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized with project:', firebaseConfig.projectId || 'UNKNOWN');

  // Initialize Firebase Authentication and get a reference to the service
  auth = getAuth(app);
  console.log('✅ Firebase Auth initialized');

  // Set persistence to browserLocalPersistence so auth state persists across browser sessions
  // This means users stay logged in even after closing the browser or server
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('✅ Auth persistence set to browserLocalPersistence');
    })
    .catch((error) => {
      console.error('❌ Error setting auth persistence:', error);
    });
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error);
  throw error;
}

export { auth };
export default app;



