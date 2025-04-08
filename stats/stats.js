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
 * Loads habit data and updates the UI components.
 * @param {Object} user - The authenticated user object.
 * @param {string} habitName - The name of the selected habit.
 */
async function loadHabitData(user, habitName) {
    if (!habitName) {
        console.error('No habit selected');
        return;
    }

    elements.habitInfo.innerHTML = "Loading habit data...";
    try {
        const view = document.querySelector('input[name="view"]:checked').value;
        const viewDate = getOffsetDate(currentOffset, view);

        const dates = habitService.getDatesForView(viewDate, view);
        const completionData = await completionService.getCompletionStatuses(user, habitName, dates);

        calendar.initialize(view);
        calendar.updateData(completionData, viewDate, view);

        const stats = completionService.calculateCompletionStats(completionData, dates);
        updatePeriodNavigation(view, viewDate);
        updateStats(stats);

        const graphData = formatGraphData(dates, completionData);
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
 */
function updateStats(stats) {
    elements.habitPercentage.innerHTML = `
        <div>Completion Rate: ${stats.percentage}%</div>
        <div class="fraction-display">${stats.completed}/${stats.total} days completed</div>
    `;
    elements.habitPercentage.style.color =
        stats.percentage >= 70 ? '#198754' :
        stats.percentage >= 40 ? '#cc8a00' : '#dc3545';
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
 * @param {Map<string, boolean>} completionData - The completion data for the dates.
 * @returns {Object} - The formatted graph data.
 */
function formatGraphData(dates, completionData) {
    const labels = [];
    const data = [];

    dates.forEach(date => {
        const dateStr = formatDate(date);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        data.push(completionData.get(dateStr) === true ? 1 : 0);
    });

    return { labels, data };
}

// Initialize the application on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    resetView();
    auth.onAuthStateChanged(async user => {
        if (user) {
            try {
                elements.habitDropdown.innerHTML = "<option value=''>Loading habits...</option>";
                const habits = await habitService.fetchHabits(user.uid);

                if (habits && habits.length > 0) {
                    const selectedHabit = updateHabitDropdown(habits);
                    if (selectedHabit) {
                        setupEventListeners(user);
                        await loadHabitData(user, selectedHabit);
                    }
                } else {
                    elements.habitDropdown.innerHTML = "<option value=''>No habits found</option>";
                    elements.habitInfo.innerHTML = "Please create some habits first.";
                }
            } catch (error) {
                console.error("Error during initialization:", error);
                elements.habitDropdown.innerHTML = "<option value=''>Error loading habits</option>";
                elements.habitInfo.innerHTML = "Error loading data. Please refresh.";
            }
        } else {
            elements.habitDropdown.innerHTML = "<option value=''>Please log in</option>";
            elements.habitInfo.innerHTML = "Please log in to view habits.";
        }
    });
});
