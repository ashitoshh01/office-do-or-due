import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyACLrxpk5wRhpVCxnoB25R7GE2XUuwsAac",
    authDomain: "office-do-or-due.firebaseapp.com",
    projectId: "office-do-or-due",
    storageBucket: "office-do-or-due.firebasestorage.app",
    messagingSenderId: "93135938226",
    appId: "1:93135938226:web:706e4899facb424cc59fab",
    measurementId: "G-3JNQ26QWRS"
};

// Initialize Firebase only if not already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
