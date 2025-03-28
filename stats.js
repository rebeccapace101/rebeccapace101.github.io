import { app } from './init.mjs';
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// Fix chart variable initialization
let trendsChart = null;
const chartColors = {
    primary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
    background: 'rgba(126, 130, 100, 0.1)'
};

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
    todayButton: document.getElementById("todayButton"),
    trendsGraph: document.getElementById('trendsGraph')
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
    try {
        if (isFutureDate(date)) return 'future';
        
        const dateStr = formatDate(date);
        const habitDocRef = doc(db, "habitData", user.uid, habitName, dateStr);
        const habitDocSnap = await getDoc(habitDocRef);
        // Fix completed property reference
        return habitDocSnap.exists() && (habitDocSnap.data()?.completed === true || habitDocSnap.data()?.data === true);
    } catch (error) {
        console.error('Error checking completion status:', error);
        return false;
    }
}

// Add cache for completion status
const completionCache = new Map();

// Add cache helper functions
function getCacheKey(user, habitName, date) {
    return `${user.uid}_${habitName}_${formatDate(date)}`;
}

function clearCache() {
    completionCache.clear();
}

// Optimize completion status checks with batching
async function getCompletionStatuses(user, habitName, dates) {
    const results = new Map();
    const uncachedDates = [];
    
    // Check cache first
    dates.forEach(date => {
        const cacheKey = getCacheKey(user, habitName, date);
        if (completionCache.has(cacheKey)) {
            results.set(formatDate(date), completionCache.get(cacheKey));
        } else if (!isFutureDate(date)) {
            uncachedDates.push(date);
        } else {
            results.set(formatDate(date), 'future');
        }
    });

    // Batch fetch uncached dates
    if (uncachedDates.length > 0) {
        const promises = uncachedDates.map(async date => {
            const dateStr = formatDate(date);
            const habitDocRef = doc(db, "habitData", user.uid, habitName, dateStr);
            return getDoc(habitDocRef).then(snap => {
                const status = snap.exists() && (snap.data()?.completed === true || snap.data()?.data === true);
                const cacheKey = getCacheKey(user, habitName, date);
                completionCache.set(cacheKey, status);
                results.set(dateStr, status);
            });
        });

        await Promise.all(promises);
    }

    return results;
}

// Fetch habit completion data for a specific habit and display it based on the selected view
async function fetchHabitCompletion(user, habitName, view) {
    if (!habitName) return;
    
    const viewDate = getOffsetDate(currentOffset, view);
    elements.habitInfo.innerHTML = "Loading habit data...";
    let completedDays = 0;
    let totalDays = 0;

    // Collect all dates needed for the view
    const datesToFetch = [];
    if (view === "day") {
        datesToFetch.push(viewDate);
    } else if (view === "week") {
        const weekStart = new Date(viewDate);
        weekStart.setDate(viewDate.getDate() - viewDate.getDay() + 1);
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(weekStart);
            currentDay.setDate(weekStart.getDate() + i);
            datesToFetch.push(currentDay);
        }
    } else if (view === "month") {
        const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        const lastDay = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
            datesToFetch.push(new Date(d));
        }
    }

    // Batch fetch all completion statuses
    const completionStatuses = await getCompletionStatuses(user, habitName, datesToFetch);

    const renderCell = (date, status, isToday = false) => {
        const cellClass = status === 'future' ? 'future' : 
                         status ? 'completed' : 'incomplete';
        return `<td class="${isToday ? 'today' : ''} ${cellClass}">
            <span>${date.getDate()}</span>
        </td>`;
    };

    if (view === "day") {
        let dayCompletionData = "<table class='calendar-table'><thead><tr><th>Selected Date</th></tr></thead><tbody><tr>";
        const status = completionStatuses.get(formatDate(viewDate));
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
            const status = completionStatuses.get(formatDate(currentDay));
            
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
            const status = completionStatuses.get(formatDate(currentDay));
            
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

    if (habitName) {
        await updateTrendsGraph(user, habitName, viewDate);
    }
    
    // Update period navigation
    updatePeriodNavigation(view, viewDate);

    // Clear cache when changing habits
    elements.habitDropdown.addEventListener("change", clearCache);
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

async function updateTrendsGraph(user, habitName, viewDate) {
    try {
        if (!elements.trendsGraph) return;
        const ctx = elements.trendsGraph.getContext('2d');
        if (!ctx) return;

        const view = document.querySelector('input[name="view"]:checked').value;
        const dates = [];
        const completionData = [];
        
        const endDate = new Date(viewDate);
        const startDate = new Date(endDate);
        
        if (view === "week") {
            // Show last 4 weeks
            startDate.setDate(startDate.getDate() - (4 * 7));
            
            // Get weekly stats
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                let weeklyCompleted = 0;
                let weeklyTotal = 0;
                
                // Check each day of the week
                for (let i = 0; i < 7; i++) {
                    if (!isFutureDate(currentDate)) {
                        weeklyTotal++;
                        const status = await getCompletionStatus(currentDate, user, habitName);
                        if (status === true) weeklyCompleted++;
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                
                if (weeklyTotal > 0) {
                    const weekStart = new Date(currentDate);
                    weekStart.setDate(currentDate.getDate() - 7);
                    dates.push(`${formatDate(weekStart)} - ${formatDate(currentDate)}`);
                    completionData.push(weeklyCompleted);
                }
            }
        } else if (view === "month") {
            // Show last 6 months
            startDate.setMonth(startDate.getMonth() - 5);
            
            // Get monthly stats
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                let monthlyCompleted = 0;
                let monthlyTotal = 0;
                
                const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                
                // Check each day of the month
                for (let i = 1; i <= daysInMonth; i++) {
                    currentDate.setDate(i);
                    if (!isFutureDate(currentDate)) {
                        monthlyTotal++;
                        const status = await getCompletionStatus(currentDate, user, habitName);
                        if (status === true) monthlyCompleted++;
                    }
                }
                
                if (monthlyTotal > 0) {
                    dates.push(currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' }));
                    completionData.push(monthlyCompleted);
                }
                
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        }

        if (trendsChart) trendsChart.destroy();

        trendsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Completions',
                    data: completionData,
                    backgroundColor: chartColors.primary,
                    borderColor: chartColors.primary,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Days Completed'
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error updating trends graph:', error);
    }
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
                    if (trendsChart) trendsChart.destroy();
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
