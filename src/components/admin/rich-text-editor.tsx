"use client";

import { useEffect, useRef, useState } from "react";

type RichTextEditorProps = {
  value: string;
  images: string[];
  onChange: (value: string) => void;
  onAddImage: (image: string) => void;
  onRemoveImage: (image: string) => void;
};

type ToolbarAction = {
  label: string;
  command?: string;
  html?: string;
};

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { label: "正文", command: "formatBlock", html: "p" },
  { label: "小标题", command: "formatBlock", html: "h2" },
  { label: "加粗", command: "bold" },
  { label: "引用", command: "formatBlock", html: "blockquote" },
  { label: "列表", command: "insertUnorderedList" },
  { label: "分隔线", command: "insertHorizontalRule" },
];

function normalizeEditorHtml(value: string) {
  const trimmed = value.trim();
  return trimmed || "<p></p>";
}

export function RichTextEditor({ value, images, onChange, onAddImage, onRemoveImage }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "error">("idle");

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const nextValue = normalizeEditorHtml(value);

    if (editor.innerHTML !== nextValue) {
      editor.innerHTML = nextValue;
    }
  }, [value]);

  function syncEditorValue() {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    onChange(normalizeEditorHtml(editor.innerHTML));
  }

  function focusEditor() {
    editorRef.current?.focus();
  }

  function applyToolbarAction(action: ToolbarAction) {
    focusEditor();

    if (action.command === "formatBlock" && action.html) {
      document.execCommand(action.command, false, action.html);
    } else if (action.command) {
      document.execCommand(action.command, false);
    }

    syncEditorValue();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadState("uploading");

    const formData = new FormData();
    formData.set("file", file);

    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      setUploadState("error");
      event.target.value = "";
      return;
    }

    const payload = (await response.json()) as { path?: string };

    if (typeof payload.path === "string" && payload.path) {
      onAddImage(payload.path);
      focusEditor();
      document.execCommand("insertHTML", false, `<p><img src="${payload.path}" alt="" /></p>`);
      syncEditorValue();
      setUploadState("idle");
      event.target.value = "";
      return;
    }

    setUploadState("error");
    event.target.value = "";
  }

  return (
    <div className="article-detail">
      <div className="toolbar">
        <span>正文</span>
        <div className="editor-toolbar" role="toolbar" aria-label="正文快捷工具">
          {TOOLBAR_ACTIONS.map((action) => (
            <button key={action.label} type="button" onClick={() => applyToolbarAction(action)}>
              {action.label}
            </button>
          ))}
        </div>
        <div
          ref={editorRef}
          className="rich-editor"
          contentEditable
          suppressContentEditableWarning
          aria-label="正文内容"
          onInput={syncEditorValue}
        />
      </div>

      <div className="toolbar">
        <span>正文图片</span>
        <label htmlFor="inlineImageUpload">添加正文图片</label>
        <input id="inlineImageUpload" name="inlineImageUpload" type="file" accept="image/*" onChange={handleFileChange} />
        {uploadState === "uploading" ? <p className="article-summary">正在上传图片...</p> : null}
        {uploadState === "error" ? <p className="article-summary">图片上传失败，请重试。</p> : null}
        {images.length === 0 ? (
          <p className="article-summary">当前没有正文图片。</p>
        ) : (
          images.map((image) => (
            <div key={image} className="pagination">
              <span>{image}</span>
              <button type="button" onClick={() => onRemoveImage(image)}>
                删除图片
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
