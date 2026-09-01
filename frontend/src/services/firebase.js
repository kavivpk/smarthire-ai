// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Your web app's Firebase configuration with optional environment overrides
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCH0kr05x9hQugIcnvLXm50Xi8tIG6Em7E",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "my-app-dc106.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "my-app-dc106",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "my-app-dc106.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "910229244747",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:910229244747:web:f60c448b11ab8ee08276ce"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};