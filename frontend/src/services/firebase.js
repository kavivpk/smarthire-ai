// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCH0kr05x9hQugIcnvLXm50Xi8tIG6Em7E",
  authDomain: "my-app-dc106.firebaseapp.com",
  projectId: "my-app-dc106",
  storageBucket: "my-app-dc106.firebasestorage.app",
  messagingSenderId: "910229244747",
  appId: "1:910229244747:web:f60c448b11ab8ee08276ce"
};

initializeApp(firebaseConfig);

export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};