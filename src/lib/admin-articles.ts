import type { ArticleStatus as PrismaArticleStatus, Prisma, PrismaClient } from "@prisma/client";
import {
  type ArticleContentBlock,
  flattenArticleInlineImages,
  mergeArticleContentHtml,
  parseArticleContentBlocks,
  serializeArticleContentBlocks,
} from "@/lib/content-blocks";
import { db } from "@/lib/db";

export type ArticleStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED";

export type AdminArticleRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  summaryImagePath: string;
  tags: string[];
  contentBlocks: ArticleContentBlock[];
  contentHtml: string;
  inlineImages: string[];
  shareTitle: string;
  shareDescription: string;
  shareImagePath: string;
  coverImagePath: string;
  status: ArticleStatus;
  isPinned: boolean;
  publishedAt: string;
  scheduledFor: string;
  createdAt: string;
  updatedAt: string;
};

type CreateAdminArticleInput = Pick<
  AdminArticleRecord,
  | "title"
  | "summary"
  | "summaryImagePath"
  | "tags"
  | "contentBlocks"
  | "contentHtml"
  | "inlineImages"
  | "shareTitle"
  | "shareDescription"
  | "shareImagePath"
  | "coverImagePath"
  | "status"
  | "publishedAt"
  | "scheduledFor"
> & {
  isPinned?: boolean;
};

type UpdateAdminArticleInput = Pick<
  AdminArticleRecord,
  | "title"
  | "summary"
  | "summaryImagePath"
  | "tags"
  | "contentBlocks"
  | "contentHtml"
  | "inlineImages"
  | "shareTitle"
  | "shareDescription"
  | "shareImagePath"
  | "status"
  | "publishedAt"
  | "scheduledFor"
>;

const defaultArticles: AdminArticleRecord[] = [
  {
    id: "notice-1",
    slug: "launch-notice",
    title: "通知",
    summary: "公告板首版已经可访问，后续会持续补充内容。",
    summaryImagePath: "",
    tags: ["公告"],
    contentBlocks: [
      {
        id: "notice-1-block-1",
        html: "<p>公告板首版已经上线，后续将持续更新内容与功能。</p>",
        inlineImages: [],
      },
    ],
    contentHtml: "<p>公告板首版已经上线，后续将持续更新内容与功能。</p>",
    inlineImages: [],
    shareTitle: "",
    shareDescription: "",
    shareImagePath: "",
    coverImagePath: "",
    status: "PUBLISHED",
    isPinned: true,
    publishedAt: "2026-05-14T01:00:00.000Z",
    scheduledFor: "",
    createdAt: "2026-05-14T00:50:00.000Z",
    updatedAt: "2026-05-14T01:00:00.000Z",
  },
  {
    id: "example-id",
    slug: "example-article",
    title: "示例文章",
    summary: "这是一篇用于详情页、分享卡片和后台编辑验证的示例文章。",
    summaryImagePath: "/uploads/example-summary.svg",
    tags: ["示例"],
    contentBlocks: [
      {
        id: "example-id-block-1",
        html: "<p>这是一篇用于详情页、分享卡片和后台编辑验证的示例文章。</p>",
        inlineImages: ["/uploads/example-inline.png"],
      },
    ],
    contentHtml: "<p>这是一篇用于详情页、分享卡片和后台编辑验证的示例文章。</p>",
    inlineImages: ["/uploads/example-inline.png"],
    shareTitle: "示例文章分享标题",
    shareDescription: "这是一段分享摘要。",
    shareImagePath: "",
    coverImagePath: "",
    status: "PUBLISHED",
    isPinned: false,
    publishedAt: "2026-05-13T02:00:00.000Z",
    scheduledFor: "",
    createdAt: "2026-05-13T01:30:00.000Z",
    updatedAt: "2026-05-13T02:00:00.000Z",
  },
  {
    id: "draft-1",
    slug: "draft-article",
    title: "草稿文章",
    summary: "这篇文章不应该出现在公开站点。",
    summaryImagePath: "",
    tags: ["草稿"],
    contentBlocks: [
      {
        id: "draft-1-block-1",
        html: "<p>这篇文章不应该出现在公开站点。</p>",
        inlineImages: [],
      },
    ],
    contentHtml: "<p>这篇文章不应该出现在公开站点。</p>",
    inlineImages: [],
    shareTitle: "",
    shareDescription: "",
    shareImagePath: "",
    coverImagePath: "",
    status: "DRAFT",
    isPinned: false,
    publishedAt: "",
    scheduledFor: "",
    createdAt: "2026-05-13T00:30:00.000Z",
    updatedAt: "2026-05-13T00:30:00.000Z",
  },
];

type PersistedArticle = Prisma.ArticleGetPayload<{
  include: {
    tags: {
      include: {
        tag: true;
      };
    };
  };
}>;

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : "";
}

