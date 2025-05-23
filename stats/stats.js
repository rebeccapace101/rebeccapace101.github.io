/**
 * Main Stats Controller
 * Orchestrates the interaction between components and services
 */

import Calendar from './components/Calendar.js';
import TrendsGraph from './components/TrendsGraph.js';
import * as habitService from './services/habitService.js';
import * as completionService from './services/completionService.js';
import { getAuth } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getOffsetDate, formatDate, getWeekNumber } from './utils/dateUtils.js';

/**
 * Determines if a habit is completed based on its status.
 * @param {*} status - The completion status from the database.
 * @returns {boolean} - Whether the habit is completed.
 */
function isHabitCompleted(status) {
    if (!status) return false;

    return (
        // Object with completed flag or positive value
        (typeof status === "object" && (status.completed || status.value > 0)) ||
        // Direct boolean true
        status === true ||
        // String but not a number (text counts as completed)
        (typeof status === "string" && isNaN(Number(status))) ||
        // Object with string value that's not "false"
        (typeof status === "object" &&
         typeof status.value === "string" &&
         status.value !== "false")
    );
}

const calendar = new Calendar('habit-calendar');
const trendsGraph = new TrendsGraph('trendsGraph');
const auth = getAuth();
let currentOffset = 0;

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

// Append the habit percentage element to the stats container
elements.habitStats.appendChild(elements.habitPercentage);

/**
 * Updates the habit dropdown with the list of habits.
 * @param {Array<string>} habits - List of habit names.
 * @returns {string|null} - The previously selected habit, if available.
 */
function updateHabitDropdown(habits) {
    console.log("Updating habit dropdown with habits:", habits); // Debug log
    elements.habitDropdown.innerHTML = "<option value=''>Select a Habit</option>";
    if (!habits || habits.length === 0) {
        elements.habitDropdown.innerHTML = "<option value=''>No habits found</option>";
        return null;
    }

    habits.forEach(habit => {
        const option = document.createElement('option');
        option.value = habit;
        option.textContent = habit;
        elements.habitDropdown.appendChild(option);
    });

    const savedHabit = localStorage.getItem('selectedHabit');
    if (savedHabit && habits.includes(savedHabit)) {
        elements.habitDropdown.value = savedHabit;
        return savedHabit;
    }
    return null;
}

/**
 * Sets up event listeners for user interactions.
 * @param {Object} user - The authenticated user object.
 */
function setupEventListeners(user) {
    if (!elements.habitDropdown || !elements.prevPeriodBtn || !elements.nextPeriodBtn || !elements.todayButton) {
        console.error('Required elements not found in the DOM');
        return;
    }

    elements.habitDropdown.addEventListener('change', async () => {
        const selectedHabit = elements.habitDropdown.value;
        if (selectedHabit) {
            localStorage.setItem('selectedHabit', selectedHabit);
            await loadHabitData(user, selectedHabit);

            // Log the oldest completion date for the selected habit
            const oldestCompletionDate = await getOldestCompletionDate(user, selectedHabit);
            if (oldestCompletionDate) {
                console.log(`Oldest completion date for habit "${selectedHabit}": ${oldestCompletionDate}`);
            } else {
                console.log(`No completion data found for habit "${selectedHabit}".`);
            }

            // Load achievements for the selected habit
            await loadAchievements(user, selectedHabit);
        } else {
            localStorage.removeItem('selectedHabit');
            resetView();
        }
    });

    document.querySelectorAll('input[name="view"]').forEach(radio => {
        radio.addEventListener('change', async () => {
            currentOffset = 0;
            elements.nextPeriodBtn.disabled = true;
            const selectedHabit = elements.habitDropdown.value;
            if (selectedHabit) {
                await loadHabitData(user, selectedHabit);
            }
        });
    });

    elements.prevPeriodBtn.addEventListener('click', () => handlePeriodNavigation(-1, user));
    elements.nextPeriodBtn.addEventListener('click', () => handlePeriodNavigation(1, user));
    elements.todayButton.addEventListener('click', () => {
        currentOffset = 0;
        loadHabitData(user, elements.habitDropdown.value);
    });
}

