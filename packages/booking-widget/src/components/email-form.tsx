import { useState } from "react";
import { cn } from "../lib/utils";

interface PendingPayment {
  bookingId: string;
  orderId: string;
  approveUrl: string;
}

interface EmailFormProps {
  className?: string;
  date: string;
  onSuccess?: (payment?: PendingPayment) => void;
  /** The organizer's user ID sent with every booking. */
  organizerUserId?: string;
  /**
   * When set, the form creates a PayPal order instead of a confirmed booking.
   * Value in cents (e.g. 5000 = $50.00).
   */
  paymentAmount?: number;
  /** ISO 4217 currency code (default: "USD"). */
  paymentCurrency?: string;
  /**
   * URL for the POST /paypal/orders endpoint.
   * Required when paymentAmount is set.
   */
  paypalOrdersUrl?: string;
  /** URL for the POST /bookings endpoint (free bookings). */
  submitUrl: string;
  time: string;
}

export function EmailForm({
  date,
  time,
  submitUrl,
  onSuccess,
  organizerUserId,
  paymentAmount,
  paymentCurrency = "USD",
  paypalOrdersUrl,
  className,
}: EmailFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiresPayment =
    typeof paymentAmount === "number" &&
    paymentAmount > 0 &&
    Boolean(paypalOrdersUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (requiresPayment && paypalOrdersUrl) {
        // Paid booking: create a pending booking + PayPal order
        const returnUrl = `${window.location.origin}${window.location.pathname}?paypal_return=1`;
        const cancelUrl = `${window.location.origin}${window.location.pathname}?paypal_cancel=1`;

        const response = await fetch(paypalOrdersUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizerUserId: organizerUserId ?? "",
            attendeeEmail: email,
            attendeeName: name || undefined,
            date,
            time,
            paymentAmount,
            paymentCurrency,
            returnUrl,
            cancelUrl,
          }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? `Request failed (${response.status})`);
        }

        const result = (await response.json()) as PendingPayment;
        onSuccess?.(result);
      } else {
        // Free booking: create a confirmed booking directly
        const response = await fetch(submitUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizerUserId: organizerUserId ?? "",
            attendeeEmail: email,
            attendeeName: name || undefined,
            date,
            time,
          }),
        });

        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }

        onSuccess?.();
      }

      setName("");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled = isLoading || !email;

  return (
    <form className={cn("space-y-4", className)} onSubmit={handleSubmit}>
      <div>
        <label
          className="block font-medium text-gray-700 text-sm"
          htmlFor="attendee-name"
        >
          Name <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <input
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          id="attendee-name"
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          type="text"
          value={name}
        />
      </div>

      <div>
        <label
          className="block font-medium text-gray-700 text-sm"
          htmlFor="attendee-email"
        >
          Email
        </label>
        <input
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          id="attendee-email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </div>

      {error && (
        <div className="rounded bg-red-50 p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        className={cn(
          "w-full rounded px-4 py-2 font-medium text-white transition",
          isSubmitDisabled
            ? "cursor-not-allowed bg-blue-300"
            : "bg-blue-500 hover:bg-blue-600"
        )}
        disabled={isSubmitDisabled}
        type="submit"
      >
        {isLoading
          ? "Processing…"
          : requiresPayment
            ? "Continue to Payment"
            : "Confirm Booking"}
      </button>
    </form>
  );
}
