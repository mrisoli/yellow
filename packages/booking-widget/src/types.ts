/**
 * Represents a blocked time slot during which bookings are not allowed
 */
export type BlockedTime = {
	/** Start time in HH:mm format (24-hour) */
	startTime: string;
	/** End time in HH:mm format (24-hour) */
	endTime: string;
	/** Date in YYYY-MM-DD format */
	date: string;
};

/**
 * Represents an available time slot for booking
 */
export type TimeSlot = {
	time: string;
	available: boolean;
};

/**
 * Configuration options for the booking widget
 */
export type BookingWidgetConfig = {
	/** Default meeting duration in minutes (default: 30) */
	defaultMeetingDuration?: number;
	/** List of time slots blocked from booking */
	blockedTimes?: BlockedTime[];
	/** URL to submit the booking form to (default: 'http://localhost:3000/api/bookings') */
	submitUrl?: string;
	/** Initial month to display (default: current month) */
	initialMonth?: Date;
	/** Initial year to display (default: current year) */
	initialYear?: Date;
	/** Callback function after successful submission */
	onSubmitSuccess?: (data: BookingSubmission) => void;
	/** Callback function on submission error */
	onSubmitError?: (error: Error) => void;
};

/**
 * Data structure for a booking submission
 */
export type BookingSubmission = {
	email: string;
	date: string;
	time: string;
	duration: number;
};

/**
 * State for a single day in the calendar
 */
export type DayState = {
	date: Date;
	isCurrentMonth: boolean;
	isSelected: boolean;
	hasAvailableSlots: boolean;
};
