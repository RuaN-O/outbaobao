import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
};

const prismaGlobal = globalThis as typeof globalThis & {
  prisma?: {
    $disconnect: () => Promise<void>;
  };
};

const testDatabasePath = join(process.cwd(), "unit-admin-articles.db");

async function resetPrismaClient() {
  await prismaGlobal.prisma?.$disconnect();
  delete prismaGlobal.prisma;
  vi.resetModules();
}

function resetTestDatabase() {
  if (existsSync(testDatabasePath)) {
    rmSync(testDatabasePath, { force: true });
  }

  const journalPath = `${testDatabasePath}-journal`;

  if (existsSync(journalPath)) {
    rmSync(journalPath, { force: true });
  }

  execSync("pnpm prisma db push --skip-generate", {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: "file:./unit-admin-articles.db",
    },
    stdio: "pipe",
  });
}

afterEach(async () => {
  process.env.DATABASE_URL = originalEnv.DATABASE_URL;
  await resetPrismaClient();

  if (existsSync(testDatabasePath)) {
    rmSync(testDatabasePath, { force: true });
  }

  const journalPath = `${testDatabasePath}-journal`;

  if (existsSync(journalPath)) {
    rmSync(journalPath, { force: true });
  }
});

describe("admin article routes", () => {
  it("creates and deletes an article", async () => {
    process.env.DATABASE_URL = "file:./unit-admin-articles.db";
    resetTestDatabase();
    await resetPrismaClient();

    const { POST } = await import("@/app/api/admin/articles/route");
    const { DELETE } = await import("@/app/api/admin/articles/[id]/route");
    const { listAdminArticles } = await import("@/lib/admin-articles");

    const createResponse = await POST(
      new Request("http://localhost:3000/api/admin/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Delete Me",
          summary: "Created for delete coverage",
          tags: ["cleanup"],
          contentHtml: "<p>hello</p>",
          inlineImages: [],
          shareTitle: "",
          shareDescription: "",
          shareImagePath: "",
          publishAction: "draft",
          scheduledFor: "",
        }),
      }),
    );

    expect(createResponse.status).toBe(201);

    const created = (await createResponse.json()) as { id: string };
    expect(created.id).toBeTruthy();
    expect((await listAdminArticles()).some((article) => article.id === created.id)).toBe(true);

    const deleteResponse = await DELETE(new Request(`http://localhost:3000/api/admin/articles/${created.id}`), {
      params: Promise.resolve({ id: created.id }),
    });

    expect(deleteResponse.status).toBe(200);
    expect((await listAdminArticles()).some((article) => article.id === created.id)).toBe(false);
  });

  it("stores multiple content blocks and exposes merged article html", async () => {
    process.env.DATABASE_URL = "file:./unit-admin-articles.db";
    resetTestDatabase();
    await resetPrismaClient();

    const { POST } = await import("@/app/api/admin/articles/route");
    const { getAdminArticleById } = await import("@/lib/admin-articles");

    const createResponse = await POST(
      new Request("http://localhost:3000/api/admin/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Block Article",
          summary: "Created with multiple blocks",
          tags: [],
          contentBlocks: [
            {
              html: "<p>First block</p>",
              inlineImages: ["/uploads/first.png"],
            },
            {
              html: "<p>Second block</p>",
              inlineImages: [],
            },
          ],
          shareTitle: "",
          shareDescription: "",
          shareImagePath: "",
          publishAction: "publish",
          scheduledFor: "",
        }),
      }),
    );

    expect(createResponse.status).toBe(201);

    const created = (await createResponse.json()) as { id: string };
    const article = await getAdminArticleById(created.id);

    expect(article?.contentBlocks).toEqual([
      {
        id: expect.any(String),
        html: "<p>First block</p>",
        inlineImages: ["/uploads/first.png"],
      },
      {
        id: expect.any(String),
        html: "<p>Second block</p>",
        inlineImages: [],
      },
    ]);
    expect(article?.contentHtml).toBe("<p>First block</p><p>Second block</p>");
    expect(article?.inlineImages).toEqual(["/uploads/first.png"]);
  });

  it("stores a summary image path for article detail pages", async () => {
    process.env.DATABASE_URL = "file:./unit-admin-articles.db";
    resetTestDatabase();
    await resetPrismaClient();

    const { POST } = await import("@/app/api/admin/articles/route");
    const { getAdminArticleById } = await import("@/lib/admin-articles");

    const createResponse = await POST(
      new Request("http://localhost:3000/api/admin/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Summary Image Article",
          summary: "Created with summary image",
          tags: [],
          contentBlocks: [
            {
              html: "<p>Only block</p>",
              inlineImages: [],
            },
          ],
          summaryImagePath: "/uploads/summary-image.png",
          shareTitle: "",
          shareDescription: "",
          shareImagePath: "",
          publishAction: "publish",
          scheduledFor: "",
        }),
      }),
    );

    expect(createResponse.status).toBe(201);

    const created = (await createResponse.json()) as { id: string };
    const article = await getAdminArticleById(created.id);

    expect(article?.summaryImagePath).toBe("/uploads/summary-image.png");
  });
});
