/**
 * Completion Service
 * Manages habit completion status checks and calculations.
 */

import { formatDate, isFutureDate } from '../utils/dateUtils.js';
import { getHabitCompletion } from './habitService.js';

/**
 * Fetches the completion statuses for a habit over a range of dates.
 * @param {Object} user - The authenticated user object.
 * @param {string} habitName - The name of the habit.
 * @param {Array<Date>} dates - The range of dates to check.
 * @returns {Map<string, boolean>} - A map of date strings to completion statuses.
 */
export async function getCompletionStatuses(user, habitName, dates) {
    if (!user || !habitName || !dates) {
        console.error('Invalid parameters for getCompletionStatuses');
        return new Map();
    }

    const results = new Map();
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const date of dates) {
        const dateStr = formatDate(date);
        if (isFutureDate(date)) {
            results.set(dateStr, 'future');
            continue;
        }

        try {
            const completionData = await getHabitCompletion(user.uid, habitName, dateStr);

            // If completionData contains a numeric value, include habit name and value
            if (completionData && typeof completionData === "object" && (completionData.value > 0 || completionData.completed)) {
                results.set(dateStr, {
                    habitName,
                    value: completionData.value,
                    completed: true
                });
            } else {
                results.set(dateStr, completionData);
            }
        } catch (error) {
            console.error(`Error fetching completion for ${dateStr}:`, error);
            results.set(dateStr, false);
        }
    }

    return results;
}

/**
 * Calculates completion statistics for a habit.
 * @param {Map<string, boolean>} completionData - The completion data.
 * @param {Array<Date>} dates - The range of dates.
 * @returns {Object} - The calculated statistics.
 */
export function calculateCompletionStats(completionData, dates) {
    let completedDays = 0;
    let totalDays = 0;

    dates.forEach(date => {
        if (!isFutureDate(date)) {
            totalDays++;
            const dateStr = formatDate(date);
            if (completionData.get(dateStr)) {
                completedDays++;
            }
        }
    });

    return {
        completed: completedDays,
        total: totalDays,
        percentage: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0
    };
}
