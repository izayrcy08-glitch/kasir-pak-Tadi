import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Offline persistence (IndexedDB) diaktifkan eksplisit — SDK modern tidak
// mengaktifkannya secara default. multi-tab manager supaya tidak gagal diam-diam
// kalau PWA ini kebuka di dua tab Windows sekaligus.
// ignoreUndefinedProperties: field opsional (mis. kodePart yang tidak diisi)
// wajar bernilai undefined di banyak fitur kasir ini — tanpa opsi ini,
// Firestore menolak (throw) setiap kali objek yang ditulis punya field undefined.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  ignoreUndefinedProperties: true,
});

// Saklar emulator: true saat dev/test lokal, WAJIB false di build produksi
// supaya tidak pernah tersambung ke Firestore/Auth asli secara tidak sengaja.
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
}
