import { createFileRoute } from "@tanstack/react-router";
import { BookingWidget } from "@yellow/booking-widget";

export const Route = createFileRoute("/booking")({
  component: BookingPage,
});

function BookingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <BookingWidget />
    </div>
  );
}
