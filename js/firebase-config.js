// =============================================================
// 🔧 CONFIGURACIÓN DE FIREBASE
// -------------------------------------------------------------
// Reemplazá los valores de "firebaseConfig" de abajo por los de
// TU proyecto de Firebase.
//
// Los vas a encontrar en:
//   Firebase Console → ⚙️ Configuración del proyecto
//   → pestaña "Tus apps" → app web → "Config del SDK"
//
// Guía paso a paso completa en el README.md incluido en este zip.
// =============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCemmVmxQPy46BFOT0TwxS4piJUY79IV_c",
  authDomain: "bebe-b69ea.firebaseapp.com",
  projectId: "bebe-b69ea",
  storageBucket: "bebe-b69ea.firebasestorage.app",
  messagingSenderId: "173109148505",
  appId: "1:173109148505:web:a59065b11893156c89ea48"
};

// Esto detecta si todavía quedan los valores de ejemplo sin
// reemplazar, para poder avisarte en la página en vez de romperse.
export const FIREBASE_IS_CONFIGURED = firebaseConfig.apiKey !== "TU_API_KEY";

export let db = null;

if (FIREBASE_IS_CONFIGURED) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}
