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
  loadEPs();
  setupEventListeners();
});

// ============ MUSIC PLAYER INTEGRATION ============

// Function to add band track to playlist
async function addBandTrackToPlaylist(bandId, trackIndex = 0) {
  try {
    const trackData = await dbService.getTrackData(bandId, trackIndex);
    
    if (globalThis.musicPlayer && trackData.url) {
      globalThis.musicPlayer.addToPlaylist(trackData);
      showToast('Canción agregada a la playlist', 'success');
    } else {
      showError('No se pudo cargar la canción');
    }
  } catch (error) {
    console.error('Error adding band track to playlist:', error);
    showError('Error al cargar la canción');
  }
}

// Function to play band track immediately
async function playBandTrack(bandId, trackIndex = 0) {
  try {
    const trackData = await dbService.getTrackData(bandId, trackIndex);
    
    if (globalThis.musicPlayer && trackData.url) {
      globalThis.musicPlayer.addToPlaylist(trackData);
      globalThis.musicPlayer.playTrack(globalThis.musicPlayer.playlist.length - 1);
      showToast('Reproduciendo canción', 'success');
    } else {
      showError('No se pudo cargar la canción para reproducir');
    }
  } catch (error) {
    console.error('Error playing band track:', error);
    showError('Error al reproducir la canción');
  }
}

// ============ LOAD BAND TRACKS WHEN SECTION OPENS ============

async function loadBandTrack(bandId) {
  try {
    const trackData = await dbService.getTrackData(bandId, 0);
    const audioElement = document.getElementById(`audio-${bandId}`);
    
    if (audioElement && trackData.url) {
      // Actualizar la fuente del audio
      const source = audioElement.querySelector('source');
      source.src = trackData.url;
      audioElement.load(); // Recargar el elemento de audio
      
      console.log(`Audio source updated for ${bandId}:`, trackData.url);
    } else {
      console.warn(`No audio element or URL found for ${bandId}`);
    }
  } catch (error) {
    console.error(`Error loading track for ${bandId}:`, error);
  }
}

// Modifica la función toggleBlogSection para cargar el track cuando se abra
function toggleBlogSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    const wasHidden = section.classList.contains('hidden');
    section.classList.toggle('hidden');
    
    // Cargar track y comentarios cuando la sección se abre
    if (wasHidden) {
      const bandMap = {
        'demo1': 'distimia',
        'demo2': 'margarita', 
        'demo3': 'nicolas',
        'demo4': 'lhmf'
      };
      
      const bandId = bandMap[sectionId];
      if (bandId) {
        // Cargar el track de la banda
        loadBandTrack(bandId);
        // Cargar los comentarios
        loadComments(bandId);
      }
    }
  }
}

// ============ LOAD DYNAMIC CONTENT ============

