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

let currentOffset = 0;
const prevPeriodBtn = document.getElementById("prevPeriod");
const nextPeriodBtn = document.getElementById("nextPeriod");
const currentPeriodLabel = document.getElementById("currentPeriodLabel");

// Function to format date as YYYY-MM-DD
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};

// Helper function to check future dates
function isFutureDate(date) {
    return new Date(date).setHours(0, 0, 0, 0) > new Date().setHours(0, 0, 0, 0);
}

// Helper function to get offset date
function getOffsetDate(offset, view) {
    const date = new Date();
    if (view === "day") {
        date.setDate(date.getDate() + offset);
    } else if (view === "week") {
        date.setDate(date.getDate() + (offset * 7));
    } else if (view === "month") {
        date.setMonth(date.getMonth() + offset);
    }
    return date;
}

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

// Helper function to check completion status
async function getCompletionStatus(date, user, habitName) {
    if (isFutureDate(date)) return 'future';
    
    const dateStr = formatDate(date);
    const habitDocRef = doc(db, "habitData", user.uid, habitName, dateStr);
    const habitDocSnap = await getDoc(habitDocRef);
    return habitDocSnap.exists() && habitDocSnap.data().completed === true;
}

// Fetch habit completion data for a specific habit and display it based on the selected view
async function fetchHabitCompletion(user, habitName, view) {
    if (!habitName) return;
    
    const viewDate = getOffsetDate(currentOffset, view);
    habitInfo.innerHTML = "Loading habit data...";
    let completedDays = 0;
    let totalDays = 0;

    if (view === "day") {
        let dayCompletionData = "<table class='calendar-table'><thead><tr><th>Selected Date</th></tr></thead><tbody><tr>";
        const status = await getCompletionStatus(viewDate, user, habitName);
        if (status !== 'future') {
            totalDays = 1;
            if (status === true) completedDays = 1;
        }
        
        const cellClass = status === 'future' ? 'future' : status ? 'completed' : 'incomplete';
        dayCompletionData += `<td class="${cellClass}"><span>${viewDate.getDate()}</span></td>`;
        dayCompletionData += "</tr></tbody></table>";
        habitInfo.innerHTML = dayCompletionData;

    } else if (view === "week") {
        let weekCompletionData = "<table class='calendar-table'><thead><tr>";
        const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        weekdays.forEach((day) => {
            weekCompletionData += `<th>${day}</th>`;
        });
        weekCompletionData += "</tr></thead><tbody><tr>";

        const weekStart = new Date(viewDate);
        weekStart.setDate(viewDate.getDate() - viewDate.getDay() + 1);

        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(weekStart);
            currentDay.setDate(weekStart.getDate() + i);
            const status = await getCompletionStatus(currentDay, user, habitName);
            
            if (status !== 'future') {
                totalDays++;
                if (status === true) completedDays++;
            }
            
            const cellClass = status === 'future' ? 'future' : status ? 'completed' : 'incomplete';
            weekCompletionData += `<td class="${cellClass}"><span>${currentDay.getDate()}</span></td>`;
        }

        weekCompletionData += "</tr></tbody></table>";
        habitInfo.innerHTML = weekCompletionData;

    } else if (view === "month") {
        let monthCompletionData = "<table class='calendar-table'><thead><tr>";
        const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        weekdays.forEach((day) => {
            monthCompletionData += `<th>${day}</th>`;
        });
        monthCompletionData += "</tr></thead><tbody><tr>";

        const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
        const totalDaysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            monthCompletionData += "<td></td>";
        }

        for (let i = 1; i <= totalDaysInMonth; i++) {
            const currentDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), i);
            const status = await getCompletionStatus(currentDay, user, habitName);
            
            if (status !== 'future') {
                totalDays++;
                if (status === true) completedDays++;
            }
            
            const cellClass = status === 'future' ? 'future' : status ? 'completed' : 'incomplete';
            monthCompletionData += `<td class="${cellClass}"><span>${i}</span></td>`;

            if ((i + firstDayOfMonth) % 7 === 0) {
                monthCompletionData += "</tr><tr>";
            }
        }

        monthCompletionData += "</tr></tbody></table>";
        habitInfo.innerHTML = monthCompletionData;
    }

    // Calculate and display percentage with fraction
    const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    const fractionText = `${completedDays}/${totalDays} days completed`;
    
    habitPercentage.innerHTML = `
        <div>Completion Rate: ${percentage}%</div>
        <div class="fraction-display">${fractionText}</div>
    `;
    habitPercentage.className = 'percentage-text';
    habitPercentage.style.color = percentage >= 70 ? '#198754' : percentage >= 40 ? '#cc8a00' : '#dc3545';

    // Update period navigation
    updatePeriodNavigation(view);
}

// Add function to update period navigation
function updatePeriodNavigation(view) {
    const currentDate = getOffsetDate(currentOffset, view);
    
    if (view === "day") {
        currentPeriodLabel.textContent = formatDate(currentDate);
    } else if (view === "week") {
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(currentDate.getDate() + 6);
        currentPeriodLabel.textContent = `${formatDate(currentDate)} - ${formatDate(weekEnd)}`;
    } else {
        currentPeriodLabel.textContent = currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    }

    nextPeriodBtn.disabled = currentOffset >= 0;
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
                    currentOffset = 0;
                    nextPeriodBtn.disabled = true;
                    const selectedHabit = habitDropdown.value;
                    const view = button.value;
                    if (selectedHabit) {
                        await fetchHabitCompletion(auth.currentUser, selectedHabit, view);
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

// Add navigation event listeners
const handlePeriodNavigation = (direction) => {
    currentOffset += direction;
    const view = document.querySelector('input[name="view"]:checked').value;
    fetchHabitCompletion(auth.currentUser, habitDropdown.value, view);
    nextPeriodBtn.disabled = currentOffset >= 0;
};

prevPeriodBtn.addEventListener('click', () => handlePeriodNavigation(-1));
nextPeriodBtn.addEventListener('click', () => handlePeriodNavigation(1));

// Reset offset when changing views
radioButtons.forEach((button) => {
    button.addEventListener("change", () => {
        currentOffset = 0;
        nextPeriodBtn.disabled = true;
        // ... rest of existing radio button handler ...
    });
});
