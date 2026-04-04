"use client";

import { useState } from "react";
import { Button } from "@yellow/ui/components/button";
import { Input } from "@yellow/ui/components/input";
import { Label } from "@yellow/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@yellow/ui/components/card";
import { useMutation } from "convex/react";
import { api } from "@yellow/backend/convex/_generated/api";
import { toast } from "sonner";

interface EventTypeFormProps {
  onSuccess?: () => void;
}

export default function EventTypeForm({ onSuccess }: EventTypeFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [isPaymentRequired, setIsPaymentRequired] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createEventType = useMutation(api.eventTypes.createEventType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Event type name is required");
      return;
    }

    if (isPaymentRequired && !paymentAmount.trim()) {
      toast.error("Payment amount is required when payment is enabled");
      return;
    }

    setIsLoading(true);
    try {
      const amount = isPaymentRequired ? parseFloat(paymentAmount) : undefined;
      if (isPaymentRequired && (isNaN(amount || 0) || (amount || 0) <= 0)) {
        toast.error("Payment amount must be a valid positive number");
        return;
      }

      await createEventType({
        name,
        description: description || undefined,
        durationMinutes: parseInt(durationMinutes) || 30,
        isPaymentRequired,
        paymentAmount: amount,
        paymentCurrency: "usd",
      });

      toast.success("Event type created successfully!");
      setName("");
      setDescription("");
      setDurationMinutes("30");
      setIsPaymentRequired(false);
      setPaymentAmount("");
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create event type";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Event Type</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="event-name">Event Name</Label>
            <Input
              id="event-name"
              placeholder="e.g., Consultation"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Description</Label>
            <Input
              id="event-description"
              placeholder="Describe the event"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-duration">Duration (minutes)</Label>
            <Input
              id="event-duration"
              placeholder="30"
              type="number"
              min="15"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isPaymentRequired}
                onChange={(e) => setIsPaymentRequired(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm">Require payment for this event</span>
            </label>
          </div>

          {isPaymentRequired && (
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Payment Amount (USD)</Label>
              <Input
                id="payment-amount"
                placeholder="99.99"
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Event Type"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
