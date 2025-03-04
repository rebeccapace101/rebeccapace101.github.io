import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, Timestamp, FieldValue, doc, setDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"
import { app } from './init.mjs';

// Import Admin SDK

const db = getFirestore();
const auth = getAuth();

const Monday = document.getElementById('Monday');
const Tuesday = document.getElementById('Tuesday');
const Wednesday = document.getElementById('Wednesday');
const Thursday = document.getElementById('Thursday');
const Friday = document.getElementById('Friday');
const Saturday = document.getElementById('Saturday');
const Sunday = document.getElementById('Sunday');
const submitted = document.getElementById('addHabit');



const habitSubmitted = async () => {

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const habitName = document.getElementById('habitInput').value;
            if (Monday.checked) {
                const Monday = doc(db, "habits", user.uid, "Monday", "habits");
                await setDoc(Monday, {
                    habits: arrayUnion(habitName)
                }, { merge: true });
                console.log("Added habit to Monday");
            }
            if (Tuesday.checked) {
                const Tuesday = doc(db, "habits", user.uid, "Tuesday", "habits");
                await setDoc(Tuesday, {
                    habits: arrayUnion(habitName)
                }, { merge: true });
                console.log("Added habit to Tuesday");
            }
            if (Wednesday.checked) {
                const Wednesday = doc(db, "habits", user.uid, "Wednesday", "habits");
                await setDoc(Wednesday, {
                    habits: arrayUnion(habitName)
                }, { merge: true });
                console.log("Added habit to Wednesday");
            }
            if (Thursday.checked) {
                const Thursday = doc(db, "habits", user.uid, "Thursday", "habits");
                await setDoc(Thursday, {
                    habits: arrayUnion(habitName)
                }, { merge: true });
                console.log("Added habit to Thursday");
            }
            if (Friday.checked) {
                const Friday = doc(db, "habits", user.uid, "Friday", "habits");
                await setDoc(Friday, {
                    habits: arrayUnion(habitName)
                }, { merge: true });
                console.log("Added habit to Friday");
            }
            if (Saturday.checked) {
                const Saturday = doc(db, "habits", user.uid, "Saturday", "habits");
                await setDoc(Saturday, {
                    habits: arrayUnion(habitName)
                }, { merge: true });
                console.log("Added habit to Saturday");
            }
            if (Sunday.checked) {
                const Sunday = doc(db, "habits", user.uid, "Sunday", "habits");
                await setDoc(Sunday, {
                    habits: arrayUnion(habitName)
                }, { merge: true });
                console.log("Added habit to Sunday");
            }

        } else {
            // User is signed out
            console.log("User is signed out");
        }
    });

}
submitted.addEventListener('click', habitSubmitted);