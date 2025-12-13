// Profile Management
class ProfileManager {
    currentUser = null;
    twoFactorEnabled = false;
    isEditMode = false;
  

  // Toggle between view and edit mode
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    this.updateEditUI();
  }

  updateEditUI() {
    const profileForm = document.getElementById('profileForm');
    const viewSection = document.getElementById('profileViewSection');
    const editBtn = document.getElementById('btnEditProfile');
    
    if (this.isEditMode) {
      if (profileForm) profileForm.style.display = 'block';
      if (viewSection) viewSection.style.display = 'none';
      if (editBtn) editBtn.textContent = 'Cancelar';
    } else {
      if (profileForm) profileForm.style.display = 'none';
      if (viewSection) viewSection.style.display = 'block';
      if (editBtn) editBtn.textContent = 'Editar';
    }
  }

  async loadProfile() {
    if (!globalThis.firebaseAuth) {
      setTimeout(() => this.loadProfile(), 500);
      return;
    }
    
    const user = firebase.auth().currentUser || authService.getCurrentUser();
    if (!user) {
      console.log('No user logged in, waiting...');
      setTimeout(() => {
        const retryUser = firebase.auth().currentUser;
        if (retryUser) {
          this.currentUser = retryUser;
          this.continueLoadProfile();
        } else {
          alert('Por favor inicia sesión para ver tu perfil');
          globalThis.location.href = '/index.html';
        }
      }, 1000);
      return;
    }
    
    this.currentUser = user;
    this.continueLoadProfile();
  }
  
  async continueLoadProfile() {
    try {
      if (!globalThis.firebaseDB) {
        console.warn('Firebase not initialized yet');
        this.populateProfileForm({
          displayName: this.currentUser.displayName || '',
          email: this.currentUser.email || '',
          photoURL: this.currentUser.photoURL || '/img/music-heart.png'
        });
        return;
      }
      
      const userDoc = await globalThis.firebaseDB.collection('users').doc(this.currentUser.uid).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        this.populateProfileForm(userData);
        this.populateProfileView(userData);
        await this.loadUserLikes();
        this.checkTwoFactorStatus();
      } else {
        const initialData = {
          uid: this.currentUser.uid,
          email: this.currentUser.email,
          displayName: this.currentUser.displayName || '',
          photoURL: this.currentUser.photoURL || '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await globalThis.firebaseDB.collection('users').doc(this.currentUser.uid).set(initialData);
        this.populateProfileForm(initialData);
        this.populateProfileView(initialData);
      }
      
      // Initialize edit mode UI
      this.updateEditUI();
    } catch (error) {
      console.error('Error loading profile:', error);
      showError('Error al cargar el perfil: ' + error.message);
      
      this.populateProfileForm({
        displayName: this.currentUser.displayName || '',
        email: this.currentUser.email || '',
        photoURL: this.currentUser.photoURL || '/img/music-heart.png'
      });
    }
  }

  populateProfileForm(userData) {
    // Campos del formulario de edición
    if (document.getElementById('profileName')) {
      document.getElementById('profileName').value = userData.displayName || '';
    }
    if (document.getElementById('profileLocation')) {
      document.getElementById('profileLocation').value = userData.location || '';
    }
    if (document.getElementById('profileBio')) {
      document.getElementById('profileBio').value = userData.bio || '';
    }
    if (document.getElementById('profileWebsite')) {
      document.getElementById('profileWebsite').value = userData.website || '';
    }
    
    // Imagen de perfil
    const photoURL = userData.photoURL || '/img/music-heart.png';
    if (document.getElementById('currentProfileImage')) {
      document.getElementById('currentProfileImage').src = photoURL;
    }
    if (document.getElementById('navUserPhoto')) {
      document.getElementById('navUserPhoto').src = photoURL;
    }
    
    // Banner
    if (userData.bannerImage && document.getElementById('currentBannerImage')) {
      document.getElementById('currentBannerImage').style.backgroundImage = `url(${userData.bannerImage})`;
      document.getElementById('currentBannerImage').style.backgroundSize = 'cover';
      document.getElementById('currentBannerImage').style.backgroundPosition = 'center';
    }
  }

