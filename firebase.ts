import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// --- KONFIGURASI FIREBASE (PRODUCTION) ---
const firebaseConfig = {
    apiKey: "AIzaSyBCCBireEUYJh9OR-kMCDkTY38eTOXXVZE",
    authDomain: "expensetracker-test-1.firebaseapp.com",
    databaseURL: "https://expensetracker-test-1-default-rtdb.firebaseio.com",
    projectId: "expensetracker-test-1",
    storageBucket: "expensetracker-test-1.firebasestorage.app",
    messagingSenderId: "192680721146",
    appId: "1:192680721146:web:84049577f6e2de212f6743",
    measurementId: "G-DVEH6873YX"
};

let app: FirebaseApp;
let authInstance: Auth;
let dbInstance: Firestore;
let storageInstance: FirebaseStorage;
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
    dbInstance = getFirestore(app);
    storageInstance = getStorage(app);
    googleProviderInstance = new GoogleAuthProvider();

} catch (criticalError) {
    console.error("CRITICAL FIREBASE ERROR:", criticalError);
}

// --- EXPORTS ---
export const auth = authInstance!;
export const db = dbInstance!;
export const storage = storageInstance!;
export const googleProvider = googleProviderInstance!;
export const firebaseApp = app!;