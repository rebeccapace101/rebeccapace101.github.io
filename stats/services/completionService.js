/**
 * Completion Service
 * Manages habit completion status checks and calculations
 */

import { formatDate, isFutureDate } from '../utils/dateUtils.js'; // Updated path
import { getHabitCompletion } from './habitService.js';

export async function getCompletionStatuses(user, habitName, dates) {
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
            const isCompleted = await getHabitCompletion(user.uid, habitName, dateStr);
            results.set(dateStr, isCompleted);
        } catch (error) {
            console.error(`Error fetching completion for ${dateStr}:`, error);
            results.set(dateStr, false);
        }
    }

    return results;
}

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
