// Albums Management

class AlbumManager {
  constructor() {
    this.currentAlbum = null;
  }

  async loadAlbum(albumId) {
    try {
      showLoading('albumContent');
      
      const albumDoc = await window.firebaseDB.collection('albums').doc(albumId).get();
      
      if (!albumDoc.exists) {
        showError('Álbum no encontrado');
        return;
      }
      
      this.currentAlbum = { id: albumDoc.id, ...albumDoc.data() };
      this.renderAlbum();
      
      // Increment views
      await window.firebaseDB.collection('albums').doc(albumId).update({
        views: firebase.firestore.FieldValue.increment(1)
      });
    } catch (error) {
      console.error('Error loading album:', error);
      showError('Error al cargar el álbum');
    }
  }
// Agrega esta función a la clase AlbumManager
getTrackData(index) {
    const track = this.currentAlbum.tracks[index];
    
    if (typeof track === 'object' && track !== null && track.url) {
        return {
            title: track.title,
            artist: this.currentAlbum.bandName,
            url: track.url,
            albumArt: this.currentAlbum.coverImage
        };
    }
    
    return {
        title: typeof track === 'string' ? track : `Canción ${index + 1}`,
        artist: this.currentAlbum.bandName,
        url: typeof track === 'string' ? `/music/song${index + 1}.mp3` : '', 
        albumArt: this.currentAlbum.coverImage
    };
}


playTrack(index) {
    const trackData = this.getTrackData(index);
    
    window.musicPlayer.addToPlaylist(trackData);
    window.musicPlayer.playTrack(window.musicPlayer.playlist.length - 1);
}

addTrackToPlaylist(index) {
    const trackData = this.getTrackData(index);
    
    window.musicPlayer.addToPlaylist(trackData);
}
  renderAlbum() {
    if (!this.currentAlbum) return;
    
    const container = document.getElementById('albumContent');
    
    const html = `
      <div class="max-w-7xl mx-auto px-4 py-8">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div class="md:col-span-1">
      <img src="${this.currentAlbum.coverImage || '/img/album1.jpg'}" 
           alt="${this.currentAlbum.title}" 
           class="w-full rounded-lg shadow-2xl mb-4">
      
      <div class="bg-white rounded-xl p-6 shadow-xl border border-gray-100"> 
        <div class="flex justify-between items-center mb-4">
          <button onclick="albumManager.addAlbumToPlaylist()" 
                  class="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-full font-bold flex items-center gap-2 transition transform hover:scale-105">
            <i class="fa fa-play text-lg"></i> Reproducir todo
          </button>
          <button onclick="albumManager.toggleLike()" 
                  class="text-gray-600 hover:text-red-500 transition">
            <i class="fa fa-heart-o text-3xl" id="albumLikeIcon"></i>
          </button>
        </div>
        
        <div class="space-y-3 text-base pt-3 border-t border-gray-200"> <div class="flex justify-between items-center">
            <span class="text-gray-700 font-medium">Lanzamiento:</span>
            <span class="font-extrabold text-purple-800">${formatDate(this.currentAlbum.releaseDate)}</span> </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-700 font-medium">Canciones:</span>
            <span class="font-extrabold text-gray-900">${this.currentAlbum.tracks?.length || 0}</span> </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-700 font-medium">Vistas:</span>
            <span class="font-extrabold text-gray-900">${this.currentAlbum.views || 0}</span> </div>
        </div>
      </div>
    </div>
    
    <div class="md:col-span-2">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="mb-6">
          <p class="text-lg text-gray-500 font-semibold uppercase mb-1">Álbum</p> <h1 class="text-6xl font-black text-gray-900 leading-tight mb-2">${this.currentAlbum.title}</h1> <a href="#" class="text-purple-700 hover:text-purple-900 text-2xl font-semibold">${this.currentAlbum.bandName}</a> </div>
        
        <div class="space-y-2">
          ${this.renderTrackList()}
        </div>
        
        ${this.currentAlbum.description ? `
          <div class="mt-8 pt-8 border-t border-gray-200">
            <h3 class="font-bold text-xl mb-4">Sobre este álbum</h3>
            <p class="text-gray-700 leading-relaxed">${this.currentAlbum.description}</p>
          </div>
        ` : ''}
      </div>
      
      <div class="bg-white rounded-lg shadow-lg p-6 mt-6">
        <h3 class="font-bold text-xl mb-4"><i class="fa fa-comments mr-2"></i>Comentarios</h3>
        <div id="albumComments">
          </div>
      </div>
    </div>
  </div>
</div>
    `;
    
    container.innerHTML = html;
    this.loadComments();
  }

  renderTrackList() {
    if (!this.currentAlbum.tracks || this.currentAlbum.tracks.length === 0) {
      return '<p class="text-gray-500">No hay canciones disponibles</p>';
    }
    
    return this.currentAlbum.tracks.map((track, index) => `
      <div class="flex items-center gap-4 p-3 rounded hover:bg-gray-50 transition group">
        <button onclick="albumManager.playTrack(${index})" 
                class="w-10 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <i class="fa fa-play text-sm"></i>
        </button>
        <span class="text-gray-500 font-semibold w-8 group-hover:hidden">${index + 1}</span>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900 truncate">${track.title || track}</p>
          ${track.duration ? `<p class="text-sm text-gray-500">${track.duration}</p>` : ''}
        </div>
        <button onclick="albumManager.addTrackToPlaylist(${index})" 
                class="text-gray-400 hover:text-purple-600 transition" 
                title="Agregar a playlist">
          <i class="fa fa-plus-circle text-xl"></i>
        </button>
      </div>
    `).join('');
  }

