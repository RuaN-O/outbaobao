import { getSiteUrl } from "@/lib/env";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getConfiguredSiteOrigin() {
  return trimTrailingSlash(getSiteUrl());
}

export function getRequestOrigin(request: Request) {
  return trimTrailingSlash(new URL(request.url).origin);
}

export function toAbsoluteUrl(value: string | null | undefined, baseUrl = getConfiguredSiteOrigin()) {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalizedBaseUrl = trimTrailingSlash(baseUrl);
  const normalizedPath = value.startsWith("/") ? value : `/${value}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}
