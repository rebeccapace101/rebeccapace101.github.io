import { app } from './init.mjs';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"
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
const updateMessage = document.getElementById("updateMessage");
const todaySummary = document.getElementById("today-summary");
const highestStreakContainer = document.getElementById("highest-streak");



const acceptedPopup = document.getElementById("acceptedPopup");
const closeAcceptedPopup = document.getElementById("closeAcceptedPopup");
const partnerpic = document.getElementById("accepted-partner-pic"); // update this line too


// Function to get today's date in Chicago timezone in YYYY-MM-DD format
const getTodayDate = () => {
    const chicagoTime = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    const today = new Date(chicagoTime);
    return today.toISOString().split('T')[0];
};

//initialize messages if not already created
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const messageRef = doc(db, "messages", user.uid);
        const messageSnap = await getDoc(messageRef);

        if (!messageSnap.exists()) {
            // create the document with null fields
            await setDoc(messageRef, {
                inComingRequest: null,
                outGoingRequest: null,
                partnerUpdate: null
            });
            console.log("Initialized message doc for", user.uid);
        } else {
            console.log("Message doc already exists for", user.uid);
        }
    }
});


//code for showing a concern update popup

const closeConcernPopup = document.getElementById("closeConcernPopup");
const concernPopup = document.getElementById("concernPopup");
const concernMessage = document.getElementById("concernMessage");


onAuthStateChanged(auth, async (user) => {
    if (user) {
        const messageRef = doc(db, "messages", user.uid);
        const messageSnap = await getDoc(messageRef);

        if (messageSnap.exists()) {
            const messageData = messageSnap.data();
            const concernUpdate = messageData.concernUpdate;
            console.log(concernUpdate);

            if (concernUpdate == "resolved") {
                concernPopup.style.display = "block";
                concernMessage.innerHTML = "Your concern has been resolved and appropriate action has been taken."
            }
        } else {
            console.warn("Message doc not found for user:", user.uid);
        }
    } else {
        console.log("User is signed out");
    }
});

closeConcernPopup.addEventListener('click', async () => {
    const user = auth.currentUser;

    const messageRef = doc(db, "messages", user.uid);
    const messageSnap = await getDoc(messageRef);
    const messageData = messageSnap.data();
    await updateDoc(messageRef, { concernUpdate: null }); //remove the update

    concernPopup.style.display = "none";
})

//code to close a popup
closeAcceptedPopup.addEventListener('click', async () => {
    const user = auth.currentUser;

    const messageRef = doc(db, "messages", user.uid);
    const messageSnap = await getDoc(messageRef);
    const messageData = messageSnap.data();
    await updateDoc(messageRef, { outGoingRequest: null }); //remove the request

    acceptedPopup.style.display = "none";

});

//code for showing an admin privacy change 

const closePrivacyPopup = document.getElementById("closePrivacyPopup");
const privacyPopup = document.getElementById("privacyPopup");
const privacyMessage = document.getElementById("privacyMessage");


onAuthStateChanged(auth, async (user) => {
    if (user) {
        const messageRef = doc(db, "messages", user.uid);
        const messageSnap = await getDoc(messageRef);

        if (messageSnap.exists()) {
            const messageData = messageSnap.data();
            const privacyChange = messageData.privacyChange;
            console.log(privacyChange);

            if (privacyChange == "changed") {
                privacyPopup.style.display = "block";
                privacyMessage.innerHTML = "Due to user report, our admin have decided to no longer allow you to be a public user. If you would like to contest this decision, contact an admin."
            }
        } else {
            console.warn("Message doc not found for user:", user.uid);
        }
    } else {
        console.log("User is signed out");
    }
});

closePrivacyPopup.addEventListener('click', async () => {
    const user = auth.currentUser;

    const messageRef = doc(db, "messages", user.uid);
    const messageSnap = await getDoc(messageRef);
    const messageData = messageSnap.data();
    await updateDoc(messageRef, { privacyChange: null }); //remove the update

    privacyPopup.style.display = "none";
})

//popup managing

const closePopup = document.getElementById("closePopup");

const closeWindow = () => popUp.style.display = "none";

closePopup.addEventListener('click', closeWindow);
// popup if there is a request existing 
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const messageRef = doc(db, "messages", user.uid);
        const messageSnap = await getDoc(messageRef);

        if (messageSnap.exists()) {
            const messageData = messageSnap.data();
            const inComingRequest = messageData.inComingRequest;
            console.log(inComingRequest);

            if (inComingRequest != null && inComingRequest != undefined) {
                const userRef = doc(db, "users", inComingRequest);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    requestPic.src = userData.photoURL;
                    partnerMessage.innerHTML = userData.displayName + " wants to add you as an accountability partner!";
                    popUp.style.display = "block";
                } else {
                    console.error("User not found for inComingRequest:", inComingRequest);
                }
            } else {
                closeWindow();
            }
        } else {
            console.warn("Message doc not found for user:", user.uid);
        }
    } else {
        console.log("User is signed out");
    }
});


