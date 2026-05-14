import { AdminShell } from "@/components/admin/admin-shell";
import { ArticleList } from "@/components/admin/article-list";

export default function AdminHomePage() {
  return (
    <AdminShell title="后台">
      <ArticleList />
    </AdminShell>
  );
}
