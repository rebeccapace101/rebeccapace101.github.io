import './habitStorage.mjs';
import { app } from './init.mjs';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

import { getFirestore, Timestamp, FieldValue, Filter, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"

import { habit } from './habitStorage.mjs';
// Import Admin SDK
initializeApp();

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

const habitSubmitted = () => {
    const habitName = document.getElementById('habitInput').getInput();

    if (Monday.checked) {
        newHabit = new habit(habitName, false);

    }

}

submitted.addEventListener('click', habitSubmitted);
