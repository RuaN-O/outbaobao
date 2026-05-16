import { describe, expect, it } from "vitest";
import { createQrCodeSvg } from "@/lib/qr-code";
import { resolveShareFields } from "@/lib/share";

describe("share field fallback", () => {
  it("prefers article-level overrides", () => {
    const result = resolveShareFields(
      {
        title: "文章标题",
        summary: "文章摘要",
        coverImagePath: "/uploads/cover.png",
        shareTitle: "分享标题",
        shareDescription: "分享摘要",
        shareImagePath: "/uploads/share.png",
      },
      "https://jss309309.com",
    );

    expect(result.title).toBe("分享标题");
    expect(result.description).toBe("分享摘要");
    expect(result.image).toBe("https://jss309309.com/uploads/share.png");
  });

  it("falls back to the article cover image before the default share image", () => {
    const result = resolveShareFields(
      {
        title: "文章标题",
        summary: "文章摘要",
        coverImagePath: "/uploads/cover.png",
        shareTitle: "",
        shareDescription: "",
        shareImagePath: "",
      },
      "https://jss309309.com",
    );

    expect(result.image).toBe("https://jss309309.com/uploads/cover.png");
  });

  it("uses the blank default share image when no other share image is available", () => {
    const result = resolveShareFields(
      {
        title: "文章标题",
        summary: "文章摘要",
        coverImagePath: null,
        shareTitle: "",
        shareDescription: "",
        shareImagePath: "",
      },
      "https://jss309309.com",
    );

    expect(result.image).toBe("https://jss309309.com/uploads/blank-image.png");
  });

  it("creates SVG markup for article QR codes", async () => {
    const svg = await createQrCodeSvg("https://example.com/articles/example-article");

    expect(svg).toContain("<svg");
    expect(svg).toContain("viewBox");
    expect(svg).toContain("<path");
  });
});
