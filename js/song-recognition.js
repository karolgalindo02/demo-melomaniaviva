// Song Recognition with AudD API

class SongRecognition {
  constructor() {
    this.apiToken = '3d537ee48a618868bddb503097db1f60';
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.recordingDuration = 10000; // 10 seconds
    this.recordingTimer = null;
  }

  async startRecognition() {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Show recording modal
      this.showRecordingModal();
      
      // Start recording
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = async () => {
        await this.processAudio();
      };
      
      this.mediaRecorder.start();
      this.isRecording = true;
      
      // Update UI
      this.updateRecordingUI();
      
      // Auto-stop after duration
      this.recordingTimer = setTimeout(() => {
        this.stopRecording();
      }, this.recordingDuration);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      showError('No se pudo acceder al micrófono. Por favor, permite el acceso.');
      this.closeModal();
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      
      // Stop all tracks
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
      
      if (this.recordingTimer) {
        clearTimeout(this.recordingTimer);
      }
    }
  }

  async processAudio() {
    try {
      // Show processing state
      this.showProcessingUI();
      
      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
      // Convert to base64
      const base64Audio = await this.blobToBase64(audioBlob);
      
      // Send to AudD API
      await this.recognizeSong(base64Audio);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      showError('Error al procesar el audio');
      this.closeModal();
    }
  }

  async recognizeSong(base64Audio) {
    try {
      const formData = new FormData();
      
      // Convert base64 back to blob for FormData
      const audioBlob = await fetch(base64Audio).then(r => r.blob());
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('return', 'apple_music,spotify');
      formData.append('api_token', this.apiToken);
      
      const response = await fetch('https://api.audd.io/', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.status === 'success' && result.result) {
        this.showResults(result.result);
      } else {
        this.showNoResults();
      }
      
    } catch (error) {
      console.error('Error recognizing song:', error);
      showError('Error al identificar la canción');
      this.closeModal();
    }
  }

  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  showRecordingModal() {
    const modal = document.getElementById('songRecognitionModal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  updateRecordingUI() {
    const content = document.getElementById('recognitionContent');
    if (content) {
      content.innerHTML = `
        <div class="text-center py-8">
          <div class="relative inline-block mb-6">
            <div class="w-32 h-32 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse flex items-center justify-center">
              <i class="fa fa-microphone text-white text-5xl"></i>
            </div>
            <div class="absolute inset-0 rounded-full border-4 border-purple-400 animate-ping"></div>
          </div>
          <h3 class="text-2xl font-bold mb-2">Escuchando...</h3>
          <p class="text-gray-400 mb-6">Reproduciendo la canción cerca del micrófono</p>
          <div class="flex justify-center gap-4">
            <button onclick="songRecognition.stopRecording()" class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition">
              <i class="fa fa-stop mr-2"></i>Detener
            </button>
          </div>
        </div>
      `;
    }
  }

  showProcessingUI() {
    const content = document.getElementById('recognitionContent');
    if (content) {
      content.innerHTML = `
        <div class="text-center py-8">
          <div class="mb-6">
            <div class="w-20 h-20 mx-auto border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 class="text-2xl font-bold mb-2">Identificando canción...</h3>
          <p class="text-gray-400">Por favor espera un momento</p>
        </div>
      `;
    }
  }

  showResults(result) {
    const content = document.getElementById('recognitionContent');
    if (content) {
      const spotifyLink = result.spotify?.external_urls?.spotify || '#';
      const appleMusicLink = result.apple_music?.url || '#';
      
      content.innerHTML = `
        <div class="py-6">
          <div class="text-center mb-6">
            <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-green-600 flex items-center justify-center">
              <i class="fa fa-check text-white text-4xl"></i>
            </div>
            <h3 class="text-2xl font-bold mb-2">¡Canción Identificada!</h3>
          </div>
          
          <div class="bg-gray-800 rounded-lg p-6 mb-6">
            <div class="flex items-start gap-4">
              ${result.spotify?.album?.images?.[0]?.url ? `
                <img src="${result.spotify.album.images[0].url}" alt="Album" class="w-24 h-24 rounded-lg shadow-lg flex-shrink-0">
              ` : ''}
              <div class="flex-1 min-w-0">
                <h4 class="text-xl font-bold text-white mb-1">${result.title}</h4>
                <p class="text-lg text-gray-300 mb-2">${result.artist}</p>
                <p class="text-sm text-gray-400">${result.album || 'Desconocido'}</p>
                ${result.release_date ? `<p class="text-sm text-gray-500 mt-1">${result.release_date}</p>` : ''}
              </div>
            </div>
          </div>
          
          <div class="flex flex-col gap-3 mb-4">
            ${spotifyLink !== '#' ? `
              <a href="${spotifyLink}" target="_blank" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition text-center">
                <i class="fa fa-spotify mr-2"></i>Abrir en Spotify
              </a>
            ` : ''}
            ${appleMusicLink !== '#' ? `
              <a href="${appleMusicLink}" target="_blank" class="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition text-center">
                <i class="fa fa-music mr-2"></i>Abrir en Apple Music
              </a>
            ` : ''}
          </div>
          
          <div class="flex gap-3">
            <button onclick="songRecognition.startRecognition()" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition">
              <i class="fa fa-microphone mr-2"></i>Buscar otra
            </button>
        
          </div>
        </div>
      `;
    }
  }

  showNoResults() {
    const content = document.getElementById('recognitionContent');
    if (content) {
      content.innerHTML = `
        <div class="text-center py-8">
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-700 flex items-center justify-center">
            <i class="fa fa-question text-white text-4xl"></i>
          </div>
          <h3 class="text-2xl font-bold mb-2">No se pudo identificar</h3>
          <p class="text-gray-400 mb-6">Intenta con una canción más clara o acércate más al audio</p>
          <div class="flex flex-col gap-3">
            <button onclick="songRecognition.startRecognition()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition">
              <i class="fa fa-microphone mr-2"></i>Intentar de nuevo
            </button>
        
          </div>
        </div>
      `;
    }
  }

  closeModal() {
    // Stop recording if active
    this.stopRecording();
    
    const modal = document.getElementById('songRecognitionModal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }
}

// Initialize song recognition
let songRecognition;
document.addEventListener('DOMContentLoaded', () => {
  songRecognition = new SongRecognition();
  window.songRecognition = songRecognition;
});
