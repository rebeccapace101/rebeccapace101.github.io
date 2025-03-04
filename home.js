import { app } from './init.mjs';
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const auth = getAuth();
const db = getFirestore(app);
const userNameElement = document.getElementById("userName");
const profilePic = document.getElementById("profile-pic");
const journalContainer = document.getElementById("journal-container");

// Function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Extracts YYYY-MM-DD
};

// Load user profile data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const displayName = user.displayName || "Guest";
        if (userNameElement) {
            userNameElement.textContent = displayName;
        }

        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                const photoURL = userData.photoURL || user.photoURL; // Get from Firestore or Firebase Auth

                if (photoURL && profilePic) {
                    profilePic.src = photoURL;
                }
            } else {
                console.log("No user document found in Firestore.");
            }
        } catch (error) {
            console.error("Error retrieving user photo URL:", error);
        }

        loadJournalEntry(user.uid);
    } else {
        console.log("No user is signed in.");
    }
});

// Function to load the journal entry if it exists for today
const loadJournalEntry = async (userId) => {
    const todayDate = getTodayDate();
    const journalRef = doc(db, "journals", userId, "journalEntry", todayDate);

    try {
        const docSnap = await getDoc(journalRef);
        if (docSnap.exists()) {
            const journalData = docSnap.data();
            journalContainer.innerHTML = `
                <h2>Current Journal Entry</h2>
                <p><strong>Date:</strong> ${journalData.date}</p>
                <p>${journalData.text}</p>
            `;
        } else {
            journalContainer.innerHTML = `
                <h2>Current Journal Entry</h2>
                <p>No journal entry written for today.</p>
                <a href="./journalPage.html"><button>Write Today's Entry</button></a>
            `;
        }
    } catch (error) {
        console.error("Error loading journal entry:", error);
    }
};

