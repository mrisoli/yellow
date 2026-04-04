"use client";

import { Button } from "@yellow/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@yellow/ui/components/card";
import { useQuery } from "convex/react";
import { api } from "@yellow/backend/convex/_generated/api";

export default function EventTypesList() {
  const eventTypes = useQuery(api.eventTypes.getEventTypes);

  if (eventTypes === undefined) {
    return <div>Loading event types...</div>;
  }

  if (!eventTypes || eventTypes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Types</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No event types created yet. Create one to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Event Types</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {eventTypes.map((eventType) => (
            <div
              key={eventType._id}
              className="border-foreground/10 border-b pb-4 last:border-0"
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{eventType.name}</h3>
                  {eventType.description && (
                    <p className="text-muted-foreground text-sm">
                      {eventType.description}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{eventType.durationMinutes} minutes</span>
                {eventType.isPaymentRequired && (
                  <span>
                    ${eventType.paymentAmount?.toFixed(2)} required
                  </span>
                )}
                {!eventType.isPaymentRequired && (
                  <span>Payment optional</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
