"use client";
import { api } from "@yellow/backend/convex/_generated/api";
import * as m from "@yellow/i18n/messages";
import { useQuery } from "convex/react";

function getHealthCheckStatus(status: string | undefined) {
  if (status === undefined) {
    return { color: "bg-orange-400", text: m.health.checking() };
  }
  if (status === "OK") {
    return { color: "bg-green-500", text: m.health.connected() };
  }
  return { color: "bg-red-500", text: m.health.error() };
}

export default function Home() {
  const healthCheck = useQuery(api.healthCheck.get);
  const healthStatus = getHealthCheckStatus(healthCheck);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 font-bold text-2xl">{m.welcome()}</h1>
      <section className="rounded-lg border p-4">
        <h2 className="mb-2 font-medium">{m.health.apiStatus()}</h2>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${healthStatus.color}`} />
          <span className="text-muted-foreground text-sm">
            {healthStatus.text}
          </span>
        </div>
      </section>
    </div>
  );
}
