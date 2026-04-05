"use client";

import { api } from "@yellow/backend/convex/_generated/api";
import { Button } from "@yellow/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@yellow/ui/components/card";
import { Input } from "@yellow/ui/components/input";
import { Label } from "@yellow/ui/components/label";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

interface StripeConnectionProps {
  onConnected?: () => void;
}

export default function StripeConnection({
  onConnected,
}: StripeConnectionProps) {
  const [stripeAccountId, setStripeAccountId] = useState("");
  const [publishableKey, setPublishableKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const stripeAccount = useQuery(api.stripeAccount.getStripeAccount);
  const createAccount = useMutation(api.stripeAccount.createStripeAccount);
  const disconnect = useMutation(api.stripeAccount.disconnectStripeAccount);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(stripeAccountId.trim() && publishableKey.trim())) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await createAccount({
        stripeAccountId,
        stripePublishableKey: publishableKey,
      });
      toast.success("Stripe account connected successfully!");
      setStripeAccountId("");
      setPublishableKey("");
      onConnected?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect Stripe";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await disconnect();
      toast.success("Stripe account disconnected");
      onConnected?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to disconnect";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (stripeAccount?.isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stripe Account</CardTitle>
          <CardDescription>Your Stripe account is connected</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Account ID</Label>
            <Input disabled type="text" value={stripeAccount.stripeAccountId} />
          </div>
          <Button
            disabled={isLoading}
            onClick={handleDisconnect}
            variant="destructive"
          >
            {isLoading ? "Disconnecting..." : "Disconnect Stripe"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stripe Account</CardTitle>
        <CardDescription>
          Connect your Stripe account to accept payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleConnect}>
          <div className="space-y-2">
            <Label htmlFor="stripe-account-id">Stripe Account ID</Label>
            <Input
              disabled={isLoading}
              id="stripe-account-id"
              onChange={(e) => setStripeAccountId(e.target.value)}
              placeholder="acct_..."
              type="text"
              value={stripeAccountId}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe-key">Publishable Key</Label>
            <Input
              disabled={isLoading}
              id="stripe-key"
              onChange={(e) => setPublishableKey(e.target.value)}
              placeholder="pk_live_... or pk_test_..."
              type="password"
              value={publishableKey}
            />
          </div>

          <Button disabled={isLoading} type="submit">
            {isLoading ? "Connecting..." : "Connect Stripe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
