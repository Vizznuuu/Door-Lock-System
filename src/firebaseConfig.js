// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAIAgKPDJWDbS_dCupYK0KTkYZJO-D9DkA",
    authDomain: "doorlock-3661f.firebaseapp.com",
    projectId: "doorlock-3661f",
    storageBucket: "doorlock-3661f.firebasestorage.app",
    messagingSenderId: "1038773553164",
    appId: "1:1038773553164:web:d86d7f8c57ca4bf6df8629",
    measurementId: "G-7DGGY03Q01"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
