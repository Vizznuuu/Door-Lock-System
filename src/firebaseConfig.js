import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSy*************YZJO-D9DkA",
    authDomain: "doorlock-******.firebaseapp.com",
    projectId: "doorlock-******",
    storageBucket: "doorlock-*******.firebasestorage.app",
    messagingSenderId: "************",
    appId: "1:**************:web:d86d7f8c57ca4bf6df8629",
    measurementId: "G-*********"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
