import { NextResponse } from "next/server";
import { deleteAdminArticle, updateAdminArticle } from "@/lib/admin-articles";
import { normalizeArticleStatus } from "@/lib/articles";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const payload = (await request.json()) as {
    title?: unknown;
    summary?: unknown;
    tags?: unknown;
    contentHtml?: unknown;
    inlineImages?: unknown;
    shareTitle?: unknown;
    shareDescription?: unknown;
    shareImagePath?: unknown;
    publishAction?: unknown;
    scheduledFor?: unknown;
  };

  if (
    typeof payload.title !== "string" ||
    typeof payload.summary !== "string" ||
    typeof payload.contentHtml !== "string" ||
    !Array.isArray(payload.tags) ||
    !Array.isArray(payload.inlineImages) ||
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
    tags: payload.tags.filter((tag): tag is string => typeof tag === "string"),
    contentHtml: payload.contentHtml,
    inlineImages: payload.inlineImages.filter((image): image is string => typeof image === "string"),
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
