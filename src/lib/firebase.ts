import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAtwb8Xn5P2wZBEQg7FVsTyKoV5H31JqDc",
  authDomain: "messmate2812.firebaseapp.com",
  projectId: "messmate2812",
  storageBucket: "messmate2812.firebasestorage.app",
  messagingSenderId: "169344099288",
  appId: "1:169344099288:web:4a6d4e8508e3887a2848ad",
  measurementId: "G-947VNS8EGV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