// popup if your previously sent request was accepted or declined
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const messageRef = doc(db, "messages", user.uid);
        const messageSnap = await getDoc(messageRef);

        if (messageSnap.exists()) {
            const messageData = messageSnap.data();
            const outGoingRequest = messageData.outGoingRequest;

            console.log(outGoingRequest);

            if (outGoingRequest != null && outGoingRequest != undefined) {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const partnerId = userData.partner;

                    const partnerRef = doc(db, "users", partnerId);
                    const partnerSnap = await getDoc(partnerRef);

                    if (partnerSnap.exists()) {
                        const partnerData = partnerSnap.data();

                        if (outGoingRequest == "accepted") {
                            updateMessage.innerHTML = "Congrats! Your request to " + partnerData.displayName + " was accepted, and you are now accountability partners!";
                            partnerpic.src = partnerData.photoURL;
                        } else if (outGoingRequest == "declined") {
                            updateMessage.innerHTML = "Your request to " + partnerData.displayName + " was declined.";
                            partnerpic.src = partnerData.photoURL;
                        }
                        acceptedPopup.style.display = "block";
                    }
                }
            } else {
                closeWindow();
            }
        } else {
            console.warn("Message doc not found for user:", user.uid);
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

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const partner = userData.partner;
            console.log(partner);

            const messagesRef = doc(db, "messages", user.uid);
            const messageSnap = await getDoc(messagesRef);

            if (messageSnap.exists()) {
                const messageData = messageSnap.data();

                if (messageData.partnerUpdate != null) {
                    if (messageData.partnerUpdate == "removed") {
                        updateMessage.innerHTML = "Your partner removed you as their accountability partner.";
                        acceptedPopup.style.display = "block";
                        partnerpic.style.display = "none";

                        await setDoc(messagesRef, { partnerUpdate: null }, { merge: true });
                    }
                }
            }

            if (partner != null) {
                const partnerRef = doc(db, "users", partner);
                const partnerSnap = await getDoc(partnerRef);

                if (partnerSnap.exists()) {
                    const partnerData = partnerSnap.data();
                    const name = partnerData.displayName;
                    const partnerPhotoURL = partnerData.photoURL;
                    const partnerpic = document.getElementById("partner-pic");

                    if (partnerPhotoURL) {
                        partnerpic.src = partnerPhotoURL;
                        partnerpic.style.display = "block";
                    } else {
                        console.log("No profile picture found.");
                        partnerpic.style.display = "none";
                    }

                    document.querySelectorAll('.partnerName').forEach(el => {
                        el.textContent = name;
                    });
                    await fetchTodayHabits(partner);
                    await fetchHighestStreak(partner);


                }
            } else {
                const searchPartner = document.getElementById("searchPartner");
                searchPartner.style.display = "block";
                displayPartner.style.display = "none";
            }
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


//code to send a request to an accountability partner

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

        if (userId == user.uid) {
            alert("You can't add yourself as an accountability partner");
        } else {


            const currentMessagesRef = doc(db, "messages", user.uid);
            const currentUserSnap = await getDoc(currentMessagesRef);
            const currentUserMessages = currentUserSnap.data();

            if (userPrivacy == "public") {

                if (userData.partner != null) { //if they already have a partner
                    errorMessage.innerHTML = "This user already has a partner!";
                }
                else { //if they are public and don't have a partner, let the user send the request
                    await setDoc(mDoc, { outGoingRequest: userId }, { merge: true }); //add message to log
                    await setDoc(partnerMDoc, { inComingRequest: user.uid }, { merge: true }); //add message to prospective partner log
                    errorMessage.innerHTML = "";
                    userNameDisplay.innerHTML = "Partner request sent! Once the user accepts, you'll be notified.";
                    addPartner.style.display = "none";
                    profilePic.style.display = "none";
                }

            } else {
                errorMessage.innerHTML = "This user is not public.";
            }
        }

    } else {
        console.log("No user is signed in.");
    }

}

addPartner.addEventListener('click', addAccountabilityPartner);


//code for removing current accountability partner

const removePartner = document.getElementById("removePartner");

const removePartnerFunc = async () => {
    const user = auth.currentUser;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    const partnerId = userData.partner;
    const partnerDoc = doc(db, "users", partnerId);

    const partnerMessages = doc(db, "messages", partnerId);
    await setDoc(partnerMessages, { partnerUpdate: "removed" }, { merge: true }); //notify the partner of the removal
    await updateDoc(userRef, { partner: null }); //remove partner
    await updateDoc(partnerDoc, { partner: null }); //remove self from partner's db
    alert("You have successfully removed your accountability partner");
    location.reload();
}



const reportPopup = document.getElementById("reportPopup");
const closeReportPopup = document.getElementById("closeReportPopup");
const reportInput = document.getElementById("reportInput");

