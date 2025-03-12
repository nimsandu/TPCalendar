import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAo4a_TyIPJU8wyWiXUiKGwxXzmudxQY40",
  authDomain: "tp-calendar-82aa5.firebaseapp.com",
  projectId: "tp-calendar-82aa5",
  storageBucket: "tp-calendar-82aa5.firebasestorage.app",
  messagingSenderId: "729962059816",
  appId: "1:729962059816:web:f167b66c23b3950042fd1d",
  measurementId: "G-P59GFQ3EJB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
