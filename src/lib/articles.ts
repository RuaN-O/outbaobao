type ArticleStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED";

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
  contentHtml: string;
  coverImagePath: string | null;
  shareTitle?: string | null;
  shareDescription?: string | null;
  shareImagePath?: string | null;
  status: ArticleStatus;
  tags: string[];
};

const SAMPLE_ARTICLES: PublicArticle[] = [
  {
    id: "notice-1",
    slug: "launch-notice",
    title: "通知",
    summary: "公告板首版已经可访问，后续会持续补充内容。",
    contentHtml: "<p>公告板首版已经上线，后续将持续更新内容与功能。</p>",
    coverImagePath: null,
    status: "PUBLISHED",
    isPinned: true,
    publishedAt: new Date("2026-05-14T09:00:00+08:00"),
    shareTitle: null,
    shareDescription: null,
    shareImagePath: null,
    tags: ["公告"],
  },
  {
    id: "article-1",
    slug: "example-article",
    title: "示例文章",
    summary: "这是一篇用于验证详情页和分享元信息的示例文章。",
    contentHtml: "<p>这是一篇用于验证详情页和分享元信息的示例文章。</p>",
    coverImagePath: null,
    status: "PUBLISHED",
    isPinned: false,
    publishedAt: new Date("2026-05-13T10:00:00+08:00"),
    shareTitle: "示例文章分享标题",
    shareDescription: "用于验证分享信息回落逻辑。",
    shareImagePath: null,
    tags: ["示例"],
  },
  {
    id: "draft-1",
    slug: "draft-article",
    title: "草稿文章",
    summary: "这篇文章不应该出现在公开站点。",
    contentHtml: "<p>这篇文章不应该出现在公开站点。</p>",
    coverImagePath: null,
    status: "DRAFT",
    isPinned: false,
    publishedAt: new Date("2026-05-13T08:00:00+08:00"),
    shareTitle: null,
    shareDescription: null,
    shareImagePath: null,
    tags: ["草稿"],
  },
];

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

export function listPublicArticles({
  q,
  tag,
  page = 1,
  pageSize = 10,
  now = new Date(),
}: ListPublicArticlesParams) {
  const normalizedQuery = q?.trim().toLowerCase();
  const normalizedTag = tag?.trim();
  const visibleArticles = SAMPLE_ARTICLES.filter((article) => isArticlePublic(article, now));
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

export function getPublicArticleBySlug(slug: string, now = new Date()): PublicArticle | null {
  const article = SAMPLE_ARTICLES.find((item) => item.slug === slug);

  if (!article || !isArticlePublic(article, now)) {
    return null;
  }

  return article;
}

export function listPublicTags(): string[] {
  const tags = new Set<string>();

  for (const article of SAMPLE_ARTICLES) {
    if (isArticlePublic(article, new Date())) {
      article.tags.forEach((tag) => tags.add(tag));
    }
  }

  return [...tags];
}
