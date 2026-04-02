import { createFileRoute } from "@tanstack/react-router";
import { api } from "@yellow/backend/convex/_generated/api";
import { useQuery } from "convex/react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const TITLE_TEXT = "better-t-stack";

function HomeComponent() {
  const healthCheck = useQuery(api.healthCheck.get);

  let statusColor = "bg-red-500";
  let statusText = "Error";

  if (healthCheck === "OK") {
    statusColor = "bg-green-500";
    statusText = "Connected";
  } else if (healthCheck === undefined) {
    statusColor = "bg-orange-400";
    statusText = "Checking...";
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
      <div className="grid gap-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">API Status</h2>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${statusColor}`} />
            <span className="text-muted-foreground text-sm">{statusText}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
