import { getAdminPassword, getSessionSecret } from "@/lib/env";
import type { AdminSession } from "@/lib/session";

const textEncoder = new TextEncoder();

function toBase64Url(value: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8").toString("base64url");
  }

  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "base64url").toString("utf8");
  }

  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  return atob(`${normalized}${padding}`);
}

function constantTimeEquals(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < left.length; index += 1) {
    result |= left[index] ^ right[index];
  }

  return result === 0;
}

async function createSessionSignature(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(payload));

  if (typeof Buffer !== "undefined") {
    return Buffer.from(signature).toString("base64url");
  }

  const bytes = new Uint8Array(signature);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function verifyAdminPassword(expected: string, incoming: string): Promise<boolean> {
  return constantTimeEquals(textEncoder.encode(expected), textEncoder.encode(incoming));
}

export async function verifyConfiguredAdminPassword(incoming: string): Promise<boolean> {
  return verifyAdminPassword(getAdminPassword(), incoming);
}

export async function signAdminSession(
  session: AdminSession,
  secret = getSessionSecret(),
): Promise<string> {
  const payload = toBase64Url(JSON.stringify(session));
  const signature = await createSessionSignature(payload, secret);

  return `${payload}.${signature}`;
}

export async function readAdminSession(
  cookieValue: string,
  secret = getSessionSecret(),
): Promise<AdminSession | null> {
  const [payload, signature] = cookieValue.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = await createSessionSignature(payload, secret);

  if (!constantTimeEquals(textEncoder.encode(signature), textEncoder.encode(expectedSignature))) {
    return null;
  }

  const parsed = JSON.parse(fromBase64Url(payload)) as Partial<AdminSession>;

  if (parsed.isAdmin !== true) {
    return null;
  }

  return { isAdmin: true };
}
