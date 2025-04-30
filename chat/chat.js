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
                const todayDate = new Date();
                const messageRef = doc(db, "chat", user.uid, "messages", todayDate);
                
                await setDoc(journalRef, {
                    text: message,
                    date: todayDate
                });

                console.log("message sent")

                const confirmation = document.createElement('div');
                confirmation.textContent = "Journal Submitted!";
                confirmation.style.position = "fixed";
                confirmation.style.top = "20px";
                confirmation.style.right = "20px";
                confirmation.style.padding = "10px 20px";
                confirmation.style.backgroundColor = "#8C9474";
                confirmation.style.color = "white";
                confirmation.style.borderRadius = "10px";
                confirmation.style.boxShadow = "2px 2px 10px rgba(0,0,0,0.3)";
                confirmation.style.zIndex = "2000";
                document.body.appendChild(confirmation);

                setTimeout(() => {
                    confirmation.remove();
                }, 3000);

                } catch (error) {
                    console.error("Error sending message:", error);
                }

        } else {
            console.log("User is signed out.");
        }

     });
}

const loadMessages = async () =>{}

// Load journal entry when the page refreshes
window.addEventListener("load", loadMessages);
sendButton.addEventListener('click', sendMessage);
