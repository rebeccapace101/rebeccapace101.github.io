export function getChicagoDate() {
    const chicagoTime = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    return new Date(chicagoTime);
}

export function formatDate(date) {
    return date.toISOString().split('T')[0];
}

export function isFutureDate(date) {
    const chicagoDate = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    const chicagoNow = new Date(chicagoDate);
    const compareDate = new Date(date);

    // Set both dates to midnight for comparison
    chicagoNow.setHours(0, 0, 0, 0);
    compareDate.setHours(0, 0, 0, 0);

    return compareDate > chicagoNow;
}

export function getOffsetDate(offset, view) {
    const date = getChicagoDate();
    const offsets = {
        'day': () => date.setDate(date.getDate() + offset),
        'week': () => date.setDate(date.getDate() + (offset * 7)),
        'month': () => date.setMonth(date.getMonth() + offset)
    };
    offsets[view]?.();
    return date;
}

export function getWeekNumber(date) {
    const chicagoDate = getChicagoDate();
    const startOfYear = new Date(chicagoDate.getFullYear(), 0, 1);
    const pastDaysOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
}

// Add this new helper function
export function getChicagoDateTime() {
    const chicagoDate = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    return new Date(chicagoDate);
}