  playTrack(index) {
    const track = this.currentAlbum.tracks[index];
    const trackData = {
      title: typeof track === 'string' ? track : track.title,
      artist: this.currentAlbum.bandName,
      url: typeof track === 'string' ? `/music/song${index + 1}.mp3` : track.url,
      albumArt: this.currentAlbum.coverImage
    };
    
    window.musicPlayer.addToPlaylist(trackData);
    window.musicPlayer.playTrack(window.musicPlayer.playlist.length - 1);
  }

  addTrackToPlaylist(index) {
    const track = this.currentAlbum.tracks[index];
    const trackData = {
      title: typeof track === 'string' ? track : track.title,
      artist: this.currentAlbum.bandName,
      url: typeof track === 'string' ? `/music/song${index + 1}.mp3` : track.url,
      albumArt: this.currentAlbum.coverImage
    };
    
    window.musicPlayer.addToPlaylist(trackData);
  }

  addAlbumToPlaylist() {
    if (!this.currentAlbum.tracks) return;
    
    this.currentAlbum.tracks.forEach((track, index) => {
      this.addTrackToPlaylist(index);
    });
    
    showToast('Álbum agregado a la playlist', 'success');
  }

  async toggleLike() {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        showToast('Debes iniciar sesión para dar like', 'warning');
        toggleModal('loginModal');
        return;
      }
      
      // Check if already liked
      const likeId = `${user.uid}_album_${this.currentAlbum.id}`;
      const likeRef = window.firebaseDB.collection('likes').doc(likeId);
      const doc = await likeRef.get();
      
      const icon = document.getElementById('albumLikeIcon');
      
      if (doc.exists) {
        // Unlike
        await likeRef.delete();
        icon.className = 'fa fa-heart-o text-2xl';
        showToast('Like removido', 'info');
      } else {
        // Like
        await likeRef.set({
          userId: user.uid,
          albumId: this.currentAlbum.id,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        icon.className = 'fa fa-heart text-2xl text-red-500';
        showToast('¡Te gusta este álbum!', 'success');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      showError('Error al procesar like');
    }
  }

  async loadComments() {
    try {
      const comments = await dbService.getComments(this.currentAlbum.id);
      const container = document.getElementById('albumComments');
      
      if (comments.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No hay comentarios aún</p>';
        return;
      }
      
      let html = '<div class="space-y-4">';
      comments.forEach(comment => {
        html += `
          <div class="border-b border-gray-200 pb-4">
            <div class="flex items-start gap-3">
              <img src="${comment.userPhoto || '/img/music-heart.png'}" alt="${comment.userName}" class="w-10 h-10 rounded-full">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-semibold">${comment.userName}</span>
                  <span class="text-xs text-gray-500">${timeAgo(comment.createdAt)}</span>
                </div>
                <p class="text-gray-700">${comment.text}</p>
              </div>
            </div>
          </div>
        `;
      });
      html += '</div>';
      
      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }
}

// Function to load all albums for the albums page
async function loadAllAlbums() {
  try {
    showLoading('albumsGrid');
    
    // Cargar TODOS los álbumes sin límite
    const albums = await dbService.getRecentAlbums(999);  // Número muy alto para obtener todos
    
    console.log('Álbumes cargados:', albums.length);  // Debug: verifica cuántos se cargan
    
    const container = document.getElementById('albumsGrid');
    
    if (albums.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay álbums disponibles</p>';
      return;
    }
    
    let html = '<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">';
    
    albums.forEach(album => {
      html += `
        <a href="/album.html?id=${album.id}" class="group">
          <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition transform hover:-translate-y-1">
            <div class="relative">
              <img src="${album.coverImage || '/img/album1.jpg'}" 
                   alt="${album.title}" 
                   class="w-full aspect-square object-cover">
              <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center">
                <button onclick="event.preventDefault(); albumManager.playTrack(0);" class="opacity-0 group-hover:opacity-100 transition bg-purple-600 hover:bg-purple-700 text-white rounded-full w-16 h-16 flex items-center justify-center">
                  <i class="fa fa-play text-2xl"></i>
                </button>
              </div>
            </div>
            <div class="p-4">
              <h3 class="font-bold text-gray-900 truncate">${album.title}</h3>
              <p class="text-sm text-gray-600 truncate">${album.bandName}</p>
              <p class="text-xs text-gray-500 mt-1">${formatDate(album.releaseDate)}</p>
            </div>
          </div>
        </a>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading albums:', error);
    document.getElementById('albumsGrid').innerHTML = '<p class="text-red-500 text-center py-8">Error al cargar álbums</p>';
  }
}

// Initialize album manager
let albumManager;
if (window.location.pathname.includes('album.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    albumManager = new AlbumManager();
    
    // Get album ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const albumId = urlParams.get('id');
    
    if (albumId) {
      albumManager.loadAlbum(albumId);
    } else {
      showError('ID de álbum no especificado');
    }
  });
}