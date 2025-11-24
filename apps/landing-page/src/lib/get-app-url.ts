export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    return `${protocol}://${process.env.NEXT_PUBLIC_APP_URL}`;
  }

  return "http://localhost:3001";
}
