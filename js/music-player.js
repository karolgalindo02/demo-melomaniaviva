// Global Music Player - Fixed bottom player with playlist functionality (Mobile Responsive)

class MusicPlayer {
  constructor() {
    this.playlist = [];
    this.currentIndex = 0;
    this.audio = new Audio();
    this.isPlaying = false;
    this.isRepeat = false;
    this.isShuffle = false;
    this.volume = 1.0;
    this.isMobile = window.innerWidth < 768;
    
    this.initializePlayer();
    this.setupEventListeners();
    this.setupResizeListener();
  }

  initializePlayer() {
    if (!document.getElementById('globalMusicPlayer')) {
      this.createPlayerUI();
    }
    
    this.audio.addEventListener('ended', () => this.playNext());
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
    this.audio.addEventListener('error', (e) => this.handleError(e));
  }

  setupResizeListener() {
    window.addEventListener('resize', () => {
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth < 768;
      
      if (wasMobile !== this.isMobile) {
        this.updatePlayerLayout();
      }
    });
  }

  createPlayerUI() {
    const playerHTML = `
      <div id="globalMusicPlayer" class="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900 to-black text-white shadow-2xl z-50 border-t border-purple-600 hidden">
        <div class="w-full px-2 md:px-4 py-2 md:py-3">
          <!-- Progress Bar -->
          <div class="mb-1 md:mb-2">
            <input type="range" id="playerProgress" min="0" max="100" value="0" 
              class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider">
            <div class="flex justify-between text-xs text-gray-400 mt-1">
              <span id="currentTime">0:00</span>
              <span id="totalTime">0:00</span>
            </div>
          </div>
          
          <!-- Player Controls - Spotify Style Layout -->
          <div class="flex items-center justify-between gap-2 md:gap-4">
            
            <!-- Left: Track Info with Image -->
            <div class="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <!-- Desktop Album Art -->
              <img id="playerAlbumArt" src="/img/music-heart.png" alt="Album" class="hidden md:block w-12 h-12 rounded-lg shadow-lg flex-shrink-0">
              
              <!-- Mobile Album Art -->
              <img id="playerAlbumArtMobile" src="/img/music-heart.png" alt="Album" class="md:hidden w-10 h-10 rounded flex-shrink-0 shadow-lg">
              
              <!-- Track Info -->
              <div class="min-w-0 flex-1">
                <p id="playerTrackName" class="font-semibold text-sm truncate hidden md:block">Selecciona una canción</p>
                <p id="playerTrackNameMobile" class="font-semibold text-xs truncate md:hidden">Selecciona una canción</p>
                
                <p id="playerArtistName" class="text-xs text-gray-400 truncate hidden md:block">Artista</p>
                <p id="playerArtistNameMobile" class="text-xs text-gray-400 truncate md:hidden">Artista</p>
              </div>
            </div>
            
            <!-- Right: Controls (Compacted) -->
            <div class="flex items-center justify-end gap-1 md:gap-3 flex-shrink-0">
              <!-- Previous -->
              <button id="btnPrevious" class="hover:text-purple-400 transition text-lg md:text-xl p-1" title="Anterior">
                <i class="fa fa-step-backward"></i>
              </button>
              
              <!-- Play/Pause -->
              <button id="btnPlayPause" class="bg-purple-600 hover:bg-purple-700 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center transition shadow-lg text-lg md:text-xl flex-shrink-0">
                <i class="fa fa-play"></i>
              </button>
              
              <!-- Next -->
              <button id="btnNext" class="hover:text-purple-400 transition text-lg md:text-xl p-1" title="Siguiente">
                <i class="fa fa-step-forward"></i>
              </button>
              
              <!-- Shuffle (Desktop) -->
              <button id="btnShuffle" class="hidden md:block hover:text-purple-400 transition text-lg p-1" title="Aleatorio">
                <i class="fa fa-random"></i>
              </button>
              
              <!-- Repeat (Desktop) -->
              <button id="btnRepeat" class="hidden md:block hover:text-purple-400 transition text-lg p-1" title="Repetir">
                <i class="fa fa-repeat"></i>
              </button>
              
              <!-- Volume Desktop -->
              <div class="hidden md:flex items-center gap-2">
                <button id="btnVolume" class="hover:text-purple-400 transition text-lg p-1">
                  <i class="fa fa-volume-up"></i>
                </button>
                <input type="range" id="volumeSlider" min="0" max="100" value="100" 
                  class="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider">
              </div>
              
              <!-- Playlist Desktop -->
              <button id="btnPlaylist" class="hidden md:flex hover:text-purple-400 transition relative p-1" title="Playlist">
                <i class="fa fa-list text-lg"></i>
                <span id="playlistCount" class="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>
              </button>
              
              <!-- Mobile: Volume & Playlist -->
              <button id="btnVolumeMobile" class="md:hidden hover:text-purple-400 transition text-lg p-1" title="Volumen">
                <i class="fa fa-volume-up"></i>
              </button>
              <button id="btnPlaylistMobile" class="md:hidden hover:text-purple-400 transition relative p-1" title="Playlist">
                <i class="fa fa-list text-lg"></i>
                <span id="playlistCountMobile" class="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">0</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Playlist Panel - Responsive (Tipo Spotify) -->
      <div id="playlistPanel" class="hidden fixed bottom-24 md:bottom-20 right-2 md:right-4 left-2 md:left-auto w-auto md:w-96 bg-gray-900 rounded-xl shadow-2xl border border-purple-600 max-h-72 md:max-h-96 overflow-hidden z-40">
        <div class="p-3 md:p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-xl">
          <h3 class="font-bold text-white text-sm md:text-base">Playlist</h3>
          <button id="btnClearPlaylist" class="text-red-400 hover:text-red-300 text-xs md:text-sm">
            <i class="fa fa-trash"></i> <span class="hidden md:inline">Limpiar</span>
          </button>
        </div>
        <div id="playlistItems" class="overflow-y-auto max-h-64 md:max-h-80">
          <!-- Playlist items will be inserted here -->
        </div>
      </div>

      <!-- Volume Control Modal (Mobile) -->
      <div id="volumeModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:hidden">
        <div class="w-full bg-gray-900 border-t border-purple-600 p-4 rounded-t-2xl">
          <h3 class="text-white font-semibold mb-3">Volumen</h3>
          <input type="range" id="volumeSliderMobile" min="0" max="100" value="100" 
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider mb-4">
          <button onclick="document.getElementById('volumeModal').classList.add('hidden')" 
            class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold">
            Cerrar
          </button>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', playerHTML);
    this.updateBottomPadding();
  }

  updateBottomPadding() {
    if (this.isMobile) {
      document.body.style.paddingBottom = '85px';
    } else {
      document.body.style.paddingBottom = '110px';
    }
  }

  updatePlayerLayout() {
    this.updateBottomPadding();
    this.updatePlaylistUI();
  }

  setupEventListeners() {
    document.getElementById('btnPlayPause')?.addEventListener('click', () => this.togglePlay());
    document.getElementById('btnPrevious')?.addEventListener('click', () => this.playPrevious());
    document.getElementById('btnNext')?.addEventListener('click', () => this.playNext());
    document.getElementById('btnShuffle')?.addEventListener('click', () => this.toggleShuffle());
    document.getElementById('btnRepeat')?.addEventListener('click', () => this.toggleRepeat());
    document.getElementById('playerProgress')?.addEventListener('input', (e) => this.seek(e.target.value));
    
    // Volume - Desktop
    document.getElementById('volumeSlider')?.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
    document.getElementById('btnVolume')?.addEventListener('click', () => this.toggleMute());
    
    // Volume - Mobile
    document.getElementById('volumeSliderMobile')?.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
    document.getElementById('btnVolumeMobile')?.addEventListener('click', () => {
      document.getElementById('volumeModal').classList.remove('hidden');
    });
    
    // Playlist
    document.getElementById('btnPlaylist')?.addEventListener('click', () => this.togglePlaylistPanel());
    document.getElementById('btnPlaylistMobile')?.addEventListener('click', () => this.togglePlaylistPanel());
    document.getElementById('btnClearPlaylist')?.addEventListener('click', () => this.clearPlaylist());

    // Cerrar playlist al hacer click fuera
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('playlistPanel');
      const btnPlaylist = document.getElementById('btnPlaylist');
      const btnPlaylistMobile = document.getElementById('btnPlaylistMobile');
      
      if (panel && !panel.contains(e.target) && e.target !== btnPlaylist && e.target !== btnPlaylistMobile 
          && !btnPlaylist?.contains(e.target) && !btnPlaylistMobile?.contains(e.target)) {
        panel.classList.add('hidden');
      }
    });
  }

  addToPlaylist(track) {
    const exists = this.playlist.find(t => t.url === track.url);
    if (exists) {
      showToast('Esta canción ya está en la playlist', 'info');
      return;
    }
    
    this.playlist.push(track);
    this.updatePlaylistUI();

    const player = document.getElementById('globalMusicPlayer');
    if (player && player.classList.contains('hidden')) {
      player.classList.remove('hidden');
      this.updateBottomPadding();
    }

    showToast(`${track.title} agregada a la playlist`, 'success');
  }

  updatePlaylistUI() {
    const container = document.getElementById('playlistItems');
    const countEl = document.getElementById('playlistCount');
    const countElMobile = document.getElementById('playlistCountMobile');
    
    if (countEl) countEl.textContent = this.playlist.length;
    if (countElMobile) countElMobile.textContent = this.playlist.length;
    
    if (!container) return;
    
    if (this.playlist.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-6 text-xs md:text-sm">La playlist está vacía</p>';
      return;
    }
    
    container.innerHTML = this.playlist.map((track, index) => `
      <div class="p-2 md:p-3 border-b border-gray-700 hover:bg-gray-800 cursor-pointer flex items-center gap-2 transition ${index === this.currentIndex ? 'bg-purple-600 bg-opacity-30' : ''}" 
           onclick="musicPlayer.playTrack(${index})">
        <img src="${track.albumArt || '/img/music-heart.png'}" alt="${track.title}" class="w-8 h-8 md:w-10 md:h-10 rounded flex-shrink-0">
        <div class="flex-1 min-w-0">
          <p class="text-white text-xs md:text-sm font-semibold truncate">${track.title}</p>
          <p class="text-gray-400 text-xs truncate">${track.artist}</p>
        </div>
        <button onclick="event.stopPropagation(); musicPlayer.removeFromPlaylist(${index})" 
                class="text-gray-500 hover:text-red-400 flex-shrink-0 text-sm md:text-base transition">
          <i class="fa fa-times"></i>
        </button>
      </div>
    `).join('');
  }

  playTrack(index) {
    if (index < 0 || index >= this.playlist.length) return;
    
    this.currentIndex = index;
    const track = this.playlist[index];
    
    this.audio.src = track.url;
    this.audio.load();
    this.audio.play();
    this.isPlaying = true;
    
    // Update UI - Desktop
    document.getElementById('playerTrackName').textContent = track.title;
    document.getElementById('playerArtistName').textContent = track.artist;
    document.getElementById('playerAlbumArt').src = track.albumArt || '/img/music-heart.png';
    
    // Update UI - Mobile
    document.getElementById('playerTrackNameMobile').textContent = track.title;
    document.getElementById('playerArtistNameMobile').textContent = track.artist;
    document.getElementById('playerAlbumArtMobile').src = track.albumArt || '/img/music-heart.png';
    
    document.getElementById('btnPlayPause').innerHTML = '<i class="fa fa-pause"></i>';
    
    this.updatePlaylistUI();
  }

  togglePlay() {
    if (this.playlist.length === 0) {
      showToast('Agrega canciones a la playlist primero', 'warning');
      return;
    }
    
    if (this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
      document.getElementById('btnPlayPause').innerHTML = '<i class="fa fa-play"></i>';
    } else {
      if (!this.audio.src) {
        this.playTrack(0);
      } else {
        this.audio.play();
        this.isPlaying = true;
        document.getElementById('btnPlayPause').innerHTML = '<i class="fa fa-pause"></i>';
      }
    }
  }

  playNext() {
    if (this.playlist.length === 0) return;
    
    if (this.isShuffle) {
      this.currentIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    }
    
    this.playTrack(this.currentIndex);
  }

  playPrevious() {
    if (this.playlist.length === 0) return;
    
    this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.playlist.length - 1;
    this.playTrack(this.currentIndex);
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    const btn = document.getElementById('btnShuffle');
    if (this.isShuffle) {
      btn.classList.add('text-purple-400');
    } else {
      btn.classList.remove('text-purple-400');
    }
  }

  toggleRepeat() {
    this.isRepeat = !this.isRepeat;
    const btn = document.getElementById('btnRepeat');
    if (this.isRepeat) {
      btn.classList.add('text-purple-400');
      this.audio.loop = true;
    } else {
      btn.classList.remove('text-purple-400');
      this.audio.loop = false;
    }
  }

  seek(value) {
    const time = (value / 100) * this.audio.duration;
    this.audio.currentTime = time;
  }

  setVolume(value) {
    this.volume = value;
    this.audio.volume = value;
    
    const sliderDesktop = document.getElementById('volumeSlider');
    if (sliderDesktop) sliderDesktop.value = value * 100;
    
    const sliderMobile = document.getElementById('volumeSliderMobile');
    if (sliderMobile) sliderMobile.value = value * 100;
    
    const btn = document.getElementById('btnVolume');
    const btnMobile = document.getElementById('btnVolumeMobile');
    
    let icon = '<i class="fa fa-volume-up text-lg"></i>';
    if (value === 0) {
      icon = '<i class="fa fa-volume-off text-lg"></i>';
    } else if (value < 0.5) {
      icon = '<i class="fa fa-volume-down text-lg"></i>';
    }
    
    if (btn) btn.innerHTML = icon;
    if (btnMobile) btnMobile.innerHTML = icon;
  }

  toggleMute() {
    if (this.audio.volume > 0) {
      this.audio.volume = 0;
      this.setVolume(0);
    } else {
      this.setVolume(this.volume);
    }
  }

  togglePlaylistPanel() {
    const panel = document.getElementById('playlistPanel');
    panel.classList.toggle('hidden');
  }

  removeFromPlaylist(index) {
    this.playlist.splice(index, 1);
    if (index === this.currentIndex && this.isPlaying) {
      this.playNext();
    } else if (index < this.currentIndex) {
      this.currentIndex--;
    }
    this.updatePlaylistUI();
  }

  clearPlaylist() {
    this.playlist = [];
    this.currentIndex = 0;
    this.audio.pause();
    this.audio.src = '';
    this.isPlaying = false;
    document.getElementById('btnPlayPause').innerHTML = '<i class="fa fa-play"></i>';
    this.updatePlaylistUI();

    const player = document.getElementById('globalMusicPlayer');
    if (player) {
      player.classList.add('hidden');
      document.body.style.paddingBottom = '0';
    }
    
    showToast('Playlist limpiada', 'success');
  }

  updateProgress() {
    const progress = (this.audio.currentTime / this.audio.duration) * 100;
    document.getElementById('playerProgress').value = progress || 0;
    document.getElementById('currentTime').textContent = this.formatTime(this.audio.currentTime);
  }

  updateDuration() {
    document.getElementById('totalTime').textContent = this.formatTime(this.audio.duration);
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  handleError(e) {
    console.error('Audio error:', e);
    showToast('Error al reproducir la canción', 'error');
    this.playNext();
  }
}

// Initialize global music player
let musicPlayer;
document.addEventListener('DOMContentLoaded', () => {
  musicPlayer = new MusicPlayer();
  window.musicPlayer = musicPlayer;
});