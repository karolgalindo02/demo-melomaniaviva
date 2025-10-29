// Sample data to populate Firebase Firestore
// Use this script in Firebase Console > Firestore > Start Collection
// Or use Firebase Admin SDK to bulk import

// BANDS Collection
const sampleBands = [
  {
    name: "Distimia Agorafóbica",
    genre: "Rock Alternativo",
    description: "Agrupación independiente de Bogotá compuesta por cuatro integrantes. Su contenido musical hace referencia a problemas emocionales, afecciones mentales y la juventud.",
    image: "/img/distimia-agorafobica.jpg",
    bandcampUrl: "https://distimiagorafobica.bandcamp.com",
    instagramUrl: "",
    createdAt: new Date(),
    likes: 0,
    views: 0
  },
  {
    name: "Margarita Siempre Viva",
    genre: "Rock Alternativo, Reverblove",
    description: "Banda independiente de Medellín. Amalgama de sonidos con base en el post-punk, rock, indie, shoegaze y producción lo-fi.",
    image: "/img/margarita-siempre-viva.jpg",
    bandcampUrl: "",
    instagramUrl: "",
    createdAt: new Date(),
    likes: 0,
    views: 0
  },
  {
    name: "Nicolas y Los Fumadores",
    genre: "Alternativo, Indie-rock",
    description: "Banda independiente de Bogotá. Una banda que aprendió a reírse de sí misma, de la mala suerte y del desamor.",
    image: "/img/nicolas-y-los-fumadores.jpg",
    bandcampUrl: "https://los-fumadores.bandcamp.com",
    instagramUrl: "",
    createdAt: new Date(),
    likes: 0,
    views: 0
  },
  {
    name: "La Hermanastra Más Fea",
    genre: "Screamo, Punk, Math rock",
    description: "Banda Underground de Bogotá. Guitarras pesadas, baterías resonantes y mezclas que lo obligan a uno a meterse en un pogo profundo.",
    image: "/img/lhmf2.jpg",
    bandcampUrl: "https://lahermanastramasfea.bandcamp.com",
    instagramUrl: "",
    createdAt: new Date(),
    likes: 0,
    views: 0
  }
];

// ALBUMS Collection
const sampleAlbums = [
  {
    title: "Recaer",
    bandId: "distimia",
    bandName: "Distimia Agorafóbica",
    coverImage: "/img/d-album2.jpg",
    releaseDate: new Date("2020-06-15"),
    tracks: ["Desespero", "Cayendo", "Agorafobia"],
    createdAt: new Date()
  },
  {
    title: "Primavera Febril",
    bandId: "margarita",
    bandName: "Margarita Siempre Viva",
    coverImage: "/img/album4.jpg",
    releaseDate: new Date("2021-03-20"),
    tracks: ["Techo de Astros", "Fenómenos"],
    createdAt: new Date()
  },
  {
    title: "Como Pez en el Hielo",
    bandId: "nicolas",
    bandName: "Nicolas y Los Fumadores",
    coverImage: "/img/n-album3.jpeg",
    releaseDate: new Date("2021-08-10"),
    tracks: ["Bailando Triste"],
    createdAt: new Date()
  },
  {
    title: "Diferencias Creativas Irreconciliables",
    bandId: "lhmf",
    bandName: "La Hermanastra Más Fea",
    coverImage: "/img/lhmf-album3.jpg",
    releaseDate: new Date("2022-01-15"),
    tracks: ["Costa", "Casa Nueva"],
    createdAt: new Date()
  }
];

// EVENTS Collection
const sampleEvents = [
  {
    title: "Fiestoke Alternativo - Mayo",
    description: "Un encuentro de las bandas más relevantes del panorama alternativo en Bogotá",
    date: new Date("2024-12-15T20:00:00"),
    venue: "Club Perro Perro, Bogotá",
    bands: ["Distimia Agorafóbica", "Margarita Siempre Viva", "Nicolas y Los Fumadores"],
    image: "/img/fiestoke.jpg",
    ticketUrl: "https://www.instagram.com/p/CsELT6bOwRr/",
    createdAt: new Date()
  },
  {
    title: "Rock Underground Showcase",
    description: "Noche de pogo y emociones intensas con las bandas más pesadas de la escena",
    date: new Date("2024-12-20T21:00:00"),
    venue: "Bar El Sótano, Bogotá",
    bands: ["La Hermanastra Más Fea"],
    image: "/img/lhmf2.jpg",
    ticketUrl: "",
    createdAt: new Date()
  },
  {
    title: "Reverb Night - Shoegaze & Dream Pop",
    description: "Una noche de texturas sonoras y reverberación infinita",
    date: new Date("2024-12-28T19:00:00"),
    venue: "Café Cultural, Medellín",
    bands: ["Margarita Siempre Viva"],
    image: "/img/revista.jpg",
    ticketUrl: "",
    createdAt: new Date()
  }
];