/**
 * Fetches the oldest completion date for a specific habit using concurrent chunked processing.
 * Ensures each date is only searched once and checks if there are 7 or more completed days.
 * @param {Object} user - The authenticated user object.
 * @param {string} habitName - The name of the habit.
 * @returns {Promise<{oldestDate: string|null, completedDays: number}>} - The oldest completion date and total completed days.
 */
async function getOldestCompletionDate(user, habitName) {
    try {
        const today = new Date();
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - 90); // Check the last 90 days

        const dates = [];
        for (let d = new Date(pastDate); d <= today; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
        }

        const chunkSize = 30; // Process 30 days at a time
        const chunks = [];
        for (let i = 0; i < dates.length; i += chunkSize) {
            chunks.push(dates.slice(i, i + chunkSize));
        }

        const processedDates = new Set(); // Track processed dates
        const completedDates = [];

        // Process all chunks concurrently
        const chunkPromises = chunks.map(async (chunk) => {
            const filteredChunk = chunk.filter(
                (date) => !processedDates.has(date.toISOString())
            ); // Exclude already processed dates

            if (filteredChunk.length === 0) return []; // Skip empty chunks

            const completionData = await completionService.getCompletionStatuses(
                user,
                habitName,
                filteredChunk
            );

            // Mark dates as processed
            filteredChunk.forEach((date) => processedDates.add(date.toISOString()));

            // Filter completed dates in this chunk
            return Array.from(completionData.entries())
                .filter(([dateStr, status]) => isHabitCompleted(status))
                .map(([dateStr]) => new Date(dateStr));
        });

        const results = await Promise.all(chunkPromises);

        // Flatten the results and find the oldest date
        results.forEach((chunkResults) => completedDates.push(...chunkResults));
        if (completedDates.length > 0) {
            completedDates.sort((a, b) => a - b); // Sort by oldest date
            const oldestDate = formatDate(completedDates[0]);

            // Log if there are 7 or more completed days
            if (completedDates.length >= 7) {
                console.log(`Achievement unlocked: A Week's Worth! Total completed days: ${completedDates.length}`);
            }

            return { oldestDate, completedDays: completedDates.length };
        }

        return { oldestDate: null, completedDays: 0 };
    } catch (error) {
        console.error(`Error fetching oldest completion date for habit "${habitName}":`, error);
        return { oldestDate: null, completedDays: 0 };
    }
}

// Ensure isHabitCompleted is exported for use in the worker
export { isHabitCompleted };

/**
 * Loads habit data and updates the UI components.
 * @param {Object} user - The authenticated user object.
 * @param {string} habitName - The name of the selected habit.
 */
async function loadHabitData(user, habitName) {
    if (!habitName) {
        console.error('No habit selected');
        elements.habitInfo.innerHTML = "Please select a habit.";
        return;
    }

    console.log("Loading data for habit:", habitName); // Debug log
    elements.habitInfo.innerHTML = "Loading habit data...";
    try {
        const view = document.querySelector('input[name="view"]:checked')?.value || 'week';
        const viewDate = getOffsetDate(currentOffset, view);
        const dates = habitService.getDatesForView(viewDate, view);

        // --- NEW: Fetch tracked habits mapping for all weekdays ---
        const daysOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        const trackedHabitsMapping = {};
        for (const day of daysOfWeek) {
            const dayDoc = await habitService.getHabitsForDay(user.uid, day);
            trackedHabitsMapping[day] = Array.isArray(dayDoc) ? dayDoc : [];
        }
        // ---------------------------------------------------------

        const [completionData, graphData] = await Promise.all([
            completionService.getCompletionStatuses(user, habitName, dates),
            (async () => {
                const completionData = await completionService.getCompletionStatuses(user, habitName, dates);
                return formatGraphData(dates, completionData);
            })()
        ]);

        console.log("Completion data received:", completionData); // Debug log

        calendar.initialize(view);
        calendar.updateData(
            completionData,
            viewDate,
            view,
            habitName,
            trackedHabitsMapping // Pass mapping here
        );

        const stats = completionService.calculateCompletionStats(completionData, dates);
        updatePeriodNavigation(view, viewDate);
        updateStats(stats, dates, completionData, habitName, trackedHabitsMapping);

        await trendsGraph.render(graphData.labels, graphData.data, view);

        elements.habitInfo.innerHTML = "";
    } catch (error) {
        console.error('Error loading habit data:', error);
        elements.habitInfo.innerHTML = "Error loading habit data. Please try again.";
    }
}

