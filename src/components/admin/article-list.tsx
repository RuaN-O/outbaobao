import Link from "next/link";
import type { AdminArticleRecord } from "@/lib/admin-articles";

type ArticleListProps = {
  articles: AdminArticleRecord[];
};

function formatStatus(status: AdminArticleRecord["status"]) {
  if (status === "PUBLISHED") {
    return "已发布";
  }

  if (status === "SCHEDULED") {
    return "待定时";
  }

  return "草稿";
}

export function ArticleList({ articles }: ArticleListProps) {
  return (
    <section className="article-list">
      <article className="article-card">
        <h2>文章管理</h2>
        <p className="article-summary">这里列出当前所有文章。你可以继续编辑、发布，或新建一篇内容。</p>
        <div className="pagination">
          <Link href="/admin/articles/new">新建文章</Link>
        </div>
      </article>

      {articles.map((article) => (
        <article key={article.id} className="article-card">
          <h2>{article.title}</h2>
          <div className="article-meta">
            <span>{formatStatus(article.status)}</span>
            <span>{article.slug}</span>
            {article.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <p className="article-summary">{article.summary}</p>
          <div className="pagination">
            <Link href={`/admin/articles/${article.id}/edit`}>继续编辑</Link>
            <Link href={`/articles/${article.slug}`}>公开预览</Link>
          </div>
        </article>
      ))}
    </section>
  );
}