// NEWS Collection
const sampleNews = [
  {
    title: "Margarita Siempre Viva lanza nuevo sencillo",
    content: "La banda medellinense acaba de lanzar su más reciente sencillo 'Techo de Astros', una exploración melancólica de texturas shoegaze y letras poéticas. El tema ya está disponible en todas las plataformas digitales y promete ser uno de los hits del verano alternativo colombiano.",
    image: "/img/margarita-siempre-viva.jpg",
    author: "Melomania Viva Staff",
    publishedAt: new Date("2024-01-15"),
    views: 0
  },
  {
    title: "Distimia Agorafóbica anuncia gira nacional",
    content: "La agrupación bogotana confirmó su gira 'Recaer Tour' que los llevará por las principales ciudades del país. Las fechas incluyen Bogotá, Medellín, Cali y Barranquilla. Los fanáticos ya pueden adquirir sus boletas en preventa.",
    image: "/img/distimia-agorafobica.jpg",
    author: "Redacción",
    publishedAt: new Date("2024-01-10"),
    views: 0
  },
  {
    title: "La escena indie colombiana conquista festivales internacionales",
    content: "Bandas como Nicolas y Los Fumadores y La Hermanastra Más Fea han sido invitadas a importantes festivales de rock alternativo en México y Argentina. Esto marca un momento histórico para el indie colombiano que cada vez gana más reconocimiento internacional.",
    image: "/img/banner.jpg",
    author: "Juan Pérez",
    publishedAt: new Date("2024-01-05"),
    views: 0
  },
  {
    title: "Entrevista exclusiva: Nicolas y Los Fumadores hablan de su nuevo álbum",
    content: "En una charla íntima, la banda nos cuenta sobre el proceso creativo detrás de 'Como Pez en el Hielo', un disco que narra las experiencias cotidianas en Bogotá desde la ensoñación y el absurdo. Además, revelan detalles de su próximo proyecto.",
    image: "/img/nicolas-y-los-fumadores.jpg",
    author: "María González",
    publishedAt: new Date("2024-01-02"),
    views: 0
  },
  {
    title: "Top 10: Las mejores bandas independientes de Bogotá en 2023",
    content: "Hacemos un recuento de las agrupaciones que marcaron el año en la capital. Desde el screamo visceral de La Hermanastra Más Fea hasta las melodías melancólicas de Distimia Agorafóbica, 2023 fue un año memorable para la escena independiente bogotana.",
    image: "/img/revista.jpg",
    author: "Melomania Viva Staff",
    publishedAt: new Date("2023-12-28"),
    views: 0
  }
];

// INSTRUCTIONS FOR IMPORTING TO FIREBASE:
console.log(`
===========================================
INSTRUCCIONES PARA IMPORTAR A FIREBASE
===========================================

Opción 1 - Manual (Firebase Console):
--------------------------------------
1. Ve a Firebase Console > Firestore Database
2. Haz clic en "Start collection"
3. Nombre de colección: "bands"
4. Agrega documentos uno por uno usando los datos de sampleBands

Repite para las colecciones:
- albums (sampleAlbums)
- events (sampleEvents)
- news (sampleNews)

Opción 2 - Con Script (Firebase Admin SDK):
------------------------------------------
1. Instala Firebase Admin: npm install firebase-admin
2. Descarga tu service account key desde Firebase Console
3. Usa este código:

const admin = require('firebase-admin');
const serviceAccount = require('./path-to-serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Importar bandas
sampleBands.forEach(async (band) => {
  await db.collection('bands').add(band);
  console.log('Banda agregada:', band.name);
});

// Importar álbums
sampleAlbums.forEach(async (album) => {
  await db.collection('albums').add(album);
  console.log('Álbum agregado:', album.title);
});

// Importar eventos
sampleEvents.forEach(async (event) => {
  await db.collection('events').add(event);
  console.log('Evento agregado:', event.title);
});

// Importar noticias
sampleNews.forEach(async (news) => {
  await db.collection('news').add(news);
  console.log('Noticia agregada:', news.title);
});

Opción 3 - Desde la Aplicación Web:
----------------------------------
1. Crea una cuenta de administrador
2. Crea una página admin en tu aplicación
3. Agrega botones para importar datos de ejemplo
4. Usa dbService.addBand(), dbService.addAlbum(), etc.

===========================================
`);

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sampleBands,
    sampleAlbums,
    sampleEvents,
    sampleNews
  };
}
