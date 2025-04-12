import { app } from './init.mjs';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, deleteDoc, addDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
const auth = getAuth();
const db = getFirestore(app);

const concernsMessage = document.getElementById("concernsMessage");

// fetching resolved concerns
const resConcMessage = document.getElementById("resConcMessage");
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const usersRef = collection(db, "users");

        // show loading indicators
        document.getElementById("loadingActive").style.display = "inline";
        document.getElementById("loadingResolved").style.display = "inline";

        // clear previous messages
        concernsMessage.innerHTML = "";
        resConcMessage.innerHTML = "";

        // ----------------- active concerns -----------------
        try {
            const userDocs = await getDocs(usersRef);
            let hasActiveConcerns = false;

            for (const userDoc of userDocs.docs) {
                const userId = userDoc.id;

                const concernsRef = collection(db, "users", userId, "concerns");
                const concernDocs = await getDocs(concernsRef);

                concernDocs.forEach(concernDoc => {
                    const concernData = concernDoc.data();
                    if (concernData.message) {
                        hasActiveConcerns = true;
                        appendConcern({
                            date: concernData.date,
                            filedBy: concernData.filedBy,
                            filedAgainst: concernData.filedAgainst,
                            message: concernData.message,
                            concernID: concernDoc.id
                        });
                    }
                });
            }

            if (!hasActiveConcerns) {
                concernsMessage.textContent = "All active concerns have been resolved.";
            }
        } catch (error) {
            console.error("Error fetching active concerns:", error);
            concernsMessage.textContent = "Error loading concerns.";
        } finally {
            document.getElementById("loadingActive").style.display = "none";
        }

        // ----------------- resolved concerns -----------------
        try {
            const userDocs = await getDocs(usersRef);
            let hasResolvedConcerns = false;

            for (const userDoc of userDocs.docs) {
                const userId = userDoc.id;

                const concernsRef = collection(db, "users", userId, "resolvedConcerns");
                const concernDocs = await getDocs(concernsRef);

                concernDocs.forEach(concernDoc => {
                    const concernData = concernDoc.data();
                    if (concernData.message) {
                        hasResolvedConcerns = true;
                        appendConcern({
                            date: concernData.date,
                            filedBy: concernData.filedBy,
                            filedAgainst: concernData.filedAgainst,
                            message: concernData.message,
                            resolvedAt: concernData.resolvedAt,
                            concernID: concernDoc.id
                        }, 'resolvedConcerns');
                    }
                });
            }

            if (!hasResolvedConcerns) {
                resConcMessage.textContent = "No concerns have been resolved yet.";
            }
        } catch (error) {
            console.error("Error fetching resolved concerns:", error);
            resConcMessage.textContent = "Error loading resolved concerns.";
        } finally {
            document.getElementById("loadingResolved").style.display = "none";
        }
    } else {
        console.log("User is signed out");
    }
});

function appendConcern({ date, filedBy, filedAgainst, message, resolvedAt, concernID }, containerId = 'userConcerns') {
    const container = document.getElementById(containerId);

    const concernDiv = document.createElement('div');
    concernDiv.classList.add('concern-container');
    concernDiv.dataset.concernId = concernID;

    const dateEl = document.createElement('h1');
    dateEl.innerHTML = `<span>${date}</span>`;

    const filedByEl = document.createElement('h1');
    filedByEl.innerHTML = `Filed by: <span>${filedBy}</span>`;

    const resolvedAtEl = document.createElement('h1');
    if (resolvedAt) {
        const formatted = new Date(resolvedAt).toLocaleString();
        resolvedAtEl.innerHTML = `Resolved At: <span>${formatted}</span>`;
    }

    const button = document.createElement('button');
    button.textContent = 'More Info';
    button.addEventListener('click', () => {
        showConcernPopup({ filedBy, filedAgainst, message, resolvedAt });
    });

    concernDiv.appendChild(dateEl);
    concernDiv.appendChild(filedByEl);
    if (resolvedAt) concernDiv.appendChild(resolvedAtEl);
    concernDiv.appendChild(button);

    container.appendChild(concernDiv);
}

function showConcernPopup({ filedBy, filedAgainst, message, resolvedAt }) {
    document.getElementById('filedName').textContent = filedBy;
    document.getElementById('filedAgainst').textContent = filedAgainst;
    document.getElementById('concernMessage').textContent = message;
    document.getElementById('concernPopup').style.display = 'block';

    const resolveButton = document.getElementById('resolve'); // assuming you have this button in the popup
    if (resolvedAt) {
        resolveButton.style.display = 'none'; // Hide the resolve button for resolved concerns
    }
}

document.getElementById('closeConcernPopup').addEventListener('click', () => {
    document.getElementById('concernPopup').style.display = 'none';
});

//code for viewing the profiles of the users

const viewReporter = document.getElementById("viewReporter");
const viewReported = document.getElementById("viewReported");

//code for resolving an active concern

const resolve = document.getElementById("resolve");

resolve.addEventListener('click', async () => {
    const filedBy = document.getElementById('filedName').textContent;
    const filedAgainst = document.getElementById('filedAgainst').textContent;
    const message = document.getElementById('concernMessage').textContent;
    const concernID = document.querySelector('.concern-container').dataset.concernId;

    try {
        // get the concern data from activeConcerns
        const activeConcernRef = doc(db, "users", filedBy, "concerns", concernID);
        const concernSnap = await getDoc(activeConcernRef);

        if (concernSnap.exists()) {
            const concernData = concernSnap.data();

            // move it to concerns/resolvedConcerns/{filedBy}/concern
            const resolvedConcernRef = doc(db, "users", filedBy, "resolvedConcerns", concernID);
            await setDoc(resolvedConcernRef, {
                ...concernData,
                resolvedAt: new Date().toISOString()
            });

            // delete it from activeConcerns
            await deleteDoc(activeConcernRef);

            //inform the user that the concern was resolved
            const messageRef = doc(db, "messages", filedBy);
            const messageSnap = await getDoc(messageRef);
            const messageData = messageSnap.data();
            await updateDoc(messageRef, { concernUpdate: "resolved" });

            alert("Concern resolved.");

            document.getElementById('concernPopup').style.display = 'none';
        } else {
            alert("No active concern found for this user.");
        }
    } catch (error) {
        console.error("Error resolving concern:", error);
        alert("Something went wrong while resolving the concern.");
    }
});
