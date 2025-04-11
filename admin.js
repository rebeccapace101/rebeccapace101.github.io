import { app } from './init.mjs';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
const auth = getAuth();
const db = getFirestore(app);

//adding in user concerns
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const usersRef = collection(db, "users");

        try {
            const userDocs = await getDocs(usersRef);

            for (const userDoc of userDocs.docs) {
                const userId = userDoc.id;

                const concernDocRef = doc(db, "concerns", "activeConcerns", userId, "concern");
                const concernSnap = await getDoc(concernDocRef);

                if (concernSnap.exists()) {
                    const concernData = concernSnap.data();

                    if (concernData.message) { // only proceed if message exists and is not null
                        console.log(`Concern for user ${userId}:`, concernData);
                        appendConcern({
                            date: concernData.date, // consider replacing this with a dynamic date if needed
                            filedBy: concernData.filedBy,
                            filedAgainst: concernData.filedAgainst,
                            message: concernData.message
                        });
                    }
                } else {
                    console.log(`No concern found for user ${userId}`);
                }
            }
        } catch (error) {
            console.error("Error fetching concerns:", error);
        }
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

document.getElementById('closeConcernPopup').addEventListener('click', () => {
    document.getElementById('concernPopup').style.display = 'none';
});
