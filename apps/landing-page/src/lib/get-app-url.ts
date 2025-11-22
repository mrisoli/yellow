export function getAppUrl(): string {
  const isDevelopment = process.env.NODE_ENV === "development";

  // Development mode
  if (isDevelopment) {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return `http://${process.env.NEXT_PUBLIC_APP_URL}`;
    }
    return "http://localhost:3001";
  }

  // Production mode
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `https://app.${process.env.NEXT_PUBLIC_APP_URL}`;
  }

  // Vercel production fallback
  if (process.env.VERCEL_URL) {
    return `https://app.${process.env.VERCEL_URL}`;
  }

  // Final fallback
  return "https://app.example.com";
}
