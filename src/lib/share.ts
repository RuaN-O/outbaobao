type ShareFieldArticle = {
  title: string;
  summary: string;
  coverImagePath: string | null;
  shareTitle?: string | null;
  shareDescription?: string | null;
  shareImagePath?: string | null;
};

export function resolveShareFields(article: ShareFieldArticle) {
  return {
    title: article.shareTitle || article.title,
    description: article.shareDescription || article.summary,
    image: article.shareImagePath || article.coverImagePath,
  };
}
