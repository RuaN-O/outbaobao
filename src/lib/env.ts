function getEnv(name: string, fallback?: string): string {
  const value = process.env[name];

  if (value) {
    return value;
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Missing required environment variable: ${name}`);
}

export function getAdminPassword(): string {
  return getEnv("ADMIN_PASSWORD", "secret");
}

export function getSessionSecret(): string {
  return getEnv("SESSION_SECRET", "change-me");
}

export function getSiteUrl(): string {
  return getEnv("SITE_URL", "http://127.0.0.1:3000");
}

export function getDatabaseUrl(): string {
  return getEnv("DATABASE_URL", "file:./dev.db");
}
