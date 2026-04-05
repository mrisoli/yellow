import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";

interface PaymentFormProps {
  /** Amount in cents (e.g. 5000 = $50.00). */
  amount: number;
  cancelUrl: string;
  className?: string;
  currency: string;
  onError?: (message: string) => void;
  onSuccess?: () => void;
  orderId: string;
  /** The PayPal client ID used to load the JS SDK. */
  paypalClientId: string;
  /** The endpoint to call when capturing an approved PayPal payment. */
  paypalCaptureUrl: string;
  /** The organizer's user ID, sent along with the capture request. */
  organizerUserId: string;
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError: (err: unknown) => void;
        onCancel: () => void;
      }) => { render: (container: HTMLElement) => Promise<void> };
    };
  }
}

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function loadPayPalScript(clientId: string, currency: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[data-paypal-sdk]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load PayPal SDK")));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}`;
    script.dataset.paypalSdk = "true";
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () =>
      reject(new Error("Failed to load PayPal SDK"))
    );
    document.head.appendChild(script);
  });
}

export function PaymentForm({
  amount,
  currency,
  orderId,
  paypalClientId,
  paypalCaptureUrl,
  organizerUserId,
  onSuccess,
  onError,
  className,
}: PaymentFormProps) {
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await loadPayPalScript(paypalClientId, currency);

        if (cancelled || !buttonContainerRef.current || !window.paypal) {
          return;
        }

        setIsLoading(false);

        // Clear any previous buttons
        buttonContainerRef.current.innerHTML = "";

        await window.paypal
          .Buttons({
            createOrder: () => Promise.resolve(orderId),

            onApprove: async () => {
              setIsCapturing(true);
              try {
                const response = await fetch(paypalCaptureUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId, organizerUserId }),
                });

                if (!response.ok) {
                  throw new Error(
                    `Capture failed with status ${response.status}`
                  );
                }

                const result = (await response.json()) as { status: string };
                if (result.status === "COMPLETED") {
                  onSuccess?.();
                } else {
                  throw new Error(
                    `Unexpected capture status: ${result.status}`
                  );
                }
              } catch (err) {
                const message =
                  err instanceof Error
                    ? err.message
                    : "Payment capture failed";
                onError?.(message);
              } finally {
                setIsCapturing(false);
              }
            },

            onError: (err) => {
              const message =
                err instanceof Error ? err.message : "PayPal encountered an error";
              onError?.(message);
            },

            onCancel: () => {
              onError?.("Payment was cancelled. Your time slot has been held — try again below.");
            },
          })
          .render(buttonContainerRef.current);
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to initialize PayPal";
          setSdkError(message);
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [orderId, paypalClientId, currency, paypalCaptureUrl, organizerUserId, onSuccess, onError]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-center">
        <p className="text-sm text-amber-800 font-medium">Payment required</p>
        <p className="mt-1 font-bold text-2xl text-amber-900">
          {formatAmount(amount, currency)}
        </p>
        <p className="mt-1 text-xs text-amber-700">
          Pay securely with PayPal to confirm your booking
        </p>
      </div>

      {sdkError && (
        <div className="rounded bg-red-50 p-3 text-red-700 text-sm">
          {sdkError}
        </div>
      )}

      {isCapturing && (
        <div className="rounded bg-blue-50 p-3 text-blue-700 text-sm text-center">
          Processing payment…
        </div>
      )}

      {isLoading && !sdkError && (
        <div className="flex items-center justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="ml-2 text-sm text-gray-600">
            Loading PayPal…
          </span>
        </div>
      )}

      <div
        ref={buttonContainerRef}
        aria-label="PayPal payment buttons"
        className={cn(isLoading || sdkError ? "hidden" : "")}
      />
    </div>
  );
}
