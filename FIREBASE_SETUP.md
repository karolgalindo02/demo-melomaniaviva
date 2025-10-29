# Guía de Configuración de Firebase para Melomania Viva!

## 🚀 Pasos para Configurar Firebase

### 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto"
3. Nombra tu proyecto (ej: "melomania-viva")
4. Sigue los pasos para crear el proyecto

### 2. Registrar tu Aplicación Web

1. En el panel de Firebase, haz clic en el ícono Web (</>)
2. Registra tu app con un apodo (ej: "Melomania Web")
3. NO selecciones "Firebase Hosting" por ahora
4. Haz clic en "Registrar app"

### 3. Obtener las Credenciales de Firebase

Después de registrar tu app, verás un objeto de configuración como este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### 4. Actualizar el Archivo de Configuración

**Archivo a editar:** `/app/js/firebase-config.js`

Reemplaza los valores en `firebaseConfig` con tus credenciales reales:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
```

### 5. Habilitar Autenticación

1. En Firebase Console, ve a **Authentication** en el menú lateral
2. Haz clic en **Get Started**
3. Ve a la pestaña **Sign-in method**
4. Habilita los siguientes proveedores:

   **a) Email/Password:**
   - Haz clic en "Email/Password"
   - Activa "Enable"
   - Guarda

   **b) Google (Opcional pero recomendado):**
   - Haz clic en "Google"
   - Activa "Enable"
   - Selecciona un email de soporte
   - Guarda

   **c) Instagram (Cuando tengas las credenciales):**
   - Necesitarás crear una app en Facebook Developers
   - Obtener Instagram App ID y App Secret
   - Configurar en Firebase como proveedor personalizado

   **d) Bandcamp (Requiere implementación personalizada):**
   - Bandcamp no es un proveedor estándar de Firebase
   - Necesitarás implementar OAuth2 personalizado

### 6. Configurar Firestore Database

1. En Firebase Console, ve a **Firestore Database**
2. Haz clic en **Create database**
3. Selecciona el modo:
   - **Producción:** Para seguridad estricta (recomendado)
   - **Prueba:** Para desarrollo (expira en 30 días)
4. Selecciona una ubicación (ej: us-central1)
5. Haz clic en **Enable**

### 7. Configurar Reglas de Seguridad de Firestore

Después de crear la base de datos, ve a la pestaña **Rules** y reemplaza con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Usuarios - solo pueden leer/escribir su propio documento
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Bandas - todos pueden leer, solo autenticados pueden escribir
    match /bands/{bandId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    
    // Álbums - todos pueden leer, solo autenticados pueden escribir
    match /albums/{albumId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Comentarios - todos pueden leer, solo autenticados pueden escribir
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Eventos - todos pueden leer, solo autenticados pueden escribir
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Noticias - todos pueden leer, solo autenticados pueden escribir
    match /news/{newsId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Suscripciones - cualquiera puede crear, solo admin puede leer
    match /subscriptions/{subscriptionId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    
    // Likes - solo autenticados
    match /likes/{likeId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Visitas - cualquiera puede crear, solo admin puede leer
    match /visits/{visitId} {
      allow create: if true;
      allow read: if request.auth != null;
    }
  }
}
```

### 8. Estructura de Colecciones en Firestore

Tu base de datos tendrá las siguientes colecciones:

**users:**
```javascript
{
  uid: "user123",
  email: "usuario@email.com",
  displayName: "Nombre Usuario",
  photoURL: "https://...",
  createdAt: Timestamp,
  lastLogin: Timestamp
}
```

**bands:**
```javascript
{
  name: "Nombre de la Banda",
  genre: "Rock Alternativo",
  description: "Descripción...",
  image: "url_imagen",
  bandcampUrl: "https://...",
  instagramUrl: "https://...",
  createdAt: Timestamp,
  likes: 0,
  views: 0
}
```

**albums:**
```javascript
{
  title: "Título del Álbum",
  bandId: "banda123",
  bandName: "Nombre Banda",
  coverImage: "url_imagen",
  releaseDate: Date,
  tracks: ["track1", "track2"],
  createdAt: Timestamp
}
```

**comments:**
```javascript
{
  text: "Comentario...",
  bandId: "banda123",
  userId: "user123",
  userName: "Nombre Usuario",
  userPhoto: "url_imagen",
  createdAt: Timestamp
}
```

