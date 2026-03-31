import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_CONVEX_URL: z.url(),
    VITE_CONVEX_SITE_URL: z.url(),
    VITE_PUBLIC_WEB_URL: z.string().optional(),
    VITE_WEB_APP_URL: z.string().optional(),
  },
  runtimeEnv: {
    VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL,
    VITE_CONVEX_SITE_URL: import.meta.env.VITE_CONVEX_SITE_URL,
    VITE_PUBLIC_WEB_URL: import.meta.env.VITE_PUBLIC_WEB_URL,
    VITE_WEB_APP_URL: import.meta.env.VITE_WEB_APP_URL,
  },
  emptyStringAsUndefined: true,
});
