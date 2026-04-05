"use client";

import { api } from "@yellow/backend/convex/_generated/api";
import { Button } from "@yellow/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@yellow/ui/components/card";
import { Input } from "@yellow/ui/components/input";
import { Label } from "@yellow/ui/components/label";
import { useMutation } from "convex/react";
import { useState } from "react";
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

  const validateFormData = (): boolean => {
    if (!name.trim()) {
      toast.error("Event type name is required");
      return false;
    }

    if (isPaymentRequired && !paymentAmount.trim()) {
      toast.error("Payment amount is required when payment is enabled");
      return false;
    }

    return true;
  };

  const getPaymentAmount = (): number | undefined => {
    if (!isPaymentRequired) {
      return undefined;
    }

    const amount = Number.parseFloat(paymentAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Payment amount must be a valid positive number");
      return undefined;
    }

    return amount;
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setDurationMinutes("30");
    setIsPaymentRequired(false);
    setPaymentAmount("");
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateFormData()) {
      return;
    }

    const amount = getPaymentAmount();
    if (isPaymentRequired && amount === undefined) {
      return;
    }

    setIsLoading(true);
    try {
      await createEventType({
        name,
        description: description || undefined,
        durationMinutes: Number.parseInt(durationMinutes, 10) || 30,
        isPaymentRequired,
        paymentAmount: amount,
        paymentCurrency: "usd",
      });

      toast.success("Event type created successfully!");
      resetForm();
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
              disabled={isLoading}
              id="event-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Consultation"
              type="text"
              value={name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Description</Label>
            <Input
              disabled={isLoading}
              id="event-description"
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the event"
              type="text"
              value={description}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-duration">Duration (minutes)</Label>
            <Input
              disabled={isLoading}
              id="event-duration"
              min="15"
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="30"
              type="number"
              value={durationMinutes}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                checked={isPaymentRequired}
                className="h-4 w-4 rounded"
                disabled={isLoading}
                onChange={(e) => setIsPaymentRequired(e.target.checked)}
                type="checkbox"
              />
              <span className="text-sm">Require payment for this event</span>
            </label>
          </div>

          {isPaymentRequired && (
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Payment Amount (USD)</Label>
              <Input
                disabled={isLoading}
                id="payment-amount"
                min="0"
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="99.99"
                step="0.01"
                type="number"
                value={paymentAmount}
              />
            </div>
          )}

          <Button disabled={isLoading} type="submit">
            {isLoading ? "Creating..." : "Create Event Type"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
