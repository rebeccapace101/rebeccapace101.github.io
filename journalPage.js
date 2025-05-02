import { app } from './init.mjs';
import {
    getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import {
    getFirestore, doc, setDoc, getDoc, updateDoc, getDocs, collection, deleteDoc, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Initialize Firebase
const db = getFirestore(app);
const auth = getAuth(app);
//sets habits as the box to add stuff inside of
const parentElement = document.getElementById('habitsScrollArea');

const dirtyHabits = new Set();

// Function to get the current date in Chicago timezone
const getChicagoDate = (dateStr = null) => {
    if (dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    } else {
        const chicagoTime = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
        return new Date(chicagoTime);
    }
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
            // Log the loop entry
            console.log("🔄 Iteration for habit:", habitName);
            try {
                //For each habit, get the input type from the habitData collection
                //Fetch the input-type doc
                const inputDoc = doc(db, "habitData", user.uid, habitName, "input");
                const inputTypeDoc = await getDoc(inputDoc);
                console.log("   input-type exists?", inputTypeDoc.exists()); //debug console log


                if (!inputTypeDoc.exists()) {
                    console.warn(`No input type found for habit: ${habitName}`);
                    //continue;
                }

                // Pick up the saved type, or fall back to "checkbox" if missing
                const inputType = inputTypeDoc.exists()
                    ? inputTypeDoc.data().inputtype
                    : "checkbox";
                console.log(`Habit ${habitName} input type: ${inputType}`);

                const todayKey = date.toISOString().split('T')[0];
                const submissionDocRef = doc(db, "habitData", user.uid, habitName, todayKey);
                const submissionDoc = await getDoc(submissionDocRef);
                console.log("   submission exists?", submissionDoc.exists()); //debug console log

                const habitContainer = document.createElement("div");
                habitContainer.className = "habit-item";

                if (submissionDoc.exists()) {
                    //Already submitted — show 'Submitted'
                   
                    habitContainer.classList.add("submitted");
                    habitContainer.style.backgroundColor = "#d0e8d0";
                    const submittedText = document.createElement("p");
                    submittedText.textContent  = `${habitName}: Submitted`;
                    submittedText.style.textAlign  = "center";
                    submittedText.style.color      = "#4a704a";
                    submittedText.style.fontWeight = "bold";
                    habitContainer.appendChild(submittedText);

                    // 2) Button row
                    const btns = document.createElement("div");
                    btns.className = "habit-buttons";
                    btns.style.justifyContent = "center";


                    
                    // • Delete submission
                    const delSub = document.createElement("button");
                    delSub.textContent = "Delete";
                    delSub.classList.add("delete-button");
                    delSub.addEventListener("click", () =>
                        handleDelete(user.uid, habitName, habitContainer)
                    );
                    btns.appendChild(delSub);

                    habitContainer.appendChild(btns);
                } else {
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
                    const buttonContainer = document.createElement("div");
                    buttonContainer.className = "habit-buttons";

                    //EDIT BUTTON
                    const editButton = document.createElement("button");
                    editButton.textContent = "Edit";
                    editButton.classList.add("edit-button");
                    //connect edit button to handleEdit function
                    editButton.addEventListener("click", () =>
                        handleEdit(user.uid, habitName, habitContainer)
                    );

                    //DELETE BUTTON
                    const deleteButton = document.createElement("button");
                    deleteButton.textContent = "Delete";
                    deleteButton.classList.add("delete-button");
                    //connect delete button to handleDelete function
                    deleteButton.addEventListener("click", () =>
                        handleDelete(user.uid, habitName, habitContainer)
                    );

                    buttonContainer.appendChild(editButton);
                    buttonContainer.appendChild(deleteButton);
                    habitContainer.appendChild(buttonContainer);
                }

                // Add the habit container to habitsBox
                parentElement.appendChild(habitContainer);
                console.log("   ✅ Appended container for", habitName); //append check

                //line break
                parentElement.appendChild(document.createElement("br"));
            } catch (error) {
                console.error(`Error fetching input type for ${habitName}:`, error);
                console.error("   ❌ Error in rendering", habitName, error);
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

            const btnContainer = habitContainer.querySelector('.habit-buttons');
            if (btnContainer) {
                const editBtn = btnContainer.querySelector('.edit-button');
                if (editBtn) editBtn.remove();
                // (we leave the delete-button in place)
            }

            //Append submitted message

            const submittedText2 = document.createElement("p");
            submittedText2.textContent = `${habitName}: Submitted`;
            submittedText2.style.textAlign = "center";
            submittedText2.style.color = "#659287";
            submittedText2.style.fontWeight = "bold";
            habitContainer.appendChild(submittedText2);

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
            window.location.reload();
        }, 3000);

    });
};

submitHabits.addEventListener('click', sendHabits);

