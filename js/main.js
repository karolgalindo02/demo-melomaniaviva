// Main Application Script

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Melomania Viva! - Initializing...');
  
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
  
  // Track visit
  if (globalThis.firebaseDB) {
    const user = authService.getCurrentUser();
    dbService.trackVisit(user ? user.uid : null);
  }
  
  // Load dynamic content
  loadRecentEvents();
  loadRecentAlbums();
  loadNews();
  loadVisitorStats();
  
  // Setup event listeners
  setupEventListeners();
});

// ============ LOAD DYNAMIC CONTENT ============

async function loadRecentEvents() {
  const container = document.getElementById('recentEventsContainer');
  if (!container) return;
  
  showLoading('recentEventsContainer');
  
  try {
    const events = await dbService.getUpcomingEvents(5);
    
    if (events.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-4">No hay eventos próximos</p>';
      return;
    }
    
    let html = '';
    events.forEach(event => {
      html += `
        <div class="bg-gray-800 rounded-lg p-4 card-hover fade-in">
          <img src="${event.image || '/img/banner.jpg'}" alt="${event.title}" class="w-full h-40 object-cover rounded-lg mb-3">
          <h4 class="text-xl font-bold text-white mb-2">${event.title}</h4>
          <p class="text-gray-300 text-sm mb-2">${formatDate(event.date)}</p>
          <p class="text-gray-400 text-sm mb-2">${event.venue || ''}</p>
          <p class="text-gray-300 text-sm">${event.description || ''}</p>
          ${event.ticketUrl ? `<a href="${event.ticketUrl}" target="_blank" class="inline-block mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">Ver tickets</a>` : ''}
        </div>
      `;
    });
    
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading events:', error);
    container.innerHTML = '<p class="text-gray-500 text-center py-4">Error al cargar eventos</p>';
  }
}

async function loadRecentAlbums() {
  const container = document.getElementById('recentAlbumsContainer');
  if (!container) return;
  
  showLoading('recentAlbumsContainer');
  
  try {
    const albums = await dbService.getRecentAlbums(8);
    
    if (albums.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-4">No hay álbums recientes</p>';
      return;
    }
    
    let html = '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">';
    albums.forEach(album => {
      html += `
        <div class="card-hover fade-in">
          <img src="${album.coverImage || '/img/album1.jpg'}" alt="${album.title}" class="w-full rounded-lg shadow-lg">
          <p class="text-white text-sm mt-2 font-semibold">${album.title}</p>
          <p class="text-gray-400 text-xs">${album.bandName}</p>
        </div>
      `;
    });
    html += '</div>';
    
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading albums:', error);
    container.innerHTML = '<p class="text-gray-500 text-center py-4">Error al cargar álbums</p>';
  }
}

async function loadNews() {
  const container = document.getElementById('newsContainer');
  if (!container) return;
  
  showLoading('newsContainer');
  
  try {
    const news = await dbService.getNews(5);
    
    if (news.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-4">No hay noticias recientes</p>';
      return;
    }
    
    let html = '';
    news.forEach(item => {
      html += `
        <article class="bg-white rounded-lg overflow-hidden shadow-lg card-hover fade-in mb-4">
          ${item.image ? `<img src="${item.image}" alt="${item.title}" class="w-full h-48 object-cover">` : ''}
          <div class="p-4">
            <h3 class="text-xl font-bold text-gray-900 mb-2">${item.title}</h3>
            <p class="text-gray-600 text-sm mb-2">${item.author} - ${timeAgo(item.publishedAt)}</p>
            <p class="text-gray-700">${item.content.substring(0, 200)}...</p>
            <button onclick="viewNewsDetail('${item.id}')" class="mt-3 text-purple-600 hover:text-purple-700 font-semibold">Leer más →</button>
          </div>
        </article>
      `;
    });
    
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading news:', error);
    container.innerHTML = '<p class="text-gray-500 text-center py-4">Error al cargar noticias</p>';
  }
}

