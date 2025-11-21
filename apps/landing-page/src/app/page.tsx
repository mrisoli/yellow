import { Button } from "@yellow/ui";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 font-bold text-4xl">Welcome to yellow</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Modern task management for teams
        </p>
        <Button asChild size="lg">
          <a href="https://app.localhost:3001">Go to App</a>
        </Button>
      </div>
    </div>
  );
}