async function loadRecentEvents() {
  const container = document.getElementById('recentEventsContainer');
  if (!container) return;
  
  showLoading('recentEventsContainer');
  
  try {
    const events = await dbService.getUpcomingEvents(5);
    
    if (events.length === 0) {
      container.innerHTML = '<div class="col-span-2"><p class="text-gray-500 text-center py-4">No hay eventos próximos</p></div>';
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
    container.innerHTML = '<div class="col-span-2"><p class="text-gray-500 text-center py-4">Error al cargar eventos</p></div>';
  }
}

async function loadRecentAlbums() {
  const container = document.getElementById('recentAlbumsContainer');
  if (!container) return;
  
  showLoading('recentAlbumsContainer');
  
  try {
    if (!globalThis.firebaseDB) {
      console.log('Firebase not initialized, using placeholder data');
      container.innerHTML = `
        <div class="text-center py-4">
          <p class="text-gray-500 mb-2">Configura Firebase para ver álbums reales</p>
        </div>
      `;
      return;
    }
    const albums = await dbService.getRecentAlbums(8);
    
    if (albums.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-4">No hay álbums recientes</p>';
      return;
    }
    
    let html = '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">';
    albums.forEach(album => {
      html += `
        <div class="card-hover fade-in">
        <a href="/album.html?id=${album.id}">
          <img src="${album.coverImage || '/img/album1.jpg'}" alt="${album.title}" class="w-full rounded-lg shadow-lg">
          <p class="text-white text-sm mt-2 font-semibold">${album.title}</p>
          <p class="text-gray-400 text-xs">${album.bandName}</p>
        </a>
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
    if (!globalThis.firebaseDB) {
      console.log('Firebase not initialized, using placeholder data');
      container.innerHTML = `
        <div class="text-center py-8">
          <p class="text-gray-500 mb-2">Configura Firebase para ver noticias reales</p>
        </div>
      `;
      return;
    }
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

// ============ LOAD EPS ============

async function loadEPs() {
  const container = document.getElementById('epsContainer');
  if (!container) return;
  
  showLoading('epsContainer');
  
  try {
    if (!globalThis.firebaseDB) {
      console.log('Firebase not initialized, using placeholder data');
      container.innerHTML = `
        <li class="p-4 hover:bg-gray-50 transition">
          <div class="flex gap-3">
            <img src="/img/buha-album1.jpg" alt="cansancio-hastio" class="w-16 h-16 rounded">
            <div class="flex-1">
              <p class="font-semibold">Cansancio Hastio</p>
              <p class="text-sm text-gray-600">BUHA 2030</p>
              <p class="text-xs text-gray-500 mt-1">Configura Firebase para reproducir</p>
            </div>
          </div>
        </li>
      `;
      return;
    }
    
    const eps = await dbService.getEPs(10);
    
    if (eps.length === 0) {
      container.innerHTML = '<li class="p-4"><p class="text-gray-500 text-center">No hay EPs disponibles</p></li>';
      return;
    }
    
    let html = '';
    eps.forEach(ep => {
      html += `
        <li class="p-4 hover:bg-gray-50 transition fade-in">
          <div class="flex gap-3">
            <img
              src="${ep.albumArtUrl || '/img/music-heart.png'}"
              alt="${ep.songName}"
              class="w-16 h-16 rounded flex-shrink-0"
            />
            <div class="flex-1">
              <p class="font-semibold">${ep.songName}</p>
              <p class="text-sm text-gray-600">${ep.bandName}</p>
              <div class="flex gap-2 mt-2">
                <button
                  onclick="addEpToPlaylist('${ep.id}')"
                  class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs transition"
                  title="Agregar a playlist"
                >
                  <i class="fa fa-plus"></i>
                </button>
                <button
                  onclick="playEp('${ep.id}')"
                  class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition"
                  title="Reproducir"
                >
                  <i class="fa fa-play"></i>
                </button>
              </div>
            </div>
          </div>
        </li>
      `;
    });
    
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading EPs:', error);
    container.innerHTML = '<li class="p-4"><p class="text-red-500 text-center">Error al cargar EPs</p></li>';
  }
}

// Function to add EP to playlist
async function addEpToPlaylist(epId) {
  try {
    const trackData = await dbService.getEPTrackData(epId);
    
    if (globalThis.musicPlayer && trackData.url) {
      globalThis.musicPlayer.addToPlaylist(trackData);
      showToast('EP agregado a la playlist', 'success');
    } else {
      showError('No se pudo cargar el EP');
    }
  } catch (error) {
    console.error('Error adding EP to playlist:', error);
    showError('Error al cargar el EP');
  }
}

// Function to play EP immediately
async function playEp(epId) {
  try {
    const trackData = await dbService.getEPTrackData(epId);
    
    if (globalThis.musicPlayer && trackData.url) {
      globalThis.musicPlayer.addToPlaylist(trackData);
      globalThis.musicPlayer.playTrack(globalThis.musicPlayer.playlist.length - 1);
      showToast('Reproduciendo EP', 'success');
    } else {
      showError('No se pudo reproducir el EP');
    }
  } catch (error) {
    console.error('Error playing EP:', error);
    showError('Error al reproducir el EP');
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
    if (!globalThis.firebaseDB) {
      container.innerHTML = '<p class="text-gray-500 text-sm">Configura Firebase para ver comentarios</p>';
      return;
    }
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
}

// Make functions globally available
globalThis.likeBand = likeBand;
globalThis.loadComments = loadComments;
globalThis.addComment = addComment;
globalThis.viewNewsDetail = viewNewsDetail;
globalThis.toggleBlogSection = toggleBlogSection;
globalThis.addBandTrackToPlaylist = addBandTrackToPlaylist;
globalThis.playBandTrack = playBandTrack;
globalThis.addEpToPlaylist = addEpToPlaylist;
globalThis.playEp = playEp;