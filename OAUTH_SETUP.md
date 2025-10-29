# Configuración de Login con Instagram y Bandcamp

## 🔐 Instagram OAuth Configuration

### Paso 1: Crear una App en Facebook Developers

1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Haz clic en "My Apps" en el menú superior
3. Clic en "Create App"
4. Selecciona el tipo "Consumer" o "None"
5. Completa la información:
   - Display Name: "Melomania Viva"
   - Contact Email: tu email
   - Purpose: "Build apps that people will use"

### Paso 2: Agregar Instagram Basic Display

1. En el dashboard de tu app, haz clic en "Add Product"
2. Busca "Instagram Basic Display"
3. Haz clic en "Set Up"
4. Scroll hacia abajo y haz clic en "Create New App"
5. Completa la información:
   - Display Name: "Melomania Viva"
   - Valid OAuth Redirect URIs: 
     - `https://tu-dominio.com/__/auth/handler`
     - `https://tu-proyecto.firebaseapp.com/__/auth/handler`
   - Deauthorize Callback URL: `https://tu-dominio.com/deauthorize`
   - Data Deletion Request URL: `https://tu-dominio.com/data-deletion`
6. Haz clic en "Save Changes"

### Paso 3: Obtener Credenciales

1. En la sección "Instagram Basic Display", ve a "Basic Display"
2. Copia tu **Instagram App ID**
3. Copia tu **Instagram App Secret**
4. En "User Token Generator", agrega tu cuenta de Instagram de prueba

### Paso 4: Configurar en Firebase

**IMPORTANTE:** Instagram no es un proveedor OAuth nativo en Firebase. Necesitas usar un proveedor OAuth personalizado.

#### Opción A: Usar Facebook Login (Recomendado)

Como Instagram pertenece a Meta/Facebook, puedes usar Facebook Login que ya incluye acceso a Instagram:

1. En Firebase Console, ve a Authentication > Sign-in method
2. Habilita "Facebook"
3. Ingresa tu App ID y App Secret de Facebook
4. Copia el OAuth redirect URI de Firebase
5. Agrégalo en Facebook App > Settings > Basic > App Domains

#### Opción B: Implementación Personalizada (Avanzado)

Necesitarás crear un backend para manejar el flujo OAuth:

**Backend (Node.js/Express ejemplo):**

```javascript
const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');

const app = express();

// Configuración
const INSTAGRAM_APP_ID = 'TU_INSTAGRAM_APP_ID';
const INSTAGRAM_APP_SECRET = 'TU_INSTAGRAM_APP_SECRET';
const REDIRECT_URI = 'https://tu-dominio.com/auth/instagram/callback';

// Paso 1: Redirigir al usuario a Instagram
app.get('/auth/instagram', (req, res) => {
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=user_profile,user_media&response_type=code`;
  res.redirect(authUrl);
});

// Paso 2: Callback de Instagram
app.get('/auth/instagram/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    // Intercambiar código por access token
    const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', {
      client_id: INSTAGRAM_APP_ID,
      client_secret: INSTAGRAM_APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
      code: code
    });
    
    const { access_token, user_id } = tokenResponse.data;
    
    // Obtener información del usuario
    const userResponse = await axios.get(`https://graph.instagram.com/me?fields=id,username,account_type&access_token=${access_token}`);
    
    // Crear custom token en Firebase
    const firebaseToken = await admin.auth().createCustomToken(user_id, {
      provider: 'instagram',
      username: userResponse.data.username
    });
    
    // Redirigir al frontend con el token
    res.redirect(`https://tu-dominio.com/auth/success?token=${firebaseToken}`);
  } catch (error) {
    console.error('Error:', error);
    res.redirect('https://tu-dominio.com/auth/error');
  }
});
```

**Frontend (actualizar auth.js):**

```javascript
async loginWithInstagram() {
  try {
    // Abrir ventana de autenticación
    window.location.href = 'https://tu-backend.com/auth/instagram';
    
    // El backend redirigirá de vuelta con un token
    // Capturar el token en una página de callback
    
  } catch (error) {
    console.error('Instagram login error:', error);
    throw error;
  }
}

// En tu página de callback (auth/success)
const urlParams = new URLSearchParams(window.location.search);
const customToken = urlParams.get('token');

if (customToken) {
  firebase.auth().signInWithCustomToken(customToken)
    .then(() => {
      window.location.href = '/';
    })
    .catch(error => {
      console.error('Error signing in:', error);
    });
}
```

---

## 🎵 Bandcamp OAuth Configuration

### Paso 1: Solicitar Acceso a la API

Bandcamp requiere aprobación manual para acceder a su API:

1. Envía un email a: **support@bandcamp.com**
2. Asunto: "API Access Request for Melomania Viva"
3. Contenido del email:

```
Hola equipo de Bandcamp,