**events:**
```javascript
{
  title: "Nombre del Evento",
  description: "Descripción...",
  date: Date,
  venue: "Lugar",
  bands: ["banda1", "banda2"],
  image: "url_imagen",
  ticketUrl: "https://...",
  createdAt: Timestamp
}
```

**news:**
```javascript
{
  title: "Título Noticia",
  content: "Contenido...",
  image: "url_imagen",
  author: "Autor",
  publishedAt: Timestamp,
  views: 0
}
```

### 9. Configurar Instagram OAuth (Cuando tengas las credenciales)

1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Crea una nueva app
3. Agrega el producto "Instagram Basic Display"
4. Configura las URLs de redirección
5. Obtén el App ID y App Secret
6. En Firebase Console > Authentication > Sign-in method:
   - Agrega un proveedor personalizado para Instagram
   - Ingresa las credenciales

### 10. Configurar Bandcamp OAuth (Cuando tengas las credenciales)

Bandcamp requiere que contactes su equipo para obtener acceso a la API:
1. Envía un email a support@bandcamp.com
2. Explica tu caso de uso
3. Espera la aprobación y credenciales (client_id, client_secret)

Una vez tengas las credenciales, necesitarás:
1. Implementar un backend para manejar el flujo OAuth
2. Usar las credenciales para obtener access tokens
3. Crear custom tokens en Firebase para autenticar usuarios

### 11. Probar la Aplicación

1. Abre `index.html` en tu navegador
2. Abre la Consola de Desarrollo (F12)
3. Verifica que no haya errores de Firebase
4. Prueba el registro con email/password
5. Prueba el login con Google (si lo habilitaste)
6. Verifica que los datos se guarden en Firestore

### 12. Índices de Firestore (Opcional para mejor rendimiento)

Si obtienes errores sobre índices faltantes, Firebase te dará un link directo para crearlos. O puedes crearlos manualmente:

1. Ve a Firestore > Indexes
2. Crea índices compuestos para:
   - `events`: date (Ascending), createdAt (Descending)
   - `albums`: releaseDate (Descending)
   - `news`: publishedAt (Descending)
   - `comments`: bandId (Ascending), createdAt (Descending)

---

## 📱 PWA - Aplicación Web Progresiva

Tu aplicación ya está configurada como PWA. Para instalarla:

### En Desktop (Chrome):
1. Ve a tu sitio web
2. Verás un ícono de instalación en la barra de direcciones
3. Haz clic para instalar

### En Mobile:
1. Abre el sitio en Chrome/Safari
2. Menú > "Agregar a pantalla de inicio"
3. La app se comportará como una app nativa

---

## 🔧 Funcionalidades Implementadas

✅ **Firebase Authentication:**
- Login con Email/Password
- Login con Google (configurar en Firebase)
- Login con Instagram (requiere configuración)
- Login con Bandcamp (requiere configuración)

✅ **Firestore Database:**
- Bandas
- Álbums
- Comentarios
- Eventos/Toques
- Noticias
- Suscripciones
- Likes
- Analytics de visitas

✅ **Validación de Datos:**
- Validación de emails
- Sanitización de inputs
- Validación de campos requeridos
- Mensajes de error claros

✅ **PWA:**
- Manifest configurado
- Service Worker para modo offline
- Cacheo de recursos
- Instalable en dispositivos

✅ **UI/UX:**
- Migrado a Tailwind CSS
- Diseño responsive
- Modales de login/registro
- Sistema de comentarios
- Sección de eventos próximos
- Álbums recientes
- Noticias/blog
- Estadísticas de visitantes

---

## 🐛 Solución de Problemas

### Error: "Firebase is not defined"
- Asegúrate de que los scripts de Firebase se cargan antes de `firebase-config.js`

### Error: "Permission denied" en Firestore
- Revisa las reglas de seguridad en Firestore
- Asegúrate de que el usuario esté autenticado para operaciones que lo requieren

### La app no se instala como PWA
- Verifica que estés usando HTTPS (o localhost)
- Revisa que manifest.json esté correctamente configurado
- Verifica en DevTools > Application > Manifest

### Instagram/Bandcamp login no funciona
- Estos requieren configuración adicional y credenciales
- Por ahora, usa Email/Password o Google

---

## 📞 Soporte

Si tienes problemas con la configuración, revisa:
- [Documentación de Firebase](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)

---

¡Disfruta de tu aplicación Melomania Viva! 🎸🎵
