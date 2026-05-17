export type ArticleContentBlock = {
  id: string;
  html: string;
  inlineImages: string[];
};

type ContentBlockLike = {
  id?: unknown;
  html?: unknown;
  inlineImages?: unknown;
};

function createBlockId(prefix = "block") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createEmptyContentBlock(): ArticleContentBlock {
  return {
    id: createBlockId(),
    html: "<p></p>",
    inlineImages: [],
  };
}

export function normalizeBlockHtml(value: string) {
  const trimmed = value.trim();
  return trimmed || "<p></p>";
}

export function normalizeArticleContentBlocks(blocks: ContentBlockLike[]): ArticleContentBlock[] {
  const normalized = blocks
    .map((block) => {
      if (typeof block.html !== "string") {
        return null;
      }

      return {
        id: typeof block.id === "string" && block.id ? block.id : createBlockId(),
        html: normalizeBlockHtml(block.html),
        inlineImages: Array.isArray(block.inlineImages)
          ? block.inlineImages.filter((image): image is string => typeof image === "string")
          : [],
      } satisfies ArticleContentBlock;
    })
    .filter((block): block is ArticleContentBlock => block !== null);

  return normalized.length > 0 ? normalized : [createEmptyContentBlock()];
}

export function parseArticleContentBlocks(
  value: string | null | undefined,
  fallbackContentHtml: string,
  fallbackInlineImages: string[],
): ArticleContentBlock[] {
  try {
    const parsed = JSON.parse(value ?? "[]") as unknown;

    if (Array.isArray(parsed)) {
      return normalizeArticleContentBlocks(parsed);
    }
  } catch {
    // Fall through to legacy single-block content.
  }

  return normalizeArticleContentBlocks([
    {
      html: fallbackContentHtml,
      inlineImages: fallbackInlineImages,
    },
  ]);
}

export function serializeArticleContentBlocks(blocks: ArticleContentBlock[]) {
  return JSON.stringify(
    blocks.map((block) => ({
      id: block.id,
      html: normalizeBlockHtml(block.html),
      inlineImages: block.inlineImages,
    })),
  );
}

export function mergeArticleContentHtml(blocks: ArticleContentBlock[]) {
  return normalizeArticleContentBlocks(blocks)
    .map((block) => normalizeBlockHtml(block.html))
    .join("");
}

export function flattenArticleInlineImages(blocks: ArticleContentBlock[]) {
  return normalizeArticleContentBlocks(blocks).flatMap((block) => block.inlineImages);
}
