import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDgqw5bnk2Y1oQpt_DmH1viUvyj6WztDok",
  authDomain: "story-7af93.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "story-7af93",
  storageBucket: "story-7af93.firebasestorage.app",
  messagingSenderId: "443276932654",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:443276932654:web:250eb2d3aa0b8dbd5811bf",
  measurementId: "G-3SSVFESQFX"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
