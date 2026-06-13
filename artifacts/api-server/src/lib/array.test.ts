import { describe, it, expect } from "vitest";
import { chunkArray } from "./array";

describe("chunkArray", () => {
  it("splits array into chunks of given size", () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns a single chunk when size >= length", () => {
    expect(chunkArray([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
  });

  it("returns empty array for empty input", () => {
    expect(chunkArray([], 3)).toEqual([]);
  });

  it("handles chunk size of 1", () => {
    expect(chunkArray(["a", "b", "c"], 1)).toEqual([["a"], ["b"], ["c"]]);
  });

  it("handles exact multiple of chunk size", () => {
    expect(chunkArray([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("works with large arrays", () => {
    const arr = Array.from({ length: 250 }, (_, i) => i);
    const chunks = chunkArray(arr, 100);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(100);
    expect(chunks[1]).toHaveLength(100);
    expect(chunks[2]).toHaveLength(50);
  });

  it("preserves element types", () => {
    const objs = [{ a: 1 }, { a: 2 }, { a: 3 }];
    const result = chunkArray(objs, 2);
    expect(result[0]).toEqual([{ a: 1 }, { a: 2 }]);
    expect(result[1]).toEqual([{ a: 3 }]);
  });
});