closeReportPopup.addEventListener('click', () => {
    reportPopup.style.display = "none";
});
removePartner.addEventListener('click', removePartnerFunc);

const reportPartner = document.getElementById("reportPartner");

const reportPartnerFunc = async () => {

    reportPopup.style.display = "block";



}

reportPartner.addEventListener('click', reportPartnerFunc);
const submitReport = document.getElementById("submitReport");

const submitReportFunc = async () => {
    const user = auth.currentUser;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    const partnerId = userData.partner;
    const userId = user.uid;

    const getFormattedDate = () => {
        const today = new Date();
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        return today.toLocaleDateString('en-US', options);
    };

    const concernMessage = reportInput.value;

    // Create a new concern under the user's concerns subcollection
    const concernsRef = collection(db, "concerns", "activeConcerns", "concerns");

    // Add a new document with auto-generated concernID
    const newConcernRef = await addDoc(concernsRef, {
        date: getFormattedDate(),
        message: concernMessage,
        filedBy: user.uid,
        filedAgainst: partnerId
    });

    console.log(concernMessage);
    alert("Concern sent. Please wait for our admin to resolve your submission. In the meantime, you can remove this person as a partner.");
    reportPopup.style.display = "none";
};

submitReport.addEventListener('click', submitReportFunc);


async function fetchTodayHabits(partnerId) {
    todaySummary.innerHTML = "Loading...";
    const todayDate = getTodayDate();
    const date = new Date();
    const dayOfWeek = date.getDay();
    console.log("date: " + todayDate);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let habitList = "<h2></h2><ul>";

    try {

        const userDocRef = doc(db, "habits", partnerId, days[dayOfWeek], "habits");
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().habits) {
            const habits = userDocSnap.data().habits;

            for (const element of habits) { //for each habit for this day of week
                console.log(element);
                const habitDocRef = doc(db, "habitData", partnerId, element, todayDate);
                console.log(todayDate);
                const habitDocSnap = await getDoc(habitDocRef);

                if (habitDocSnap.exists()) {
                    const inputDocRef = doc(db, "habitData", partnerId, element, "input");
                    const inputDocSnap = await getDoc(inputDocRef);

                    const inputType = inputDocSnap.data().inputtype;

                    if (inputType == "checkbox") {
                        const completed = habitDocSnap.data().data;
                        habitList += `<li>${element}: ${completed ? "✅" : "❌"}</li>`;
                    } else {
                        const userData = habitDocSnap.data().data;
                        habitList += `<li>${element}: ${userData}</li>`;
                    }

                } else {
                    habitList += `<li>${element}: No data found</li>`;
                }
            }


        } else {
            habitList += "<li>No habits found.</li>";
        }
    } catch (error) {
        console.error("Error fetching today's habits:", error);
        habitList += "<li>Error loading habits.</li>";
    }

    habitList += "</ul>";
    todaySummary.innerHTML = habitList;
}


//fetching highest streak

async function fetchHighestStreak(user) {
    highestStreakContainer.innerHTML = "Loading...";
    let longestStreak = 0;
    let topHabit = "";

    try {
        const userDocRef = doc(db, "habitData", user);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().namesOfHabits) {
            const habitNames = userDocSnap.data().namesOfHabits;

            for (const habitName of habitNames) {
                console.log("checking: " + habitName);
                const habitCollectionRef = collection(db, "habitData", user, habitName);
                const habitDocs = await getDocs(habitCollectionRef);
                let streak = 0, maxStreak = 0;

                for (const habitDoc of habitDocs.docs) {
                    if (habitDoc.id !== "input") {
                        const inputDocRef = doc(db, "habitData", user, habitName, "input");
                        const inputDocSnap = await getDoc(inputDocRef);

                        let inputType = "checkbox"; // default fallback
                        if (inputDocSnap.exists()) {
                            const inputData = inputDocSnap.data();
                            if (inputData && inputData.inputtype) {
                                inputType = inputData.inputtype;
                            } else {
                                console.warn(`No inputtype field in input doc for ${habitName}`);
                            }
                        } else {
                            console.warn(`No input doc found for ${habitName}`);
                        }

                        const data = habitDoc.data().data;
                        if (inputType === "checkbox") {
                            if (data === true) {
                                streak++;
                                maxStreak = Math.max(maxStreak, streak);
                            } else {
                                streak = 0;
                            }
                        } else {
                            streak++;
                            maxStreak = Math.max(maxStreak, streak);
                        }
                    }
                }

                if (maxStreak > longestStreak) {
                    longestStreak = maxStreak;
                    topHabit = habitName;
                }
            }
        }
    } catch (error) {
        console.error("Error fetching highest streak:", error);
    }

    highestStreakContainer.innerHTML = `<p>${topHabit}: ${longestStreak} days 🔥</p>`;
}
