import { app } from './init.mjs';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
const auth = getAuth();
const db = getFirestore(app);

const idInput = document.getElementById("idInput");
const userNameDisplay = document.getElementById("userNameDisplay");
const displayResults = document.getElementById("displayResults");
const profilePic = document.getElementById("profile-pic");



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
            userNameDisplay.innerHTML = `${userData.displayName || "Not Available"}`;
            const photoURL = userData.photoURL || auth.currentUser?.photoURL;

            if (photoURL) {
                profilePic.src = photoURL;
                profilePic.style.display = "block"; // Show the image
            } else {
                console.log("No profile picture found.");
                profilePic.style.display = "none"; // Hide if no image available
            }

            errorMessage.innerHTML = "";

            displayResults.style.display = "block";

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


//code to add an accountability partner

const addPartner = document.getElementById("addPartner");
const errorMessage = document.getElementById("errorMessage");

const addAccountabilityPartner = async () => {
    const user = auth.currentUser;

    if (user) {
        const userId = idInput.value.trim();

        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        const userPrivacy = userData.privacy;

        if (userPrivacy == "public") {
            errorMessage.innerHTML = "";
            userNameDisplay.innerHTML = "Successfully added!";
            addPartner.style.display = "none";
            profilePic.style.display = "none";

        } else {
            errorMessage.innerHTML = "This user is not public.";
        }

    } else {
        console.log("No user is signed in.");
    }

}

addPartner.addEventListener('click', addAccountabilityPartner);
