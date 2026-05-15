import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium"
      }
    }
  ],
  use: {
    baseURL: "http://127.0.0.1:3200"
  },
  webServer: {
    command:
      "del /f /q e2e-public.db 2>nul & del /f /q e2e-public.db-journal 2>nul & set NEXT_E2E=1&& set ADMIN_PASSWORD=secret&& set SESSION_SECRET=session-secret&& set DATABASE_URL=file:./e2e-public.db&& set SITE_URL=http://127.0.0.1:3200&& pnpm prisma db push --skip-generate&& node ./node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3200",
    port: 3200,
    reuseExistingServer: !process.env.CI
  }
});
