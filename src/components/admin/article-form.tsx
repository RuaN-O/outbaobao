"use client";

import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import type { AdminArticleRecord } from "@/lib/admin-articles";

type ArticleFormProps = {
  mode: "create" | "edit";
  article?: AdminArticleRecord;
};

type SaveState = "idle" | "success" | "error";

function removeImageFromContent(contentHtml: string, image: string) {
  const escapedImage = image.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return contentHtml.replace(new RegExp(`<p><img src="${escapedImage}" alt="" \\/><\\/p>`, "g"), "");
}

export function ArticleForm({ mode, article }: ArticleFormProps) {
  const router = useRouter();
  const [isClientReady, setIsClientReady] = useState(false);
  const [title, setTitle] = useState(article?.title ?? "");
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [contentHtml, setContentHtml] = useState(article?.contentHtml ?? "<p></p>");
  const [inlineImages, setInlineImages] = useState(article?.inlineImages ?? []);
  const [shareTitle] = useState(article?.shareTitle ?? "");
  const [shareDescription, setShareDescription] = useState(article?.shareDescription ?? "");
  const [shareImagePath, setShareImagePath] = useState(article?.shareImagePath ?? "");
  const [tags] = useState(article?.tags ?? []);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [shareUploadState, setShareUploadState] = useState<"idle" | "uploading" | "error">("idle");

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  async function handleShareImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setShareUploadState("uploading");

    const formData = new FormData();
    formData.set("file", file);

    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      setShareUploadState("error");
      event.target.value = "";
      return;
    }

    const payload = (await response.json()) as { path?: string };

    if (typeof payload.path === "string" && payload.path) {
      setShareImagePath(payload.path);
      setShareUploadState("idle");
      event.target.value = "";
      return;
    }

    setShareUploadState("error");
    event.target.value = "";
  }

  async function saveArticle() {
    setSaveState("idle");

    const body = JSON.stringify({
      title,
      summary,
      tags,
      contentHtml,
      inlineImages,
      shareTitle,
      shareDescription,
      shareImagePath,
      publishAction: "publish",
      scheduledFor: "",
    });

    if (mode === "edit" && article) {
      const response = await fetch(`/api/admin/articles/${article.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      setSaveState(response.ok ? "success" : "error");
      return;
    }

    const response = await fetch("/api/admin/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (!response.ok) {
      setSaveState("error");
      return;
    }

    const data = (await response.json()) as { id?: string };
    setSaveState("success");

    if (typeof data.id === "string") {
      router.push(`/admin/articles/${data.id}/edit`);
      router.refresh();
    }
  }

  if (!isClientReady) {
    return (
      <section className="article-detail">
        <p className="article-summary">编辑器加载中...</p>
      </section>
    );
  }

  return (
    <section className="article-detail">
      <div className="toolbar">
        <label htmlFor="title">标题</label>
        <textarea
          id="title"
          className="article-title-input"
          name="title"
          rows={3}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="toolbar">
        <label htmlFor="summary">摘要</label>
        <textarea
          id="summary"
          className="article-summary-input"
          name="summary"
          rows={4}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
        />
      </div>

      <div className="toolbar">
        <label htmlFor="shareDescription">分享摘要</label>
        <textarea
          id="shareDescription"
          className="share-summary-textarea"
          name="shareDescription"
          rows={3}
          value={shareDescription}
          onChange={(event) => setShareDescription(event.target.value)}
        />
      </div>

      <div className="toolbar">
        <label htmlFor="shareImagePath">分享封面图地址</label>
        <label htmlFor="shareImageUpload">上传分享封面图</label>
        <input
          id="shareImageUpload"
          name="shareImageUpload"
          type="file"
          accept="image/*"
          onChange={handleShareImageUpload}
        />
        <input
          id="shareImagePath"
          name="shareImagePath"
          value={shareImagePath}
          onChange={(event) => setShareImagePath(event.target.value)}
        />
        {shareUploadState === "uploading" ? <p className="article-summary">正在上传分享封面图...</p> : null}
        {shareUploadState === "error" ? <p className="article-summary">分享封面图上传失败，请重试。</p> : null}
        {shareImagePath ? <img className="share-cover-preview" src={shareImagePath} alt="分享封面图预览" /> : null}
      </div>

      <RichTextEditor
        value={contentHtml}
        images={inlineImages}
        onChange={setContentHtml}
        onAddImage={(image) => {
          setInlineImages((current) => [...current, image]);
        }}
        onRemoveImage={(image) => {
          setInlineImages((current) => current.filter((item) => item !== image));
          setContentHtml((current) => removeImageFromContent(current, image));
        }}
      />

      <div className="pagination">
        <button type="button" onClick={() => void saveArticle()}>
          立即发布
        </button>
        {saveState === "success" ? <span>保存成功</span> : null}
        {saveState === "error" ? <span>保存失败</span> : null}
      </div>
    </section>
  );
}
