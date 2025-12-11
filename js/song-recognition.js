// Song Recognition with SongFinder API

class SongRecognition {
  constructor() {
    this.apiKey = '6fcd89c844msh6e359553be7efb7p16abfajsn29e45e46a046';
    this.apiHost = 'songfinder-file-recognition.p.rapidapi.com';
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.recordingDuration = 10000;
    this.recordingTimer = null;
  }

  async startRecognition() {
    try {
      console.log('Iniciando reconocimiento...');
      
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('Micrófono accedido correctamente');
      
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
      
      console.log('Grabación iniciada');
      
      // Update UI
      this.updateRecordingUI();
      
      // Auto-stop after duration
      this.recordingTimer = setTimeout(() => {
        console.log('Tiempo de grabación terminado');
        this.stopRecording();
      }, this.recordingDuration);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      showToast('No se pudo acceder al micrófono. Por favor, permite el acceso.', 'error');
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
      
      // Create audio blob directamente
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
      console.log('Audio blob size:', audioBlob.size, 'bytes');
      
      // Send to backend
      await this.recognizeSong(audioBlob);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      showToast('Error al procesar el audio', 'error');
      this.closeModal();
    }
  }

  async recognizeSong(audioBlob) {
    try {
      console.log('Enviando a SongFinder API...');
      
      // ✅ Usar FormData en lugar de octet-stream
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      
      const response = await fetch('https://songfinder-file-recognition.p.rapidapi.com/api/rapidapi/recognize/file?startTime=0', {
        method: 'POST',
        headers: {
          'x-rapidapi-key': this.apiKey,
          'x-rapidapi-host': this.apiHost
          // NO incluir Content-Type - FormData lo hace automáticamente
        },
        body: formData
      });
      
      const result = await response.json();
      
      console.log('Respuesta SongFinder:', result);
      
      if (result.success && result.result) {
        this.showResults(result.result);
      } else if (result.error) {
        console.error('SongFinder Error:', result.error);
        showToast(`Error: ${result.error}`, 'error');
        this.showNoResults();
      } else {
        showToast('No se pudo identificar la canción', 'error');
        this.showNoResults();
      }
      
    } catch (error) {
      console.error('Error recognizing song:', error);
      showToast('Error al identificar la canción', 'error');
      this.closeModal();
    }
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
          <p class="text-sm text-gray-500 mb-4">Se detendrá automáticamente en 10 segundos</p>
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
      const title = result.title || result.song || 'Desconocido';
      const artist = result.artist || result.artists?.[0] || 'Artista desconocido';
      const album = result.album || 'Desconocido';
      const image = result.image || result.artwork || 'https://via.placeholder.com/150';
      
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
              <img src="${image}" alt="Album" class="w-24 h-24 rounded-lg shadow-lg flex-shrink-0" onerror="this.src='https://via.placeholder.com/150'">
              <div class="flex-1 min-w-0">
                <h4 class="text-xl font-bold text-white mb-1">${title}</h4>
                <p class="text-lg text-gray-300 mb-2">${artist}</p>
                <p class="text-sm text-gray-400">${album}</p>
                ${result.release_date ? `<p class="text-sm text-gray-500 mt-1">${result.release_date}</p>` : ''}
              </div>
            </div>
          </div>
          
          <div class="flex flex-col gap-3 mb-4">
            ${result.spotify_url ? `
              <a href="${result.spotify_url}" target="_blank" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition text-center">
                <i class="fa fa-spotify mr-2"></i>Abrir en Spotify
              </a>
            ` : ''}
            ${result.apple_music_url ? `
              <a href="${result.apple_music_url}" target="_blank" class="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition text-center">
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

// Initialize song recognition GLOBALLY
let songRecognition;
document.addEventListener('DOMContentLoaded', () => {
  songRecognition = new SongRecognition();
  window.songRecognition = songRecognition;
  console.log('✅ SongRecognition initialized with SongFinder API');
});