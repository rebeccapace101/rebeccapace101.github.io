import { app } from './init.mjs';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, Timestamp, collection, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const db = getFirestore();
const auth = getAuth();
const subJournal = document.getElementById('submitBtn');
const journalInput = document.getElementById('myTextbox');

// Function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Extracts YYYY-MM-DD
};

// Function to submit a journal entry
const journalSubmission = async () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const entryText = journalInput.value.trim();
            if (!entryText) {
                console.log("Journal entry is empty.");
                return;
            }

            try {
                const todayDate = getTodayDate();
                const journalRef = doc(db, "journals", user.uid, "journalEntry", todayDate);
                
                await setDoc(journalRef, {
                    text: entryText,
                    date: todayDate
                });

                console.log("Journal entry saved for today.");
            } catch (error) {
                console.error("Error adding journal entry:", error);
            }
        } else {
            console.log("User is signed out.");
        }
    });
};

// Function to load the journal entry if it exists for today
const loadJournalEntry = async () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const todayDate = getTodayDate();
            const journalRef = doc(db, "journals", user.uid, "journalEntry", todayDate);

            try {
                const docSnap = await getDoc(journalRef);
                if (docSnap.exists()) {
                    journalInput.value = docSnap.data().text; // Load the saved entry
                    console.log("Loaded journal entry for today.");
                } else {
                    journalInput.value = ""; // No entry for today, clear the text area
                    console.log("No journal entry found for today.");
                }
            } catch (error) {
                console.error("Error loading journal entry:", error);
            }
        }
    });
};

// Load journal entry when the page refreshes
window.addEventListener("load", loadJournalEntry);
subJournal.addEventListener('click', journalSubmission);
