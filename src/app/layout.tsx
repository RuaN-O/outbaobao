import type { Metadata } from "next";
import "./globals.css";
import { getConfiguredSiteOrigin } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(getConfiguredSiteOrigin()),
  title: "内容",
  description: "一个用于公开发布文章和公告的在线公告板。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
