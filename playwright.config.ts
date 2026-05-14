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
    baseURL: "http://127.0.0.1:3000"
  },
  webServer: {
    command:
      "set ADMIN_PASSWORD=secret&& set SESSION_SECRET=session-secret&& set DATABASE_URL=file:./dev.db&& set SITE_URL=http://127.0.0.1:3000&& node ./node_modules/next/dist/bin/next dev --hostname 127.0.0.1",
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
});
