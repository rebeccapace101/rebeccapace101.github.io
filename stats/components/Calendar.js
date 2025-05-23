/**
 * Calendar Component
 * Handles the rendering and management of calendar views (day, week, month)
 */

import { formatDate, isFutureDate, getChicagoDateTime } from '../utils/dateUtils.js';
import { getDatesForView } from '../services/habitService.js';

export default class Calendar {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.table = null;
    }

    initialize(view) {
        if (!this.container) return null;

        this.container.innerHTML = '';
        this.table = document.createElement('table');
        this.table.className = 'custom-calendar-table';
        this.table.setAttribute('data-view', view);

        if (view !== 'day') {
            const headerRow = document.createElement('tr');
            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            daysOfWeek.forEach(day => {
                const th = document.createElement('th');
                th.textContent = day;
                th.style.fontSize = '0.8rem';
                headerRow.appendChild(th);
            });
            this.table.appendChild(headerRow);
        }

        this.container.appendChild(this.table);
        return this.table;
    }

    updateData(completionData, viewDate, view, selectedHabit, trackedHabitsMapping) {
        if (!this.table) return;

        // Clear existing rows
        while (this.table.rows.length > (view === 'day' ? 0 : 1)) {
            this.table.deleteRow(view === 'day' ? 0 : 1);
        }

        const currentDate = getChicagoDateTime();
        currentDate.setHours(0, 0, 0, 0);

        if (view === 'day') {
            this.renderDayView(completionData, viewDate);
        } else {
            this.renderCalendarView(completionData, viewDate, view, currentDate, selectedHabit, trackedHabitsMapping);
        }
    }

    renderDayView(completionData, viewDate) {
        const row = this.table.insertRow();
        const cell = row.insertCell();
        const dateStr = formatDate(viewDate);
        const isFuture = isFutureDate(viewDate);
        const status = completionData.get(dateStr);

        let habitName = "";
        let habitValue = "";
        let isCompleted = false;

        // Check if status contains habit data
        if (typeof status === "object" && status.completed) {
            habitName = status.habitName || "";
            habitValue = status.value || "";
            isCompleted = true;
        } else {
            isCompleted = status === true;
        }

        cell.innerHTML = `
            <div class="day-view-cell" style="background-color: ${
                isFuture ? 'transparent' : isCompleted ? '#A7C957' : '#E63946'
            }; color: ${
                isFuture ? 'inherit' : isCompleted ? '#2C4001' : 'white'
            };">
                <div class="day-date">${viewDate.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                <div class="day-number">${viewDate.getDate()}</div>
                <div class="day-month">${viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                ${!isFuture ? `<div class="day-status">${
                    isCompleted && habitName && habitValue ? `${habitName}: ${habitValue}` : isCompleted ? '✓ Completed' : '✗ Not Completed'
                }</div>` : '<div class="day-status future">Future Date</div>'}
            </div>
        `;
        cell.classList.add('custom-calendar-date');
        cell.classList.add(isFuture ? 'custom-calendar-date--disabled' :
                         isCompleted ? 'custom-calendar-date--selected' :
                         'custom-calendar-date--failed');
    }

    renderCalendarView(completionData, viewDate, view, currentDate, selectedHabit, trackedHabitsMapping) {
        const dates = getDatesForView(viewDate, view);
        let currentRow = this.table.insertRow();
        let dayCount = 0;
        const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

        if (view === 'month') {
            const firstDayOfMonth = dates[0].getDay();
            for (let i = 0; i < firstDayOfMonth; i++) {
                const emptyCell = currentRow.insertCell();
                emptyCell.classList.add('custom-calendar-date');
                emptyCell.innerHTML = `<div class="empty-cell"></div>`;
                dayCount++;
            }
        }

        dates.forEach(date => {
            const dateStr = formatDate(date);
            const isFuture = isFutureDate(date);
            const status = completionData.get(dateStr);
            const isToday = formatDate(date) === formatDate(currentDate);
            const td = currentRow.insertCell();
            td.classList.add('custom-calendar-date');

            const dayName = weekdays[date.getDay()];
            // Check if the habit is tracked on this specific day
            if (trackedHabitsMapping && Object.prototype.hasOwnProperty.call(trackedHabitsMapping, dayName) &&
                !trackedHabitsMapping[dayName].includes(selectedHabit)) {
                td.innerHTML = `
                    <div style="background-color: #ccc; color: #333; font-size: 0.8rem;
                        display: flex; flex-direction: column; justify-content: center;
                        align-items: center; height: 100%; width: 100%;">
                        Not Tracked ${dayName}
                    </div>
                `;
            } else {
                let isCompleted = false;
                let displayText = '';
                if (typeof status === "object" && (status.completed || status.value > 0)) {
                    isCompleted = true;
                    displayText = status.value > 0 ? `${status.habitName || ''}: ${status.value}` : "Complete";
                } else if (status === true) {
                    isCompleted = true;
                    displayText = "Complete";
                } else if (status === false) {
                    displayText = "Not Completed";
                } else if (typeof status === "string" && isNaN(Number(status))) {
                    isCompleted = true;
                    displayText = `${status.habitName || ''}: ${status}`;
                }
                td.innerHTML = `
                    <div class="month-view-cell" style="background-color: ${
                        isFuture ? 'transparent' : isCompleted ? '#A7C957' : '#E63946'
                    }; color: ${
                        isFuture ? 'inherit' : isCompleted ? '#2C4001' : 'white'
                    }; font-size: 0.8rem; display: flex; flex-direction: column;
                    justify-content: center; align-items: center; height: 100%; width: 100%;">
                        ${isFuture ? '<div class="future-day">Future Day</div>' : isCompleted || displayText ? `
                            <div class="completion-status">${displayText}</div>
                        ` : `
                            <div class="no-data">No Data</div>
                        `}
                    </div>
                `;
            }

            if (isToday) {
                td.classList.add('today');
            }

            dayCount++;
            if (dayCount % 7 === 0) {
                currentRow = this.table.insertRow(); // Start a new row after 7 cells
            }
        });
    }
}
