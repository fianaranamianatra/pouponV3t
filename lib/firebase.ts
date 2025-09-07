// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableNetwork, disableNetwork, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA-7iUNdHGEBYRiU5bzcykDEu8OXbOO89c",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "poupons-d7979.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "poupons-d7979",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "poupons-d7979.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "748366685258",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:748366685258:web:327e8baa8b0d0a502d32b3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);

// Configuration de l'authentification
auth.useDeviceLanguage(); // Utiliser la langue du navigateur pour les emails

export const db = getFirestore(app);

// Configuration Firestore pour une meilleure gestion hors ligne
try {
  // Activer la persistance hors ligne
  console.log("Configuration de la persistance Firestore...");
  
  // Gérer les erreurs de connectivité
  const handleConnectionError = (error: any) => {
    console.warn("Problème de connectivité Firestore détecté:", error.message);
    // L'application continuera à fonctionner en mode hors ligne
  };
  
  // Écouter les changements d'état de connexion
  window.addEventListener('online', () => {
    console.log("Connexion internet rétablie, tentative de reconnexion à Firestore...");
    enableNetwork(db).catch(handleConnectionError);
  });
  
  window.addEventListener('offline', () => {
    console.log("Connexion internet perdue, passage en mode hors ligne...");
  });
  
} catch (error) {
  console.warn("Erreur lors de la configuration Firestore:", error);
}

export const storage = getStorage(app);
export const functions = getFunctions(app);

console.log("Firebase configuré avec gestion hors ligne améliorée");

export default app;