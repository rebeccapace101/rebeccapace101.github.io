import { app } from './init.mjs';
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const db = getFirestore(app);
const auth = getAuth();
const todaySummary = document.getElementById("today-summary");
const highestStreakContainer = document.getElementById("highest-streak");
const userNameElement = document.getElementById("userName");
const profilePic = document.getElementById("profile-pic");
const journalContainer = document.getElementById("journal-container");

// Function to get today's date in Chicago timezone in YYYY-MM-DD format
const getTodayDate = () => {
    const chicagoTime = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    const today = new Date(chicagoTime);
    return today.toISOString().split('T')[0];
};

async function fetchTodayHabits(user) {
    todaySummary.innerHTML = "Loading...";
    const todayDate = getTodayDate();
    const date = new Date();
    const dayOfWeek = date.getDay();
    console.log("date: " + todayDate);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let habitList = "<h2>Today's Habits</h2><ul>";

    try {

        const userDocRef = doc(db, "habits", user.uid, days[dayOfWeek], "habits");
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().habits) {
            const habits = userDocSnap.data().habits;

            for (const element of habits) { //for each habit for this day of week
                console.log(element);
                const habitDocRef = doc(db, "habitData", user.uid, element, todayDate);
                console.log(todayDate);
                const habitDocSnap = await getDoc(habitDocRef);

                if (habitDocSnap.exists()) {
                    const inputDocRef = doc(db, "habitData", user.uid, element, "input");
                    const inputDocSnap = await getDoc(inputDocRef);

                    const inputType = inputDocSnap.data().inputtype;

                    if (inputType == "checkbox") {
                        const completed = habitDocSnap.data().data;
                        habitList += `<li>${element}: ${completed ? "✅" : "❌"}</li>`;
                    } else {
                        const userData = habitDocSnap.data().data;
                        habitList += `<li>${element}: ${userData}</li>`;
                    }

                } else {
                    habitList += `<li>${element}: No data found</li>`;
                }
            }


        } else {
            habitList += "<li>No habits found.</li>";
        }
    } catch (error) {
        console.error("Error fetching today's habits:", error);
        habitList += "<li>Error loading habits.</li>";
    }

    habitList += "</ul>";
    todaySummary.innerHTML = habitList;
}
async function fetchHighestStreak(user) {
    highestStreakContainer.innerHTML = "Loading...";
    let longestStreak = 0;
    let topHabit = "";

    try {
        const userDocRef = doc(db, "habitData", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().namesOfHabits) {
            const habitNames = userDocSnap.data().namesOfHabits;

            for (const habitName of habitNames) {
                console.log("checking: " + habitName);
                const habitCollectionRef = collection(db, "habitData", user.uid, habitName);
                const habitDocs = await getDocs(habitCollectionRef);
                let streak = 0, maxStreak = 0;

                for (const habitDoc of habitDocs.docs) {
                    if (habitDoc.id !== "input") {
                        const inputDocRef = doc(db, "habitData", user.uid, habitName, "input");
                        const inputDocSnap = await getDoc(inputDocRef);

                        let inputType = "checkbox"; // default fallback
                        if (inputDocSnap.exists()) {
                            const inputData = inputDocSnap.data();
                            if (inputData && inputData.inputtype) {
                                inputType = inputData.inputtype;
                            } else {
                                console.warn(`No inputtype field in input doc for ${habitName}`);
                            }
                        } else {
                            console.warn(`No input doc found for ${habitName}`);
                        }

                        const data = habitDoc.data().data;
                        if (inputType === "checkbox") {
                            if (data === true) {
                                streak++;
                                maxStreak = Math.max(maxStreak, streak);
                            } else {
                                streak = 0;
                            }
                        } else {
                            streak++;
                            maxStreak = Math.max(maxStreak, streak);
                        }
                    }
                }

                if (maxStreak > longestStreak) {
                    longestStreak = maxStreak;
                    topHabit = habitName;
                }
            }
        }
    } catch (error) {
        console.error("Error fetching highest streak:", error);
    }

    highestStreakContainer.innerHTML = `<h2>Longest Streak</h2><p>${topHabit}: ${longestStreak} days 🔥</p>`;
}


const loadJournalEntry = async (userId) => {
    const todayDate = getTodayDate();
    const journalRef = doc(db, "journals", userId, "journalEntry", todayDate);

    try {
        const docSnap = await getDoc(journalRef);
        if (docSnap.exists()) {
            const journalData = docSnap.data();
            journalContainer.innerHTML = `
                <h2>Current Journal Entry</h2>
                <p><strong>Date:</strong> ${journalData.date}</p>
                <p>${journalData.text}</p>
            `;
        } else {
            journalContainer.innerHTML = `
                <h2>Current Journal Entry</h2>
                <p>No journal entry written for today.</p>
                <a href="./journalPage.html"><button>Write Today's Entry</button></a>
            `;
        }
    } catch (error) {
        console.error("Error loading journal entry:", error);
    }
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const displayName = user.displayName || "Guest";
        if (userNameElement) {
            userNameElement.textContent = displayName;
        }

        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                const photoURL = userData.photoURL || user.photoURL;

                if (photoURL && profilePic) {
                    profilePic.src = photoURL;
                }
            } else {
                console.log("No user document found in Firestore.");
            }
        } catch (error) {
            console.error("Error retrieving user photo URL:", error);
        }

        await fetchTodayHabits(user);
        await fetchHighestStreak(user);
        await loadJournalEntry(user.uid);
    } else {
        todaySummary.innerHTML = "Please log in to see your habits.";
        highestStreakContainer.innerHTML = "";
        journalContainer.innerHTML = "";
    }
});
