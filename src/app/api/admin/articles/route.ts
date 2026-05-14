import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const title = formData.get("title");

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ message: "Title is required" }, { status: 400 });
  }

  return NextResponse.json({ id: "stub-article", slug: "stub-article" }, { status: 201 });
}
