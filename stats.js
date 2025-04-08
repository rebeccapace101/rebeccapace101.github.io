import { app } from './init.mjs';
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getChicagoDate, formatDate, isFutureDate, getOffsetDate, getWeekNumber, getChicagoDateTime } from './utils/dateUtils.js';

let trendsChart = null;
const chartColors = {
    primary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
    background: 'rgba(126, 130, 100, 0.1)'
};

const db = getFirestore(app);
const auth = getAuth();

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

let currentOffset = 0;

// Cache for completion statuses
const completionCache = new Map();
const getCacheKey = (user, habitName, date) => `${user.uid}_${habitName}_${formatDate(date)}`;
const clearCache = () => completionCache.clear();

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

            // If there was a previously selected habit, restore it
            const savedHabit = localStorage.getItem('selectedHabit');
            if (savedHabit && habitNames.includes(savedHabit)) {
                elements.habitDropdown.value = savedHabit;
                const view = document.querySelector('input[name="view"]:checked').value;
                await fetchHabitCompletion(user, savedHabit, view);
            }
        } else {
            elements.habitDropdown.innerHTML = "<option value=''>No habits found</option>";
        }
    } catch (error) {
        console.error("Error fetching habits:", error);
        elements.habitInfo.innerHTML = "Error loading habits. Please try again.";
    }
}

// Optimize data fetching by batching requests
async function getCompletionStatuses(user, habitName, dates) {
    const results = new Map();
    const currentDate = getChicagoDateTime();
    currentDate.setHours(0, 0, 0, 0);

    for (const date of dates) {
        const dateStr = formatDate(date);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        if (checkDate > currentDate) {
            results.set(dateStr, 'future');
            continue;
        }

        try {
            const habitDocRef = doc(db, "habitData", user.uid, habitName, dateStr);
            const habitDocSnap = await getDoc(habitDocRef);
            const data = habitDocSnap.data();

            const isCompleted = habitDocSnap.exists() && (
                data?.completed === true ||
                data?.data === true ||
                data?.data === 1 ||
                data?.value === true ||
                data?.value === 1
            );

            results.set(dateStr, isCompleted);
        } catch (error) {
            console.error(`Error fetching data for ${dateStr}:`, error);
            results.set(dateStr, false);
        }
    }

    return results;
}

let calendar = null;

function initializeCalendar() {
    const calendarEl = document.getElementById('habit-calendar');
    if (!calendarEl) return;

    calendarEl.innerHTML = '';
    const calendarTable = document.createElement('table');
    calendarTable.className = 'custom-calendar-table';

    const view = document.querySelector('input[name="view"]:checked').value;
    if (view !== 'day') {
        const headerRow = document.createElement('tr');
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        daysOfWeek.forEach(day => {
            const th = document.createElement('th');
            th.textContent = day;
            headerRow.appendChild(th);
        });
        calendarTable.appendChild(headerRow);
    }

    calendarEl.appendChild(calendarTable);
    return calendarTable;
}