function parseInlineImages(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function normalizeOptionalString(value: string) {
  return value.trim();
}

function slugifyTitle(title: string) {
  const normalized = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || `article-${Date.now()}`;
}

function toAdminArticleRecord(article: PersistedArticle): AdminArticleRecord {
  const inlineImages = parseInlineImages(article.inlineImagesJson);
  const contentBlocks = parseArticleContentBlocks(article.contentBlocksJson, article.contentHtml, inlineImages);

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    summaryImagePath: article.summaryImagePath ?? "",
    tags: article.tags.map((item) => item.tag.name),
    contentBlocks,
    contentHtml: mergeArticleContentHtml(contentBlocks),
    inlineImages: flattenArticleInlineImages(contentBlocks),
    shareTitle: article.shareTitle ?? "",
    shareDescription: article.shareDescription ?? "",
    shareImagePath: article.shareImagePath ?? "",
    coverImagePath: article.coverImagePath ?? "",
    status: article.status,
    isPinned: article.isPinned,
    publishedAt: toIsoString(article.publishedAt),
    scheduledFor: toIsoString(article.scheduledFor),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
}

async function ensureUniqueSlug(client: PrismaClient | Prisma.TransactionClient, baseSlug: string, excludedId?: string) {
  let slug = baseSlug;
  let suffix = 2;

  while (
    await client.article.findFirst({
      where: {
        slug,
        ...(excludedId ? { NOT: { id: excludedId } } : {}),
      },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function replaceArticleTags(client: PrismaClient | Prisma.TransactionClient, articleId: string, tags: string[]) {
  await client.articleTag.deleteMany({ where: { articleId } });

  for (const rawTag of tags) {
    const name = rawTag.trim();

    if (!name) {
      continue;
    }

    const tag = await client.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    await client.articleTag.create({
      data: {
        articleId,
        tagId: tag.id,
      },
    });
  }
}

async function seedDefaultArticlesIfNeeded() {
  const count = await db.article.count();

  if (count > 0) {
    return;
  }

  await db.$transaction(async (tx) => {
    for (const article of defaultArticles) {
      await tx.article.create({
        data: {
          id: article.id,
          slug: article.slug,
          title: article.title,
          summary: article.summary,
          summaryImagePath: article.summaryImagePath || null,
          contentHtml: article.contentHtml,
          contentBlocksJson: serializeArticleContentBlocks(article.contentBlocks),
          inlineImagesJson: JSON.stringify(article.inlineImages),
          coverImagePath: article.coverImagePath || null,
          shareTitle: article.shareTitle || null,
          shareDescription: article.shareDescription || null,
          shareImagePath: article.shareImagePath || null,
          status: article.status as PrismaArticleStatus,
          isPinned: article.isPinned,
          publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
          scheduledFor: article.scheduledFor ? new Date(article.scheduledFor) : null,
          createdAt: new Date(article.createdAt),
          updatedAt: new Date(article.updatedAt),
        },
      });

      await replaceArticleTags(tx, article.id, article.tags);
    }
  });
}

async function findArticleById(id: string) {
  await seedDefaultArticlesIfNeeded();

  return db.article.findUnique({
    where: { id },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
}

export async function listAdminArticles() {
  await seedDefaultArticlesIfNeeded();

  const articles = await db.article.findMany({
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return articles.map(toAdminArticleRecord);
}

export async function getAdminArticleById(id: string): Promise<AdminArticleRecord | null> {
  const article = await findArticleById(id);
  return article ? toAdminArticleRecord(article) : null;
}

export async function listSharedArticles() {
  return listAdminArticles();
}

export async function createAdminArticle(input: CreateAdminArticleInput): Promise<AdminArticleRecord> {
  await seedDefaultArticlesIfNeeded();

  const article = await db.$transaction(async (tx) => {
    const baseSlug = slugifyTitle(input.title);
    const slug = await ensureUniqueSlug(tx, baseSlug);
    const created = await tx.article.create({
      data: {
        slug,
        title: input.title.trim(),
        summary: input.summary.trim(),
        summaryImagePath: normalizeOptionalString(input.summaryImagePath) || null,
        contentHtml: mergeArticleContentHtml(input.contentBlocks),
        contentBlocksJson: serializeArticleContentBlocks(input.contentBlocks),
        inlineImagesJson: JSON.stringify(flattenArticleInlineImages(input.contentBlocks)),
        coverImagePath: normalizeOptionalString(input.coverImagePath) || null,
        shareTitle: normalizeOptionalString(input.shareTitle) || null,
        shareDescription: normalizeOptionalString(input.shareDescription) || null,
        shareImagePath: normalizeOptionalString(input.shareImagePath) || null,
        status: input.status as PrismaArticleStatus,
        isPinned: input.isPinned ?? false,
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    await replaceArticleTags(tx, created.id, input.tags);

    const hydrated = await tx.article.findUniqueOrThrow({
      where: { id: created.id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return hydrated;
  });

  return toAdminArticleRecord(article);
}

export async function updateAdminArticle(id: string, updates: UpdateAdminArticleInput): Promise<AdminArticleRecord | null> {
  const existing = await findArticleById(id);

  if (!existing) {
    return null;
  }

  const article = await db.$transaction(async (tx) => {
    await tx.article.update({
      where: { id },
      data: {
        title: updates.title.trim(),
        summary: updates.summary.trim(),
        summaryImagePath: normalizeOptionalString(updates.summaryImagePath) || null,
        contentHtml: mergeArticleContentHtml(updates.contentBlocks),
        contentBlocksJson: serializeArticleContentBlocks(updates.contentBlocks),
        inlineImagesJson: JSON.stringify(flattenArticleInlineImages(updates.contentBlocks)),
        shareTitle: normalizeOptionalString(updates.shareTitle) || null,
        shareDescription: normalizeOptionalString(updates.shareDescription) || null,
        shareImagePath: normalizeOptionalString(updates.shareImagePath) || null,
        status: updates.status as PrismaArticleStatus,
        publishedAt: updates.publishedAt ? new Date(updates.publishedAt) : null,
        scheduledFor: updates.scheduledFor ? new Date(updates.scheduledFor) : null,
      },
    });

    await replaceArticleTags(tx, id, updates.tags);

    return tx.article.findUniqueOrThrow({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  });

  return toAdminArticleRecord(article);
}

export async function deleteAdminArticle(id: string): Promise<boolean> {
  const existing = await findArticleById(id);

  if (!existing) {
    return false;
  }

  await db.$transaction(async (tx) => {
    await tx.article.delete({
      where: { id },
    });

    await tx.tag.deleteMany({
      where: {
        articles: {
          none: {},
        },
      },
    });
  });

  return true;
}
