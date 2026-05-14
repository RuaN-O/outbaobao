import Link from "next/link";

export function ArticleList() {
  return (
    <section className="article-list">
      <article className="article-card">
        <h2>文章管理</h2>
        <p className="article-summary">首版后台文章管理正在接入。先从新建文章入口开始。</p>
        <div className="pagination">
          <Link href="/admin/articles/new">新建文章</Link>
        </div>
      </article>
    </section>
  );
}
