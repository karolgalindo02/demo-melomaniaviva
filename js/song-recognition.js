// Song Recognition with Shazam API

class SongRecognition {
  constructor() {
    this.shazamToken = 'JExXAjWRovnYhbMEb5jlLujz5ZBeTEtsAC3WAyIyrbO7QoPtLEnklU6tbIE5CZiQ';
    this.shazamApiUrl = 'https://shazam-api.com/api/recognize';
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.recordingDuration = 20000;
    this.recordingTimer = null;
    this.proxyUrl = 'https://corsproxy.io/?';
  }

  async startRecognition() {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      
      // Show recording modal
      this.showRecordingModal();
      
      // Start recording
      this.audioChunks = [];
      // Intentar usar formato MP3/MP4 si está disponible
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
        mimeType = 'audio/mpeg';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      }
      
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

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
async cleanupTempFile(audioUrl) {
  try {
    // Extraer el nombre del archivo de la URL
    const url = new URL(audioUrl);
    const pathname = decodeURIComponent(url.pathname);
    
    // Buscar el path del archivo en Firebase Storage
    const match = new RegExp(/o\/(.+?)\?/).exec(pathname);
    if (match?.[1]) {
      const filePath = match[1];
      const storageRef = globalThis.firebaseStorage.ref(filePath);
      await storageRef.delete();
    }
  } catch (error) {
    console.warn('No se pudo eliminar archivo temporal:', error);
  }
}
  async processAudio() {
  try {
    this.showProcessingUI();
    
    const mimeType = this.mediaRecorder.mimeType;
    const audioBlob = new Blob(this.audioChunks, { type: mimeType });

    // Step 1: Upload audio to temporary storage
    const audioUrl = await this.uploadToTempStorage(audioBlob);
    
    if (!audioUrl) {
      throw new Error('No se pudo subir el audio');
    }

    setTimeout(() => this.cleanupTempFile(audioUrl), 5000);
    
  } catch (error) {
    console.error('Error processing audio:', error);
    showToast('Error al procesar el audio: ' + error.message, 'error');
    this.closeModal();
  }
}
async uploadToTempStorage(audioBlob) {
    try {
      console.log('Subiendo audio a Firebase Storage...');
      
      // Verificar que Firebase Storage esté disponible
      if (!globalThis.firebaseStorage) {
        throw new Error('Firebase Storage no está inicializado');
      }
      
      // Crear referencia única para el archivo
      const timestamp = Date.now();
      let extension = 'webm';
      const contentType = audioBlob.type;
      
      if (contentType.includes('mp4')) {
        extension = 'mp4';
      } else if (contentType.includes('mpeg') || contentType.includes('mp3')) {
        extension = 'mp3';
      } else if (contentType.includes('wav')) {
        extension = 'wav';
      }
      
      const fileName = `song-recognition/recording_${timestamp}.${extension}`;
      const storageRef = globalThis.firebaseStorage.ref(fileName);

      
      // Subir el archivo
      const uploadTask = await storageRef.put(audioBlob, {
        contentType: contentType
      });

      
      // Obtener URL de descarga pública
      const downloadURL = await uploadTask.ref.getDownloadURL();

      
      return downloadURL;
      
    } catch (error) {
      console.error('Error uploading to temp storage:', error);

      console.error('Error uploading to Firebase Storage:', error);
      throw new Error('No se pudo subir el audio: ' + error.message);
      }
    }
  
