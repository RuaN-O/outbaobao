import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function saveUpload(file: File): Promise<string> {
  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
  const relativePath = `/uploads/${fileName}`;
  const absolutePath = path.join(UPLOAD_DIR, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(absolutePath, bytes);

  return relativePath;
}
