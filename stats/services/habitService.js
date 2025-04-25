/**
 * Habit Service
 * Handles all habit-related data operations
 */

import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { app } from '../../init.mjs';

const db = getFirestore(app);

export async function fetchHabits(userId) {
    console.log("Fetching habits for userId:", userId); // Debug log
    try {
        const userDocRef = doc(db, "habitData", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            console.log("No user document found");
            return [];
        }

        const data = userDocSnap.data();
        console.log("Raw habit data:", data); // Debug log

        if (!data.namesOfHabits) {
            console.log("No habits array found in document");
            return [];
        }

        console.log("Found habits:", data.namesOfHabits); // Debug log
        return data.namesOfHabits;
    } catch (error) {
        console.error("Error in fetchHabits:", error);
        throw error;
    }
}

export async function getHabitCompletion(userId, habitName, date) {
    try {
        console.log("Starting getHabitCompletion"); // Debug log
        const habitDocRef = doc(db, "habitData", userId, habitName, date);
        console.log("Fetching document:", habitDocRef.path); // Debug log

        const habitDocSnap = await getDoc(habitDocRef);
        if (!habitDocSnap.exists()) {
            console.log("Document does not exist.");
            return false;
        }

        const data = habitDocSnap.data();
        console.log("Fetched data:", data); // Debug log

        if (typeof data.data === "string" && isNaN(Number(data.data))) {
            return { completed: true, habitName, value: data.data }; // Handle string values as completed
        } else if (data.completed === true || data.data === true || data.value === true) {
            return { completed: true, habitName, value: "Completed" }; // Handle boolean true
        } else if (typeof data.data === "number" || !isNaN(Number(data.data))) {
            return { completed: true, habitName, value: data.data }; // Handle numeric values
        }

        return false; // Default to not completed
    } catch (error) {
        console.error("Error fetching habit completion:", error);
        throw error;
    }
}

/**
 * Fetches the array of habits for a specific user and day of week.
 * @param {string} userId
 * @param {string} dayName - e.g. "Monday"
 * @returns {Promise<Array<string>>}
 */
export async function getHabitsForDay(userId, dayName) {
    try {
        const docRef = doc(db, "habits", userId, dayName, "habits");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && Array.isArray(docSnap.data().habits)) {
            return docSnap.data().habits;
        }
        return [];
    } catch (e) {
        console.error(`Error fetching habits for ${dayName}:`, e);
        return [];
    }
}

export function getDatesForView(viewDate, view) {
    try {
        console.log('Getting dates for:', { view, viewDate }); // Debug log
        const dates = [];
        if (view === "day") {
            dates.push(new Date(viewDate));
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
    } catch (error) {
        console.error('Error in getDatesForView:', error);
        throw error;
    }
}
