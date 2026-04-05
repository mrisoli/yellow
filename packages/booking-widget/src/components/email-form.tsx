import { useState } from "react";
import { cn } from "../lib/utils";

interface EmailFormProps {
  className?: string;
  date: string;
  onSuccess?: () => void;
  organizerUserId?: string;
  showPhoneField?: boolean;
  submitUrl: string;
  time: string;
}

export function EmailForm({
  date,
  time,
  submitUrl,
  onSuccess,
  organizerUserId,
  showPhoneField = false,
  className,
}: EmailFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(submitUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attendeeName: name,
          attendeeEmail: email,
          attendeePhone: showPhoneField && phone ? phone : undefined,
          organizerUserId: organizerUserId ?? "",
          date,
          time,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      onSuccess?.();
      setName("");
      setEmail("");
      setPhone("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled = isLoading || !name || !email;

  return (
    <form className={cn("space-y-4", className)} onSubmit={handleSubmit}>
      <div>
        <label
          className="block font-medium text-gray-700 text-sm"
          htmlFor="attendee-name"
        >
          Name
        </label>
        <input
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          id="attendee-name"
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
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

      {showPhoneField && (
        <div>
          <label
            className="block font-medium text-gray-700 text-sm"
            htmlFor="attendee-phone"
          >
            Phone{" "}
            <span className="font-normal text-gray-500">
              (optional, for SMS reminders)
            </span>
          </label>
          <input
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
            id="attendee-phone"
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 000 0000"
            type="tel"
            value={phone}
          />
        </div>
      )}

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
        {isLoading ? "Submitting..." : "Confirm Booking"}
      </button>
    </form>
  );
}
