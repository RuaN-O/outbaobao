function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getAdminPassword(): string {
  return getRequiredEnv("ADMIN_PASSWORD");
}

export function getSessionSecret(): string {
  return getRequiredEnv("SESSION_SECRET");
}

export function getSiteUrl(): string {
  return getRequiredEnv("SITE_URL");
}
