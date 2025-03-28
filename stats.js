import { app } from './init.mjs';
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const db = getFirestore(app);
const auth = getAuth();

// Common DOM elements
const elements = {
    habitDropdown: document.getElementById("habitDropdown"),
    habitStats: document.getElementById("habit-stats"),
    habitInfo: document.getElementById("habit-info"),
    habitPercentage: document.createElement("p"),
    prevPeriodBtn: document.getElementById("prevPeriod"),
    nextPeriodBtn: document.getElementById("nextPeriod"),
    currentPeriodLabel: document.getElementById("currentPeriodLabel"),
    todayButton: document.getElementById("todayButton")
};

elements.habitStats.appendChild(elements.habitPercentage);

const dayView = document.getElementById("dayView");
const weekView = document.getElementById("weekView");
const monthView = document.getElementById("monthView");

const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

let currentOffset = 0;

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
    const offsets = {
        'day': () => date.setDate(date.getDate() + offset),
        'week': () => date.setDate(date.getDate() + (offset * 7)),
        'month': () => date.setMonth(date.getMonth() + offset)
    };
    offsets[view]?.();
    return date;
}

// Fetch habits for the user
async function fetchHabits(user) {
    elements.habitDropdown.innerHTML = "<option value=''>Loading...</option>";
    try {
        const userDocRef = doc(db, "habitData", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().namesOfHabits) {
            const habitNames = userDocSnap.data().namesOfHabits;
            elements.habitDropdown.innerHTML = "<option value=''>Select a Habit</option>";
            habitNames.forEach((habitName) => {
                const option = document.createElement("option");
                option.value = habitName;
                option.textContent = habitName;
                elements.habitDropdown.appendChild(option);
            });
        } else {
            elements.habitDropdown.innerHTML = "<option value=''>No habits found</option>";
        }
    } catch (error) {
        console.error("Error fetching habits:", error);
        elements.habitDropdown.innerHTML = "<option value=''>Error loading habits</option>";
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
    elements.habitInfo.innerHTML = "Loading habit data...";
    let completedDays = 0;
    let totalDays = 0;

    const renderCell = (date, status, isToday = false) => {
        const cellClass = status === 'future' ? 'future' : 
                         status ? 'completed' : 'incomplete';
        return `<td class="${isToday ? 'today' : ''} ${cellClass}">
            <span>${date.getDate()}</span>
        </td>`;
    };

    if (view === "day") {
        let dayCompletionData = "<table class='calendar-table'><thead><tr><th>Selected Date</th></tr></thead><tbody><tr>";
        const status = await getCompletionStatus(viewDate, user, habitName);
        if (status !== 'future') {
            totalDays = 1;
            if (status === true) completedDays = 1;
        }
        
        dayCompletionData += renderCell(viewDate, status);
        dayCompletionData += "</tr></tbody></table>";
        elements.habitInfo.innerHTML = dayCompletionData;

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
            
            weekCompletionData += renderCell(currentDay, status);
        }

        weekCompletionData += "</tr></tbody></table>";
        elements.habitInfo.innerHTML = weekCompletionData;

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
            
            monthCompletionData += renderCell(currentDay, status);

            if ((i + firstDayOfMonth) % 7 === 0) {
                monthCompletionData += "</tr><tr>";
            }
        }

        monthCompletionData += "</tr></tbody></table>";
        elements.habitInfo.innerHTML = monthCompletionData;
    }

    // Calculate and display percentage with fraction
    const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    const fractionText = `${completedDays}/${totalDays} days completed`;
    
    elements.habitPercentage.innerHTML = `
        <div>Completion Rate: ${percentage}%</div>
        <div class="fraction-display">${fractionText}</div>
    `;
    elements.habitPercentage.className = 'percentage-text';
    elements.habitPercentage.style.color = percentage >= 70 ? '#198754' : percentage >= 40 ? '#cc8a00' : '#dc3545';

    // Update period navigation
    updatePeriodNavigation(view, viewDate);
}

// Add function to update period navigation
function updatePeriodNavigation(view, currentDate) {
    if (view === "day") {
        elements.currentPeriodLabel.textContent = formatDate(currentDate);
    } else if (view === "week") {
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(currentDate.getDate() + 6);
        elements.currentPeriodLabel.textContent = `${formatDate(currentDate)} - ${formatDate(weekEnd)}`;
    } else {
        elements.currentPeriodLabel.textContent = currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    }

    elements.nextPeriodBtn.disabled = currentOffset >= 0;
}

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await fetchHabits(user);

            elements.habitDropdown.addEventListener("change", async () => {
                const selectedHabit = elements.habitDropdown.value;
                const view = document.querySelector('input[name="view"]:checked').value; // Get the selected view
                if (selectedHabit) {
                    await fetchHabitCompletion(user, selectedHabit, view);
                } else {
                    elements.habitInfo.innerHTML = "Select a habit to view details.";
                }
            });

            // Add event listeners for radio buttons to update the view
            const radioButtons = document.querySelectorAll('input[name="view"]');
            radioButtons.forEach((button) => {
                button.addEventListener("change", async () => {
                    currentOffset = 0;
                    elements.nextPeriodBtn.disabled = true;
                    const selectedHabit = elements.habitDropdown.value;
                    const view = button.value;
                    if (selectedHabit) {
                        await fetchHabitCompletion(auth.currentUser, selectedHabit, view);
                    }
                });
            });

            // Initialize with a default view (Day View)
            document.querySelector('input[name="view"][value="day"]').checked = true;
            await fetchHabitCompletion(user, elements.habitDropdown.value, "day");
        } else {
            console.log("User is signed out");
            elements.habitDropdown.innerHTML = "<option value=''>Please log in to see your habits.</option>";
            elements.habitInfo.innerHTML = "";
        }
    });
});

// Add navigation event listeners
const handlePeriodNavigation = (direction) => {
    currentOffset += direction;
    const view = document.querySelector('input[name="view"]:checked').value;
    fetchHabitCompletion(auth.currentUser, elements.habitDropdown.value, view);
    elements.nextPeriodBtn.disabled = currentOffset >= 0;
};

elements.prevPeriodBtn.addEventListener('click', () => handlePeriodNavigation(-1));
elements.nextPeriodBtn.addEventListener('click', () => handlePeriodNavigation(1));

// Add Today button functionality
elements.todayButton.addEventListener('click', () => {
    currentOffset = 0;
    const view = document.querySelector('input[name="view"]:checked').value;
    fetchHabitCompletion(auth.currentUser, elements.habitDropdown.value, view);
    elements.nextPeriodBtn.disabled = true;
});

// Reset offset when changing views
const radioButtons = document.querySelectorAll('input[name="view"]');
radioButtons.forEach((button) => {
    button.addEventListener("change", () => {
        currentOffset = 0;
        elements.nextPeriodBtn.disabled = true;
        // ... rest of existing radio button handler ...
    });
});
