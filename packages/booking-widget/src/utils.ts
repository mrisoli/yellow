import type { BlockedTime, TimeSlot } from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Get all days in a month including padding from previous/next months
 */
export function getDaysInMonth(year: number, month: number): Date[] {
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	const startDate = new Date(firstDay);
	startDate.setDate(startDate.getDate() - firstDay.getDay());

	const days: Date[] = [];
	const current = new Date(startDate);

	while (current <= lastDay || current.getDay() !== 0) {
		days.push(new Date(current));
		current.setDate(current.getDate() + 1);
	}

	return days;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
}

/**
 * Get month name from month number
 */
export function getMonthName(month: number): string {
	const monthNames = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	return monthNames[month];
}

/**
 * Check if a time slot is blocked
 */
export function isTimeBlocked(
	date: string,
	time: string,
	duration: number,
	blockedTimes: BlockedTime[]
): boolean {
	const [hours, minutes] = time.split(":").map(Number);
	const slotStart = hours * 60 + minutes;
	const slotEnd = slotStart + duration;

	return blockedTimes.some((block) => {
		if (block.date !== date) {
			return false;
		}

		const [blockStartHours, blockStartMinutes] = block.startTime
			.split(":")
			.map(Number);
		const blockStart = blockStartHours * 60 + blockStartMinutes;

		const [blockEndHours, blockEndMinutes] = block.endTime
			.split(":")
			.map(Number);
		const blockEnd = blockEndHours * 60 + blockEndMinutes;

		// Check if there's any overlap
		return slotStart < blockEnd && slotEnd > blockStart;
	});
}

/**
 * Generate available time slots for a given date
 */
export function generateTimeSlots(
	date: string,
	duration: number,
	blockedTimes: BlockedTime[]
): TimeSlot[] {
	const slots: TimeSlot[] = [];
	const workdayStart = 9; // 9 AM
	const workdayEnd = 17; // 5 PM

	for (let hour = workdayStart; hour < workdayEnd; hour++) {
		for (let minute = 0; minute < 60; minute += 30) {
			const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
			const available = !isTimeBlocked(date, time, duration, blockedTimes);
			slots.push({ time, available });
		}
	}

	return slots;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
	return EMAIL_REGEX.test(email);
}

/**
 * Parse time string to minutes since midnight
 */
export function timeToMinutes(time: string): number {
	const [hours, minutes] = time.split(":").map(Number);
	return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 */
export function minutesToTime(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}
