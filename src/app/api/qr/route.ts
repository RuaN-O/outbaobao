import type { NextRequest } from "next/server";
import { createQrCodeSvg } from "@/lib/qr-code";

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get("url")?.trim();

  if (!targetUrl) {
    return new Response("Missing url query parameter.", {
      status: 400,
    });
  }

  try {
    const svg = await createQrCodeSvg(targetUrl);

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Failed to generate QR code.", {
      status: 500,
    });
  }
}
