import { listSharedArticles, type ArticleStatus } from "@/lib/admin-articles";

type VisibilityArticle = {
  status: ArticleStatus;
  publishedAt: Date | null;
};

type SortableArticle = {
  id: string;
  isPinned: boolean;
  publishedAt: Date | null;
};

export type PublicArticle = SortableArticle & {
  slug: string;
  title: string;
  summary: string;
  summaryImagePath: string | null;
  contentHtml: string;
  coverImagePath: string | null;
  shareTitle?: string | null;
  shareDescription?: string | null;
  shareImagePath?: string | null;
  status: ArticleStatus;
  tags: string[];
};

function parseDateValue(value: string) {
  return value ? new Date(value) : null;
}

function toPublicArticle(record: Awaited<ReturnType<typeof listSharedArticles>>[number]): PublicArticle {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    summaryImagePath: record.summaryImagePath || null,
    contentHtml: record.contentHtml,
    coverImagePath: record.coverImagePath || null,
    shareTitle: record.shareTitle || null,
    shareDescription: record.shareDescription || null,
    shareImagePath: record.shareImagePath || null,
    status: record.status,
    isPinned: record.isPinned,
    publishedAt: parseDateValue(record.publishedAt),
    tags: record.tags,
  };
}

export function isArticlePublic(article: VisibilityArticle, now: Date): boolean {
  if (article.status === "DRAFT") {
    return false;
  }

  if (article.status === "PUBLISHED") {
    return true;
  }

  return Boolean(article.publishedAt && article.publishedAt <= now);
}

export function sortArticles<T extends SortableArticle>(articles: T[]): T[] {
  return [...articles].sort((left, right) => {
    if (left.isPinned !== right.isPinned) {
      return left.isPinned ? -1 : 1;
    }

    const leftTime = left.publishedAt?.getTime() ?? 0;
    const rightTime = right.publishedAt?.getTime() ?? 0;

    return rightTime - leftTime;
  });
}

type ListPublicArticlesParams = {
  q?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
  now?: Date;
};

export async function listPublicArticles({
  q,
  tag,
  page = 1,
  pageSize = 10,
  now = new Date(),
}: ListPublicArticlesParams) {
  const normalizedQuery = q?.trim().toLowerCase();
  const normalizedTag = tag?.trim();
  const visibleArticles = (await listSharedArticles()).map(toPublicArticle).filter((article) => isArticlePublic(article, now));
  const filteredArticles = visibleArticles.filter((article) => {
    const matchesTag = normalizedTag ? article.tags.includes(normalizedTag) : true;
    const matchesQuery = normalizedQuery
      ? [article.title, article.summary].some((value) => value.toLowerCase().includes(normalizedQuery))
      : true;

    return matchesTag && matchesQuery;
  });
  const sortedArticles = sortArticles(filteredArticles);
  const total = sortedArticles.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = Math.max(page - 1, 0) * pageSize;

  return {
    articles: sortedArticles.slice(start, start + pageSize),
    total,
    totalPages,
    page,
  };
}

export async function getPublicArticleBySlug(slug: string, now = new Date()): Promise<PublicArticle | null> {
  const article = (await listSharedArticles()).map(toPublicArticle).find((item) => item.slug === slug);

  if (!article || !isArticlePublic(article, now)) {
    return null;
  }

  return article;
}

export async function listPublicTags(now = new Date()): Promise<string[]> {
  const tags = new Set<string>();

  for (const article of (await listSharedArticles()).map(toPublicArticle)) {
    if (isArticlePublic(article, now)) {
      article.tags.forEach((tag) => tags.add(tag));
    }
  }

  return [...tags];
}

export function normalizeArticleStatus(input: {
  action: "draft" | "publish" | "schedule";
  scheduledFor?: Date | null;
}) {
  if (input.action === "draft") {
    return {
      status: "DRAFT" as const,
      publishedAt: null,
    };
  }

  if (input.action === "publish") {
    return {
      status: "PUBLISHED" as const,
      publishedAt: new Date(),
    };
  }

  return {
    status: "SCHEDULED" as const,
    publishedAt: input.scheduledFor ?? null,
  };
}