function updateCalendarData(completionData, viewDate) {
    const calendarEl = document.getElementById('habit-calendar');
    if (!calendarEl) return;

    const calendarTable = calendarEl.querySelector('.custom-calendar-table');
    if (!calendarTable) return;

    const view = document.querySelector('input[name="view"]:checked').value;

    // Clear existing rows but keep header for week/month views
    while (calendarTable.rows.length > (view === 'day' ? 0 : 1)) {
        calendarTable.deleteRow(view === 'day' ? 0 : 1);
    }

    const currentDate = getChicagoDateTime();
    currentDate.setHours(0, 0, 0, 0);

    if (view === 'day') {
        const row = calendarTable.insertRow();
        const cell = row.insertCell();
        const dateStr = formatDate(viewDate);
        const isFuture = isFutureDate(viewDate);
        const status = completionData.get(dateStr);

        console.log(`Day View - Date: ${dateStr}, Status:`, status); // Debug log

        cell.innerHTML = `
            <div class="day-view-cell">
                <div class="day-date">${viewDate.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                <div class="day-number">${viewDate.getDate()}</div>
                <div class="day-month">${viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                ${!isFuture ? `<div class="day-status">${status ? '✓ Completed' : '✗ Not Completed'}</div>` :
                            '<div class="day-status future">Future Date</div>'}
            </div>
        `;
        cell.classList.add('custom-calendar-date');
        cell.classList.add(isFuture ? 'custom-calendar-date--disabled' :
                         status ? 'custom-calendar-date--selected' :
                         'custom-calendar-date--failed');
    } else {
        const dates = getDatesForView(viewDate, view);
        let currentRow = calendarTable.insertRow();
        let dayCount = 0;

        if (view === 'month') {
            const firstDayOfMonth = dates[0].getDay();
            for (let i = 0; i < firstDayOfMonth; i++) {
                currentRow.insertCell().textContent = '';
                dayCount++;
            }
        }

        dates.forEach(date => {
            const dateStr = formatDate(date);
            const isFuture = isFutureDate(date);
            const status = completionData.get(dateStr);
            const isToday = formatDate(date) === formatDate(currentDate);

            console.log(`${view} View - Date: ${dateStr}, Status:`, status); // Debug log

            const td = currentRow.insertCell();
            td.textContent = date.getDate();
            td.classList.add('custom-calendar-date');

            if (isToday) td.classList.add('today');

            if (isFuture) {
                td.classList.add('custom-calendar-date--disabled');
            } else {
                td.classList.add(status ? 'custom-calendar-date--selected' : 'custom-calendar-date--failed');
            }

            dayCount++;
            if (dayCount === 7) {
                currentRow = calendarTable.insertRow();
                dayCount = 0;
            }
        });
    }
}

async function fetchHabitCompletion(user, habitName, view) {
    if (!habitName) {
        elements.habitInfo.innerHTML = "Select a habit to view details.";
        return;
    }

    elements.habitInfo.innerHTML = "Loading habit data...";

    try {
        const viewDate = getOffsetDate(currentOffset, view);
        viewDate.setHours(0, 0, 0, 0);

        const datesToFetch = getDatesForView(viewDate, view);
        const completionStatuses = await getCompletionStatuses(user, habitName, datesToFetch);

        console.log('Fetched completion statuses:', completionStatuses);

        initializeCalendar(); // Reinitialize calendar before updating
        updateCalendarData(completionStatuses, viewDate);

        // Calculate completion stats
        let completedDays = 0;
        let totalDays = 0;

        datesToFetch.forEach(date => {
            if (!isFutureDate(date)) {
                totalDays++;
                const dateStr = formatDate(date);
                if (completionStatuses.get(dateStr)) {
                    completedDays++;
                }
            }
        });

        const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
        const fractionText = `${completedDays}/${totalDays} days completed`;

        elements.habitPercentage.innerHTML = `
            <div>Completion Rate: ${percentage}%</div>
            <div class="fraction-display">${fractionText}</div>
        `;
        elements.habitPercentage.className = 'percentage-text';
        elements.habitPercentage.style.color = percentage >= 70 ? '#198754' : percentage >= 40 ? '#cc8a00' : '#dc3545';

        elements.habitInfo.innerHTML = ""; // Clear loading message

        if (habitName) {
            await updateTrendsGraph(user, habitName, viewDate);
        }

        updatePeriodNavigation(view, viewDate);
    } catch (error) {
        console.error('Error in fetchHabitCompletion:', error);
        elements.habitInfo.innerHTML = "Error loading habit data. Please try again.";
    }
}

// Helper function to get dates for a view
function getDatesForView(viewDate, view) {
    const dates = [];
    if (view === "day") {
        dates.push(viewDate);
    } else if (view === "week") {
        const weekStart = new Date(viewDate);
        weekStart.setDate(viewDate.getDate() - viewDate.getDay());
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(weekStart);
            currentDay.setDate(weekStart.getDate() + i);
            dates.push(currentDay);
        }
    } else if (view === "month") {
        const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        const lastDay = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d));
        }
    }
    return dates;
}

