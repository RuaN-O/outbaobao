import { NextResponse } from "next/server";
import { deleteAdminArticle, updateAdminArticle } from "@/lib/admin-articles";
import { normalizeArticleContentBlocks } from "@/lib/content-blocks";
import { normalizeArticleStatus } from "@/lib/articles";

function normalizeContentBlocksPayload(payload: {
  contentBlocks?: unknown;
  contentHtml?: unknown;
  inlineImages?: unknown;
}) {
  if (Array.isArray(payload.contentBlocks)) {
    return normalizeArticleContentBlocks(payload.contentBlocks);
  }

  if (typeof payload.contentHtml === "string" && Array.isArray(payload.inlineImages)) {
    return normalizeArticleContentBlocks([
      {
        html: payload.contentHtml,
        inlineImages: payload.inlineImages.filter((image): image is string => typeof image === "string"),
      },
    ]);
  }

  return null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const payload = (await request.json()) as {
    title?: unknown;
    summary?: unknown;
    summaryImagePath?: unknown;
    contentBlocks?: unknown;
    tags?: unknown;
    contentHtml?: unknown;
    inlineImages?: unknown;
    shareTitle?: unknown;
    shareDescription?: unknown;
    shareImagePath?: unknown;
    publishAction?: unknown;
    scheduledFor?: unknown;
  };

  const contentBlocks = normalizeContentBlocksPayload(payload);

  if (
    typeof payload.title !== "string" ||
    typeof payload.summary !== "string" ||
    (typeof payload.summaryImagePath !== "string" && typeof payload.summaryImagePath !== "undefined") ||
    contentBlocks === null ||
    !Array.isArray(payload.tags) ||
    typeof payload.shareTitle !== "string" ||
    typeof payload.shareDescription !== "string" ||
    typeof payload.shareImagePath !== "string" ||
    (payload.publishAction !== "draft" && payload.publishAction !== "publish" && payload.publishAction !== "schedule") ||
    typeof payload.scheduledFor !== "string"
  ) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const normalizedStatus = normalizeArticleStatus({
    action: payload.publishAction,
    scheduledFor: payload.scheduledFor ? new Date(payload.scheduledFor) : null,
  });

  const article = await updateAdminArticle(id, {
    title: payload.title,
    summary: payload.summary,
    summaryImagePath: typeof payload.summaryImagePath === "string" ? payload.summaryImagePath : "",
    tags: payload.tags.filter((tag): tag is string => typeof tag === "string"),
    contentBlocks,
    contentHtml: "",
    inlineImages: [],
    shareTitle: payload.shareTitle,
    shareDescription: payload.shareDescription,
    shareImagePath: payload.shareImagePath,
    status: normalizedStatus.status,
    publishedAt: normalizedStatus.publishedAt?.toISOString() ?? "",
    scheduledFor: payload.scheduledFor,
  });

  if (!article) {
    return NextResponse.json({ message: "Article not found" }, { status: 404 });
  }

  return NextResponse.json(article);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const deleted = await deleteAdminArticle(id);

  if (!deleted) {
    return NextResponse.json({ message: "Article not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
