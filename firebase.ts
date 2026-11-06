import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAIgMydsxOcEuKG8_M146pkPHH8Wr5UbY4",
  authDomain: "school-diary-new-a776c.firebaseapp.com",
  projectId: "school-diary-new-a776c",
  storageBucket:
    "school-diary-new-a776c.firebasestorage.app",
  messagingSenderId: "47721218913",
  appId: "1:47721218913:web:53a935b7936238b3abfb20",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);
