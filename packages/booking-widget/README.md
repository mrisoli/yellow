# Booking Widget

A reusable React booking widget component for embeddable booking experiences.

## Features

- 📅 Interactive calendar with date selection (current month default)
- ⏰ Time slot selection with 30-minute intervals (configurable)
- 🚫 Support for blocked/busy times
- 📧 Email collection and booking submission
- ♿ Accessible UI components
- 🎨 Unstyled foundation (bring your own styles)

## Installation

```bash
bun add @yellow/booking-widget
```

## Usage

### Basic Example

```tsx
import { BookingWidget } from '@yellow/booking-widget/react';

export default function MyBookingPage() {
	return (
		<BookingWidget
			submitUrl="/api/bookings"
			onSubmitSuccess={(data) => {
				console.log('Booking submitted:', data);
			}}
			onSubmitError={(error) => {
				console.error('Booking failed:', error);
			}}
		/>
	);
}
```

### With Custom Configuration

```tsx
import { BookingWidget } from '@yellow/booking-widget/react';

export default function MyBookingPage() {
	const blockedTimes = [
		{
			date: '2025-11-15',
			startTime: '12:00',
			endTime: '13:00',
		},
		{
			date: '2025-11-15',
			startTime: '14:30',
			endTime: '15:30',
		},
	];

	return (
		<BookingWidget
			defaultMeetingDuration={60}
			blockedTimes={blockedTimes}
			submitUrl="https://api.example.com/bookings"
			initialMonth={new Date('2025-12-01')}
			onSubmitSuccess={(data) => {
				console.log('Booking confirmed:', data);
			}}
			onSubmitError={(error) => {
				console.error('Booking error:', error.message);
			}}
		/>
	);
}
```

## API Reference

### BookingWidget Props

- `defaultMeetingDuration`: number (default: `30`) - Duration of booking in minutes
- `blockedTimes`: `BlockedTime[]` - Array of blocked time slots
- `submitUrl`: string (default: `http://localhost:3000/api/bookings`) - API endpoint for booking submission
- `initialMonth`: Date - Initial month to display in calendar
- `initialYear`: Date - Initial year to display in calendar
- `onSubmitSuccess`: (data: BookingSubmission) => void - Callback on successful submission
- `onSubmitError`: (error: Error) => void - Callback on submission error

### Types

```typescript
interface BlockedTime {
	date: string;         // YYYY-MM-DD format
	startTime: string;    // HH:mm format (24-hour)
	endTime: string;      // HH:mm format (24-hour)
}

interface BookingSubmission {
	email: string;
	date: string;
	time: string;
	duration: number;
}
```

## Components

### BookingWidget

The main component that orchestrates the entire booking flow.

### Calendar

Standalone calendar component for date selection.

```tsx
import { Calendar } from '@yellow/booking-widget/react';

<Calendar
	onDateSelect={(date) => console.log(date)}
	initialMonth={new Date()}
/>
```

### TimeSlotSelector

Standalone component for time slot selection.

```tsx
import { TimeSlotSelector } from '@yellow/booking-widget/react';

<TimeSlotSelector
	slots={timeSlots}
	selectedTime={selectedTime}
	onTimeSelect={handleSelectTime}
/>
```

### EmailForm

Standalone form component for email collection and submission.

```tsx
import { EmailForm } from '@yellow/booking-widget/react';

<EmailForm
	date="2025-11-15"
	time="14:00"
	duration={30}
	submitUrl="/api/bookings"
	onSubmitSuccess={() => console.log('Success')}
	onSubmitError={(error) => console.error(error)}
/>
```

## Styling

The widget uses inline styles by default. To customize styles, you can:

1. **CSS Override** - Use CSS selectors to override styles
2. **Wrap Components** - Wrap components and apply custom styling
3. **Component Composition** - Use individual components and build your own layout

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
