// Firebase Configuration
// Get these from: Firebase Console > Project Settings > General > Your apps > Web app

const firebaseConfig = {
    apiKey: "AIzaSyAGwr_x0O5ey-llKbhxoFiTUOnsSD8za-c",
    authDomain: "melomania-viva.firebaseapp.com",
    projectId: "melomania-viva",
    storageBucket: "melomania-viva.firebasestorage.app",
    messagingSenderId: "803225895839",
    appId: "1:803225895839:web:37269cfe18e6b438fbf3aa",
    measurementId: "G-04Z9KD60E6"
};

// Initialize Firebase
let app, auth, db;

try {
  // Check if Firebase is loaded
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded yet');
  } else {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    console.log('Firebase initialized successfully');
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

// Export for use in other modules
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDB = db;