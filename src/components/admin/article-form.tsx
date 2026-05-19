"use client";

import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import type { AdminArticleRecord } from "@/lib/admin-articles";
import { createEmptyContentBlock, type ArticleContentBlock } from "@/lib/content-blocks";
import { getCenteredSquareCrop, SHARE_CARD_IMAGE_SIZE } from "@/lib/share-card-image";

type ArticleFormProps = {
  mode: "create" | "edit";
  article?: AdminArticleRecord;
};

type SaveState = "idle" | "success" | "error";

function createInitialBlocks(article?: AdminArticleRecord) {
  return article?.contentBlocks.length ? article.contentBlocks : [createEmptyContentBlock()];
}

function replaceFileExtension(fileName: string, nextExtension: string) {
  if (/\.[^/.]+$/.test(fileName)) {
    return fileName.replace(/\.[^/.]+$/, nextExtension);
  }

  return `${fileName}${nextExtension}`;
}

async function loadImageElement(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Failed to load image"));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function createShareCardUpload(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Unsupported file type");
  }

  const image = await loadImageElement(file);
  const crop = getCenteredSquareCrop(image.naturalWidth || image.width, image.naturalHeight || image.height);
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_IMAGE_SIZE;
  canvas.height = SHARE_CARD_IMAGE_SIZE;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not available");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, SHARE_CARD_IMAGE_SIZE, SHARE_CARD_IMAGE_SIZE);
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.size,
    crop.size,
    0,
    0,
    SHARE_CARD_IMAGE_SIZE,
    SHARE_CARD_IMAGE_SIZE,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => {
        if (nextBlob) {
          resolve(nextBlob);
          return;
        }

        reject(new Error("Failed to export image"));
      },
      "image/jpeg",
      0.86,
    );
  });

  return new File([blob], replaceFileExtension(file.name, ".jpg"), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export function ArticleForm({ mode, article }: ArticleFormProps) {
  const router = useRouter();
  const [isClientReady, setIsClientReady] = useState(false);
  const [title, setTitle] = useState(article?.title ?? "");
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [summaryImagePath, setSummaryImagePath] = useState(article?.summaryImagePath ?? "");
  const [contentBlocks, setContentBlocks] = useState<ArticleContentBlock[]>(() => createInitialBlocks(article));
  const [shareTitle] = useState(article?.shareTitle ?? "");
  const [shareDescription, setShareDescription] = useState(article?.shareDescription ?? "");
  const [shareImagePath, setShareImagePath] = useState(article?.shareImagePath ?? "");
  const [tags] = useState(article?.tags ?? []);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [summaryUploadState, setSummaryUploadState] = useState<"idle" | "uploading" | "error">("idle");
  const [shareUploadState, setShareUploadState] = useState<"idle" | "uploading" | "error">("idle");

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  async function uploadImage(
    file: File,
    setUploadState: (state: "idle" | "uploading" | "error") => void,
    preprocess?: (file: File) => Promise<File>,
  ): Promise<string | null> {
    setUploadState("uploading");

    let uploadFile = file;

    try {
      uploadFile = preprocess ? await preprocess(file) : file;
    } catch {
      setUploadState("error");
      return null;
    }

    const formData = new FormData();
    formData.set("file", uploadFile);

    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      setUploadState("error");
      return null;
    }

    const payload = (await response.json()) as { path?: string };

    if (typeof payload.path === "string" && payload.path) {
      setUploadState("idle");
      return payload.path;
    }

    setUploadState("error");
    return null;
  }

  async function handleSummaryImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const path = await uploadImage(file, setSummaryUploadState);

    if (path) {
      setSummaryImagePath(path);
    }

    event.target.value = "";
  }

  async function handleShareImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const path = await uploadImage(file, setShareUploadState, createShareCardUpload);

    if (path) {
      setShareImagePath(path);
    }

    event.target.value = "";
  }

  function updateBlock(blockId: string, updater: (block: ArticleContentBlock) => ArticleContentBlock) {
    setContentBlocks((current) => current.map((block) => (block.id === blockId ? updater(block) : block)));
  }

  function moveBlock(blockId: string, direction: -1 | 1) {
    setContentBlocks((current) => {
      const index = current.findIndex((block) => block.id === blockId);

      if (index < 0) {
        return current;
      }

      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const nextBlocks = [...current];
      const [moved] = nextBlocks.splice(index, 1);
      nextBlocks.splice(nextIndex, 0, moved);
      return nextBlocks;
    });
  }

  function addBlock() {
    setContentBlocks((current) => [...current, createEmptyContentBlock()]);
  }

  function removeBlock(blockId: string) {
    setContentBlocks((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((block) => block.id !== blockId);
    });
  }

  async function saveArticle() {
    setSaveState("idle");

    const body = JSON.stringify({
      title,
      summary,
      summaryImagePath,
      tags,
      contentBlocks,
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
          rows={1}
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
        <label htmlFor="summaryImagePath">摘要配图</label>
        <label htmlFor="summaryImageUpload">上传摘要配图</label>
        <input
          id="summaryImageUpload"
          name="summaryImageUpload"
          type="file"
          accept="image/*"
          onChange={handleSummaryImageUpload}
        />
        <input
          id="summaryImagePath"
          name="summaryImagePath"
          value={summaryImagePath}
          onChange={(event) => setSummaryImagePath(event.target.value)}
        />
        {summaryUploadState === "uploading" ? <p className="article-summary">正在上传摘要配图...</p> : null}
        {summaryUploadState === "error" ? <p className="article-summary">摘要配图上传失败，请重试。</p> : null}
        {summaryImagePath ? (
          <div className="toolbar">
            <img className="share-cover-preview" src={summaryImagePath} alt="摘要配图预览" />
            <button type="button" onClick={() => setSummaryImagePath("")}>
              删除摘要配图
            </button>
          </div>
        ) : null}
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
        <p className="article-summary">上传时会自动裁剪并压缩为 215x215，用于微信分享卡片。</p>
        {shareUploadState === "uploading" ? <p className="article-summary">正在上传分享封面图...</p> : null}
        {shareUploadState === "error" ? <p className="article-summary">分享封面图上传失败，请重试。</p> : null}
        {shareImagePath ? <img className="share-cover-preview" src={shareImagePath} alt="分享封面图预览" /> : null}
      </div>

      <div className="toolbar">
        <div className="content-block-header">
          <span>正文分段</span>
          <button type="button" onClick={addBlock}>
            新增正文块
          </button>
        </div>
        {contentBlocks.map((block, index) => (
          <section key={block.id} className="content-block-card">
            <div className="content-block-actions">
              <span>{`正文块 ${index + 1}`}</span>
              <div className="pagination">
                <button type="button" onClick={() => moveBlock(block.id, -1)} disabled={index === 0}>
                  上移
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(block.id, 1)}
                  disabled={index === contentBlocks.length - 1}
                >
                  下移
                </button>
                <button type="button" onClick={() => removeBlock(block.id)} disabled={contentBlocks.length === 1}>
                  删除正文块
                </button>
              </div>
            </div>
            <RichTextEditor
              blockLabel={`正文块 ${index + 1}`}
              editorLabel={`正文块 ${index + 1} 内容`}
              uploadInputId={`inlineImageUpload-${block.id}`}
              value={block.html}
              images={block.inlineImages}
              onChange={(html) => updateBlock(block.id, (current) => ({ ...current, html }))}
              onAddImage={(image) =>
                updateBlock(block.id, (current) => ({
                  ...current,
                  inlineImages: [...current.inlineImages, image],
                }))
              }
              onRemoveImage={(image) =>
                updateBlock(block.id, (current) => ({
                  ...current,
                  html: current.html.replace(
                    new RegExp(`<p><img src="${image.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}" alt="" \\/><\\/p>`, "g"),
                    "",
                  ),
                  inlineImages: current.inlineImages.filter((item) => item !== image),
                }))
              }
            />
          </section>
        ))}
      </div>

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
