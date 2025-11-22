import { Button } from "@yellow/ui";
import { getAppUrl } from "@/lib/get-app-url";

export function AppLinkButton() {
  const appUrl = getAppUrl();

  return (
    <Button asChild size="lg">
      <a href={appUrl}>Go to App</a>
    </Button>
  );
}
