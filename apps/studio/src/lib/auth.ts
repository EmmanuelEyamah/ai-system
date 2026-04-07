const DEFAULT_USERNAME = process.env.AUTH_USERNAME || "admin";
const DEFAULT_PASSWORD = process.env.AUTH_PASSWORD || "admin123";
const AUTH_COOKIE = "studio_auth";
const AUTH_TOKEN = "studio_authenticated";

export function validateCredentials(username: string, password: string): boolean {
  return username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD;
}

export function getAuthCookieName(): string {
  return AUTH_COOKIE;
}

export function getAuthToken(): string {
  return AUTH_TOKEN;
}
