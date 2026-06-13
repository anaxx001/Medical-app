export type MediaKind = "image" | "audio" | "video" | "document";

export const MEDIA_EXTENSIONS: Record<MediaKind, string[]> = {
  image: ["png", "jpg", "jpeg", "webp", "gif"],
  audio: ["mp3", "wav", "m4a", "aac"],
  video: ["mp4", "mov", "webm"],
  document: ["pdf", "docx", "txt"],
};

export function getFileName(url: string): string {
  const clean = url.split("?")[0].split("#")[0];
  const last = clean.split("/").pop() || "file";
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

export function resolveMediaKind(fileUrl: string, fileType?: string): MediaKind {
  const t = fileType?.toLowerCase();
  if (t === "image" || t === "audio" || t === "video" || t === "document") return t;
  if (t === "pdf") return "document";
  const ext = getFileName(fileUrl).split(".").pop()?.toLowerCase() || "";
  for (const kind of Object.keys(MEDIA_EXTENSIONS) as MediaKind[]) {
    if (MEDIA_EXTENSIONS[kind].includes(ext)) return kind;
  }
  return "document";
}

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}
