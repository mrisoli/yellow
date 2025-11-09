// Export all types

// Export React components
export { BookingWidget } from "./react/booking-widget";
export { Calendar } from "./react/calendar";
export { EmailForm } from "./react/email-form";
export { TimeSlotSelector } from "./react/time-slot-selector";
export type {
	BlockedTime,
	BookingSubmission,
	BookingWidgetConfig,
	DayState,
	TimeSlot,
} from "./types";
// Export utilities
export {
	formatDate,
	generateTimeSlots,
	getDaysInMonth,
	getMonthName,
	isSameDay,
	isTimeBlocked,
	isValidEmail,
	minutesToTime,
	timeToMinutes,
} from "./utils";
