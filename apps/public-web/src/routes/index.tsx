import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@yellow/ui/components/button";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex min-h-[calc(100vh-70px)] flex-col items-center justify-center px-4">
      <div className="max-w-2xl space-y-6 text-center">
        <h1 className="font-bold text-5xl">Welcome to yellow</h1>
        <p className="text-gray-600 text-xl dark:text-gray-400">
          A modern appointment scheduling application. Book your meetings with
          ease.
        </p>

        <div className="flex justify-center gap-4 pt-4">
          <Link to="/login">
            <Button size="lg" variant="default">
              Sign In
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="lg" variant="outline">
              Create Account
            </Button>
          </Link>
        </div>

        <div className="mt-12 border-t pt-8">
          <h2 className="mb-4 font-semibold text-2xl">Features</h2>
          <ul className="mx-auto max-w-md space-y-2 text-left">
            <li>✓ Easy appointment scheduling</li>
            <li>✓ Real-time availability</li>
            <li>✓ Customizable time slots</li>
            <li>✓ Block busy times</li>
            <li>✓ Professional calendar interface</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