/**
 * Resets the view to its default state.
 */
function resetView() {
    elements.habitInfo.innerHTML = "Select a habit to view details.";
    elements.habitPercentage.innerHTML = "";
    calendar.initialize(document.querySelector('input[name="view"]:checked').value);
    trendsGraph.destroy();
}

/**
 * Handles navigation between periods (e.g., previous/next week).
 * @param {number} direction - The direction to navigate (-1 for previous, 1 for next).
 * @param {Object} user - The authenticated user object.
 */
function handlePeriodNavigation(direction, user) {
    currentOffset += direction;
    loadHabitData(user, elements.habitDropdown.value);
    elements.nextPeriodBtn.disabled = currentOffset >= 0;
}

/**
 * Updates the stats display with calculated statistics.
 * @param {Object} stats - The calculated statistics.
 * @param {Array<Date>} dates - The list of dates in the current view.
 * @param {Map<string, Object>} completionData - The completion data for the dates.
 * @param {string} habitName - The selected habit.
 * @param {Object} trackedHabitsMapping - Mapping of day name to array of tracked habits.
 */
function updateStats(stats, dates, completionData, habitName, trackedHabitsMapping) {
    // Only count days where the habit is tracked and not in the future
    const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    let trackedTotal = 0;
    let trackedCompleted = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Special handling for day view: only one date
    if (dates.length === 1) {
        const date = dates[0];
        const dayName = weekdays[date.getDay()];
        const trackedArr = trackedHabitsMapping && trackedHabitsMapping[dayName];
        const isTracked = Array.isArray(trackedArr) && trackedArr.includes(habitName);

        if (isTracked) {
            trackedTotal = 1; // Always set to 1 for tracked habits
            const dateStr = formatDate(date);
            const status = completionData.get(dateStr);

            trackedCompleted = (status && (
                (typeof status === "object" && (status.completed || status.value > 0)) ||
                status === true ||
                (typeof status === "string" && isNaN(Number(status)))
            )) ? 1 : 0;
        } else {
            trackedTotal = 0;
            trackedCompleted = 0;
        }
    } else {
        // Week/Month view handling
        // ...existing code for week/month views...
        dates.forEach(date => {
            // Skip future days
            if (date > today) return;
            const dayName = weekdays[date.getDay()];
            const trackedArr = trackedHabitsMapping && trackedHabitsMapping[dayName];
            const isTracked = Array.isArray(trackedArr) && trackedArr.includes(habitName);
            if (isTracked) {
                trackedTotal++;
                const dateStr = formatDate(date);
                const status = completionData.get(dateStr);
                if (
                    (typeof status === "object" && (status.completed || status.value > 0)) ||
                    status === true ||
                    (typeof status === "string" && isNaN(Number(status)))
                ) {
                    trackedCompleted++;
                }
            }
        });
    }

    console.log(`Stats calculation result: ${trackedCompleted}/${trackedTotal}`);
    const percentage = trackedTotal === 0 ? 0 : Math.round((trackedCompleted / trackedTotal) * 100);

    elements.habitPercentage.innerHTML = `
        <div>Completion Rate: ${percentage}%</div>
        <div class="fraction-display">${trackedCompleted}/${trackedTotal} days completed</div>
    `;
    elements.habitPercentage.style.color =
        percentage >= 70 ? '#198754' :
        percentage >= 40 ? '#cc8a00' : '#dc3545';
}

/**
 * Updates the period navigation label based on the current view and date.
 * @param {string} view - The current view (e.g., day, week, month).
 * @param {Date} currentDate - The current date for the view.
 */
