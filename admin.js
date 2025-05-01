import { app } from './init.mjs';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, deleteDoc, addDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
const auth = getAuth();
const db = getFirestore(app);


// fetching resolved concerns

const concernsMessage = document.getElementById("concernsMessage");
const resConcMessage = document.getElementById("resConcMessage");
let currentViewedUserUID = null;


onAuthStateChanged(auth, async (user) => {
    if (!user) {
        console.log("User is signed out");
        return;
    }

    // show loading indicators
    document.getElementById("loadingActive").style.display = "inline";
    document.getElementById("loadingResolved").style.display = "inline";

    // clear previous messages
    concernsMessage.innerHTML = "";
    resConcMessage.innerHTML = "";

    // ----------------- active concerns -----------------
    try {
        const concernsRef = collection(db, "concerns", "activeConcerns", "concerns");
        const concernDocs = await getDocs(concernsRef);
        let hasActiveConcerns = false;

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
        const resolvedConcernsRef = collection(db, "concerns", "resolvedConcerns", "concerns");
        const resolvedDocs = await getDocs(resolvedConcernsRef);
        let hasResolvedConcerns = false;

        resolvedDocs.forEach(concernDoc => {
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

        if (!hasResolvedConcerns) {
            resConcMessage.textContent = "No concerns have been resolved yet.";
        }
    } catch (error) {
        console.error("Error fetching resolved concerns:", error);
        resConcMessage.textContent = "Error loading resolved concerns.";
    } finally {
        document.getElementById("loadingResolved").style.display = "none";
    }
});


function appendConcern({ date, filedBy, filedAgainst, message, resolvedAt, concernID }, containerId = 'userConcerns') {
    const container = document.getElementById(containerId);

    const concernDiv = document.createElement('div');
    concernDiv.classList.add('concern-card');
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
        // attach concern ID to popup too (for resolve)
        document.querySelector('.popup').dataset.concernId = concernID;
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


//code for resolving an active concern

const resolve = document.getElementById("resolve");

resolve.addEventListener('click', async () => {
    const filedBy = document.getElementById('filedName').textContent;
    const filedAgainst = document.getElementById('filedAgainst').textContent;
    const message = document.getElementById('concernMessage').textContent;
    const concernID = document.querySelector('.popup').dataset.concernId;

    try {
        // get the concern data from activeConcerns
        const activeConcernRef = doc(db, "concerns", "activeConcerns", "concerns", concernID);
        const concernSnap = await getDoc(activeConcernRef);

        if (concernSnap.exists()) {
            const concernData = concernSnap.data();

            // move it to concerns/resolvedConcerns/{filedBy}/concern
            const resolvedConcernRef = doc(db, "concerns", "resolvedConcerns", "concerns", concernID);
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




//code for viewing the profiles of the users

const viewReporter = document.getElementById("viewReporter");
const viewReported = document.getElementById("viewReported");

async function viewReporterFunc() {
    const filedBy = document.getElementById('filedName').textContent;

    try {
        const userRef = doc(db, "users", filedBy);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            showUserProfilePopup(userData, 'Reporter Profile');
        } else {
            alert("Reporter profile not found.");
        }
    } catch (error) {
        console.error("Error fetching reporter profile:", error);
        alert("Could not load reporter profile.");
    }
}

async function viewReportedFunc() {
    const filedAgainst = document.getElementById('filedAgainst').textContent;

    try {
        const userRef = doc(db, "users", filedAgainst);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            showUserProfilePopup(userData, 'Reported User Profile');
        } else {
            alert("Reported user profile not found.");
        }
    } catch (error) {
        console.error("Error fetching reported profile:", error);
        alert("Could not load reported profile.");
    }
}

async function showUserProfilePopup(userData, title = "User Profile") {
    const userProfilePopup = document.getElementById('userProfilePopup');
    const concernPopup = document.getElementById('concernPopup'); // Make sure 'concernPopup' is the more info popup.
    const privacyPopup = document.getElementById('privacyEditPopup');

    // Fill in user info
    document.getElementById('profile-pic-view').src = userData.photoURL || 'default.png';
    document.getElementById('userNameView').textContent = userData.displayName || "N/A";
    document.getElementById('emailView').textContent = userData.email || "N/A";
    document.getElementById('userIdView').textContent = userData.uid || "N/A";
    document.getElementById('privacyView').textContent = userData.privacy || "Not Set";
    currentViewedUserUID = userData.uid;

    // Ensure 'concernPopup' is hidden before showing 'userProfilePopup'
    concernPopup.style.display = 'none'; // Hide concern popup
    userProfilePopup.style.display = 'block'; // Show user profile popup

    // Handle the "Edit Privacy" button click inside the profile popup
    document.getElementById('changePrivacy').addEventListener('click', () => {
        privacyPopup.style.display = 'block'; // Show privacy edit popup on top
    });

    // Close the user profile popup
    document.getElementById('closeUserProfilePopup').addEventListener('click', () => {
        userProfilePopup.style.display = 'none';
        concernPopup.style.display = 'block'; // Reopen concern popup when closing profile
    });
}


document.getElementById('confirmPrivacyChange').addEventListener('click', async () => {
    if (!currentViewedUserUID) return alert("No user selected.");

    const userRef = doc(db, "users", currentViewedUserUID);
    try {
        await updateDoc(userRef, {
            privacy: "private",
            partner: null,
            privacyLock: "set"
        });

        document.getElementById('privacyView').textContent = "private";
        alert("Privacy updated to private.");

        const messageRef = doc(db, "messages", currentViewedUserUID);
        await updateDoc(messageRef, { privacyChange: "changed" });

        document.getElementById('privacyEditPopup').style.display = 'none';
    } catch (error) {
        console.error("Error updating privacy:", error);
        alert("Failed to update privacy.");
    }
});


// Close privacy edit popup if user cancels
document.getElementById('closePrivacyEditPopup').addEventListener('click', () => {
    document.getElementById('privacyEditPopup').style.display = 'none';
});


viewReporter.addEventListener('click', viewReporterFunc);

viewReported.addEventListener('click', viewReportedFunc);

