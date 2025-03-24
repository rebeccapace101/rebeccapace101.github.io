//submitting user inputted habits for the day

const submitHabits = document.getElementById("submitHabits");

const sendHabits = async () => {
    onAuthStateChanged(auth, async (user) => {

        if (user) {
            const dayDoc = doc(db, "habits", user.uid, days[dayOfWeek], "habits");
            const habitsDoc = await getDoc(dayDoc);
            const habits = habitsDoc.data().habits;
            for (const element of habits) {
                const elementName = document.getElementById(element);
                const elementLabel = document.getElementById(element + "id");
                let userInput = null;
                const inputDoc = doc(db, "habitData", user.uid, element, "input")
                const inputTypeDoc = await getDoc(inputDoc);
                const inputType = inputTypeDoc.inputType;

                //edit userInput based on input type

                if (inputType === "checkbox") {
                    userInput = false;
                    if (elementName.checked) {
                        userInput = true;
                    }
                }
                else {
                    userInput = elementName.value;
                }

                //submitting to the doc
                const habitDoc = doc(db, "habitData", user.uid, element, date.toISOString().split('T')[0]);
                setDoc(habitDoc, {
                    date: date.toISOString().split('T')[0],
                    data: userInput
                });
                elementName.style.display = "none";
                elementLabel.style.display = "none";
            }
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