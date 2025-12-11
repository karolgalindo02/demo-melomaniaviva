// Database Service - Firestore operations

class DatabaseService {
  constructor() {
    this.db = globalThis.firebaseDB;
  }

  // Validation helper
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  validateRequired(value, fieldName) {
    if (!value || value.trim() === '') {
      throw new Error(`${fieldName} es requerido`);
    }
    return true;
  }

  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replaceAll(/[<>]/g, '');
  }

  // ============ BANDS ============
  
  async getBands(limit = 20) {
    try {
      const snapshot = await this.db.collection('bands')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting bands:', error);
      return [];
    }
  }

  async getBandById(bandId) {
    try {
      const doc = await this.db.collection('bands').doc(bandId).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting band:', error);
      return null;
    }
  }

  async addBand(bandData) {
    try {
      // Validate
      this.validateRequired(bandData.name, 'Nombre de la banda');
      this.validateRequired(bandData.genre, 'Género');
      
      // Sanitize
      const sanitized = {
        name: this.sanitizeInput(bandData.name),
        genre: this.sanitizeInput(bandData.genre),
        description: this.sanitizeInput(bandData.description),
        image: bandData.image || '',
        bandcampUrl: bandData.bandcampUrl || '',
        instagramUrl: bandData.instagramUrl || '',
        track: bandData.track || [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        likes: 0,
        views: 0
      };
      
      const docRef = await this.db.collection('bands').add(sanitized);
      return docRef.id;
    } catch (error) {
      console.error('Error adding band:', error);
      throw error;
    }
  }

 async getTrackData(bandId, trackIndex = 0) {
    try {
      const band = await this.getBandById(bandId);

      if (!band) {
        throw new Error(`Banda con ID ${bandId} no encontrada`);
      }


      let tracksMap = band.tracks || band.track || {};
      let tracksArray = [];
      
      // Si es un OBJETO directo con 'url', es un track único
      if (tracksMap.url && typeof tracksMap.url === 'string') {
        tracksArray = [tracksMap]; // Envolver en array
      }


      
      if (tracksArray.length === 0) {
        throw new Error('No se encontraron tracks válidos para esta banda');
      }
      
      if (trackIndex >= tracksArray.length) {
        throw new Error(`Track en índice ${trackIndex} no encontrado`);
      }
      
      const track = tracksArray[trackIndex];
      
      return {
        title: track.title?.toString().trim() || `Canción ${trackIndex + 1}`,
        artist: band.name || 'Artista desconocido',
        url: track.url.toString().trim(),
        albumArt: track.image || band.image || '/img/music-heart.png',
        duration: track.duration?.toString().trim() || '0:00'
      };
      
    } catch (error) {
      console.error(`Error getting track data for band ${bandId}:`, error);
      throw error;
    }
  }


  // ============ ALBUMS ============
  
async getRecentAlbums(limit = 100) {  // Aumenta el límite a 100 (o más si necesitas)
  try {
    const snapshot = await this.db.collection('albums')
      .orderBy('releaseDate', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting albums:', error);
    return [];
  }
}

  async addAlbum(albumData) {
    try {
      this.validateRequired(albumData.title, 'Título del álbum');
      this.validateRequired(albumData.bandId, 'ID de la banda');
      
      const sanitized = {
        title: this.sanitizeInput(albumData.title),
        bandId: albumData.bandId,
        bandName: this.sanitizeInput(albumData.bandName),
        coverImage: albumData.coverImage || '',
        releaseDate: albumData.releaseDate || new Date(),
        track: albumData.track || [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await this.db.collection('albums').add(sanitized);
      return docRef.id;
    } catch (error) {
      console.error('Error adding album:', error);
      throw error;
    }
  }

  // ============ COMMENTS ============
  
  async getComments(bandId, limit = 50) {
    try {
      const snapshot = await this.db.collection('comments')
        .where('bandId', '==', bandId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  }

  async addComment(commentData) {
    try {
      this.validateRequired(commentData.text, 'Comentario');
      this.validateRequired(commentData.bandId, 'ID de la banda');
      
      if (commentData.text.length < 3) {
        throw new Error('El comentario debe tener al menos 3 caracteres');
      }
      
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('Debes iniciar sesión para comentar');
      }
      
      const sanitized = {
        text: this.sanitizeInput(commentData.text),
        bandId: commentData.bandId,
        userId: user.uid,
        userName: user.displayName || 'Anónimo',
        userPhoto: user.photoURL || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await this.db.collection('comments').add(sanitized);
      return docRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // ============ EVENTS (Toques recientes) ============
  
  async getUpcomingEvents(limit = 10) {
    try {
      const now = new Date();
      const snapshot = await this.db.collection('events')
        .where('date', '>=', now)
        .orderBy('date', 'asc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  async addEvent(eventData) {
    try {
      this.validateRequired(eventData.title, 'Título del evento');
      this.validateRequired(eventData.date, 'Fecha del evento');
      
      const sanitized = {
        title: this.sanitizeInput(eventData.title),
        description: this.sanitizeInput(eventData.description),
        date: new Date(eventData.date),
        venue: this.sanitizeInput(eventData.venue),
        bands: eventData.bands || [],
        image: eventData.image || '',
        ticketUrl: eventData.ticketUrl || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await this.db.collection('events').add(sanitized);
      return docRef.id;
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  }

  // ============ SUBSCRIPTIONS ============
  
  async subscribe(email) {
    try {
      if (!this.validateEmail(email)) {
        throw new Error('Email inválido');
      }
      
      // Check if already subscribed
      const existing = await this.db.collection('subscriptions')
        .where('email', '==', email)
        .get();
      
      if (!existing.empty) {
        throw new Error('Este email ya está suscrito');
      }
      
      await this.db.collection('subscriptions').add({
        email: email.toLowerCase().trim(),
        subscribedAt: firebase.firestore.FieldValue.serverTimestamp(),
        active: true
      });
      
      return true;
    } catch (error) {
      console.error('Error subscribing:', error);
      throw error;
    }
  }

  // ============ NEWS/BLOG ============
  
  async getNews(limit = 10) {
    try {
      const snapshot = await this.db.collection('news')
        .orderBy('publishedAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting news:', error);
      return [];
    }
  }

  async addNews(newsData) {
    try {
      this.validateRequired(newsData.title, 'Título');
      this.validateRequired(newsData.content, 'Contenido');
      
      const sanitized = {
        title: this.sanitizeInput(newsData.title),
        content: this.sanitizeInput(newsData.content),
        image: newsData.image || '',
        author: newsData.author || 'Admin',
        publishedAt: firebase.firestore.FieldValue.serverTimestamp(),
        views: 0
      };
      
      const docRef = await this.db.collection('news').add(sanitized);
      return docRef.id;
    } catch (error) {
      console.error('Error adding news:', error);
      throw error;
    }
  }

  // ============ ANALYTICS ============
  
  async trackVisit(userId = null) {
    try {
      await this.db.collection('visits').add({
        userId: userId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('Error tracking visit:', error);
    }
  }

  async getVisitStats() {
    try {
      const snapshot = await this.db.collection('visits')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();
      
      return {
        total: snapshot.size,
        visits: snapshot.docs.map(doc => doc.data())
      };
    } catch (error) {
      console.error('Error getting visit stats:', error);
      return { total: 0, visits: [] };
    }
  }

  // ============ LIKES ============
  
  async likeBand(bandId) {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('Debes iniciar sesión para dar like');
      }
      
      const likeRef = this.db.collection('likes').doc(`${user.uid}_${bandId}`);
      const doc = await likeRef.get();
      
      if (doc.exists) {
        // Unlike
        await likeRef.delete();
        await this.db.collection('bands').doc(bandId).update({
          likes: firebase.firestore.FieldValue.increment(-1)
        });
        return false;
      } else {
        // Like
        await likeRef.set({
          userId: user.uid,
          bandId: bandId,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        await this.db.collection('bands').doc(bandId).update({
          likes: firebase.firestore.FieldValue.increment(1)
        });
        return true;
      }
    } catch (error) {
      console.error('Error liking band:', error);
      throw error;
    }
  }
}

// Initialize database service
const dbService = new DatabaseService();