Mi nombre es [Tu Nombre] y estoy desarrollando una aplicación web llamada 
"Melomania Viva" (https://tu-dominio.com) que ayuda a los usuarios a descubrir 
bandas independientes de rock alternativo.

Me gustaría integrar la API de Bandcamp para:
- Permitir a los usuarios iniciar sesión con sus cuentas de Bandcamp
- Mostrar información de artistas y álbumes
- Integrar reproductor de música

¿Podrían proporcionarme acceso a la API y las credenciales necesarias 
(client_id y client_secret)?

Gracias por su consideración.

[Tu Nombre]
[Tu Email]
[URL de tu aplicación]
```

4. Espera la respuesta (puede tomar varios días)

### Paso 2: Una vez recibas las credenciales

Te enviarán:
- `client_id`
- `client_secret`
- Documentación de endpoints

### Paso 3: Implementar OAuth Flow

**Backend (Node.js/Express):**

```javascript
const BANDCAMP_CLIENT_ID = 'TU_BANDCAMP_CLIENT_ID';
const BANDCAMP_CLIENT_SECRET = 'TU_BANDCAMP_CLIENT_SECRET';
const REDIRECT_URI = 'https://tu-dominio.com/auth/bandcamp/callback';

// Paso 1: Obtener access token
app.post('/auth/bandcamp/token', async (req, res) => {
  const { code } = req.body;
  
  try {
    const response = await axios.post('https://bandcamp.com/oauth_token', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: BANDCAMP_CLIENT_ID,
        client_secret: BANDCAMP_CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const { access_token } = response.data;
    
    // Obtener información del usuario
    const userInfo = await axios.get('https://bandcamp.com/api/account/1/my_bands', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    // Crear custom token en Firebase
    const userId = userInfo.data.bands[0].band_id;
    const firebaseToken = await admin.auth().createCustomToken(userId.toString(), {
      provider: 'bandcamp',
      bandcamp_data: userInfo.data
    });
    
    res.json({ firebaseToken });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Refresh token
app.post('/auth/bandcamp/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  
  try {
    const response = await axios.post('https://bandcamp.com/oauth_token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: BANDCAMP_CLIENT_ID,
        client_secret: BANDCAMP_CLIENT_SECRET,
        refresh_token: refresh_token
      })
    );
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Frontend (actualizar auth.js):**

```javascript
async loginWithBandcamp() {
  try {
    // URL de autorización de Bandcamp
    const authUrl = `https://bandcamp.com/oauth/authorize?` +
      `client_id=${BANDCAMP_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=profile`;
    
    // Abrir en ventana popup o redirigir
    const width = 500;
    const height = 600;
    const left = (screen.width / 2) - (width / 2);
    const top = (screen.height / 2) - (height / 2);
    
    const popup = window.open(
      authUrl,
      'Bandcamp Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    // Escuchar el callback
    window.addEventListener('message', async (event) => {
      if (event.data.type === 'bandcamp-auth') {
        const { code } = event.data;
        
        // Intercambiar código por token en tu backend
        const response = await fetch('https://tu-backend.com/auth/bandcamp/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        
        const { firebaseToken } = await response.json();
        
        // Iniciar sesión en Firebase con custom token
        await firebase.auth().signInWithCustomToken(firebaseToken);
        
        showSuccess('Login con Bandcamp exitoso!');
        popup.close();
      }
    });
    
  } catch (error) {
    console.error('Bandcamp login error:', error);
    throw error;
  }
}
```

**Página de Callback (bandcamp-callback.html):**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Bandcamp Auth</title>
</head>
<body>
  <script>
    // Obtener el código de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // Enviar el código a la ventana padre
      window.opener.postMessage({
        type: 'bandcamp-auth',
        code: code
      }, '*');
    } else {
      window.opener.postMessage({
        type: 'bandcamp-auth-error',
        error: 'No code received'
      }, '*');
    }
  </script>
</body>
</html>
```

---

## 🔧 Archivos a Actualizar

### 1. /app/js/firebase-config.js

Agregar configuración de providers:

```javascript
// Bandcamp configuration
const BANDCAMP_CLIENT_ID = 'TU_CLIENT_ID_CUANDO_LO_TENGAS';
const BANDCAMP_REDIRECT_URI = 'https://tu-dominio.com/bandcamp-callback.html';

// Instagram configuration  
const INSTAGRAM_APP_ID = 'TU_INSTAGRAM_APP_ID';
const INSTAGRAM_REDIRECT_URI = 'https://tu-dominio.com/instagram-callback.html';
```

### 2. /app/js/auth.js

Ya está preparado, solo necesitas agregar las configuraciones cuando tengas las credenciales.

---

## 📋 Checklist de Implementación

### Instagram:
- [ ] Crear app en Facebook Developers
- [ ] Configurar Instagram Basic Display
- [ ] Obtener App ID y App Secret
- [ ] Configurar redirect URIs
- [ ] Agregar Instagram de prueba
- [ ] Decidir: ¿Facebook Login o implementación personalizada?
- [ ] Actualizar firebase-config.js con credenciales
- [ ] Probar login

### Bandcamp:
- [ ] Enviar email a support@bandcamp.com
- [ ] Esperar aprobación
- [ ] Recibir client_id y client_secret
- [ ] Crear backend para OAuth flow
- [ ] Implementar endpoints de token
- [ ] Crear página de callback
- [ ] Actualizar auth.js
- [ ] Probar login

---

## ⚠️ Consideraciones Importantes

### Instagram:
- Instagram Basic Display solo funciona con cuentas de Instagram que sean Business o Creator accounts vinculadas a una página de Facebook
- Para producción, necesitarás pasar por "App Review" de Facebook
- Los tokens expiran y necesitan renovarse

### Bandcamp:
- Bandcamp API es muy restrictiva y principalmente para labels y partners
- Pueden rechazar tu solicitud si no cumples sus criterios
- Considera usar su widget embebido como alternativa

### Alternativas Más Simples:

1. **Solo usar Google Login** (ya implementado y funcional)
2. **Agregar enlaces sociales** en vez de login (mostrar perfiles de Instagram/Bandcamp)
3. **Web scraping** (no recomendado legalmente)
4. **Widgets embebidos** de Instagram y Bandcamp

---

## 🆘 Soporte

Si tienes problemas durante la implementación:

- **Instagram API:** [Documentación oficial](https://developers.facebook.com/docs/instagram-basic-display-api)
- **Bandcamp API:** Contactar support@bandcamp.com
- **Firebase Custom Auth:** [Documentación](https://firebase.google.com/docs/auth/web/custom-auth)

---

¡Buena suerte con la implementación! 🚀
