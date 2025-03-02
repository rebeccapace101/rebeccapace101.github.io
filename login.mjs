
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { app } from './init.mjs';
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"

const auth = getAuth();
const provider = new GoogleAuthProvider();
const signInButton = document.getElementById("signInButton");
const signOutButton = document.getElementById("signOutButton");
const message = document.getElementById("message");
const db = getFirestore(app);
const profile = document.getElementById("profile");

signOutButton.style.display = "none";
profile.style.display = "none";

const userSignIn = async () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user
            console.log(user);
            signInButton.style.display = "none";
            profile.style.display = "block";

        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message
        })
}

const userSignOut = async () => {
    signOut(auth).then(() => {
        profile.style.display = "none";
        alert("You have signed out successfully!");
    }).catch((error) => { })
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        signOutButton.style.display = "block";
        signInButton.style.display = "none";
        profile.style.display = "block";


    } else {
        signInButton.style.display = "block";
        signOutButton.style.display = "none";
    }
})

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/auth/admin/manage-users
        const userRef = doc(db, "users", user.uid); // user.uid is the document ID
        try {
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                creationTimestamp: Date.now(), //or use admin sdk to get accurate timestamps
                lastLoginTimestamp: Date.now(), //or use admin sdk to get accurate timestamps
            });
            console.log("User data written with ID: ", user.uid);
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    } else {
        // User is signed out
        console.log("User is signed out");
    }
});

signInButton.addEventListener('click', userSignIn);
signOutButton.addEventListener('click', userSignOut);



onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/auth/admin/manage-users
        const userRef = doc(db, "habits", user.uid); // user.uid is the document ID
        try {
            await setDoc(userRef, {
                Monday: null,
                Tuesday: null,
                Wednesday: null,
                Thursday: null,
                Friday: null,
                Saturday: null,
                Sunday: null
            });
            console.log("User data written with ID: ", user.uid);
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    } else {
        // User is signed out
        console.log("User is signed out");
    }
});
