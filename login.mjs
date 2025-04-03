import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { app } from './init.mjs';
import { getFirestore, doc, setDoc, getDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const auth = getAuth();
const provider = new GoogleAuthProvider();
const signInButton = document.getElementById("signInButton");
const signOutButton = document.getElementById("signOutButton");
const message = document.getElementById("message");
const db = getFirestore(app);

signOutButton.style.display = "none";

const userSignIn = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log(user);
        signInButton.style.display = "none";
    } catch (error) {
        console.error("Sign-in error:", error);
    }
};

const userSignOut = async () => {
    try {
        await signOut(auth);
        alert("You have signed out successfully!");
    } catch (error) {
        console.error("Sign-out error:", error);
    }
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        signOutButton.style.display = "block";
        signInButton.style.display = "none";

        const userRef = doc(db, "users", user.uid);

        try {
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    creationTimestamp: Date.now(),
                    lastLoginTimestamp: Date.now(),
                    privacy: "private"
                }, { merge: true });

                console.log("New user document created:", user.uid);
            } else {
                console.log("User document already exists:", user.uid);
            }

            // Create habits subcollection for new users
            const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            for (const day of days) {
                const habitRef = doc(db, "habits", user.uid, day, "habits");
                await setDoc(habitRef, { habits: arrayUnion() }, { merge: true });
            }

            console.log("Habit documents created for:", user.uid);
        } catch (error) {
            console.error("Error managing user data:", error);
        }
    } else {
        signInButton.style.display = "block";
        signOutButton.style.display = "none";
        console.log("User is signed out");
    }
});

signInButton.addEventListener('click', userSignIn);
signOutButton.addEventListener('click', userSignOut);