  async recognizeSong(audioUrl) {
  try {
    // Step 1: Enviar URL del audio a Shazam API
    const recognizeResponse = await fetch(`${this.proxyUrl}${encodeURIComponent(this.shazamApiUrl)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.shazamToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: audioUrl
      })
    });
    
    const recognizeResult = await recognizeResponse.json();
    
    // Step 2: Obtener resultados desde la URL proporcionada
    if (recognizeResult.results) {
      const fullResultsUrl = `https://shazam-api.com${recognizeResult.results}`;
      console.log('URL completa para resultados:', fullResultsUrl);
      
      // SOLO haz el polling, NO hagas una segunda petición
      await this.pollForResults(recognizeResult.results);
      
    } else if (recognizeResult.error) {
      console.error('Shazam Error:', recognizeResult.error);
      showToast(`Error: ${recognizeResult.error}`, 'error');
      this.showNoResults();
    } else {
      console.error('No se recibió result_url de Shazam');
      showToast('Error al procesar con Shazam API', 'error');
      this.showNoResults();
    }
    
  } catch (error) {
    console.error('Error recognizing song:', error);
    showToast('Error al identificar la canción: ' + error.message, 'error');
    this.closeModal();
  }
}
async pollForResults(resultsPath) {
  const maxAttempts = 8;
  const delay = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, delay));
    this.showProcessingUI(`Analizando... (${attempt}/${maxAttempts})`);

    try {
      const fullResultsUrl = `https://shazam-api.com${resultsPath}`;
      const proxyPollUrl = `${this.proxyUrl}${encodeURIComponent(fullResultsUrl)}`;
      
      // Intenta con POST directamente (ya sabes que funciona)
      const pollResponse = await fetch(proxyPollUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.shazamToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (pollResponse.ok) {
        const pollResult = await pollResponse.json();
        const success = this.processPollResult(pollResult, attempt);
        if (success) return;
      } else {
        console.log(`Intento ${attempt} falló con status: ${pollResponse.status}`);
      }
      
    } catch (error) {
      console.error(`Error en intento ${attempt}:`, error.message);
    }
  }

  this.showErrorUI('Tiempo de espera agotado para obtener resultados');
}
// Método para obtener detalles de la canción usando tagid
async fetchTrackDetails(tagId) {
  try {

    // Usa el endpoint de tracks de Shazam API
    const trackDetailsUrl = `https://shazam-api.com/api/tracks/${tagId}`;
    const proxyUrl = `${this.proxyUrl}${encodeURIComponent(trackDetailsUrl)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.shazamToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const trackDetails = await response.json();

      if (trackDetails.track) {
        this.showResults(trackDetails.track);
      } else {
        this.showResults(trackDetails);
      }
    } else {
      throw new Error(`HTTP ${response.status} al obtener detalles`);
    }
    
  } catch (error) {
    console.error('Error obteniendo detalles:', error);
    this.showErrorUI('No se pudieron obtener detalles completos de la canción');
  }
}

// Método para intentar mostrar el resultado con diferentes estructuras
tryToShowResult(resultData) {
  // Verifica diferentes estructuras posibles
  if (resultData.title || resultData.heading?.title) {
    // Parece tener datos de canción directamente
    this.showResults(resultData);
  } else if (resultData.song || resultData.artist) {
    // Otra estructura común
    const formattedResult = {
      title: resultData.song || 'Desconocido',
      subtitle: resultData.artist || 'Artista desconocido',
      // Agrega otros campos si existen
      images: resultData.images || {}
    };
    this.showResults(formattedResult);
  } else {
    this.showFallbackResult(resultData);
  }
}

// Método fallback para mostrar información básica
showFallbackResult(resultData) {
  const content = document.getElementById('recognitionContent');
  if (content) {
    const info = JSON.stringify(resultData, null, 2).substring(0, 500);
    content.innerHTML = `
      <div class="text-center py-8">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-600 flex items-center justify-center">
          <i class="fa fa-info text-white text-4xl"></i>
        </div>
        <h3 class="text-2xl font-bold mb-2">Canción Identificada</h3>
        <p class="text-gray-400 mb-4">(Formato de datos no estándar)</p>
        <div class="bg-gray-800 rounded-lg p-4 mb-6 text-left">
          <pre class="text-xs text-gray-300 overflow-auto max-h-40">${info}</pre>
        </div>
        <button onclick="songRecognition.startRecognition()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition">
          <i class="fa fa-microphone mr-2"></i>Buscar otra
        </button>
      </div>
    `;
  }
}
// Método auxiliar para procesar el resultado del polling
processPollResult(pollResult, attempt) {

  if (pollResult.status === 'completed') {

    if (pollResult.results && pollResult.results.length > 0) {

      const resultData = pollResult.results[0];

      if (resultData.track) {
        this.showResults(resultData.track);
      } else if (resultData.matches && resultData.matches.length > 0) {
        this.showResults(resultData.matches[0]);
      } else if (resultData.tagid) {
        this.fetchTrackDetails(resultData.tagid);
      } else {
        // Intenta mostrar el resultado directamente si tiene información de canción
        this.tryToShowResult(resultData);
      }
      
    } else if (pollResult.track) {
      // Si el track está en el nivel superior
      this.showResults(pollResult.track);
    } else {
      this.showNoResults();
    }
    return true;
  }
  
  return false;
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
showErrorUI(message) {
  const content = document.getElementById('recognitionContent');
  if (content) {
    content.innerHTML = `
      <div class="text-center py-8">
        <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-red-600 flex items-center justify-center">
          <i class="fa fa-exclamation-triangle text-white text-4xl"></i>
        </div>
        <h3 class="text-2xl font-bold mb-2">Error</h3>
        <p class="text-gray-400 mb-6">${message}</p>
        <div class="flex flex-col gap-3">
          <button onclick="songRecognition.startRecognition()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition">
            <i class="fa fa-microphone mr-2"></i>Intentar de nuevo
          </button>
          <button onclick="songRecognition.closeModal()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition">
            Cancelar
          </button>
        </div>
      </div>
    `;
  }
}
  showResults(result) {
    const content = document.getElementById('recognitionContent');
    if (content) {
      // Adaptar a la estructura de respuesta de Shazam API
      const title = result.title || result.heading?.title || result.share?.subject || 'Desconocido';
      const artist = result.subtitle || result.heading?.subtitle || 
      (result.artists ? result.artists[0]?.name : '') || 'Artista desconocido';
      const album = result.sections?.[0]?.metadata?.find(m => m.title === 'Album')?.text || 'Desconocido';
      const image = result.images?.coverart || result.images?.background || 
                    result.share?.image || 'https://via.placeholder.com/150';
      
      // URLs de streaming
      const spotifyUrl = result.hub?.providers?.find(p => p.type === 'SPOTIFY')?.actions?.[0]?.uri || '';
      const appleMusicUrl = result.url || result.hub?.options?.find(o => o.providername === 'applemusic')?.actions?.[0]?.uri || '';

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
                </div>
            </div>
          </div>
          
          <div class="flex flex-col gap-3 mb-4">
           ${spotifyUrl ? `
              <a href="${spotifyUrl}" target="_blank" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition text-center">
                <i class="fa fa-spotify mr-2"></i>Abrir en Spotify
              </a>
            ` : ''}
            ${appleMusicUrl ? `
              <a href="${appleMusicUrl}" target="_blank" class="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition text-center">
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
// Wait for Firebase to be ready before initializing
function initSongRecognition() {
  if (globalThis.firebaseStorage) {
    songRecognition = new SongRecognition();
    globalThis.songRecognition = songRecognition;
  } else {
    setTimeout(initSongRecognition, 100);
  }
}
document.addEventListener('DOMContentLoaded', () => {
  initSongRecognition();
});