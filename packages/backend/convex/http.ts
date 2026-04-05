import { httpRouter } from "convex/server";

import { authComponent, createAuth } from "./auth";
import { stripeWebhookHandler } from "./stripe-webhook";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, { cors: true });

http.route({
  pathPrefix: "/stripe",
  handler: stripeWebhookHandler,
});

export default http;
