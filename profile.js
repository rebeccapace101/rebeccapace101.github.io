import { app } from './init.mjs';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";


const userName = document.getElementById("userName");
const email = document.getElementById("email");
const privacy = document.getElementById("privacy");
const auth = getAuth();
const provider = new GoogleAuthProvider();
const changeUser = document.getElementById("changeUser");
const changePFP = document.getElementById("changePFP");
const userNameBody = document.getElementById("userNameBody");
const db = getFirestore(app);
const signOutButton = document.getElementById("signOutButton");
const submitNewUsername = document.getElementById("submitNewUsername");
const changePrivacy = document.getElementById("changePrivacy");
const newPrivacy = document.getElementById("newPrivacy");


changeUser.style.display = "none";


//adding user information to the profile page
onAuthStateChanged(auth, async (user) => {
    if (user) {

        try {
            const userRef = doc(db, "users", user.uid);

            console.log(user);
            userNameBody.innerHTML = user.displayName;
            email.innerHTML = user.email;
            changeUser.style.display = "block";

            // Fetch user document from Firestore
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                privacy.innerHTML = userData.privacy || "Not Set";
                if (userData.privacy == "public") {
                    newPrivacy.innerHTML = "private";
                } else {
                    newPrivacy.innerHTML = "public";
                }
            } else {
                privacy.innerHTML = "Not Set";
            }
        } catch (error) {
            console.error("Error fetching user document: ", error);
        }
    } else {
        console.log("User is signed out");
    }
});


//for displaying and changing profile picture

const profilePic = document.getElementById("profile-pic");


onAuthStateChanged(auth, async (user) => {
    if (user) {

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

const popUpUser = document.getElementById("popupOverlayUser");
const closePopupUser = document.getElementById("closePopupUser");

const callNewUser = async () => {

    popUpUser.style.display = "block";

}

const closeUserWindow = async () => {

    popUpUser.style.display = "none";
}

closePopupUser.addEventListener('click', closeUserWindow);




const userNameChange = async () => {

    const inputField = document.getElementById("userNameInput").value;

    onAuthStateChanged(auth, async (user) => {
        popUpUser.style.display = "none";
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

//changing user privacy button function

const popUpPrivacy = document.getElementById("popupOverlayPrivacy");
const closePopupPrivacy = document.getElementById("closePopupPrivacy");

const callNewPrivacy = async () => {

    popUpPrivacy.style.display = "block";

}

const closePrivacyWindow = async () => {

    popUpPrivacy.style.display = "none";
}

closePopupPrivacy.addEventListener('click', closePrivacyWindow);

const changeUserPrivacy = async () => {
    const user = auth.currentUser;

    if (user) {
        popUpPrivacy.style.display = "none";

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        const userPrivacy = userData.privacy;

        if (userPrivacy === 'public') {
            await updateDoc(userRef, { privacy: "private" });
            privacy.innerHTML = "private";
            newPrivacy.innerHTML = "public";

        } else {
            await updateDoc(userRef, { privacy: "public" });
            privacy.innerHTML = "public";
            newPrivacy.innerHTML = "private";
            console.log("changed user to public");

        }

    } else {
        // User is signed out
        console.log("User is signed out");
    }

}



const confirmPrivacyChange = document.getElementById("confirmPrivacyChange");
const denyPrivacyChange = document.getElementById("denyPrivacyChange");
confirmPrivacyChange.addEventListener('click', changeUserPrivacy);
denyPrivacyChange.addEventListener('click', closePrivacyWindow);
changePrivacy.addEventListener('click', callNewPrivacy);


/* code for changing profile picture
const popUpPFP = document.getElementById("popupOverlayPFP");
const closePopupPFP = document.getElementById("closePopupPFP");

const callNewPFP = async () => {

    popUpPFP.style.display = "block";

}

const closePFPWindow = async () => {

    popUpPFP.style.display = "none";
}

closePopupPFP.addEventListener('click', closePFPWindow);
const pfpInput = document.getElementById("imageUpload");
const newPFP = null;

pfpInput.addEventListener('change', (event) => {
    newPFP = event.target.files[0];
});

const pfpChange = async () => {

    onAuthStateChanged(auth, async (user) => {
        popUpPFP.style.display = "none";
        if (user) {
            updateProfile(user, { photoURL: newPFP }).then(() => {
                profilePic.src = newPFP;
            }).catch((error) => {
                console.error("Error updating pfp ", error);
            });
        } else {
            // User is signed out
            console.log("User is signed out");
        }

    });

}

changePFP.addEventListener('click', callNewPFP);
submitNewPFP.addEventListener('click', pfpChange);
*/

const userSignOut = async () => {
    signOut(auth).then(() => {
        alert("You have signed out successfully!");
        window.location.href = "./index.html";
    }).catch((error) => { })
}

changeUser.addEventListener('click', callNewUser)
submitNewUsername.addEventListener('click', userNameChange);
signOutButton.addEventListener('click', userSignOut);