populateProfileView(userData) {
  const elementMappings = [
    {
      id: 'viewDisplayName',
      value: userData.displayName || 'Usuario',
      isHtml: false
    },
    {
      id: 'viewEmail',
      value: userData.email || this.currentUser.email || '',
      isHtml: false
    },
    {
      id: 'viewLocation',
      value: userData.location || 'No especificado',
      isHtml: false
    },
    {
      id: 'viewBio',
      value: userData.bio || 'Sin biografía',
      isHtml: false
    },
    {
      id: 'viewWebsite',
      value: userData.website,
      isHtml: true,
      transform: (value) => value
        ? `<a href="${value}" target="_blank" class="text-purple-600 hover:text-purple-700">${value}</a>`
        : 'No especificado'
    }
  ];

  // Procesar cada mapeo de elemento
  elementMappings.forEach(mapping => {
    const element = document.getElementById(mapping.id);
    if (!element) return;

    if (mapping.isHtml && mapping.transform) {
      element.innerHTML = mapping.transform(mapping.value);
    } else {
      element.textContent = mapping.value;
    }
  });

  // Actualizar elementos adicionales de forma separada
  this.updateAdditionalDisplayElements(userData);
}

updateAdditionalDisplayElements(userData) {
  const additionalElements = [
    { id: 'displayName', value: userData.displayName || 'Usuario' },
    { id: 'displayEmail', value: userData.email || this.currentUser.email || '' },
    { id: 'navUserName', value: userData.displayName || 'Usuario' }
  ];

  additionalElements.forEach(item => {
    const element = document.getElementById(item.id);
    if (element) {
      element.textContent = item.value;
    }
  });
}

  async updateProfile(formData) {
    if (!this.currentUser) {
      showError('Usuario no autenticado', 'profileStatus');
      return;
    }
    
    try {
      showLoading('profileStatus');
      
      const updates = {
        displayName: formData.name,
        location: formData.location || '',
        bio: formData.bio || '',
        website: formData.website || '',
        email: this.currentUser.email,
        uid: this.currentUser.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await globalThis.firebaseDB.collection('users').doc(this.currentUser.uid).set(updates, { merge: true });
      
      await firebase.auth().currentUser.updateProfile({
        displayName: formData.name
      });
      
      showSuccess('Perfil actualizado correctamente', 'profileStatus');
      
      // Actualizar vista
      this.populateProfileView(updates);
      
      // Volver a modo lectura
      this.isEditMode = false;
      this.updateEditUI();
      
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Error al actualizar el perfil: ' + error.message, 'profileStatus');
    }
  }

  async uploadProfileImage(file) {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showError('Por favor selecciona una imagen válida', 'imageUploadStatus');
      return;
    }

    try {
      showLoading('imageUploadStatus');
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const imageUrl = e.target.result;
          
          // Actualizar UI inmediatamente
          const profileImg = document.getElementById('currentProfileImage');
          if (profileImg) {
            profileImg.src = imageUrl;
          }
          
          const navImg = document.getElementById('navUserPhoto');
          if (navImg) {
            navImg.src = imageUrl;
          }
          
          // Guardar en Firestore
          await globalThis.firebaseDB.collection('users').doc(this.currentUser.uid).set({
            photoURL: imageUrl
          }, { merge: true });
          
          // Actualizar Firebase Auth
          await firebase.auth().currentUser.updateProfile({
            photoURL: imageUrl
          });
          
          showSuccess('Imagen de perfil actualizada', 'imageUploadStatus');
        } catch (error) {
          console.error('Error in reader.onload:', error);
          showError('Error al procesar la imagen: ' + error.message, 'imageUploadStatus');
        }
      };
      
      reader.onerror = () => {
        showError('Error al leer el archivo', 'imageUploadStatus');
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      showError('Error al subir la imagen: ' + error.message, 'imageUploadStatus');
    }
  }

