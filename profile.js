import { app } from './init.mjs';
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";


const userName = document.getElementById("userName");
const Email = document.getElementById("Email");
const auth = getAuth();
const provider = new GoogleAuthProvider();
const signInButton = document.getElementById("signInButton");
const signOutButton = document.getElementById("signOutButton");
const changeuser = document.getElementById("changeuser");
const db = getFirestore(app);

signOutButton.style.display = "none";
changeuser.style.display = "none";



onAuthStateChanged(auth, (user) => {
    if (user) {
        signOutButton.style.display = "block";
        userName.innerHTML = user.displayName;
        changeuser.style.display = "block";
    } else {
        signOutButton.style.display = "none";
    }
})

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/auth/admin/manage-users
        const userRef = doc(db, "users", user.uid); // user.uid is the document ID
        try {
            userName.innerHTML = user.displayName;
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    } else {
        // User is signed out
        console.log("User is signed out");
    }
});

const userSignIn = async () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            console.log(user);
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
        })
}

const userSignOut = async () => {
    signOut(auth).then(() => {
        alert("You have signed out successfully!");
    }).catch((error) => { })
}

const userNameChange = async () => {

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            updateProfile(user, { displayName: "New User Name" }).then(() => {
                userName.innerHTML = user.displayName;
            }).catch((error) => {
                console.error("Error updating username ", error);
            });
        } else {
            // User is signed out
            console.log("User is signed out");
        }
    });


}

const user = auth.currentUser;

signInButton.addEventListener('click', userSignIn);
signOutButton.addEventListener('click', userSignOut);
changeuser.addEventListener('click', userNameChange);