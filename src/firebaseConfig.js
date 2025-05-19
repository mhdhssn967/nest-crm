// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


export const firebaseConfig = {
  apiKey: "AIzaSyALgvPlNrdoPd9bL-26oqyDdpjAWK9UM0A",
  authDomain: "oqulix-nest.firebaseapp.com",
  projectId: "oqulix-nest",
  storageBucket: "oqulix-nest.firebasestorage.app",
  messagingSenderId: "1062926352512",
  appId: "1:1062926352512:web:c468e8060f8481ef59e665",
  measurementId: "G-8MWSEVG6L9"
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// analytics
const analytics = getAnalytics(app);


// 🔐 Enable persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Auth persistence set to local (default).");
  })
  .catch((error) => {
    console.error("Failed to set persistence:", error);
  });