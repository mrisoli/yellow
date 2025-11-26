import { landing, welcome } from "@yellow/i18n/messages";
import { AppLinkButton } from "@/components/app-link-button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 font-bold text-4xl">{welcome()}</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          {landing.tagline()}
        </p>
        <AppLinkButton />
      </div>
    </div>
  );
}
