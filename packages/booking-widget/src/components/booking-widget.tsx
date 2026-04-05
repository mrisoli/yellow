import { useState } from "react";
import { cn, formatDate } from "../lib/utils";
import type { BookingWidgetProps } from "../types";
import { Calendar } from "./calendar";
import { EmailForm } from "./email-form";
import { PaymentForm } from "./payment-form";
import { TimeslotList } from "./timeslot-list";

type Step = "calendar" | "timeslots" | "form" | "payment" | "success";

interface PendingPayment {
  bookingId: string;
  orderId: string;
  approveUrl: string;
}

export function BookingWidget({
  defaultDate,
  defaultMonth,
  meetingDuration = 30,
  availability,
  blockedTimes,
  organizerUserId,
  submitUrl = "http://localhost:3000",
  paymentAmount,
  paymentCurrency = "USD",
  paypalClientId,
  className,
}: BookingWidgetProps) {
  const [step, setStep] = useState<Step>("calendar");
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    defaultDate ?? null
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [month, setMonth] = useState<Date>(defaultMonth ?? new Date());
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const requiresPayment =
    typeof paymentAmount === "number" &&
    paymentAmount > 0 &&
    Boolean(paypalClientId);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setStep("timeslots");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep("form");
  };

  const handleFormSuccess = (payment?: PendingPayment) => {
    if (requiresPayment && payment) {
      setPendingPayment(payment);
      setPaymentError(null);
      setStep("payment");
    } else {
      setStep("success");
    }
  };

  const handlePaymentSuccess = () => {
    setPendingPayment(null);
    setStep("success");
  };

  const handlePaymentError = (message: string) => {
    setPaymentError(message);
  };

  const handleReset = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setMonth(defaultMonth ?? new Date());
    setPendingPayment(null);
    setPaymentError(null);
    setStep("calendar");
  };

  return (
    <div
      className={cn(
        "w-full max-w-md space-y-6 rounded-lg border border-gray-200 p-6 shadow-sm",
        className
      )}
    >
      {step === "calendar" && (
        <>
          <h2 className="font-bold text-xl">Select a Date</h2>
          <Calendar
            month={month}
            onDateSelect={handleDateSelect}
            onMonthChange={setMonth}
            selectedDate={selectedDate}
          />
        </>
      )}

      {step === "timeslots" && selectedDate && (
        <>
          <h2 className="font-bold text-xl">
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <TimeslotList
            availability={availability}
            blockedTimes={blockedTimes}
            date={selectedDate}
            meetingDuration={meetingDuration}
            onTimeSelect={handleTimeSelect}
            selectedTime={selectedTime}
          />
          <button
            className="w-full rounded border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => setStep("calendar")}
            type="button"
          >
            Back
          </button>
        </>
      )}

      {step === "form" && selectedDate && selectedTime && (
        <>
          <h2 className="font-bold text-xl">Complete Your Booking</h2>
          <div className="space-y-2 rounded bg-gray-50 p-4 text-sm">
            <p>
              <strong>Date:</strong> {selectedDate.toLocaleDateString()}
            </p>
            <p>
              <strong>Time:</strong> {selectedTime}
            </p>
            {requiresPayment && paymentAmount && (
              <p>
                <strong>Payment:</strong>{" "}
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: paymentCurrency,
                }).format(paymentAmount / 100)}
              </p>
            )}
          </div>
          <EmailForm
            date={formatDate(selectedDate)}
            onSuccess={handleFormSuccess}
            organizerUserId={organizerUserId}
            paymentAmount={requiresPayment ? paymentAmount : undefined}
            paymentCurrency={requiresPayment ? paymentCurrency : undefined}
            paypalOrdersUrl={requiresPayment ? `${submitUrl}/paypal/orders` : undefined}
            submitUrl={`${submitUrl}/bookings`}
            time={selectedTime}
          />
          <button
            className="w-full rounded border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => setStep("timeslots")}
            type="button"
          >
            Back
          </button>
        </>
      )}

      {step === "payment" && pendingPayment && paypalClientId && selectedDate && selectedTime && (
        <>
          <h2 className="font-bold text-xl">Complete Payment</h2>
          <div className="space-y-1 rounded bg-gray-50 p-4 text-sm">
            <p>
              <strong>Date:</strong> {selectedDate.toLocaleDateString()}
            </p>
            <p>
              <strong>Time:</strong> {selectedTime}
            </p>
          </div>

          {paymentError && (
            <div className="rounded bg-red-50 p-3 text-red-700 text-sm">
              {paymentError}
            </div>
          )}

          <PaymentForm
            amount={paymentAmount ?? 0}
            cancelUrl={`${submitUrl}/booking-cancelled`}
            currency={paymentCurrency}
            onError={handlePaymentError}
            onSuccess={handlePaymentSuccess}
            orderId={pendingPayment.orderId}
            organizerUserId={organizerUserId ?? ""}
            paypalCaptureUrl={`${submitUrl}/paypal/capture`}
            paypalClientId={paypalClientId}
          />

          <button
            className="w-full rounded border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
            onClick={handleReset}
            type="button"
          >
            Cancel and start over
          </button>
        </>
      )}

      {step === "success" && (
        <>
          <div className="space-y-4 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <span className="text-green-600 text-xl">✓</span>
            </div>
            <h2 className="font-bold text-xl">Booking Confirmed!</h2>
            <p className="text-gray-600">
              Check your email for booking details and confirmation.
            </p>
          </div>
          <button
            className="w-full rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
            onClick={handleReset}
            type="button"
          >
            Book Another Time
          </button>
        </>
      )}
    </div>
  );
}
