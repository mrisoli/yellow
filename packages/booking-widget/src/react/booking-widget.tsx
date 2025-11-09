import { useState } from "react";
import type { BookingWidgetConfig } from "../types";
import { formatDate, generateTimeSlots } from "../utils";
import { Calendar } from "./calendar";
import { EmailForm } from "./email-form";
import { TimeSlotSelector } from "./time-slot-selector";

type BookingWidgetProps = BookingWidgetConfig;

type BookingStep = "date" | "time" | "email" | "success";

export function BookingWidget({
	defaultMeetingDuration = 30,
	blockedTimes = [],
	submitUrl = "http://localhost:3000/api/bookings",
	initialMonth = new Date(),
	onSubmitSuccess,
	onSubmitError,
}: BookingWidgetProps): JSX.Element {
	const [step, setStep] = useState<BookingStep>("date");
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [selectedTime, setSelectedTime] = useState<string | null>(null);

	const handleDateSelect = (date: Date): void => {
		setSelectedDate(date);
		setSelectedTime(null);
		setStep("time");
	};

	const handleTimeSelect = (time: string): void => {
		setSelectedTime(time);
		setStep("email");
	};

	const handleBack = (): void => {
		if (step === "email") {
			setStep("time");
			setSelectedTime(null);
		} else if (step === "time") {
			setStep("date");
			setSelectedDate(null);
		}
	};

	const handleSubmit = (submission: BookingSubmission): void => {
		setStep("success");
		onSubmitSuccess?.(submission);
	};

	const handleSubmitError = (error: Error): void => {
		onSubmitError?.(error);
	};

	const timeSlots = selectedDate
		? generateTimeSlots(
				formatDate(selectedDate),
				defaultMeetingDuration,
				blockedTimes
			)
		: [];

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "1.5rem",
				maxWidth: "500px",
				margin: "0 auto",
				padding: "1.5rem",
				fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
			}}
		>
			{/* Header */}
			<div>
				<h1
					style={{
						margin: "0 0 0.5rem 0",
						fontSize: "1.5rem",
						fontWeight: "700",
					}}
				>
					Book an Appointment
				</h1>
				<p
					style={{
						margin: 0,
						color: "#6b7280",
						fontSize: "0.875rem",
					}}
				>
					{step === "date" && "Select a date to get started"}
					{step === "time" && "Choose your preferred time"}
					{step === "email" && "Enter your email to confirm"}
					{step === "success" && "Your booking has been confirmed"}
				</p>
			</div>

			{/* Steps indicator */}
			<div
				style={{
					display: "flex",
					gap: "0.5rem",
					justifyContent: "center",
				}}
			>
				{["date", "time", "email", "success"].map((s) => (
					<div
						key={s}
						style={{
							width: "0.5rem",
							height: "0.5rem",
							borderRadius: "50%",
							backgroundColor:
								step === s || (s === "success" && step === "success")
									? "#3b82f6"
									: "#d1d5db",
							transition: "all 0.2s",
						}}
					/>
				))}
			</div>

			{/* Step content */}
			{step === "date" && (
				<Calendar
					blockedDates={new Set()}
					initialMonth={initialMonth}
					onDateSelect={handleDateSelect}
				/>
			)}

			{step === "time" && selectedDate && (
				<>
					<TimeSlotSelector
						onTimeSelect={handleTimeSelect}
						selectedTime={selectedTime}
						slots={timeSlots}
					/>
					<button
						onClick={handleBack}
						style={{
							padding: "0.75rem",
							backgroundColor: "#f3f4f6",
							color: "#1f2937",
							border: "1px solid #e5e7eb",
							borderRadius: "0.375rem",
							cursor: "pointer",
							fontSize: "0.875rem",
							fontWeight: "600",
						}}
						type="button"
					>
						← Back
					</button>
				</>
			)}

			{step === "email" && selectedDate && selectedTime && (
				<>
					<EmailForm
						date={formatDate(selectedDate)}
						duration={defaultMeetingDuration}
						onSubmitError={handleSubmitError}
						onSubmitSuccess={() =>
							handleSubmit({
								email: "", // Will be set by the form
								date: formatDate(selectedDate),
								time: selectedTime,
								duration: defaultMeetingDuration,
							})
						}
						submitUrl={submitUrl}
						time={selectedTime}
					/>
					<button
						onClick={handleBack}
						style={{
							padding: "0.75rem",
							backgroundColor: "#f3f4f6",
							color: "#1f2937",
							border: "1px solid #e5e7eb",
							borderRadius: "0.375rem",
							cursor: "pointer",
							fontSize: "0.875rem",
							fontWeight: "600",
						}}
						type="button"
					>
						← Back
					</button>
				</>
			)}

			{step === "success" && (
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: "1rem",
						padding: "2rem 1rem",
						textAlign: "center",
						backgroundColor: "#f0fdf4",
						border: "1px solid #86efac",
						borderRadius: "0.5rem",
					}}
				>
					<div
						style={{
							fontSize: "3rem",
						}}
					>
						✓
					</div>
					<div>
						<h3
							style={{
								margin: "0 0 0.5rem 0",
								fontSize: "1.125rem",
								fontWeight: "600",
								color: "#166534",
							}}
						>
							Booking Confirmed
						</h3>
						<p
							style={{
								margin: 0,
								color: "#15803d",
								fontSize: "0.875rem",
							}}
						>
							You should receive a confirmation email shortly.
						</p>
					</div>
					<button
						onClick={() => {
							setStep("date");
							setSelectedDate(null);
							setSelectedTime(null);
						}}
						style={{
							marginTop: "1rem",
							padding: "0.75rem 1.5rem",
							backgroundColor: "#22c55e",
							color: "#ffffff",
							border: "none",
							borderRadius: "0.375rem",
							cursor: "pointer",
							fontSize: "0.875rem",
							fontWeight: "600",
						}}
						type="button"
					>
						Book Another Appointment
					</button>
				</div>
			)}
		</div>
	);
}
