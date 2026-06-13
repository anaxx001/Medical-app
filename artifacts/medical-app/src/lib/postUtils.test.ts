import { describe, it, expect, vi, afterEach } from "vitest";
import { getFileName, resolveMediaKind, timeAgo } from "./postUtils";

describe("getFileName", () => {
  it("extracts filename from a simple URL", () => {
    expect(getFileName("https://example.com/files/report.pdf")).toBe(
      "report.pdf",
    );
  });

  it("strips query parameters", () => {
    expect(getFileName("https://example.com/img.png?token=abc")).toBe(
      "img.png",
    );
  });

  it("strips hash fragments", () => {
    expect(getFileName("https://example.com/doc.txt#page=2")).toBe("doc.txt");
  });

  it("decodes URI-encoded filenames", () => {
    expect(getFileName("https://example.com/my%20file.pdf")).toBe(
      "my file.pdf",
    );
  });

  it('returns "file" for empty path', () => {
    expect(getFileName("")).toBe("file");
  });

  it("handles URLs with multiple path segments", () => {
    expect(
      getFileName("https://cdn.example.com/a/b/c/d/photo.jpg?v=1"),
    ).toBe("photo.jpg");
  });
});

describe("resolveMediaKind", () => {
  it("returns the explicit fileType when valid", () => {
    expect(resolveMediaKind("file.xyz", "image")).toBe("image");
    expect(resolveMediaKind("file.xyz", "audio")).toBe("audio");
    expect(resolveMediaKind("file.xyz", "video")).toBe("video");
    expect(resolveMediaKind("file.xyz", "document")).toBe("document");
  });

  it('maps "pdf" fileType to "document"', () => {
    expect(resolveMediaKind("file.xyz", "pdf")).toBe("document");
  });

  it("is case-insensitive for fileType", () => {
    expect(resolveMediaKind("file.xyz", "IMAGE")).toBe("image");
    expect(resolveMediaKind("file.xyz", "PDF")).toBe("document");
  });

  it("falls back to extension-based detection", () => {
    expect(resolveMediaKind("photo.jpg")).toBe("image");
    expect(resolveMediaKind("song.mp3")).toBe("audio");
    expect(resolveMediaKind("clip.mp4")).toBe("video");
    expect(resolveMediaKind("notes.docx")).toBe("document");
  });

  it('defaults to "document" for unknown extensions', () => {
    expect(resolveMediaKind("archive.zip")).toBe("document");
    expect(resolveMediaKind("data.csv")).toBe("document");
  });

  it("handles URLs with query params for extension detection", () => {
    expect(resolveMediaKind("https://cdn.com/pic.webp?v=1")).toBe("image");
  });

  it("detects all supported image extensions", () => {
    for (const ext of ["png", "jpg", "jpeg", "webp", "gif"]) {
      expect(resolveMediaKind(`file.${ext}`)).toBe("image");
    }
  });

  it("detects all supported audio extensions", () => {
    for (const ext of ["mp3", "wav", "m4a", "aac"]) {
      expect(resolveMediaKind(`file.${ext}`)).toBe("audio");
    }
  });

  it("detects all supported video extensions", () => {
    for (const ext of ["mp4", "mov", "webm"]) {
      expect(resolveMediaKind(`file.${ext}`)).toBe("video");
    }
  });

  it("detects all supported document extensions", () => {
    for (const ext of ["pdf", "docx", "txt"]) {
      expect(resolveMediaKind(`file.${ext}`)).toBe("document");
    }
  });
});

describe("timeAgo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for very recent dates', () => {
    expect(timeAgo(new Date().toISOString())).toBe("just now");
  });

  it("returns minutes ago", () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);
    const fiveMinAgo = new Date(now - 5 * 60_000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe("5m ago");
    vi.useRealTimers();
  });

  it("returns hours ago", () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);
    const threeHoursAgo = new Date(now - 3 * 3_600_000).toISOString();
    expect(timeAgo(threeHoursAgo)).toBe("3h ago");
    vi.useRealTimers();
  });

  it("returns days ago", () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);
    const twoDaysAgo = new Date(now - 2 * 86_400_000).toISOString();
    expect(timeAgo(twoDaysAgo)).toBe("2d ago");
    vi.useRealTimers();
  });

  it("prioritises days over hours", () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);
    const ago = new Date(now - 25 * 3_600_000).toISOString(); // 25h = 1d
    expect(timeAgo(ago)).toBe("1d ago");
    vi.useRealTimers();
  });
});
