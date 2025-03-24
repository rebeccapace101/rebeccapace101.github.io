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

        if (!habitsDoc.exists()) {
            console.log("No habits found for today.");
            return;
        }

        const habitsData = habitsDoc.data();
        const habits = habitsData?.habits || [];

        if (habits.length === 0) {
            console.log("User has no habits for today.");
            return;
        }

        console.log("Retrieved habits:", habits);

        for (const element of habits) {
            console.log("Element:", element);

            try {
                const habitsCollection = doc(db, "habitData", user.uid, element, "input");
                const habitsColDoc = await getDoc(habitsCollection);

                if (!habitsColDoc.exists()) {
                    console.warn(`No input type found for habit: ${element}`);
                    continue;
                }

                const habitsInput = habitsColDoc.data().inputtype;
                console.log(habitsInput);

                const newParagraph = document.createElement("input");
                newParagraph.type = habitsInput;
                newParagraph.value = element;
                newParagraph.id = element;

                const newLabel = document.createElement("label");
                newLabel.textContent = element;
                newLabel.htmlFor = element;
                newLabel.id = element + "id";

                parentElement.appendChild(newParagraph);
                parentElement.appendChild(newLabel);
                parentElement.appendChild(document.createElement("br"));
            } catch (error) {
                console.error(`Error fetching input type for ${element}:`, error);
            }
        }
    } else {
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
                const habitsCollection = doc(db, "habitData", user.uid, habitName, "input");
                setDoc(habitsCollection, {
                    inputtype: selectedValue
                });
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
                const habitsCollection = doc(db, "habitData", user.uid, habitName, "input");
                setDoc(habitsCollection, {
                    inputtype: selectedValue
                });
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
                }, { merge: true }); const habitsCollection = doc(db, "habitData", user.uid, habitName, "input");
                setDoc(habitsCollection, {
                    inputtype: selectedValue
                });

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
                const habitsCollection = doc(db, "habitData", user.uid, habitName, "input");
                setDoc(habitsCollection, {
                    inputtype: selectedValue
                });
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
                const habitsCollection = doc(db, "habitData", user.uid, habitName, "input");
                setDoc(habitsCollection, {
                    inputtype: selectedValue
                });
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
                const habitsCollection = doc(db, "habitData", user.uid, habitName, "input");
                setDoc(habitsCollection, {
                    inputtype: selectedValue
                });
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

                //adding the input type
                const habitsCollection = doc(db, "habitData", user.uid, habitName, "input");
                setDoc(habitsCollection, {
                    inputtype: selectedValue
                });
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

//opening and closing the popup for creating new habtis
const callNewHabits = async () => {

    popUp.style.display = "block";

}

const closeWindow = async () => {

    popUp.style.display = "none";
}

closePopup.addEventListener('click', closeWindow);
newHabit.addEventListener('click', callNewHabits);
newMetric.addEventListener('click', callNewHabits);




//submitting user inputted habits for the day

const submitHabits = document.getElementById("submitHabits");

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