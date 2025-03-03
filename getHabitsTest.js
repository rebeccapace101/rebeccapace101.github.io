import { app } from './init.mjs';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, Timestamp, FieldValue, doc, setDoc, arrayUnion, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"

// Import Admin SDK

const db = getFirestore();
const auth = getAuth();
const parentElement = document.getElementById('habits');
const date = new Date();
const dayOfWeek = date.getDay();
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
onAuthStateChanged(auth, async (user) => {
    if (user) {

        const dayDoc = doc(db, "habits", user.uid, days[dayOfWeek], "habits");
        const habitsDoc = await getDoc(dayDoc);
        const habits = habitsDoc.data().habits;
        habits.forEach(element => {
            const newParagraph = document.createElement('p');
            newParagraph.textContent = element;
            parentElement.appendChild(newParagraph);
        });

        console.log(habits)

    } else {
        // User is signed out
        console.log("User is signed out");
    }
});