function updatePeriodNavigation(view, currentDate) {
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

async function updateTrendsGraph(user, habitName, viewDate) {
    try {
        if (!elements.trendsGraph || !window.ApexCharts) return;

        const view = document.querySelector('input[name="view"]:checked').value;
        const dates = [];
        const completionData = [];

        const chicagoNow = getChicagoDateTime();
        chicagoNow.setHours(0, 0, 0, 0);

        if (view === "day") {
            // Show last 7 days up to today
            const startDate = new Date(chicagoNow);
            startDate.setDate(startDate.getDate() - 6);

            const daysToShow = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                if (!isFutureDate(date)) {
                    daysToShow.push(date);
                }
            }

            const statuses = await getCompletionStatuses(user, habitName, daysToShow);
            daysToShow.forEach(date => {
                const dateStr = formatDate(date);
                dates.push(new Date(date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                }));
                completionData.push(statuses.get(dateStr) === true ? 1 : 0);
            });

        } else if (view === "week") {
            // Show last 4 weeks
            const endDate = new Date(chicagoNow);
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - (4 * 7));

            for (let week = 0; week < 4; week++) {
                const weekStart = new Date(startDate);
                weekStart.setDate(startDate.getDate() + (week * 7));

                let weeklyCompleted = 0;
                let weeklyTotal = 0;
                const weekDates = [];

                for (let i = 0; i < 7; i++) {
                    const currentDate = new Date(weekStart);
                    currentDate.setDate(weekStart.getDate() + i);
                    if (!isFutureDate(currentDate)) {
                        weekDates.push(currentDate);
                    }
                }

                const weekStatuses = await getCompletionStatuses(user, habitName, weekDates);
                weekStatuses.forEach((status, dateStr) => {
                    if (status !== 'future') {
                        weeklyTotal++;
                        if (status === true) weeklyCompleted++;
                    }
                });

                if (weeklyTotal > 0) {
                    const weekLabel = `${formatDate(weekStart)} - ${formatDate(new Date(weekStart.setDate(weekStart.getDate() + 6)))}`;
                    dates.push(weekLabel);
                    completionData.push(weeklyCompleted);
                }
            }

        } else if (view === "month") {
            // Show last 6 months
            const endMonth = new Date(chicagoNow);
            const startMonth = new Date(endMonth);
            startMonth.setMonth(startMonth.getMonth() - 5);

            for (let i = 0; i <= 5; i++) {
                const currentDate = new Date(startMonth);
                currentDate.setMonth(startMonth.getMonth() + i);
                const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

                const monthDates = [];
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    if (!isFutureDate(date)) {
                        monthDates.push(date);
                    }
                }

                const monthStatuses = await getCompletionStatuses(user, habitName, monthDates);
                let monthlyCompleted = 0;
                monthStatuses.forEach((status, dateStr) => {
                    if (status === true) monthlyCompleted++;
                });

                if (monthDates.length > 0) {
                    const monthLabel = currentDate.toLocaleDateString('en-US', {
                        month: 'long',
                        year: currentDate.getFullYear() !== chicagoNow.getFullYear() ? 'numeric' : undefined
                    });
                    dates.push(monthLabel);
                    completionData.push(monthlyCompleted);
                }
            }
        }

        renderCustomGraph(dates, completionData, view);
    } catch (error) {
        console.error('Error updating trends graph:', error);
    }
}

