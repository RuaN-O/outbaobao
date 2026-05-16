import { getSiteUrl } from "@/lib/env";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getConfiguredSiteOrigin() {
  return trimTrailingSlash(getSiteUrl());
}

export function getRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (host) {
    const protocol = forwardedProto || new URL(request.url).protocol.replace(":", "");
    return trimTrailingSlash(`${protocol}://${host}`);
  }

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
