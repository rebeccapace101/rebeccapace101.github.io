import { app } from './init.mjs';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
const auth = getAuth();
const db = getFirestore(app);

//adding in user concerns
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const concernsRef = doc(db, "concerns", "activeConcerns");
        const concernSnap = await getDoc(concernsRef);
        const concernData = concernSnap.data();

    } else {
        console.log("User is signed out");
    }

});

function appendConcern({ date, filedBy, filedAgainst, message }) {
    const container = document.getElementById('userConcerns');

    const concernDiv = document.createElement('div');
    concernDiv.classList.add('concern-container');

    const dateEl = document.createElement('h1');
    dateEl.innerHTML = `<span>${date}</span>`;

    const filedByEl = document.createElement('h1');
    filedByEl.innerHTML = `Filed by: <span>${filedBy}</span>`;

    const button = document.createElement('button');
    button.textContent = 'More Info';
    button.addEventListener('click', () => {
        showConcernPopup({ filedBy, filedAgainst, message });
    });

    concernDiv.appendChild(dateEl);
    concernDiv.appendChild(filedByEl);
    concernDiv.appendChild(button);

    container.appendChild(concernDiv);
}

function showConcernPopup({ filedBy, filedAgainst, message }) {
    document.getElementById('filedName').textContent = filedBy;
    document.getElementById('filedAgainst').textContent = filedAgainst;
    document.getElementById('concernMessage').textContent = message;

    document.getElementById('concernPopup').style.display = 'block';
}

document.getElementById('closeAcceptedPopup').addEventListener('click', () => {
    document.getElementById('concernPopup').style.display = 'none';
});

// example usage
appendConcern({
    date: 'April 10, 2025',
    filedBy: 'Jane Doe',
    filedAgainst: 'John Smith',
    message: 'Inappropriate behavior during a group project.'
});