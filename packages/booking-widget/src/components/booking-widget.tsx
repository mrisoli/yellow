import { useState } from "react";
import { cn, formatDate } from "../lib/utils";
import type { BookingWidgetProps } from "../types";
import { Calendar } from "./calendar";
import { EmailForm } from "./email-form";
import { TimeslotList } from "./timeslot-list";

type Step = "calendar" | "timeslots" | "form" | "success";

export function BookingWidget({
  defaultDate,
  defaultMonth,
  meetingDuration = 30,
  blockedTimes,
  submitUrl = "http://localhost:3000/bookings",
  className,
}: BookingWidgetProps) {
  const [step, setStep] = useState<Step>("calendar");
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    defaultDate || null
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [month, setMonth] = useState<Date>(defaultMonth || new Date());

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setStep("timeslots");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep("form");
  };

  const handleSuccess = () => {
    setStep("success");
  };

  const handleReset = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setMonth(defaultMonth || new Date());
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
          </div>
          <EmailForm
            date={formatDate(selectedDate)}
            onSuccess={handleSuccess}
            submitUrl={submitUrl}
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
