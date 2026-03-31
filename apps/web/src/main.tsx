import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { env } from "@yellow/env/web";
import {
  Authenticated,
  AuthLoading,
  ConvexReactClient,
  Unauthenticated,
} from "convex/react";
import { useEffect } from "react";
import ReactDOM from "react-dom/client";

import { authClient } from "@/lib/auth-client";

import Loader from "./components/loader";
import { routeTree } from "./routeTree.gen";

const convex = new ConvexReactClient(env.VITE_CONVEX_URL);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingComponent: () => <Loader />,
  context: {},
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function AppWrapper() {
  return (
    <>
      <AuthLoading>
        <div className="flex h-screen items-center justify-center">
          <Loader />
        </div>
      </AuthLoading>
      <Authenticated>
        <RouterProvider router={router} />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedRedirect />
      </Unauthenticated>
    </>
  );
}

function UnauthenticatedRedirect() {
  useEffect(() => {
    const publicWebUrl =
      import.meta.env.VITE_PUBLIC_WEB_URL || "http://localhost:3000";
    window.location.href = `${publicWebUrl}/login`;
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h2 className="font-bold text-2xl">Please log in</h2>
        <p className="text-gray-600">Redirecting to login page...</p>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ConvexBetterAuthProvider authClient={authClient} client={convex}>
      <AppWrapper />
    </ConvexBetterAuthProvider>
  );
}
