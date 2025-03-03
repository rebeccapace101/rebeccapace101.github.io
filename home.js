import { app } from './init.mjs';
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const auth = getAuth();
const db = getFirestore(app);
const userNameElement = document.getElementById("userName");
const profilePic = document.getElementById("profile-pic");

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const displayName = user.displayName || "Guest";
        if (userNameElement) {
            userNameElement.textContent = displayName;
        }

        try {
            // Reference to the user's Firestore document
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                const photoURL = userData.photoURL || user.photoURL; // Get from Firestore or fallback to Firebase Auth

                if (photoURL && profilePic) {
                    profilePic.src = photoURL;
                }
            } else {
                console.log("No user document found in Firestore.");
            }
        } catch (error) {
            console.error("Error retrieving user photo URL:", error);
        }
    } else {
        console.log("No user is signed in.");
    }
});
