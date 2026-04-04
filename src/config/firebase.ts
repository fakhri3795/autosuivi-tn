import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAwRpOKMHw-lbenGnMe8rvU6gFXCegek4E",
  authDomain: "autosuivi-tn.firebaseapp.com",
  projectId: "autosuivi-tn",
  storageBucket: "autosuivi-tn.firebasestorage.app",
  messagingSenderId: "420641305315",
  appId: "1:420641305315:android:17585652532c954d670bd6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);