import { useState } from "react";
import type { DayState } from "../types";
import { formatDate, getDaysInMonth, getMonthName, isSameDay } from "../utils";

type CalendarProps = {
	onDateSelect: (date: Date) => void;
	initialMonth?: Date;
	blockedDates?: Set<string>;
};

export function Calendar({
	onDateSelect,
	initialMonth = new Date(),
	blockedDates = new Set(),
}: CalendarProps): JSX.Element {
	const [currentDate, setCurrentDate] = useState(initialMonth);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);

	const year = currentDate.getFullYear();
	const month = currentDate.getMonth();
	const days = getDaysInMonth(year, month);

	const handlePreviousMonth = (): void => {
		const newDate = new Date(currentDate);
		newDate.setMonth(newDate.getMonth() - 1);
		setCurrentDate(newDate);
	};

	const handleNextMonth = (): void => {
		const newDate = new Date(currentDate);
		newDate.setMonth(newDate.getMonth() + 1);
		setCurrentDate(newDate);
	};

	const handleSelectDate = (date: Date): void => {
		// Only allow selecting dates in the current month
		if (date.getMonth() !== month) {
			return;
		}

		// Don't allow selecting past dates
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		if (date < today) {
			return;
		}

		setSelectedDate(date);
		onDateSelect(date);
	};

	const dayStates: DayState[] = days.map((date) => ({
		date,
		isCurrentMonth: date.getMonth() === month,
		isSelected: selectedDate !== null && isSameDay(date, selectedDate),
		hasAvailableSlots: !blockedDates.has(formatDate(date)),
	}));

	const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "1rem",
				padding: "1rem",
				border: "1px solid #e5e7eb",
				borderRadius: "0.5rem",
				backgroundColor: "#ffffff",
			}}
		>
			{/* Header */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "1rem",
				}}
			>
				<button
					aria-label="Previous month"
					onClick={handlePreviousMonth}
					style={{
						padding: "0.5rem",
						border: "none",
						backgroundColor: "#f3f4f6",
						borderRadius: "0.375rem",
						cursor: "pointer",
						fontSize: "1rem",
					}}
					type="button"
				>
					←
				</button>
				<h2
					style={{
						margin: 0,
						fontSize: "1.25rem",
						fontWeight: "600",
					}}
				>
					{getMonthName(month)} {year}
				</h2>
				<button
					aria-label="Next month"
					onClick={handleNextMonth}
					style={{
						padding: "0.5rem",
						border: "none",
						backgroundColor: "#f3f4f6",
						borderRadius: "0.375rem",
						cursor: "pointer",
						fontSize: "1rem",
					}}
					type="button"
				>
					→
				</button>
			</div>

			{/* Weekday headers */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(7, 1fr)",
					gap: "0.5rem",
					marginBottom: "0.5rem",
				}}
			>
				{weekDays.map((day) => (
					<div
						key={day}
						style={{
							textAlign: "center",
							fontWeight: "600",
							fontSize: "0.875rem",
							color: "#6b7280",
							padding: "0.5rem",
						}}
					>
						{day}
					</div>
				))}
			</div>

			{/* Calendar days */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(7, 1fr)",
					gap: "0.5rem",
				}}
			>
				{dayStates.map((day, index) => {
					const isDisabled = !day.isCurrentMonth || day.date < new Date();
					const isSelected = day.isSelected;

					return (
						<button
							aria-label={`${day.date.toLocaleDateString()}`}
							disabled={isDisabled}
							key={`${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}-${index}`}
							onClick={() => handleSelectDate(day.date)}
							onMouseEnter={(e) => {
								if (!isDisabled) {
									const target = e.currentTarget;
									target.style.backgroundColor = "#f3f4f6";
								}
							}}
							onMouseLeave={(e) => {
								const target = e.currentTarget;
								target.style.backgroundColor = isSelected
									? "#dbeafe"
									: "#ffffff";
							}}
							style={{
								aspectRatio: "1 / 1",
								padding: "0.5rem",
								border: isSelected ? "2px solid #3b82f6" : "1px solid #e5e7eb",
								backgroundColor: isSelected ? "#dbeafe" : "#ffffff",
								borderRadius: "0.375rem",
								cursor: isDisabled ? "not-allowed" : "pointer",
								fontSize: "0.875rem",
								fontWeight: isSelected ? "600" : "400",
								color: isDisabled ? "#d1d5db" : "#1f2937",
								opacity: day.isCurrentMonth ? 1 : 0.5,
								transition: "all 0.2s",
							}}
							type="button"
						>
							{day.date.getDate()}
						</button>
					);
				})}
			</div>
		</div>
	);
}
