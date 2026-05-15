import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
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
