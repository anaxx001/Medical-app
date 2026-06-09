import { createClient } from "./supabase";

export const BUCKET = "post-files";

export type AttachedFile = {
  url: string;
  type: string;
  name: string;
};

export function fileCategory(mimeType?: string): "image" | "pdf" | "doc" | "other" {
  if (!mimeType) return "other";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document")) return "doc";
  return "other";
}

export function categoryIcon(cat: ReturnType<typeof fileCategory>): string {
  switch (cat) {
    case "image": return "🖼";
    case "pdf": return "📄";
    case "doc": return "📝";
    default: return "📎";
  }
}

export async function uploadPostFile(
  uri: string,
  mimeType: string,
  fileName: string,
  userId: string,
): Promise<AttachedFile> {
  const supabase = createClient();
  const ext = fileName.split(".").pop()?.toLowerCase() || "bin";
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${Date.now()}-${safeName}`;

  const formData = new FormData();
  formData.append("file", { uri, name: safeName, type: mimeType } as any);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, formData, { contentType: mimeType, upsert: false });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return { url: publicUrl, type: mimeType, name: fileName };
}
