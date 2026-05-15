import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleShareButton } from "@/components/public/article-share-button";
import { getPublicArticleBySlug } from "@/lib/articles";
import { resolveShareFields } from "@/lib/share";

export const dynamic = "force-dynamic";

type ArticleDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicArticleBySlug(slug);

  if (!article) {
    return {
      title: "未找到文章",
    };
  }

  const share = resolveShareFields(article);

  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      title: share.title,
      description: share.description,
      images: share.image ? [share.image] : [],
    },
  };
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = await params;
  const article = await getPublicArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="page-shell">
      <article className="article-detail">
        <h1>{article.title}</h1>
        <ArticleShareButton />
        <div className="article-meta">
          <span>{article.publishedAt?.toLocaleDateString("zh-CN")}</span>
          {article.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <p className="article-summary">{article.summary}</p>
        <div className="article-content" dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
      </article>
    </main>
  );
}
