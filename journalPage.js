import { app } from './init.mjs';
import {
    getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import {
    getFirestore, doc, setDoc, arrayUnion, getDoc
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Initialize Firebase
const db = getFirestore(app);
const auth = getAuth(app);
//sets habits as the box to add stuff inside of
const parentElement = document.getElementById('habitsScrollArea');

const dirtyHabits = new Set();

// Function to get the current date in Chicago timezone
const getChicagoDate = () => {
    const chicagoTime = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    return new Date(chicagoTime);
};

// Replace `new Date()` with `getChicagoDate()` where applicable
const date = getChicagoDate();
const dayOfWeek = date.getDay();
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Fetch preexisting habits
onAuthStateChanged(auth, async (user) => {
    if (user) {
        //Create a reference to the Firestore document for the user's habits for today's day of the week
        const dayDoc = doc(db, "habits", user.uid, days[dayOfWeek], "habits");
        const habitsDoc = await getDoc(dayDoc);

        if (!habitsDoc.exists()) {
            console.log("No habits found for today.");
            return;
        }

        const habits = habitsDoc.data()?.habits || [];
        if (habits.length === 0) return console.log("User has no habits for today.");
        //Log the retrieved habits
        console.log("Retrieved habits:", habits);
        //Loop over each habit name.
        for (const habitName of habits) {
            try {
                //For each habit, get the input type from the habitData collection
                const inputDoc = doc(db, "habitData", user.uid, habitName, "input");
                const inputTypeDoc = await getDoc(inputDoc);

                if (!inputTypeDoc.exists()) {
                    console.warn(`No input type found for habit: ${habitName}`);
                    continue;
                }
                
                //inputType = input type of habit to add to page
                const inputType = inputTypeDoc.data().inputtype;
                console.log(`Habit ${habitName} input type: ${inputType}`);

                const todayKey = date.toISOString().split('T')[0];
                const submissionDocRef = doc(db, "habitData", user.uid, habitName, todayKey);
                const submissionDoc = await getDoc(submissionDocRef);

                const habitContainer = document.createElement("div");
                habitContainer.className = "habit-item";

                if (submissionDoc.exists()) {
                    //Already submitted — show 'Submitted'
                    const submittedText = document.createElement("p");
                    submittedText.textContent = `${habitName}: Submitted`;
                    submittedText.style.textAlign = "center";
                    submittedText.style.color = "#4a704a";
                    submittedText.style.fontWeight = "bold";
                    habitContainer.appendChild(submittedText);
                }else {
                    // Not yet submitted — render label + input
                    const label = document.createElement("label");
                    label.textContent = habitName;
                    label.htmlFor = habitName;
                    label.id = habitName + "id";
                
                    const inputField = document.createElement("input");
                    inputField.type = inputType;
                    inputField.id = habitName;
                    if (inputType !== "checkbox") inputField.value = "";
                
                    inputField.addEventListener("input", () => {
                        dirtyHabits.add(habitName);
                      });
                      if (inputType === "checkbox") {
                        inputField.addEventListener("change", () => {
                          dirtyHabits.add(habitName);
                        });
                      }

                    habitContainer.appendChild(label);
                    habitContainer.appendChild(inputField);
                }

                // Add the habit container to habitsBox
                parentElement.appendChild(habitContainer);

                //line break
                parentElement.appendChild(document.createElement("br"));
            } catch (error) {
                console.error(`Error fetching input type for ${habitName}:`, error);
            }
        }
    } else {
        console.log("User is signed out");
    }
});

// Habit creation
const submitted = document.getElementById('addHabit');

const habitSubmitted = async () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) return console.log("User is signed out");

        const habitName = document.getElementById('habitInput').value;
        const selectedValue = document.getElementById("inputtype").value;
        console.log(`New Habit: ${habitName}, Input Type: ${selectedValue}`);

        const daysChecked = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            .filter(day => document.getElementById(day).checked);

        if (daysChecked.length === 0) return console.log("No days selected for habit.");

        for (const day of daysChecked) {
            const dayDoc = doc(db, "habits", user.uid, day, "habits");
            await setDoc(dayDoc, { habits: arrayUnion(habitName) }, { merge: true });
            console.log(`Added habit to ${day}`);
        }

        // Store habit name and input type
        const habitsList = doc(db, "habitData", user.uid);
        await setDoc(habitsList, { namesOfHabits: arrayUnion(habitName) }, { merge: true });

        const inputTypeDoc = doc(db, "habitData", user.uid, habitName, "input");
        await setDoc(inputTypeDoc, { inputtype: selectedValue }, { merge: true });

        window.location.reload();
    });
};

submitted.addEventListener('click', habitSubmitted);


// Habit submission
const submitHabits = document.getElementById("submitHabits");

const sendHabits = async () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) return console.log("User is signed out");

        const dayDoc = doc(db, "habits", user.uid, days[dayOfWeek], "habits");
        const habitsDoc = await getDoc(dayDoc);

        if (!habitsDoc.exists()) return console.log("No habits found for today.");

        const habits = habitsDoc.data()?.habits || [];

        for (const habitName of habits) {
            if (!dirtyHabits.has(habitName)) continue;

            const inputField = document.getElementById(habitName);
            const labelField = document.getElementById(habitName + "id");

            if (!inputField) {
                console.warn(`Element not found: ${habitName}`);
                continue;
            }

            const inputDoc = doc(db, "habitData", user.uid, habitName, "input");
            const inputTypeDoc = await getDoc(inputDoc);

            if (!inputTypeDoc.exists()) {
                console.warn(`No input type found for habit: ${habitName}`);
                continue;
            }

            const inputType = inputTypeDoc.data().inputtype;
            const userInput = (inputType === "checkbox") ? inputField.checked : inputField.value;

            const habitDoc = doc(db, "habitData", user.uid, habitName, date.toISOString().split('T')[0]);
            await setDoc(habitDoc, {
                date: date.toISOString().split('T')[0],
                data: userInput
            }, { merge: true });

            const submittedText = document.createElement("p");
            submittedText.textContent = `${habitName}: Submitted`;
            //submittedText.style.backgroundColor = "black";
            submittedText.style.textAlign = "center";
            submittedText.style.color = "#659287";
            submittedText.style.fontWeight = "bold";
            
            // Assign parent container just once
            const habitContainer = inputField.parentElement;
            
            // Remove child elements cleanly
            if (labelField) labelField.remove();
            if (inputField) inputField.remove();
            
            //Append submitted message
            habitContainer.appendChild(submittedText);
            habitContainer.style.backgroundColor = "#d0e8d0";
            
        }


        const confirmation = document.createElement('div');
        confirmation.textContent = "Habits Submitted!";
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

    });
};

submitHabits.addEventListener('click', sendHabits);

// Pop-up handlers
const newHabit = document.getElementById("newHabit");
const popUp = document.getElementById("popupOverlay");
const closePopup = document.getElementById("closePopup");

const callNewHabits = () => popUp.style.display = "block";
const closeWindow = () => popUp.style.display = "none";

closePopup.addEventListener('click', closeWindow);
newHabit.addEventListener('click', callNewHabits);
