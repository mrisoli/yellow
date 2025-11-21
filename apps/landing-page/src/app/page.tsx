import { AppLinkButton } from "@/components/app-link-button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 font-bold text-4xl">Welcome to yellow</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Modern task management for teams
        </p>
        <AppLinkButton />
      </div>
    </div>
  );
}
