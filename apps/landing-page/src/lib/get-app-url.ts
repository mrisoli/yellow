export function getAppUrl(): string {
  // Use environment variable (NEXT_PUBLIC_APP_URL)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Use Vercel's built-in URL during build time
  if (process.env.VERCEL_URL) {
    return `https://app.${process.env.VERCEL_URL}`;
  }

  // Browser fallback - construct from current domain
  if (typeof window !== "undefined") {
    const host = window.location.host;
    const protocol = window.location.protocol;
    return `${protocol}//app.${host}`;
  }

  // Development fallback
  return "http://localhost:3001";
}
