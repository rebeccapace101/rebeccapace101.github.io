import { app } from './init.mjs';
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const db = getFirestore(app);
const auth = getAuth();
const habitDropdown = document.getElementById("habitDropdown");
const habitStats = document.getElementById("habit-stats");
const habitInfo = document.getElementById("habit-info");
const habitTableContainer = document.getElementById("habit-table-container");
const habitPercentage = document.createElement("p");
const habitStreak = document.createElement("p");
habitStats.appendChild(habitPercentage);
habitStats.appendChild(habitStreak);

async function fetchHabits(user) {
    habitDropdown.innerHTML = "<option value=''>Loading...</option>";
    try {
        const userDocRef = doc(db, "habitData", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().namesOfHabits) {
            const habitNames = userDocSnap.data().namesOfHabits;
            habitDropdown.innerHTML = "<option value=''>Select a Habit</option>";
            habitNames.forEach((habitName) => {
                const option = document.createElement("option");
                option.value = habitName;
                option.textContent = habitName;
                habitDropdown.appendChild(option);
            });
        } else {
            habitDropdown.innerHTML = "<option value=''>No habits found</option>";
        }
    } catch (error) {
        console.error("Error fetching habits:", error);
        habitDropdown.innerHTML = "<option value=''>Error loading habits</option>";
    }
}

async function fetchHabitCompletion(user, habitName) {
    habitInfo.innerHTML = "Loading habit data...";
    const startDate = new Date("2025-03-03");
    const endDate = new Date("2025-03-09");
    let completedDays = 0;
    let streak = 0;
    let currentStreak = 0;
    
    let habitCompletionData = "<h2>Habit Completion</h2><table border='1'><tr>";
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        habitCompletionData += `<th>${dateStr}</th>`;
    }
    habitCompletionData += "</tr><tr>";
    
    try {
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split("T")[0];
            const habitDocRef = doc(db, "habitData", user.uid, habitName, dateStr);
            const habitDocSnap = await getDoc(habitDocRef);
            
            if (habitDocSnap.exists() && habitDocSnap.data().completed !== undefined) {
                const completed = habitDocSnap.data().completed;
                habitCompletionData += `<td>${completed ? "✅" : "❌"}</td>`;
                if (completed) {
                    completedDays++;
                    currentStreak++;
                    streak = Math.max(streak, currentStreak);
                } else {
                    currentStreak = 0;
                }
            } else {
                habitCompletionData += "<td>❌</td>";
                currentStreak = 0;
            }
        }
        habitCompletionData += "</tr></table>";
        habitInfo.innerHTML = habitCompletionData;
        
        let percentage = ((completedDays / 7) * 100).toFixed(2);
        habitPercentage.innerHTML = `Completion Rate: ${percentage}%`;
        habitStreak.innerHTML = `Longest Streak: ${streak} days`;
    } catch (error) {
        console.error("Error fetching habit completion data:", error);
        habitInfo.innerHTML = "Error loading habit completion data.";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await fetchHabits(user);
            habitDropdown.addEventListener("change", async () => {
                const selectedHabit = habitDropdown.value;
                if (selectedHabit) {
                    await fetchHabitCompletion(user, selectedHabit);
                } else {
                    habitInfo.innerHTML = "Select a habit to view details.";
                }
            });
        } else {
            console.log("User is signed out");
            habitDropdown.innerHTML = "<option value=''>Please log in to see your habits.</option>";
            habitInfo.innerHTML = "";
        }
    });
});
