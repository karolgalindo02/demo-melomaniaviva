// Authentication Module

class AuthService {
  constructor() {
    this.currentUser = null;
    this.initAuthListener();
  }

  // Listen for auth state changes
  initAuthListener() {
    if (window.firebaseAuth) {
      window.firebaseAuth.onAuthStateChanged((user) => {
        this.currentUser = user;
        this.updateUI(user);
      });
    }
  }

  // Update UI based on auth state
  updateUI(user) {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    const heroBtnLogin = document.getElementById('heroBtnLogin');
    
    if (user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (heroBtnLogin) heroBtnLogin.style.display = 'none';
      if (userInfo) {
        userInfo.style.display = 'block';
        userInfo.innerHTML = `
          <div class="flex items-center gap-2">
            <img src="${user.photoURL || '/img/music-heart.png'}" alt="User" class="w-8 h-8 rounded-full">
            <span class="text-white">${user.displayName || user.email}</span>
            <button onclick="authService.logout()" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">Salir</button>
          </div>
        `;
      }
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (heroBtnLogin) heroBtnLogin.style.display = 'block';
      if (userInfo) userInfo.style.display = 'none';
    }
  }

  // Email/Password Login
  async loginWithEmail(email, password) {
    try {
      const result = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
      console.log('Login successful:', result.user);
      return result.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Email/Password Registration
  async registerWithEmail(email, password, displayName) {
    try {
      const result = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
      
      // Update profile with display name
      await result.user.updateProfile({
        displayName: displayName
      });
      
      // Create user document in Firestore
      await this.createUserDocument(result.user);
      
      console.log('Registration successful:', result.user);
      return result.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Google OAuth Login
  async loginWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await window.firebaseAuth.signInWithPopup(provider);
      await this.createUserDocument(result.user);
      
      console.log('Google login successful:', result.user);
      return result.user;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  // Create user document in Firestore
  async createUserDocument(user) {
    if (!window.firebaseDB) return;
    
    const userRef = window.firebaseDB.collection('users').doc(user.uid);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      await userRef.set({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await userRef.update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  // Logout
  async logout() {
    try {
      await window.firebaseAuth.signOut();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.currentUser !== null;
  }
}

// Initialize auth service
const authService = new AuthService();