//OPEN EDIT HANDLER
async function handleEdit(uid, habitName, container) {
    // 1) Compute today’s key just for consistency (though we won't touch submissions here)
    const todayKey = getChicagoDate().toISOString().split("T")[0];
  
    // 2) Wipe out the existing label+input+buttons UI
    container.innerHTML = "";
  
    // 3) Create a single text input for the new name
    const nameInput = document.createElement("input");
    nameInput.type  = "text";
    nameInput.value = habitName;
    nameInput.style.width = "100%";
    container.appendChild(nameInput);
  
    // 4) Add a Save button
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.classList.add("edit-button");
    container.appendChild(saveBtn);
  
    saveBtn.addEventListener("click", async () => {
        const newName = nameInput.value.trim();
        if (!newName || newName === habitName) return;
      
        // 1) Move ALL docs (including "input") from oldName → newName
        const oldColl = collection(db, "habitData", uid, habitName);
        const snaps   = await getDocs(oldColl);
        for (const snap of snaps.docs) {
          const id   = snap.id;
          const data = snap.data();
          await setDoc(doc(db, "habitData", uid, newName, id), data, { merge: true });
          await deleteDoc(doc(db, "habitData", uid, habitName, id));
        }
      
        // 2) Update each day's habits array
        for (const day of days) {
          const dayRef = doc(db, "habits", uid, day, "habits");
          await updateDoc(dayRef, { habits: arrayRemove(habitName) });
          await updateDoc(dayRef, { habits: arrayUnion(newName) });
        }
      
        // 3) Update master list
        const masterRef = doc(db, "habitData", uid);
        await updateDoc(masterRef, { namesOfHabits: arrayRemove(habitName) });
        await updateDoc(masterRef, { namesOfHabits: arrayUnion(newName) });
      
        // 4) Finally reload to show the change
        window.location.reload();
      });
}  //  CLOSE handleEdit 

//START DELETE HANDLER
async function handleDelete(uid, habitName, container) {

    //find document 
    //when delete button pressed, make extra popup, do you want to delete this recurring habit? (other button "yes")
    //delete habit from firestore, and delete all stuff on screen (should happen automatically)

    try {
        // 1) Delete every document in habitData/{uid}/{habitName}:
        const collRef = collection(db, "habitData", uid, habitName);
        const snaps = await getDocs(collRef);
        for (const snap of snaps.docs) {
            await deleteDoc(
                doc(db, "habitData", uid, habitName, snap.id)
            );
        }

        for (const day of days) {
            const dayRef = doc(db, "habits", uid, day, "habits");
            await updateDoc(dayRef, {
                habits: arrayRemove(habitName)
            });
        }

        const masterRef = doc(db, "habitData", uid);
        await updateDoc(masterRef, {
            namesOfHabits: arrayRemove(habitName)
        });


        container.remove();

        console.log(`Habit “${habitName}” fully deleted.`);
    } catch (err) {
        console.error("Error deleting habit fully:", err);
    }
}
  

// Pop-up handlers
const newHabit = document.getElementById("newHabit");
const popUp = document.getElementById("popupOverlay");
const closePopup = document.getElementById("closePopup");

const callNewHabits = () => popUp.style.display = "block";
const closeWindow = () => popUp.style.display = "none";

closePopup.addEventListener('click', closeWindow);
newHabit.addEventListener('click', callNewHabits);

// code for scrolling through journal entries

const leftArrow = document.getElementById("leftArrow");
const rightArrow = document.getElementById("rightArrow");
const journalInput = document.getElementById('myTextbox');
const dateLabel = document.getElementById("dateLabel");



const getTodayDate = () => {
    const today = getChicagoDate();
    return today.toISOString().split('T')[0];
};

let currentDate = getTodayDate();

const updateDate = (offset) => {
    const dateObj = getChicagoDate(currentDate);
    dateObj.setDate(dateObj.getDate() + offset);
    currentDate = dateObj.toISOString().split('T')[0];
    return currentDate;
};

const goLeft = async () => {
    journalInput.readOnly = true;
    const newDate = updateDate(-1);
    await loadJournalEntry(newDate);
    updateDateLabel(newDate);
    journalInput.readOnly = false;
};

const goRight = async () => {
    const today = getTodayDate();

    const nextDateObj = getChicagoDate(currentDate);
    nextDateObj.setDate(nextDateObj.getDate() + 1);
    const nextDate = nextDateObj.toISOString().split('T')[0];

    if (nextDate > today) return;

    const newDate = updateDate(1);
    journalInput.readOnly = true;
    await loadJournalEntry(newDate);
    updateDateLabel(newDate);
    journalInput.readOnly = false;
};

const updateDateLabel = (dateStr) => {
    const date = getChicagoDate(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateLabel.textContent = date.toLocaleDateString('en-US', options);
};

const loadJournalEntry = async (selectedDate) => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const journalRef = doc(db, "journals", user.uid, "journalEntry", selectedDate);
            try {
                const docSnap = await getDoc(journalRef);
                if (docSnap.exists()) {
                    journalInput.value = docSnap.data().text;
                    console.log("Loaded journal entry for", selectedDate);
                } else {
                    journalInput.value = "No journal entry for this day.";
                    console.log("No journal entry found for", selectedDate);
                }
            } catch (error) {
                console.error("Error loading journal entry:", error);
            }
        }
    });
};

leftArrow.addEventListener('click', goLeft);
rightArrow.addEventListener('click', goRight);

updateDateLabel(currentDate);
loadJournalEntry(currentDate);