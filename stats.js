import { app } from './init.mjs';
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
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

const dayView = document.getElementById("dayView");
const weekView = document.getElementById("weekView");
const monthView = document.getElementById("monthView");

const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

// Function to format date as YYYY-MM-DD
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};

// Fetch habits for the user
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

// Fetch habit completion data for a specific habit and display it based on the selected view
async function fetchHabitCompletion(user, habitName, view) {
    habitInfo.innerHTML = "Loading habit data...";
    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);
    let completedDays = 0;
    let streak = 0;
    let currentStreak = 0;

    if (view === "day") {
        // Day View
        let dayCompletionData = "<table class='calendar-table'><thead><tr><th>Today</th></tr></thead><tbody><tr>";
        const dateStr = formatDate(today);
        const habitDocRef = doc(db, "habitData", user.uid, habitName, dateStr);
        const habitDocSnap = await getDoc(habitDocRef);

        const completed = habitDocSnap.exists() && habitDocSnap.data().completed !== undefined ? habitDocSnap.data().completed : false;
        const todayClass = 'today';

        dayCompletionData += `<td class="${todayClass} ${completed ? 'completed' : 'incomplete'}">
            <span>Today</span>
        </td>`;

        dayCompletionData += "</tr></tbody></table>";
        habitInfo.innerHTML = dayCompletionData;
    } else if (view === "week") {
        // Week View (Monday-Sunday)
        let weekCompletionData = "<table class='calendar-table'><thead><tr>";
        const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        weekdays.forEach((day) => {
            weekCompletionData += `<th>${day}</th>`;
        });
        weekCompletionData += "</tr></thead><tbody><tr>";

        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1); // Set to Monday of the current week

        // Loop through each day of the week (Monday to Sunday)
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(weekStart);
            currentDay.setDate(weekStart.getDate() + i);
            const dateStr = formatDate(currentDay);
            const habitDocRef = doc(db, "habitData", user.uid, habitName, dateStr);
            const habitDocSnap = await getDoc(habitDocRef);

            const completed = habitDocSnap.exists() && habitDocSnap.data().completed !== undefined ? habitDocSnap.data().completed : false;
            const todayClass = currentDay.toDateString() === today.toDateString() ? 'today' : '';
            const emoji = completed ? '✅' : '❌';

            weekCompletionData += `<td class="${todayClass} ${completed ? 'completed' : 'incomplete'}">
                <span>${emoji}</span>
            </td>`;
        }

        weekCompletionData += "</tr></tbody></table>";
        habitInfo.innerHTML = weekCompletionData;
    } else if (view === "month") {
        // Month View (Calendar)
        let monthCompletionData = "<table class='calendar-table'><thead><tr>";
        const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        weekdays.forEach((day) => {
            monthCompletionData += `<th>${day}</th>`;
        });
        monthCompletionData += "</tr></thead><tbody><tr>";

        let firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        let totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Empty days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            monthCompletionData += "<td></td>";
        }

        // Loop through each day in the month
        for (let i = 1; i <= totalDaysInMonth; i++) {
            const currentDay = new Date(currentYear, currentMonth, i);
            const dateStr = formatDate(currentDay);
            const habitDocRef = doc(db, "habitData", user.uid, habitName, dateStr);
            const habitDocSnap = await getDoc(habitDocRef);
            const completed = habitDocSnap.exists() && habitDocSnap.data().completed !== undefined ? habitDocSnap.data().completed : false;

            // Mark today with a special class
            const todayClass = currentDay.toDateString() === today.toDateString() ? 'today' : '';

            monthCompletionData += `<td class="${todayClass} ${completed ? 'completed' : 'incomplete'}">
                <span>${i}</span>
            </td>`;

            // Break row after 7 days
            if ((i + firstDayOfMonth) % 7 === 0) {
                monthCompletionData += "</tr><tr>";
            }
        }

        monthCompletionData += "</tr></tbody></table>";
        habitInfo.innerHTML = monthCompletionData;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await fetchHabits(user);

            habitDropdown.addEventListener("change", async () => {
                const selectedHabit = habitDropdown.value;
                const view = document.querySelector('input[name="view"]:checked').value; // Get the selected view
                if (selectedHabit) {
                    await fetchHabitCompletion(user, selectedHabit, view);
                } else {
                    habitInfo.innerHTML = "Select a habit to view details.";
                }
            });

            // Add event listeners for radio buttons to update the view
            const radioButtons = document.querySelectorAll('input[name="view"]');
            radioButtons.forEach((button) => {
                button.addEventListener("change", async () => {
                    const selectedHabit = habitDropdown.value;
                    const view = document.querySelector('input[name="view"]:checked').value; // Get the selected view
                    if (selectedHabit) {
                        await fetchHabitCompletion(user, selectedHabit, view);
                    }
                });
            });

            // Initialize with a default view (Day View)
            document.querySelector('input[name="view"][value="day"]').checked = true;
            await fetchHabitCompletion(user, habitDropdown.value, "day");
        } else {
            console.log("User is signed out");
            habitDropdown.innerHTML = "<option value=''>Please log in to see your habits.</option>";
            habitInfo.innerHTML = "";
        }
    });
});
