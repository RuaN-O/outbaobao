import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArticleShareButton } from "@/components/public/article-share-button";
import { readAdminSession } from "@/lib/auth";
import { getPublicArticleBySlug } from "@/lib/articles";
import { resolveShareFields } from "@/lib/share";
import { ADMIN_SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

type ArticleDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function isCurrentViewerAdmin() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!cookieValue) {
    return false;
  }

  const session = await readAdminSession(cookieValue);
  return session?.isAdmin === true;
}

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

  const isAdmin = await isCurrentViewerAdmin();

  return (
    <main className="page-shell">
      <article className="article-detail">
        <h1>{article.title}</h1>
        {isAdmin ? <ArticleShareButton /> : null}
        <div className="article-meta">
          {article.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <p className="article-summary">{article.summary}</p>
        {article.summaryImagePath ? (
          <img className="article-summary-image" src={article.summaryImagePath} alt="摘要配图" />
        ) : null}
        <div className="article-content" dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
      </article>
    </main>
  );
}
