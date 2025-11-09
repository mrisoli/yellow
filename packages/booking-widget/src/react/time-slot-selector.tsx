import type { TimeSlot } from "../types";

type TimeSlotselectorProps = {
	slots: TimeSlot[];
	selectedTime: string | null;
	onTimeSelect: (time: string) => void;
};

export function TimeSlotSelector({
	slots,
	selectedTime,
	onTimeSelect,
}: TimeSlotselectorProps): JSX.Element {
	const getBackgroundColor = (slot: TimeSlot, isSelected: boolean): string => {
		if (isSelected) {
			return "#dbeafe";
		}
		return slot.available ? "#ffffff" : "#f3f4f6";
	};

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
			<h3
				style={{
					margin: "0 0 0.5rem 0",
					fontSize: "1rem",
					fontWeight: "600",
				}}
			>
				Available Time Slots
			</h3>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(3, 1fr)",
					gap: "0.5rem",
				}}
			>
				{slots.map((slot) => (
					<button
						aria-label={`${slot.time} - ${slot.available ? "Available" : "Not available"}`}
						disabled={!slot.available}
						key={slot.time}
						onClick={() => {
							if (slot.available) {
								onTimeSelect(slot.time);
							}
						}}
						onMouseEnter={(e) => {
							if (slot.available) {
								const target = e.currentTarget;
								target.style.backgroundColor = "#f3f4f6";
							}
						}}
						onMouseLeave={(e) => {
							const target = e.currentTarget;
							const isSelected = selectedTime === slot.time;
							target.style.backgroundColor = getBackgroundColor(
								slot,
								isSelected
							);
						}}
						style={{
							padding: "0.75rem",
							border:
								selectedTime === slot.time
									? "2px solid #3b82f6"
									: "1px solid #e5e7eb",
							backgroundColor: getBackgroundColor(
								slot,
								selectedTime === slot.time
							),
							borderRadius: "0.375rem",
							cursor: slot.available ? "pointer" : "not-allowed",
							fontSize: "0.875rem",
							fontWeight: selectedTime === slot.time ? "600" : "400",
							color: slot.available ? "#1f2937" : "#d1d5db",
							transition: "all 0.2s",
						}}
						type="button"
					>
						{slot.time}
					</button>
				))}
			</div>

			{slots.length === 0 && (
				<p
					style={{
						margin: 0,
						color: "#6b7280",
						fontSize: "0.875rem",
					}}
				>
					No available time slots for this date.
				</p>
			)}
		</div>
	);
}
