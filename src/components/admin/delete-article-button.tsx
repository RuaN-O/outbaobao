"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteArticleButtonProps = {
  articleId: string;
  articleTitle: string;
};

export function DeleteArticleButton({ articleId, articleTitle }: DeleteArticleButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (isDeleting) {
      return;
    }

    const confirmed = window.confirm(`确认删除《${articleTitle}》吗？文章会从公开页和后台列表中移除。`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    const response = await fetch(`/api/admin/articles/${articleId}`, {
      method: "DELETE",
    });

    setIsDeleting(false);

    if (!response.ok) {
      window.alert("删除失败，请重试。");
      return;
    }

    router.refresh();
  }

  return (
    <button type="button" onClick={handleDelete} disabled={isDeleting}>
      {isDeleting ? "删除中..." : "删除文章"}
    </button>
  );
}
