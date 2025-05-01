import { app } from '../init.mjs';
import {
    getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import {
    getFirestore, doc, setDoc, arrayUnion, getDoc, updateDoc, collection, addDoc, getDocs
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Initialize Firebase
const db = getFirestore(app);
const auth = getAuth(app);
const sendButton = document.getElementById("sendMessage");
const messageBox = document.getElementById("message");

//send chat message
const sendMessage = async () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const message = messageBox.value.trim();
            if (!message) {
                console.log("Message is empty.");
                return;
            }
                
            try {
                //save message under send date
                const todayDate = (new Date()).toString();
                const messageRef = doc(db, "chat", todayDate);

                //get user data, used later to retrive partner id
                const userRef = doc(db, "users", user.uid)
                const userSnap = await getDoc(userRef);
                const userData = userSnap.data();
                
                //send message to db
                await setDoc(messageRef, {
                    from: user.uid,
                    to: userData.partner,
                    text: message,
                    date:todayDate,
                });

                //confirmation of message sent
                console.log("message sent");
                messageBox.value = "";

                } catch (error) {
                    console.error("Error sending message:", error);
                }

        } else {
            console.log("User is signed out.");
        }

     });
}

const loadMessages = async () =>{
    onAuthStateChanged(auth, async (user) => {
        if(user){
            try{
                //
                

            } catch (error){
                console.error("Error retriving messages:", error);
            }
        } else {
            console.log("User is signed out.");
        }
    });
}

// Load journal entry when the page refreshes
window.addEventListener("load", loadMessages);
sendButton.addEventListener('click', sendMessage);
