import { app } from './init.mjs';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, Timestamp, FieldValue, doc, setDoc, arrayUnion, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"

// Import Admin SDK

const db = getFirestore();
const auth = getAuth();
const parentElement = document.getElementById('habits');

const date = new Date();
const dayOfWeek = date.getDay();
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

//getting the preexisting habits from the database based on today's date
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const dayDoc = doc(db, "habits", user.uid, days[dayOfWeek], "habits");
        const habitsDoc = await getDoc(dayDoc);
        const habits = habitsDoc.data().habits;
        habits.forEach(element => {
            console.log('Element:', element);

            const newParagraph = document.createElement('input');
            newParagraph.type = 'checkbox';
            newParagraph.value = element;
            const newLabel = document.createElement('label');
            newLabel.textContent = element;
            newLabel.for = element;
            newLabel.id = element + "id";
            newParagraph.id = element;
            parentElement.appendChild(newParagraph);
            parentElement.appendChild(newLabel);
            const br = document.createElement("br");
            parentElement.appendChild(br);
        });

        console.log(habits)

    } else {
        // User is signed out
        console.log("User is signed out");
    }
});

const Monday = document.getElementById('Monday');
const Tuesday = document.getElementById('Tuesday');
const Wednesday = document.getElementById('Wednesday');
const Thursday = document.getElementById('Thursday');
const Friday = document.getElementById('Friday');
const Saturday = document.getElementById('Saturday');
const Sunday = document.getElementById('Sunday');
const submitted = document.getElementById('addHabit');
const subJournal = document.getElementById('submitBtn');

//creating new habits
const habitSubmitted = async () => {

    onAuthStateChanged(auth, async (user) => {
        popUp.style.display = "none";

        if (user) {
            const habitName = document.getElementById('habitInput').value;

            const dropdown = document.getElementById("inputtype");

            const selectedValue = dropdown.value;
            console.log(selectedValue);
            if (Monday.checked) {

                const Monday = doc(db, "habits", user.uid, "Monday", "habits");
                await setDoc(Monday, {
                    habits: arrayUnion(habitName)
                }, { merge: true });
                console.log("Added habit to monday");

                const habitsList = doc(db, "habitData", user.uid);
                await setDoc(habitsList, {
                    namesOfHabits: arrayUnion(habitName)
                }, { merge: true });
            }
            if (Tuesday.checked) {
                const Tuesday = doc(db, "habits", user.uid, "Tuesday", "habits");
                await setDoc(Tuesday, {
                    habits: arrayUnion(habitName)
                }, { merge: true });
                console.log("Added habit to Tuesday");

                const habitsList = doc(db, "habitData", user.uid);
                await setDoc(habitsList, {
                    namesOfHabits: arrayUnion(habitName)
                }, { merge: true });
            }
            if (Wednesday.checked) {
                const Wednesday = doc(db, "habits", user.uid, "Wednesday", "habits");
                await setDoc(Wednesday, {
                    habits: arrayUnion(habitName)
                }, { merge: true });
                console.log("Added habit to Wednesday");

                const habitsList = doc(db, "habitData", user.uid);
                await setDoc(habitsList, {
                    namesOfHabits: arrayUnion(habitName)
                }, { merge: true });
            }
            if (Thursday.checked) {
                const Thursday = doc(db, "habits", user.uid, "Thursday", "habits");
                await setDoc(Thursday, {
                    habits: arrayUnion(habitName)
                }, { merge: true });
                console.log("Added habit to Thursday");

                const habitsList = doc(db, "habitData", user.uid);
                await setDoc(habitsList, {
                    namesOfHabits: arrayUnion(habitName)
                }, { merge: true });
            }
            if (Friday.checked) {
                const Friday = doc(db, "habits", user.uid, "Friday", "habits");
                await setDoc(Friday, {
                    habits: arrayUnion(habitName)
                }, { merge: true });
                console.log("Added habit to Friday");

                const habitsList = doc(db, "habitData", user.uid);
                await setDoc(habitsList, {
                    namesOfHabits: arrayUnion(habitName)
                }, { merge: true });
            }
            if (Saturday.checked) {
                const Saturday = doc(db, "habits", user.uid, "Saturday", "habits");
                await setDoc(Saturday, {
                    habits: arrayUnion(habitName)
                }, { merge: true });
                console.log("Added habit to Saturday");

                const habitsList = doc(db, "habitData", user.uid);
                await setDoc(habitsList, {
                    namesOfHabits: arrayUnion(habitName)
                }, { merge: true });
            }
            if (Sunday.checked) {
                const Sunday = doc(db, "habits", user.uid, "Sunday", "habits");
                await setDoc(Sunday, {
                    habits: arrayUnion(habitName)
                }, { merge: true });
                console.log("Added habit to Sunday");

                const habitsList = doc(db, "habitData", user.uid);
                await setDoc(habitsList, {
                    namesOfHabits: arrayUnion(habitName)
                }, { merge: true });
            }

        } else {
            // User is signed out
            console.log("User is signed out");
        }
    });

}
submitted.addEventListener('click', habitSubmitted);

const newMetric = document.getElementById("newMetric");
const newHabit = document.getElementById("newHabit");
const popUp = document.getElementById("popupOverlay");
const closePopup = document.getElementById("closePopup");

const callNewHabits = async () => {

    popUp.style.display = "block";

}

const closeWindow = async () => {

    popUp.style.display = "none";
}

closePopup.addEventListener('click', closeWindow);
newHabit.addEventListener('click', callNewHabits);
newMetric.addEventListener('click', callNewHabits);


const submitHabits = document.getElementById("submitHabits");

//submitting user inputted habits for the day
const sendHabits = async () => {
    onAuthStateChanged(auth, async (user) => {
        const dayDoc = doc(db, "habits", user.uid, days[dayOfWeek], "habits");
        const habitsDoc = await getDoc(dayDoc);
        const habits = habitsDoc.data().habits;
        if (user) {
            habits.forEach(element => {
                const habitCheck = document.getElementById(element);
                const habitLabel = document.getElementById(element + "id");
                let isChecked = false;
                if (habitCheck.checked) {
                    isChecked = true;
                }
                const habitDoc = doc(db, "habitData", user.uid, element, date.toISOString().split('T')[0]);
                setDoc(habitDoc, {
                    date: date.toISOString().split('T')[0],
                    completed: isChecked
                });
                habitCheck.style.display = "none";
                habitLabel.style.display = "none";
            });
            submitHabits.style.display = "none";
            const newParagraph = document.createElement('p');
            newParagraph.textContent = "Habits Submitted!";
            parentElement.appendChild(newParagraph);

        } else {
            // User is signed out
            console.log("User is signed out");
        }
    });
}

submitHabits.addEventListener('click', sendHabits);