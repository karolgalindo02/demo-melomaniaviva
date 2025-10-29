// Firebase Configuration
// TODO: Replace these values with your actual Firebase project credentials
// Get these from: Firebase Console > Project Settings > General > Your apps > Web app

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
let app, auth, db;

try {
  // Check if Firebase is loaded
  if (typeof firebase !== 'undefined') {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    console.log('Firebase initialized successfully');
  } else {
    console.warn('Firebase SDK not loaded yet');
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

// Export for use in other modules
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDB = db;