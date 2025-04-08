/**
 * Calendar Component
 * Handles the rendering and management of calendar views (day, week, month)
 */

import { formatDate, isFutureDate, getChicagoDateTime } from '../utils/dateUtils.js'; // Updated import path
import { getDatesForView } from '../services/habitService.js'; // Import getDatesForView from habitService

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

        if (view !== 'day') {
            const headerRow = document.createElement('tr');
            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            daysOfWeek.forEach(day => {
                const th = document.createElement('th');
                th.textContent = day;
                headerRow.appendChild(th);
            });
            this.table.appendChild(headerRow);
        }

        this.container.appendChild(this.table);
        return this.table;
    }

    updateData(completionData, viewDate, view) {
        if (!this.table) return;

        while (this.table.rows.length > (view === 'day' ? 0 : 1)) {
            this.table.deleteRow(view === 'day' ? 0 : 1);
        }

        const currentDate = getChicagoDateTime();
        currentDate.setHours(0, 0, 0, 0);

        if (view === 'day') {
            this.renderDayView(completionData, viewDate);
        } else {
            this.renderCalendarView(completionData, viewDate, view, currentDate);
        }
    }

    renderDayView(completionData, viewDate) {
        const row = this.table.insertRow();
        const cell = row.insertCell();
        const dateStr = formatDate(viewDate);
        const isFuture = isFutureDate(viewDate);
        const status = completionData.get(dateStr);

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
    }

    renderCalendarView(completionData, viewDate, view, currentDate) {
        const dates = getDatesForView(viewDate, view); // Use the imported getDatesForView function
        let currentRow = this.table.insertRow();
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
                currentRow = this.table.insertRow();
                dayCount = 0;
            }
        });
    }
}