function updatePeriodNavigation(view, currentDate) {
    if (!elements.currentPeriodLabel) return;

    if (view === "day") {
        elements.currentPeriodLabel.textContent = formatDate(currentDate);
    } else if (view === "week") {
        const weekStart = getOffsetDate(currentOffset, 'week');
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const weekNumber = getWeekNumber(weekStart);
        elements.currentPeriodLabel.textContent = `Week ${weekNumber}: ${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    } else {
        elements.currentPeriodLabel.textContent = currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    }

    elements.nextPeriodBtn.disabled = currentOffset >= 0;
}

/**
 * Formats data for the graph component.
 * @param {Array<Date>} dates - The list of dates.
 * @param {Map<string, Object>} completionData - The completion data for the dates.
 * @returns {Object} - The formatted graph data.
 */
function formatGraphData(dates, completionData) {
    const labels = [];
    const data = [];

    dates.forEach(date => {
        const dateStr = formatDate(date);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        const status = completionData.get(dateStr);

        if (typeof status === 'object' && status.value > 0) {
            data.push(status.value); // Use the actual value if it exists
        } else if (status === true || (typeof status === 'string' && isNaN(Number(status)))) {
            data.push(1); // Treat true or non-numeric strings as completed
        } else if (typeof status === 'object' && typeof status.value === 'string' && status.value !== 'false') {
            data.push(1); // Treat any string other than "false" as completed
        } else {
            data.push(0); // Default to 0 for other cases
        }
    });

    return { labels, data };
}

/**
 * Fetches and displays achievements for the user.
 * @param {Object} user - The authenticated user object.
 * @param {string} habitName - The name of the selected habit.
 */
async function loadAchievements(user, habitName) {
    const achievementsContainer = document.getElementById("achievements");
    achievementsContainer.innerHTML = "<p>Loading achievements...</p>";

    try {
        // Fetch the oldest completion date and total completed days
        const { oldestDate, completedDays } = await getOldestCompletionDate(user, habitName);

        // Build the achievements list
        const achievements = [
            {
                key: "firstCompletion",
                title: "First Completion",
                description: oldestDate
                    ? `Completed on ${oldestDate}`
                    : "Not Achieved Yet!",
                isCompleted: !!oldestDate,
                icon: "🏆", // Trophy icon for first completion
            },
            {
                key: "aWeeksWorth",
                title: "A Week's Worth",
                description: completedDays >= 7
                    ? `Completed ${completedDays} days!`
                    : `Only ${completedDays} days completed so far.`,
                isCompleted: completedDays >= 7,
                icon: "📅", // Calendar icon for a week's worth
            },
            {
                key: "aMonthsWorth",
                title: "A Month's Worth",
                description: completedDays >= 30
                    ? `Completed ${completedDays} days!`
                    : `Only ${completedDays} days completed so far.`,
                isCompleted: completedDays >= 30,
                icon: "📆", // Calendar icon for a month's worth
            },
        ];

        // Generate HTML for achievements
        achievementsContainer.innerHTML = achievements
            .map(
                (achievement) => `
                <div class="achievement ${
                    achievement.isCompleted ? "completed" : "incomplete"
                }">
                    <span class="icon">${achievement.icon}</span>
                    <h3>${achievement.title}</h3>
                    <p>${achievement.description}</p>
                </div>
            `
            )
            .join("");
    } catch (error) {
        console.error("Error loading achievements:", error);
        achievementsContainer.innerHTML =
            "<p>Error loading achievements. Please try again later.</p>";
    }
}

// Initialize the application on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing stats page..."); // Debug log
    resetView();
    auth.onAuthStateChanged(async user => {
        if (user) {
            try {
                const habits = await habitService.fetchHabits(user.uid);
                console.log("Fetched habits:", habits); // Debug log
                if (habits && habits.length > 0) {
                    const selectedHabit = updateHabitDropdown(habits);
                    setupEventListeners(user);
                    if (selectedHabit) {
                        await loadHabitData(user, selectedHabit);
                        // Load achievements for the initially selected habit
                        await loadAchievements(user, selectedHabit);
                    } else {
                        // If no habit is selected, clear achievements
                        document.getElementById("achievements").innerHTML = "<p>Select a habit to view achievements.</p>";
                    }
                } else {
                    displayNoHabitsMessage();
                }
            } catch (error) {
                console.error("Error during initialization:", error);
                displayErrorMessage();
            }
        } else {
            displayLoginMessage();
        }
    });
});

function displayNoHabitsMessage() {
    elements.habitDropdown.innerHTML = "<option value=''>No habits found</option>";
    elements.habitInfo.innerHTML = "Please create some habits first.";
}

function displayErrorMessage() {
    elements.habitDropdown.innerHTML = "<option value=''>Error loading habits</option>";
    elements.habitInfo.innerHTML = "Error loading data. Please refresh.";
}

function displayLoginMessage() {
    elements.habitDropdown.innerHTML = "<option value=''>Please log in</option>";
}
