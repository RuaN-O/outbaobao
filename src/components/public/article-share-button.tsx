"use client";

import { useEffect, useState } from "react";

export function ArticleShareButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [articleUrl, setArticleUrl] = useState("");

  useEffect(() => {
    setArticleUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const qrImageSrc = articleUrl ? `/api/qr?url=${encodeURIComponent(articleUrl)}` : "";

  return (
    <>
      <div className="article-share-row">
        <button className="article-share-button" type="button" onClick={() => setIsOpen(true)}>
          分享
        </button>
      </div>

      {isOpen ? (
        <div className="share-modal-backdrop" role="presentation" onClick={() => setIsOpen(false)}>
          <div
            className="share-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="文章分享二维码"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="share-modal-close"
              type="button"
              aria-label="关闭分享二维码"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>

            {qrImageSrc ? <img className="share-modal-image" src={qrImageSrc} alt="文章分享二维码" /> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
