import { toAbsoluteUrl } from "@/lib/site-url";

type ShareFieldArticle = {
  title: string;
  summary: string;
  coverImagePath: string | null;
  shareTitle?: string | null;
  shareDescription?: string | null;
  shareImagePath?: string | null;
};

export function resolveShareFields(article: ShareFieldArticle, baseUrl?: string) {
  return {
    title: article.shareTitle || article.title,
    description: article.shareDescription || article.summary,
    image: toAbsoluteUrl(article.shareImagePath || article.coverImagePath, baseUrl),
  };
}
