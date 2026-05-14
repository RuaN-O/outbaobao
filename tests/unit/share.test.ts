import { describe, expect, it } from "vitest";
import { resolveShareFields } from "@/lib/share";

describe("share field fallback", () => {
  it("prefers article-level overrides", () => {
    const result = resolveShareFields({
      title: "文章标题",
      summary: "文章摘要",
      coverImagePath: "/uploads/cover.png",
      shareTitle: "分享标题",
      shareDescription: "分享摘要",
      shareImagePath: "/uploads/share.png",
    });

    expect(result.title).toBe("分享标题");
    expect(result.description).toBe("分享摘要");
    expect(result.image).toBe("/uploads/share.png");
  });
});
