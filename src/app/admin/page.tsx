import { AdminShell } from "@/components/admin/admin-shell";
import { ArticleList } from "@/components/admin/article-list";
import { listAdminArticles } from "@/lib/admin-articles";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const articles = await listAdminArticles();

  return (
    <AdminShell title="后台">
      <ArticleList articles={articles} />
    </AdminShell>
  );
}
