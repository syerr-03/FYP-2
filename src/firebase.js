import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCU3TZ037_OF5kVwgHKzV8pnSFuGVSIbQ4",
  authDomain: "fyp2-28e30.firebaseapp.com",
  projectId: "fyp2-28e30",
  storageBucket: "fyp2-28e30.firebasestorage.app",
  messagingSenderId: "35646685424",
  appId: "1:35646685424:web:c5f24b901464b3cbddc235"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };