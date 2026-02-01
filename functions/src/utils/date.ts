/**
 * Date Utility Functions
 * Handles timezone conversions for standardized date handling (Jakarta/WIB - UTC+7)
 */

/**
 * Get Date object shifted to Jakarta Time (UTC+7)
 * While it returns a Date object, the UTC components of this object 
 * correspond to the local time components in Jakarta.
 * e.g. if it's 10:00 UTC, this returns 17:00 (Jakarta).
 * .toISOString() on this object will yield "YYYY-MM-DDTHH:mm:ss.sssZ" where HH is 17.
 */
export function getJakartaDate(date: Date = new Date()): Date {
    // Jakarta is UTC+7
    const offset = 7 * 60 * 60 * 1000;
    return new Date(date.getTime() + offset);
}

/**
 * Get date string "YYYY-MM-DD" for Jakarta Time
 */
export function getJakartaDateString(date: Date = new Date()): string {
    return getJakartaDate(date).toISOString().split('T')[0];
}
