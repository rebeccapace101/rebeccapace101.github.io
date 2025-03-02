import './habitStorage.mjs';
import { app } from './init.mjs';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { user } from "./login.mjs";
import { getFirestore, Timestamp, FieldValue, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"

// Import Admin SDK

const db = getFirestore();
const auth = getAuth();

const Monday = document.getElementById('Monday');
const Tuesday = document.getElementById('Tuesday');
const Wednesday = document.getElementById('Wednesday');
const Thursday = document.getElementById('Thursday');
const Friday = document.getElementById('Friday');
const Saturday = document.getElementById('Saturday');
const Sunday = document.getElementById('Sunday');
const submitted = document.getElementById('addHabit');

const habitSubmitted = async () => {
    const habitName = document.getElementById('habitInput').value;

    if (Monday.checked) {
        const Monday = doc(db, "habits", user.uid, "Monday", "habits");
        await setDoc(Monday, {
            habits: [habitName]
        }, { merge: true });
        console.log("Added habit to monday");
    }

}

submitted.addEventListener('click', habitSubmitted);
