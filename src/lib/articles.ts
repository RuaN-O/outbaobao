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
