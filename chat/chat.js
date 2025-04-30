import { app } from './init.mjs';
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
                if (!entryText) {
                                console.log("message is empty.");
                                return;
                            }
                
                 try {
                     const todayDate = getTodayDate();
                     const messageRef = doc(db, "chat", user.uid, "messages", todayDate);
                
                    await setDoc(journalRef, {
                        text: message,
                        date: todayDate
                       });
                } catch (error) {
                      console.error("Error sending message:", error);
                }

            } else {
                console.log("User is signed out.");
            }

     });
}