async uploadBannerImage(file) {
  if (!file) return;
  
  try {
    showLoading('bannerUploadStatus');
    
    if (!file.type.startsWith('image/')) {
      showError('Por favor selecciona una imagen válida', 'bannerUploadStatus');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      showError('La imagen debe ser menor a 5MB', 'bannerUploadStatus');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        // Verifica que sea una cadena válida
        const result = e.target.result;
        if (typeof result !== 'string') {
          throw newError('Formato de imagen no válido');
        }
        
        const imageUrl = result;
        
        // Actualizar UI inmediatamente
        const bannerEl = document.getElementById('currentBannerImage');
        if (bannerEl) {
          // SOLUCIÓN: Separar la lógica de escape
          const escapedImageUrl = imageUrl.replaceAll('"', String.raw`\"`);
          bannerEl.style.backgroundImage = `url("${escapedImageUrl}")`;
          bannerEl.style.backgroundSize = 'cover';
          bannerEl.style.backgroundPosition = 'center';
        }
        
        // Guardar en Firestore
        await globalThis.firebaseDB.collection('users').doc(this.currentUser.uid).update({
          bannerImage: imageUrl
        });
        
        showSuccess('Banner actualizado', 'bannerUploadStatus');
      } catch (error) {
        console.error('Error in reader.onload:', error);
        showError('Error al procesar el banner: ' + error.message, 'bannerUploadStatus');
      }
    };
    
    reader.onerror = () => {
      showError('Error al leer el archivo', 'bannerUploadStatus');
    };
    
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('Error uploading banner:', error);
    showError('Error al subir el banner: ' + error.message, 'bannerUploadStatus');
  }
}      

  async loadUserLikes() {
    try {
      const likes = await globalThis.firebaseDB.collection('likes')
        .where('userId', '==', this.currentUser.uid)
        .get();
      
      const container = document.getElementById('userLikesContainer');
      
      if (likes.empty) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No has dado me gusta a ninguna banda aún</p>';
        return;
      }
      
      let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
      
      for (const doc of likes.docs) {
        const likeData = doc.data();
        const bandDoc = await globalThis.firebaseDB.collection('bands').doc(likeData.bandId).get();
        
        if (bandDoc.exists) {
          const band = bandDoc.data();
          html += `
            <div class="bg-white rounded-lg p-4 shadow hover:shadow-lg transition">
              <div class="flex items-center gap-3">
                <img src="${band.image || '/img/music-heart.png'}" alt="${band.name}" class="w-16 h-16 rounded-lg">
                <div class="flex-1">
                  <h4 class="font-bold text-gray-900">${band.name}</h4>
                  <p class="text-sm text-gray-600">${band.genre}</p>
                  <p class="text-xs text-gray-500">${timeAgo(likeData.createdAt)}</p>
                </div>
                <button onclick="profileManager.unlikeBand('${likeData.bandId}')" class="text-red-500 hover:text-red-600">
                  <i class="fa fa-heart text-xl"></i>
                </button>
              </div>
            </div>
          `;
        }
      }
      
      html += '</div>';
      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  }

  async unlikeBand(bandId) {
    try {
      await dbService.likeBand(bandId);
      await this.loadUserLikes();
    } catch (error) {
      console.error('Error unliking band:', error);
    }
  }

  async enableTwoFactor() {
    try {
      showToast('Autenticación de dos factores habilitada (demo)', 'success');
      this.twoFactorEnabled = true;
      
      await globalThis.firebaseDB.collection('users').doc(this.currentUser.uid).update({
        twoFactorEnabled: true
      });
      
      this.updateTwoFactorUI();
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      showError('Error al habilitar 2FA');
    }
  }

  async disableTwoFactor() {
    try {
      showToast('Autenticación de dos factores deshabilitada', 'info');
      this.twoFactorEnabled = false;
      
      await globalThis.firebaseDB.collection('users').doc(this.currentUser.uid).update({
        twoFactorEnabled: false
      });
      
      this.updateTwoFactorUI();
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      showError('Error al deshabilitar 2FA');
    }
  }

  checkTwoFactorStatus() {
    globalThis.firebaseDB.collection('users').doc(this.currentUser.uid).get()
      .then(doc => {
        if (doc.exists) {
          this.twoFactorEnabled = doc.data().twoFactorEnabled || false;
          this.updateTwoFactorUI();
        }
      });
  }

  updateTwoFactorUI() {
    const statusEl = document.getElementById('twoFactorStatus');
    const btnEl = document.getElementById('btnToggleTwoFactor');
    
    if (this.twoFactorEnabled) {
      statusEl.textContent = 'Habilitado';
      statusEl.className = 'text-green-600 font-semibold';
      btnEl.textContent = 'Deshabilitar';
      btnEl.className = 'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded';
      btnEl.onclick = () => this.disableTwoFactor();
    } else {
      statusEl.textContent = 'Deshabilitado';
      statusEl.className = 'text-gray-500 font-semibold';
      btnEl.textContent = 'Habilitar';
      btnEl.className = 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded';
      btnEl.onclick = () => this.enableTwoFactor();
    }
  }
}

// Initialize profile manager
let profileManager;
if (globalThis.location.pathname.includes('profile.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    profileManager = new ProfileManager();
    profileManager.loadProfile();
    
    // Botón para toggle edit mode
    const editBtn = document.getElementById('btnEditProfile');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        profileManager.toggleEditMode();
      });
    }
    
    // Setup form handlers
    document.getElementById('profileForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = {
        name: document.getElementById('profileName').value,
        location: document.getElementById('profileLocation').value,
        bio: document.getElementById('profileBio').value,
        website: document.getElementById('profileWebsite').value
      };
      profileManager.updateProfile(formData);
    });
    
    // Image uploads
    document.getElementById('profileImageInput')?.addEventListener('change', (e) => {
      profileManager.uploadProfileImage(e.target.files[0]);
    });
    
    document.getElementById('bannerImageInput')?.addEventListener('change', (e) => {
      profileManager.uploadBannerImage(e.target.files[0]);
    });
  });
}