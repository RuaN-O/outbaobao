import { describe, expect, it } from "vitest";
import { isArticlePublic, normalizeArticleStatus, sortArticles } from "@/lib/articles";

describe("article visibility", () => {
  it("hides drafts", () => {
    expect(
      isArticlePublic({ status: "DRAFT", publishedAt: new Date("2026-05-13T10:00:00Z") }, new Date("2026-05-13T12:00:00Z")),
    ).toBe(false);
  });

  it("publishes scheduled articles only when their time arrives", () => {
    const now = new Date("2026-05-13T12:00:00Z");

    expect(
      isArticlePublic({ status: "SCHEDULED", publishedAt: new Date("2026-05-13T13:00:00Z") }, now),
    ).toBe(false);
  });

  it("sorts pinned articles before others", () => {
    const result = sortArticles([
      { id: "b", isPinned: false, publishedAt: new Date("2026-05-13T10:00:00Z") },
      { id: "a", isPinned: true, publishedAt: new Date("2026-05-13T09:00:00Z") },
    ]);

    expect(result.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("normalizes scheduled publishing state", () => {
    const scheduledFor = new Date("2026-05-15T09:00:00Z");

    expect(
      normalizeArticleStatus({
        action: "schedule",
        scheduledFor,
      }),
    ).toEqual({
      status: "SCHEDULED",
      publishedAt: scheduledFor,
    });
  });
});
