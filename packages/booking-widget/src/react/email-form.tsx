import type React from "react";
import { useState } from "react";
import { isValidEmail } from "../utils";

type EmailFormProps = {
	date: string;
	time: string;
	duration: number;
	submitUrl: string;
	onSubmitSuccess: () => void;
	onSubmitError: (error: Error) => void;
};

export function EmailForm({
	date,
	time,
	duration,
	submitUrl,
	onSubmitSuccess,
	onSubmitError,
}: EmailFormProps): JSX.Element {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (
		e: React.FormEvent<HTMLFormElement>
	): Promise<void> => {
		e.preventDefault();
		setError(null);

		if (!isValidEmail(email)) {
			setError("Please enter a valid email address");
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch(submitUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email,
					date,
					time,
					duration,
				}),
			});

			if (!response.ok) {
				throw new Error(`Server error: ${response.statusText}`);
			}

			onSubmitSuccess();
		} catch (err) {
			const submitError =
				err instanceof Error ? err : new Error("Unknown error occurred");
			setError(submitError.message);
			onSubmitError(submitError);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
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
					margin: 0,
					fontSize: "1rem",
					fontWeight: "600",
				}}
			>
				Confirm Your Booking
			</h3>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: "1rem",
					fontSize: "0.875rem",
					color: "#6b7280",
				}}
			>
				<div>
					<div style={{ fontWeight: "500" }}>Date</div>
					<p
						style={{
							margin: "0.25rem 0 0 0",
							color: "#1f2937",
						}}
					>
						{new Date(date).toLocaleDateString()}
					</p>
				</div>
				<div>
					<div style={{ fontWeight: "500" }}>Time</div>
					<p
						style={{
							margin: "0.25rem 0 0 0",
							color: "#1f2937",
						}}
					>
						{time} ({duration} min)
					</p>
				</div>
			</div>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "0.5rem",
				}}
			>
				<label
					htmlFor="email"
					style={{
						fontSize: "0.875rem",
						fontWeight: "500",
					}}
				>
					Email Address
				</label>
				<input
					disabled={isLoading}
					id="email"
					onChange={(e) => {
						setEmail(e.target.value);
						setError(null);
					}}
					placeholder="your@email.com"
					style={{
						padding: "0.5rem",
						border: error ? "2px solid #ef4444" : "1px solid #d1d5db",
						borderRadius: "0.375rem",
						fontSize: "0.875rem",
						fontFamily: "inherit",
						color: "#1f2937",
						backgroundColor: "#ffffff",
					}}
					type="email"
					value={email}
				/>
				{error && (
					<p
						style={{
							margin: "0.25rem 0 0 0",
							fontSize: "0.875rem",
							color: "#ef4444",
						}}
					>
						{error}
					</p>
				)}
			</div>

			<button
				disabled={isLoading || !email}
				onMouseEnter={(e) => {
					if (!isLoading) {
						const target = e.currentTarget;
						target.style.backgroundColor = "#2563eb";
					}
				}}
				onMouseLeave={(e) => {
					const target = e.currentTarget;
					target.style.backgroundColor = "#3b82f6";
				}}
				style={{
					padding: "0.75rem",
					backgroundColor: "#3b82f6",
					color: "#ffffff",
					border: "none",
					borderRadius: "0.375rem",
					fontSize: "0.875rem",
					fontWeight: "600",
					cursor: isLoading ? "not-allowed" : "pointer",
					opacity: isLoading ? 0.7 : 1,
					transition: "all 0.2s",
				}}
				type="submit"
			>
				{isLoading ? "Submitting..." : "Confirm Booking"}
			</button>
		</form>
	);
}