async function loadVisitorStats() {
  const container = document.getElementById('visitorStats');
  if (!container) return;
  
  try {
    const stats = await dbService.getVisitStats();
    container.innerHTML = `
      <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 text-white">
        <p class="text-3xl font-bold">${stats.total}</p>
        <p class="text-sm">Visitantes recientes</p>
      </div>
    `;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// ============ EVENT LISTENERS ============

function setupEventListeners() {
  // Subscribe form
  const subscribeForm = document.getElementById('subscribeForm');
  if (subscribeForm) {
    subscribeForm.addEventListener('submit', handleSubscribe);
  }
  
  // Login forms
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
  
  // Social login buttons
  const instagramLoginBtn = document.getElementById('instagramLoginBtn');
  if (instagramLoginBtn) {
    instagramLoginBtn.addEventListener('click', handleInstagramLogin);
  }
  
  const bandcampLoginBtn = document.getElementById('bandcampLoginBtn');
  if (bandcampLoginBtn) {
    bandcampLoginBtn.addEventListener('click', handleBandcampLogin);
  }
  
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', handleGoogleLogin);
  }
}

// ============ HANDLERS ============

async function handleSubscribe(e) {
  e.preventDefault();
  
  const emailInput = e.target.querySelector('input[type="email"]');
  const email = emailInput.value.trim();
  
  if (!email) {
    showError('Por favor ingresa un email válido');
    return;
  }
  
  try {
    await dbService.subscribe(email);
    showSuccess('¡Suscripción exitosa! Recibirás las últimas novedades.');
    emailInput.value = '';
    toggleModal('subscribeModal');
  } catch (error) {
    showError(error.message);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = e.target.querySelector('input[name="email"]').value;
  const password = e.target.querySelector('input[name="password"]').value;
  
  try {
    await authService.loginWithEmail(email, password);
    showSuccess('¡Inicio de sesión exitoso!');
    toggleModal('loginModal');
  } catch (error) {
    showError('Error al iniciar sesión: ' + error.message);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  const name = e.target.querySelector('input[name="name"]').value;
  const email = e.target.querySelector('input[name="email"]').value;
  const password = e.target.querySelector('input[name="password"]').value;
  
  if (password.length < 6) {
    showError('La contraseña debe tener al menos 6 caracteres');
    return;
  }
  
  try {
    await authService.registerWithEmail(email, password, name);
    showSuccess('¡Registro exitoso!');
    toggleModal('registerModal');
  } catch (error) {
    showError('Error al registrarse: ' + error.message);
  }
}

async function handleInstagramLogin() {
  try {
    await authService.loginWithInstagram();
    showSuccess('¡Inicio de sesión con Instagram exitoso!');
    toggleModal('loginModal');
  } catch (error) {
    // Error already shown in auth service
  }
}

async function handleBandcampLogin() {
  try {
    await authService.loginWithBandcamp();
    showSuccess('¡Inicio de sesión con Bandcamp exitoso!');
    toggleModal('loginModal');
  } catch (error) {
    // Error already shown in auth service
  }
}

async function handleGoogleLogin() {
  try {
    await authService.loginWithGoogle();
    showSuccess('¡Inicio de sesión con Google exitoso!');
    toggleModal('loginModal');
  } catch (error) {
    showError('Error al iniciar sesión con Google: ' + error.message);
  }
}

// ============ BAND INTERACTIONS ============

async function likeBand(bandId) {
  try {
    const liked = await dbService.likeBand(bandId);
    const btn = document.querySelector(`[data-band-id="${bandId}"]`);
    
    if (btn) {
      if (liked) {
        btn.classList.add('liked');
        btn.innerHTML = '<i class="fa fa-heart"></i> Me gusta';
      } else {
        btn.classList.remove('liked');
        btn.innerHTML = '<i class="fa fa-heart-o"></i> Me gusta';
      }
    }
  } catch (error) {
    showError(error.message);
  }
}

// ============ COMMENTS ============

async function loadComments(bandId) {
  const container = document.getElementById(`comments-${bandId}`);
  if (!container) return;
  
  showLoading(`comments-${bandId}`);
  
  try {
    const comments = await dbService.getComments(bandId);
    
    if (comments.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-sm">No hay comentarios aún. ¡Sé el primero!</p>';
      return;
    }
    
    let html = '<div class="space-y-3">';
    comments.forEach(comment => {
      html += `
        <div class="bg-gray-50 rounded p-3">
          <div class="flex items-center gap-2 mb-2">
            <img src="${comment.userPhoto || '/img/music-heart.png'}" alt="${comment.userName}" class="w-8 h-8 rounded-full">
            <div>
              <p class="font-semibold text-sm">${comment.userName}</p>
              <p class="text-xs text-gray-500">${timeAgo(comment.createdAt)}</p>
            </div>
          </div>
          <p class="text-gray-700 text-sm">${comment.text}</p>
        </div>
      `;
    });
    html += '</div>';
    
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading comments:', error);
    container.innerHTML = '<p class="text-red-500 text-sm">Error al cargar comentarios</p>';
  }
}

async function addComment(bandId) {
  const input = document.querySelector(`#comment-input-${bandId}`);
  if (!input) return;
  
  const text = input.value.trim();
  if (!text) {
    showError('El comentario no puede estar vacío');
    return;
  }
  
  try {
    await dbService.addComment({ text, bandId });
    input.value = '';
    showSuccess('Comentario agregado');
    loadComments(bandId);
  } catch (error) {
    showError(error.message);
  }
}

// ============ UTILITY FUNCTIONS ============

function viewNewsDetail(newsId) {
  // Navigate to news detail or show modal
  console.log('Viewing news:', newsId);
  // TODO: Implement news detail view
}

function toggleBlogSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.toggle('hidden');
  }
}

// Make functions globally available
window.likeBand = likeBand;
window.loadComments = loadComments;
window.addComment = addComment;
window.viewNewsDetail = viewNewsDetail;
window.toggleBlogSection = toggleBlogSection;
