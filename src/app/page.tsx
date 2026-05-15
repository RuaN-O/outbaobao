import { ArticleCard } from "@/components/public/article-card";
import { Pagination } from "@/components/public/pagination";
import { SearchForm } from "@/components/public/article-search-form";
import { TagFilter } from "@/components/public/tag-filter";
import { listPublicArticles, listPublicTags } from "@/lib/articles";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams?: Promise<{
    page?: string;
    q?: string;
    tag?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const page = Number(params.page ?? "1");
  const q = params.q ?? "";
  const tag = params.tag ?? "";
  const { articles, totalPages } = await listPublicArticles({ page, q, tag });
  const tags = await listPublicTags();

  return (
    <main className="page-shell">
      <header className="page-header">
        <p className="page-subtitle">公开展示已发布内容，支持搜索、标签筛选和单篇分享。</p>
      </header>

      <section className="toolbar">
        <SearchForm defaultValue={q} />
        <TagFilter tags={tags} activeTag={tag} />
      </section>

      <section className="article-list">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </section>

      <Pagination currentPage={page} totalPages={totalPages} q={q} tag={tag} />
    </main>
  );
}
