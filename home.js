import { app } from './init.mjs';
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const auth = getAuth();
const db = getFirestore(app);
const userNameElement = document.getElementById("userName");

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Get user's display name
        const displayName = user.displayName || "Guest";

        // Update the HTML content
        if (userNameElement) {
            userNameElement.textContent = displayName;
        }
        const storageRef = firebase.storage().ref('path/to/your/photo.jpg');
storageRef.getDownloadURL()
  .then((url) => {
    // Get the img element by its ID
    const profilePic = document.getElementById('profile-pic');

    // Update the src attribute with the new URL
    profilePic.src = url;
  })
  .catch((error) => {
    console.error('Error retrieving photo URL:', error);
  });
    } else {
        console.log("No user is signed in.");
    }
});
