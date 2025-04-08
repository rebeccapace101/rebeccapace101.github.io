import { app } from './init.mjs';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
const auth = getAuth();
const db = getFirestore(app);

const idInput = document.getElementById("idInput");
const userNameDisplay = document.getElementById("userNameDisplay");
const displayResults = document.getElementById("displayResults");
const profilePic = document.getElementById("profile-pic");
const displayPartner = document.getElementById("displayPartner");
const popUp = document.getElementById("popupOverlay");
const partnerMessage = document.getElementById("partnerMessage");
const requestPic = document.getElementById("request-pic");
const acceptedPopup = document.getElementById("acceptedPopup");
const updateMessage = document.getElementById("updateMessage");
const partnerpic = document.getElementById("partner-pic");

//popup managing

const closePopup = document.getElementById("closePopup");

const closeWindow = () => popUp.style.display = "none";

closePopup.addEventListener('click', closeWindow);

//popup if there is a request
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const messageRef = doc(db, "messages", user.uid);
        const messageSnap = await getDoc(messageRef);
        const messageData = messageSnap.data();
        const inComingRequest = messageData.inComingRequest;
        console.log(inComingRequest);
        if (inComingRequest != null && inComingRequest != undefined) {  //if there is an partner request available
            const userRef = doc(db, "users", inComingRequest);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();
            if (userSnap.exists()) {
                const userData = userSnap.data();
                requestPic.src = userData.photoURL;
                partnerMessage.innerHTML = userData.displayName + " wants to add you as an accountability partner!";
                popUp.style.display = "block";
            } else {
                console.error("User not found for inComingRequest:", inComingRequest);
            }
        }
        else {
            closeWindow();
        }

    } else {
        console.log("User is signed out");
    }
});
//popup if your request was accepted

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const messageRef = doc(db, "messages", user.uid);
        const messageSnap = await getDoc(messageRef);
        const messageData = messageSnap.data();
        const outGoingRequest = messageData.outGoingRequest;

        console.log(outGoingRequest);
        if (outGoingRequest != null && outGoingRequest != undefined) {  //if there is an outgoing request
            if (outGoingRequest == "accepted") { //if the request was accepted
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                const userData = userSnap.data();
                const partnerId = userData.partner;
                const partnerRef = doc(db, "users", partnerId);
                const partnerSnap = await getDoc(partnerRef);
                const partnerData = partnerSnap.data();
                updateMessage.innerHTML = "Congrats! Your request to " + partnerData.displayName + " was accepted, and you are now accountability partners!";
                partnerpic.src = partnerData.photoURL;
            }
        }
        else {
            closeWindow();
        }

    } else {
        console.log("User is signed out");
    }
});



//code for accepting or denying a partner request
const acceptRequest = document.getElementById("acceptRequest");
const denyRequest = document.getElementById("denyRequest");

const submitAcceptance = async () => {
    const user = auth.currentUser;

    const messageRef = doc(db, "messages", user.uid);
    const messageSnap = await getDoc(messageRef);
    const messageData = messageSnap.data();
    const requesterId = messageData.inComingRequest;
    const partnerMDoc = doc(db, "messages", requesterId);
    const currentUserRef = doc(db, "users", user.uid);

    const partnerRef = doc(db, "users", requesterId);

    await updateDoc(currentUserRef, { partner: requesterId }); //add the partner
    await updateDoc(messageRef, { inComingRequest: null }); //remove the request
    await updateDoc(partnerMDoc, { outGoingRequest: "accepted" }); //send acceptance
    await updateDoc(partnerRef, { partner: user.uid }); //add the user as a partner

    closeWindow();
};

const submitDecline = async () => {
    const user = auth.currentUser;

    const messageRef = doc(db, "messages", user.uid);
    const messageSnap = await getDoc(messageRef);
    const messageData = messageSnap.data();
    const requesterId = messageData.inComingRequest;
    const partnerMDoc = doc(db, "messages", requesterId);
    const currentUserRef = doc(db, "users", user.uid);

    await updateDoc(messageRef, { inComingRequest: null }); //remove the request
    await updateDoc(partnerMDoc, { outGoingRequest: "declined" }); //send decline
    closeWindow();
};

acceptRequest.addEventListener('click', submitAcceptance);
denyRequest.addEventListener('click', submitDecline);


//either showing search or partner based on whether you have a partner yet 

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        const partner = userData.partner;
        console.log(partner);
        if (partner != null) {
            const partnerRef = doc(db, "users", partner);
            const partnerSnap = await getDoc(partnerRef);
            const partnerData = partnerSnap.data();
            const partnerName = document.getElementById("partnerName");
            partnerName.innerHTML = partnerData.displayName;
            const partnerPhotoURL = partnerData.photoURL;
            const partnerpic = document.getElementById("partner-pic");
            if (partnerPhotoURL) {
                partnerpic.src = partnerPhotoURL;
                partnerpic.style.display = "block"; // Show the image
            } else {
                console.log("No profile picture found.");
                partnerpic.style.display = "none"; // Hide if no image available
            }
        }
        else { //if there is no partner yet, display the search block
            const searchPartner = document.getElementById("searchPartner");
            searchPartner.style.display = "block";
            displayPartner.style.display = "none";
        }

    } else {
        console.log("User is signed out");
    }
});

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
    const mDoc = doc(db, "messages", user.uid);


    if (user) {
        const userId = idInput.value.trim();
        const partnerMDoc = doc(db, "messages", userId);
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        const userPrivacy = userData.privacy;

        if (userPrivacy == "public") {
            await setDoc(mDoc, { outGoingRequest: userId }); //add message to log
            await setDoc(partnerMDoc, { inComingRequest: user.uid }); //add message to prospective partner log
            errorMessage.innerHTML = "";
            userNameDisplay.innerHTML = "Partner request sent! Once the user accepts, you'll be notified.";
            addPartner.style.display = "none";
            profilePic.style.display = "none";

        } else {
            errorMessage.innerHTML = "This user may not be public or already has a partner.";
        }

    } else {
        console.log("No user is signed in.");
    }

}

addPartner.addEventListener('click', addAccountabilityPartner);


