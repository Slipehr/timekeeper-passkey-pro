export function getBaseUrl(): string {
  const origin = window.location.origin;
  if (origin.startsWith("https://time.krilee.se")) return "https://time-api.krilee.se";
  if (origin.startsWith("http://192.168.11.3:3000")) return "http://192.168.11.3:8200";
  if (origin.includes("lovableproject.com")) return "https://time-api.krilee.se";
  return "http://192.168.11.3:8200";
}
