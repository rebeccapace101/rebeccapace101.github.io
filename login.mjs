
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { app } from './init.mjs';

const auth = getAuth();
const provider = new GoogleAuthProvider();
const signInButton = document.getElementById("signInButton");
const signOutButton = document.getElementById("signOutButton");
const message = document.getElementById("message");
const userName = document.getElementById("userName");

signOutButton.style.display = "none";
message.style.display = "none";

const userSignIn = async () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user
            console.log(user);
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message
        })
}

const userSignOut = async () => {
    signOut(auth).then(() => {
        alert("You have signed out successfully!");
    }).catch((error) => { })
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        signOutButton.style.display = "block";
        message.style.display = "block";
        userName.innerHTML = user.displayName;
    } else {
        signOutButton.style.display = "none";
        message.style.display = "none";
    }
})

signInButton.addEventListener('click', userSignIn);
signOutButton.addEventListener('click', userSignOut);