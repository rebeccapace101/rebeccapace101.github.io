import { app } from './init.mjs';
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";


const userName = document.getElementById("userName");
const email = document.getElementById("email");
const auth = getAuth();
const provider = new GoogleAuthProvider();
const changeUser = document.getElementById("changeUser");
const userNameBody = document.getElementById("userNameBody");
const db = getFirestore(app);
const signOutButton = document.getElementById("signOutButton");


changeUser.style.display = "none";

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log(user);
        userName.innerHTML = user.displayName;
        email.innerHTML = user.email;
        changeUser.style.display = "block";
    } else {
    }
})

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/auth/admin/manage-users
        const userRef = doc(db, "users", user.uid); // user.uid is the document ID
        try {
            userName.innerHTML = user.displayName;
            userNameBody.innerHTML = user.displayName;
            email.innerHTML = user.email;
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    } else {
        // User is signed out
        console.log("User is signed out");
    }
});

const userNameChange = async () => {

    const inputField = document.getElementById("userNameInput").value;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            updateProfile(user, { displayName: inputField }).then(() => {
                userName.innerHTML = user.displayName;
                userNameBody.innerHTML = user.displayName;
            }).catch((error) => {
                console.error("Error updating username ", error);
            });
        } else {
            // User is signed out
            console.log("User is signed out");
        }
    });

}

const userSignOut = async () => {
    signOut(auth).then(() => {
        alert("You have signed out successfully!");
        window.location.href = "./landing.html";
    }).catch((error) => { })
}

changeUser.addEventListener('click', userNameChange);
signOutButton.addEventListener('click', userSignOut);

