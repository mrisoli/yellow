export function getAppUrl(): string {
  // Use environment variable (NEXT_PUBLIC_APP_URL)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Production fallback - construct from current domain
  if (typeof window !== "undefined") {
    const host = window.location.host;
    const protocol = window.location.protocol;
    return `${protocol}//app.${host}`;
  }

  // Server-side production fallback
  return "https://app.example.com";
}
