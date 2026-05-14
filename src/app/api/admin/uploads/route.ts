import { NextResponse } from "next/server";
import { saveUpload } from "@/lib/uploads";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Missing file" }, { status: 400 });
  }

  const path = await saveUpload(file);

  return NextResponse.json({ path });
}
