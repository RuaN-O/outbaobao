import { AdminShell } from "@/components/admin/admin-shell";
import { ArticleForm } from "@/components/admin/article-form";

export default function NewArticlePage() {
  return (
    <AdminShell title="新建文章">
      <ArticleForm />
    </AdminShell>
  );
}
