import { toAbsoluteUrl } from "@/lib/site-url";

const DEFAULT_SHARE_IMAGE_PATH = "/uploads/blank-image.png";

type ShareFieldArticle = {
  title: string;
  summary: string;
  coverImagePath: string | null;
  shareTitle?: string | null;
  shareDescription?: string | null;
  shareImagePath?: string | null;
};

export function resolveShareFields(article: ShareFieldArticle, baseUrl?: string) {
  const resolvedImagePath = article.shareImagePath || article.coverImagePath || DEFAULT_SHARE_IMAGE_PATH;

  return {
    title: article.shareTitle || article.title,
    description: article.shareDescription || article.summary,
    image: toAbsoluteUrl(resolvedImagePath, baseUrl),
  };
}