function renderCustomGraph(labels, data, view) {
    if (!elements.trendsGraph || !window.ApexCharts) return;

    elements.trendsGraph.innerHTML = "";

    const options = {
        series: [{
            name: 'Completions',
            data: data
        }],
        chart: {
            type: 'bar',
            height: 350,
            background: 'transparent',
            fontFamily: 'roca, sans-serif',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 300,
                animateGradually: {
                    enabled: false
                },
                dynamicAnimation: {
                    enabled: true
                }
            },
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                borderRadius: 6,
                columnWidth: '70%',
                distributed: true,
                rangeBarOverlap: true,
                colors: {
                    ranges: [{
                        from: 0,
                        to: 0,
                        color: '#ff9b9b'
                    }]
                }
            }
        },
        colors: ['#8C9474'],
        dataLabels: {
            enabled: true,
            formatter: function(val) {
                if (view === 'day') return val === 1 ? '✓' : '❌';
                return val;
            },
            style: {
                fontSize: '14px',
                fontFamily: 'roca, sans-serif',
                fontWeight: 'bold'
            },
            offsetY: -20
        },
        grid: {
            show: true,
            borderColor: '#f1f1f1',
            strokeDashArray: 4,
            padding: {
                top: 20
            }
        },
        xaxis: {
            categories: labels,
            labels: {
                formatter: function(value) {
                    return value; // No need to format since we're pre-formatting the dates
                },
                style: {
                    fontSize: '12px',
                    fontFamily: 'roca, sans-serif'
                },
                rotate: -45,
                trim: true
            },
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            }
        },
        yaxis: {
            min: view === 'day' ? 0 : undefined,
            max: view === 'day' ? 1 : undefined,
            tickAmount: view === 'day' ? 1 : 5,
            labels: {
                formatter: function(val) {
                    if (view === 'day') return val === 1 ? 'Complete' : 'Incomplete';
                    return Math.floor(val) + ' days';
                },
                style: {
                    fontSize: '12px',
                    fontFamily: 'roca, sans-serif'
                }
            }
        },
        tooltip: {
            enabled: true,
            theme: 'light',
            y: {
                formatter: function(val) {
                    if (view === 'day') return val === 1 ? 'Completed' : 'Not Completed';
                    return `${val} days completed`;
                }
            }
        },
        states: {
            hover: {
                filter: {
                    type: 'lighten',
                    value: 0.15
                }
            }
        }
    };

    if (trendsChart) {
        trendsChart.destroy();
    }

    trendsChart = new ApexCharts(elements.trendsGraph, options);
    trendsChart.render();
}

document.addEventListener("DOMContentLoaded", () => {
    initializeCalendar();
    elements.habitInfo.innerHTML = "Select a habit to view details.";

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                await fetchHabits(user);

                elements.habitDropdown.addEventListener("change", async () => {
                    const selectedHabit = elements.habitDropdown.value;
                    if (selectedHabit) {
                        localStorage.setItem('selectedHabit', selectedHabit);
                        const view = document.querySelector('input[name="view"]:checked').value;
                        await fetchHabitCompletion(user, selectedHabit, view);
                    } else {
                        localStorage.removeItem('selectedHabit');
                        elements.habitInfo.innerHTML = "Select a habit to view details.";
                        initializeCalendar();
                    }
                });

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

                document.querySelector('input[name="view"][value="day"]').checked = true;
                await fetchHabitCompletion(user, elements.habitDropdown.value, "day");
            } catch (error) {
                console.error("Error during initialization:", error);
                elements.habitInfo.innerHTML = "Error initializing. Please refresh the page.";
            }
        } else {
            elements.habitDropdown.innerHTML = "<option value=''>Please log in to see your habits.</option>";
            elements.habitInfo.innerHTML = "Please log in to view habits.";
        }
    });
});

const handlePeriodNavigation = (direction) => {
    currentOffset += direction;
    const view = document.querySelector('input[name="view"]:checked').value;
    fetchHabitCompletion(auth.currentUser, elements.habitDropdown.value, view);
    elements.nextPeriodBtn.disabled = currentOffset >= 0;
};

elements.prevPeriodBtn.addEventListener('click', () => handlePeriodNavigation(-1));
elements.nextPeriodBtn.addEventListener('click', () => handlePeriodNavigation(1));
elements.todayButton.addEventListener('click', () => {
    currentOffset = 0;
    const view = document.querySelector('input[name="view"]:checked').value;
    fetchHabitCompletion(auth.currentUser, elements.habitDropdown.value, view);
    elements.nextPeriodBtn.disabled = true;
});

// Add this helper function at the top with other utility functions
function formatDisplayDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: viewDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
}
