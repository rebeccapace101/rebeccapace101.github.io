// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-analytics.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDIXaXxuONi2pds9lpsfilESYs_PAYkv7Y",
    authDomain: "momentum-f225c.firebaseapp.com",
    projectId: "momentum-f225c",
    storageBucket: "momentum-f225c.firebasestorage.app",
    messagingSenderId: "292176368363",
    appId: "1:292176368363:web:7821e3251883d25ec924ae",
    measurementId: "G-RC4FF63NNJ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
