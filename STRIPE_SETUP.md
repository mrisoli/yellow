# Stripe Payment Integration Setup

This document explains how to set up and use the Stripe payment processing feature for Yellow.

## Prerequisites

- A Stripe account (free tier is available at https://stripe.com)
- Stripe API keys (Secret and Publishable keys)

## Environment Setup

Add the following environment variables to your `.env.local` file:

```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_... (optional, only needed for webhook testing)
```

## Getting Your Stripe Keys

1. Log in to your Stripe dashboard at https://dashboard.stripe.com
2. Navigate to the Developers section (left sidebar)
3. Click "API keys"
4. Copy the Secret Key and Publishable Key
5. For webhook testing, generate a webhook endpoint signing secret

## Features Implemented

### 1. Stripe Account Connection
Users can connect their Stripe account through the Settings page (`/settings`). The connection stores:
- Stripe Account ID
- Stripe Publishable Key
- Connection status

### 2. Event Type Payment Configuration
Users can create event types with optional payment requirements:
- Set payment amount in USD
- Make payment required or optional
- Supports various event durations

### 3. Payment Processing
When a booking is created for a paid event type:
- A Stripe PaymentIntent is created
- Customers receive a payment confirmation
- Payment status is tracked (pending/completed/failed)

### 4. Webhook Handling
Stripe webhooks are automatically processed at the `/stripe` endpoint:
- `payment_intent.succeeded`: Updates booking payment status to completed
- `payment_intent.payment_failed`: Updates booking payment status to failed

## Database Schema

### stripeAccounts
Stores Stripe connection information per user.

```ts
{
  userId: Id<"users">;
  stripeAccountId: string;
  stripePublishableKey: string;
  isConnected: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### eventTypes
Stores event type definitions with optional payment settings.

```ts
{
  userId: Id<"users">;
  name: string;
  description?: string;
  durationMinutes: number;
  isPaymentRequired: boolean;
  paymentAmount?: number;
  paymentCurrency?: string;
  createdAt: number;
  updatedAt: number;
}
```

### bookings
Stores booking records with payment status.

```ts
{
  userId: Id<"users">;
  eventTypeId: Id<"eventTypes">;
  guestEmail: string;
  guestName: string;
  scheduledStartTime: number;
  scheduledEndTime: number;
  paymentStatus?: "pending" | "completed" | "failed";
  stripePaymentIntentId?: string;
  createdAt: number;
  updatedAt: number;
}
```

### paymentConfirmations
Stores payment confirmation records from Stripe webhooks.

```ts
{
  bookingId: Id<"bookings">;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed";
  createdAt: number;
  updatedAt: number;
}
```

## API Functions

### Stripe Account Functions
- `getStripeAccount()`: Retrieve the authenticated user's Stripe account
- `createStripeAccount(stripeAccountId, stripePublishableKey)`: Connect a Stripe account
- `disconnectStripeAccount()`: Disconnect the current Stripe account

### Event Type Functions
- `getEventTypes()`: Retrieve all event types for the authenticated user
- `getEventType(eventTypeId)`: Get a specific event type
- `createEventType(...)`: Create a new event type
- `updateEventType(...)`: Update an existing event type
- `deleteEventType(eventTypeId)`: Delete an event type

### Booking Functions
- `getBookings()`: Retrieve all bookings for the authenticated user
- `getBooking(bookingId)`: Get a specific booking
- `createBooking(...)`: Create a new booking
- `createPaymentIntent(bookingId, amount, currency)`: Create a Stripe PaymentIntent
- `updateBookingPaymentStatus(...)`: Update booking payment status
- `getBookingByStripePaymentIntent(stripePaymentIntentId)`: Find a booking by payment intent ID

## Frontend Components

### StripeConnection
Located at `apps/web/src/components/stripe-connection.tsx`
Allows users to connect/disconnect their Stripe account.

### EventTypeForm
Located at `apps/web/src/components/event-type-form.tsx`
Form for creating new event types with optional payment settings.

### EventTypesList
Located at `apps/web/src/components/event-types-list.tsx`
Displays all event types created by the user.

## Testing Payments

To test payment processing without going live:

1. Use Stripe test mode (default when using `sk_test_...` keys)
2. Use Stripe's test card numbers:
   - Success: `4242 4242 4242 4242`
   - Requires authentication: `4000 0025 0000 3155`
   - Declined: `4000 0000 0000 0002`

For more test cards, see: https://stripe.com/docs/testing

## Going Live

To process real payments:

1. Complete Stripe account activation
2. Update environment variables with live keys (`sk_live_...`)
3. Configure your webhook endpoint in Stripe dashboard
4. Test thoroughly with your live keys before going public

## Security Considerations

- Never expose your Secret Key in frontend code
- Always validate payment status on the server side
- Use HTTPS for all payment-related endpoints
- Store webhook signing secrets securely
- Implement rate limiting for payment endpoints
