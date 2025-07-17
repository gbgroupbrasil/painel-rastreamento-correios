// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAx4s2sQ-xFjpMwDy3Z3TFvLdp3xKhlf3M",
  authDomain: "painelrastreamento.firebaseapp.com",
  projectId: "painelrastreamento",
  storageBucket: "painelrastreamento.firebasestorage.app",
  messagingSenderId: "924456577637",
  appId: "1:924456577637:web:270b78fa9bfbe925ccf48c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
