import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-70px)] flex-col items-center justify-center">
      {isSignUp ? (
        <SignUpForm onSwitchToSignIn={() => setIsSignUp(false)} />
      ) : (
        <SignInForm onSwitchToSignUp={() => setIsSignUp(true)} />
      )}
    </div>
  );
}
