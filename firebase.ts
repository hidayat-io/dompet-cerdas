import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import {
    Firestore,
    connectFirestoreEmulator,
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
} from "firebase/firestore";

// --- KONFIGURASI FIREBASE (PRODUCTION) ---
// PENTING: authDomain menggunakan custom domain untuk menghindari
// masalah third-party cookie di iOS Safari dan in-app browsers
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
const authEmulatorUrl = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL || 'http://127.0.0.1:9099';
const firestoreEmulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || '127.0.0.1';
const firestoreEmulatorPort = Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8080);

let app: FirebaseApp;
let authInstance: Auth;
let dbInstance: Firestore;
let googleProviderInstance: GoogleAuthProvider;

// --- INITIALIZATION ---
try {
    // Cek apakah Firebase sudah ada instance-nya (HMR/Hot Reload safety)
    if (getApps().length > 0) {
        app = getApp();
    } else {
        app = initializeApp(firebaseConfig);
    }

    // Setup Services
    authInstance = getAuth(app);
    try {
        dbInstance = initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
            }),
        });
    } catch (firestoreInitError) {
        console.warn("Firestore persistence fallback:", firestoreInitError);
        dbInstance = getFirestore(app);
    }
    googleProviderInstance = new GoogleAuthProvider();

    if (useEmulators) {
        connectAuthEmulator(authInstance, authEmulatorUrl, { disableWarnings: true });
        connectFirestoreEmulator(dbInstance, firestoreEmulatorHost, firestoreEmulatorPort);
    }

} catch (criticalError) {
    console.error("CRITICAL FIREBASE ERROR:", criticalError);
}

// --- EXPORTS ---
export const auth = authInstance!;
export const db = dbInstance!;
export const googleProvider = googleProviderInstance!;
export const firebaseApp = app!;
