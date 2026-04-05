export interface BlockedTime {
  date: string;
  endTime: string;
  startTime: string;
}

/** A single contiguous time window within a day (24-hour "HH:mm" strings). */
export interface TimeRange {
  endTime: string;
  startTime: string;
}

/**
 * Availability for one day of the week.
 * dayOfWeek follows JS conventions: 0 = Sunday, 6 = Saturday.
 */
export interface DayAvailability {
  dayOfWeek: number;
  enabled: boolean;
  timeRanges: TimeRange[];
}

export interface BookingWidgetProps {
  /**
   * Weekly availability schedule used to determine which time slots to show.
   * When omitted the widget falls back to 09:00–17:00 Mon–Fri.
   */
  availability?: DayAvailability[];
  blockedTimes?: BlockedTime[];
  className?: string;
  defaultDate?: Date;
  defaultMonth?: Date;
  meetingDuration?: number;
  /** The organizer's user ID — sent with every booking request. */
  organizerUserId?: string;
  /**
   * The base URL for the Convex HTTP endpoint.
   * Defaults to http://localhost:3000.
   * Used to construct: {siteUrl}/bookings and {siteUrl}/paypal/orders
   */
  submitUrl?: string;

  // ── Payment options ──────────────────────────────────────────────────────

  /**
   * When set, the widget requires payment before confirming a booking.
   * Value is in cents (e.g. 5000 = $50.00).
   */
  paymentAmount?: number;
  /** ISO 4217 currency code (default: "USD"). */
  paymentCurrency?: string;
  /**
   * The PayPal client ID for the JS SDK.
   * Required when paymentAmount > 0 and the host uses PayPal.
   */
  paypalClientId?: string;
}
