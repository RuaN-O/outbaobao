import Link from "next/link";
import type { PublicArticle } from "@/lib/articles";

type ArticleCardProps = {
  article: PublicArticle;
};

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="article-card">
      <h2>
        <Link href={`/articles/${article.slug}`}>{article.title}</Link>
      </h2>
      <div className="article-meta">
        <span>{article.isPinned ? "置顶" : "文章"}</span>
        <span>{article.publishedAt?.toLocaleDateString("zh-CN")}</span>
        {article.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <p className="article-summary">{article.summary}</p>
    </article>
  );
}
