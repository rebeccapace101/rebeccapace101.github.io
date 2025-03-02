import { app } from './init.mjs';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

import { getFirestore, Timestamp, FieldValue, Filter, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"

// Import Admin SDK
initializeApp();

const db = getFirestore();
const auth = getAuth();


class habit {
    constructor(name, type, schedule) {
        this.name = name;
        this.type = type;
        this.schedule = schedule;
    }
}

const sleep = new habit(sleep, numberScale, [1, 1, 1, 1, 1, 1, 1]);
