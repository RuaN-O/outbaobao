"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import type { AdminArticleRecord } from "@/lib/admin-articles";

type ArticleFormProps = {
  mode: "create" | "edit";
  article?: AdminArticleRecord;
  submitLabel?: string;
};

type SaveState = "idle" | "success" | "error";

function removeImageFromContent(contentHtml: string, image: string) {
  const escapedImage = image.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return contentHtml.replace(new RegExp(`<p><img src="${escapedImage}" alt="" \\/><\\/p>`, "g"), "");
}

export function ArticleForm({ mode, article, submitLabel = "保存草稿" }: ArticleFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(article?.title ?? "");
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [tags, setTags] = useState(article?.tags.join(",") ?? "");
  const [contentHtml, setContentHtml] = useState(article?.contentHtml ?? "<p></p>");
  const [inlineImages, setInlineImages] = useState(article?.inlineImages ?? []);
  const [shareTitle, setShareTitle] = useState(article?.shareTitle ?? "");
  const [shareDescription, setShareDescription] = useState(article?.shareDescription ?? "");
  const [shareImagePath, setShareImagePath] = useState(article?.shareImagePath ?? "");
  const [publishAction, setPublishAction] = useState<"draft" | "publish" | "schedule">(
    article?.status === "PUBLISHED" ? "publish" : article?.status === "SCHEDULED" ? "schedule" : "draft",
  );
  const [scheduledFor, setScheduledFor] = useState(article?.scheduledFor ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [shareUploadState, setShareUploadState] = useState<"idle" | "uploading" | "error">("idle");

  async function handleShareImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nativeEvent = event.nativeEvent;
    const submitter =
      nativeEvent instanceof SubmitEvent && nativeEvent.submitter instanceof HTMLButtonElement
        ? nativeEvent.submitter
        : null;
    const action =
      submitter?.value === "draft" || submitter?.value === "publish" || submitter?.value === "schedule"
        ? submitter.value
        : publishAction;

    if (mode === "edit" && article) {
      const response = await fetch(`/api/admin/articles/${article.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          summary,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          contentHtml,
          inlineImages,
          shareTitle,
          shareDescription,
          shareImagePath,
          publishAction: action,
          scheduledFor,
        }),
      });

      setSaveState(response.ok ? "success" : "error");
      return;
    }

    const response = await fetch("/api/admin/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        summary,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        contentHtml,
        inlineImages,
        shareTitle,
        shareDescription,
        shareImagePath,
        publishAction: action,
        scheduledFor,
      }),
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

  return (
    <form className="article-detail" onSubmit={handleSubmit}>
      <div className="toolbar">
        <label htmlFor="title">标题</label>
        <input id="title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} />
      </div>

      <div className="toolbar">
        <label htmlFor="summary">摘要</label>
        <textarea
          id="summary"
          name="summary"
          rows={4}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
        />
      </div>

      <div className="toolbar">
        <label htmlFor="tags">标签</label>
        <input
          id="tags"
          name="tags"
          placeholder="用逗号分隔"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
        />
      </div>

      <div className="toolbar">
        <label htmlFor="shareTitle">分享卡片主文案</label>
        <input
          id="shareTitle"
          name="shareTitle"
          value={shareTitle}
          onChange={(event) => setShareTitle(event.target.value)}
        />
      </div>

      <div className="toolbar">
        <label htmlFor="shareDescription">分享摘要</label>
        <textarea
          id="shareDescription"
          name="shareDescription"
          rows={3}
          value={shareDescription}
          onChange={(event) => setShareDescription(event.target.value)}
        />
      </div>

      <div className="toolbar">
        <label htmlFor="shareImagePath">分享封面图地址</label>
        <label htmlFor="shareImageUpload">上传分享封面图</label>
        <input id="shareImageUpload" name="shareImageUpload" type="file" accept="image/*" onChange={handleShareImageUpload} />
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

      <div className="toolbar">
        <label htmlFor="publishAction">发布状态</label>
        <select
          id="publishAction"
          name="publishAction"
          value={publishAction}
          onChange={(event) => setPublishAction(event.target.value as "draft" | "publish" | "schedule")}
        >
          <option value="draft">草稿</option>
          <option value="publish">立即发布</option>
          <option value="schedule">定时发布</option>
        </select>
      </div>

      <div className="toolbar">
        <label htmlFor="scheduledFor">定时发布时间</label>
        <input
          id="scheduledFor"
          name="scheduledFor"
          type="datetime-local"
          value={scheduledFor}
          onChange={(event) => setScheduledFor(event.target.value)}
        />
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
        <button type="submit" value="draft">
          {submitLabel}
        </button>
        <button type="submit" value="publish">
          立即发布
        </button>
        {saveState === "success" ? <span>保存成功</span> : null}
        {saveState === "error" ? <span>保存失败</span> : null}
      </div>
    </form>
  );
}
