import { app } from './init.mjs';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
const auth = getAuth();
const db = getFirestore(app);

const idInput = document.getElementById("idInput");
const userNameDisplay = document.getElementById("userNameDisplay");

//function to look for a user based on user input
const searchUser = async () => {
    const userId = idInput.value.trim();
    console.log("Entered User ID:", userId); // ✅ Debugging Log
    if (!userId) {
        alert("Please enter a valid User ID.");
        return;
    }

    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            userNameDisplay.innerHTML = `Username: ${userData.displayName || "Not Available"}`;
        } else {
            alert("User not found.");
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        alert("An error occurred while fetching user data.");
    }
};


const submitID = document.getElementById("submitID");

submitID.addEventListener('click', searchUser);
