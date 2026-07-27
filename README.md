# ¡Adivina Adivinador! 👶

Página de votación para el "gender reveal" familiar. Cada persona entra con
su nombre, vota Varón / Nena / Ni Idea, y después ve los resultados de
toda la familia actualizándose en vivo. El voto se puede cambiar durante
5 minutos; después queda bloqueado.

## Qué incluye este proyecto

```
gender-reveal/
├── index.html          → las 3 pantallas (bienvenida, votación, resultados)
├── css/style.css        → todo el diseño
├── js/firebase-config.js → ACÁ VAS A PEGAR TU CONFIGURACIÓN DE FIREBASE
├── js/app.js             → toda la lógica (votar, temporizador, resultados en vivo)
├── firestore.rules       → reglas de seguridad para pegar en Firebase
└── README.md             → este archivo
```

No hace falta instalar nada ni usar la terminal: es HTML/CSS/JS puro y
usa Firebase directamente desde el navegador.

---

## Parte 1 — Crear la base de datos en Firebase (gratis)

### 1. Crear el proyecto
Entrá a **[console.firebase.google.com](https://console.firebase.google.com)**,
iniciá sesión con una cuenta de Google y hacé clic en **"Crear un proyecto"**.
Ponele el nombre que quieras (ej: "bebe-reveal"). Podés desactivar Google
Analytics, no lo necesitás para esto.

### 2. Activar Firestore
Dentro del proyecto, en el menú de la izquierda: **Build → Firestore Database
→ Crear base de datos**. Elegí **modo producción** y una ubicación cercana
(por ejemplo `southamerica-east1` si estás en Sudamérica).

### 3. Pegar las reglas de seguridad
En Firestore Database, andá a la pestaña **"Reglas"**, borrá lo que hay y
pegá el contenido completo del archivo `firestore.rules` (incluido en este
zip). Hacé clic en **"Publicar"**.

> Esto es más seguro que dejar el modo de prueba abierto: solo permite que
> cada quien cree su propio voto con el formato correcto y cambie el campo
> "vote", sin poder borrar ni alterar los votos de otros.

### 4. Registrar la app web y copiar la configuración
Volvé a la página principal del proyecto (Project Overview) y hacé clic en
el ícono **`</>`** (Web). Registrala con cualquier nombre (ej: "pagina") —
**no hace falta** activar Firebase Hosting, porque vas a usar GitHub Pages.

Firebase te va a mostrar un bloque de código con un objeto `firebaseConfig`
parecido a este:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "bebe-reveal.firebaseapp.com",
  projectId: "bebe-reveal",
  storageBucket: "bebe-reveal.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

Copiá esos 6 valores.

### 5. Pegarlos en el proyecto
Abrí el archivo `js/firebase-config.js` de este zip con cualquier editor de
texto (o directo en GitHub, más abajo) y reemplazá los valores de ejemplo
(`"TU_API_KEY"`, `"TU_PROYECTO"`, etc.) por los tuyos. Guardá el archivo.

---

## Parte 2 — Publicar la página en GitHub Pages (gratis)

### 6. Crear el repositorio
Entrá a **[github.com](https://github.com)** (creá una cuenta gratis si no
tenés), hacé clic en **"New repository"**. Ponele un nombre (ej:
`genero-bebe`), marcalo como **Público** y creálo.

### 7. Subir los archivos
Dentro del repositorio recién creado, hacé clic en **"Add file" → "Upload
files"**, y arrastrá **todo el contenido** de la carpeta `gender-reveal`
(incluidas las carpetas `css` y `js` — arrastralas tal cual). Confirmá con
**"Commit changes"**.

### 8. Activar GitHub Pages
Andá a la pestaña **Settings** del repositorio → **Pages** (en el menú de
la izquierda). En "Source" elegí la rama **main** y la carpeta **/ (root)**,
después **Save**. Esperá 1 o 2 minutos.

### 9. Compartir el link
GitHub te va a mostrar la URL pública, algo como:

```
https://tu-usuario.github.io/genero-bebe/
```

Ese es el link que le mandás a la familia por WhatsApp. 🎉

---

## Personalización

- **Colores / textos**: están todos en `css/style.css` (arriba de todo, en
  `:root`) y en `index.html`.
- **Ilustraciones**: los tres íconos (varón, nena, ni idea) son SVG dibujados
  a mano dentro de `index.html`, en formato acuarela vintage con marco
  dorado tipo bastidor de bordado — no dependen de imágenes externas, así
  que no hay que subir ni linkear ninguna foto. Si más adelante querés
  reemplazarlos por tus propias ilustraciones, cada uno está dentro de un
  bloque `<svg class="vote-card__icon">…</svg>` fácil de ubicar y cambiar
  por una etiqueta `<img src="...">`.
- **Los 5 minutos del temporizador**: en `js/app.js`, constante
  `FIVE_MIN_MS` (arriba del todo).

## Cómo funciona el bloqueo de 5 minutos

Cada voto guarda la hora exacta en que se votó por primera vez. Mientras no
pasaron 5 minutos desde ESE momento, la persona puede tocar "Cambiar mi
voto" y elegir otra opción (el reloj no se reinicia al cambiar de opción).
Pasados los 5 minutos, el botón desaparece y se muestra el candado. El
estado se guarda en el `localStorage` del navegador, así que si recargan
la página el temporizador sigue donde iba.

## Limitaciones a tener en cuenta

- No hay login: la identidad de cada persona es simplemente el nombre que
  escribió más un identificador guardado en su navegador. Es un juego de
  confianza familiar, no está pensado para votaciones a prueba de trampas.
- Si alguien borra los datos del navegador o vota desde otro dispositivo,
  el sitio lo va a tratar como una persona nueva.
- Estas reglas y el plan gratuito de Firebase (Spark) alcanzan de sobra
  para una familia; no hace falta tarjeta de crédito.

## Problemas comunes

- **La página carga pero no puedo votar / no aparece nada en resultados**:
  seguramente falta pegar la configuración real en `js/firebase-config.js`
  (vas a ver un aviso amarillo en la propia página avisando esto).
- **Aparece un error de permisos en la consola del navegador**: revisá que
  hayas pegado y publicado bien las reglas del paso 3.
- **Subí un cambio a `firebase-config.js` y no se ve reflejado**: en GitHub
  Pages puede tardar 1-2 minutos en actualizarse, y a veces hay que
  refrescar con Ctrl+Shift+R (o Cmd+Shift+R en Mac) para saltear la caché.
