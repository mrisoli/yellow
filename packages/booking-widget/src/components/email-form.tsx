import { useState } from "react";
import { cn } from "../lib/utils";

interface EmailFormProps {
  className?: string;
  date: string;
  onSuccess?: () => void;
  submitUrl: string;
  time: string;
}

export function EmailForm({
  date,
  time,
  submitUrl,
  onSuccess,
  className,
}: EmailFormProps) {
  const [email, setEmail] = useState("");
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
          email,
          date,
          time,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      onSuccess?.();
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={cn("space-y-4", className)} onSubmit={handleSubmit}>
      <div>
        <label
          className="block font-medium text-gray-700 text-sm"
          htmlFor="email"
        >
          Email
        </label>
        <input
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          id="email"
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
          isLoading || !email
            ? "cursor-not-allowed bg-blue-300"
            : "bg-blue-500 hover:bg-blue-600"
        )}
        disabled={isLoading || !email}
        type="submit"
      >
        {isLoading ? "Submitting..." : "Confirm Booking"}
      </button>
    </form>
  );
}
