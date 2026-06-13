import { describe, it, expect } from "vitest";
import { reducer } from "./use-toast";

function makeToast(overrides: Record<string, unknown> = {}) {
  return { id: "1", open: true, ...overrides } as any;
}

describe("use-toast reducer", () => {
  describe("ADD_TOAST", () => {
    it("adds a toast to an empty list", () => {
      const state = { toasts: [] };
      const result = reducer(state, {
        type: "ADD_TOAST",
        toast: makeToast({ id: "a" }),
      });
      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe("a");
    });

    it("prepends new toast and respects the limit of 1", () => {
      const state = { toasts: [makeToast({ id: "old" })] };
      const result = reducer(state, {
        type: "ADD_TOAST",
        toast: makeToast({ id: "new" }),
      });
      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe("new");
    });
  });

  describe("UPDATE_TOAST", () => {
    it("updates a matching toast by id", () => {
      const state = { toasts: [makeToast({ id: "1", title: "Old" })] };
      const result = reducer(state, {
        type: "UPDATE_TOAST",
        toast: { id: "1", title: "New" },
      });
      expect(result.toasts[0].title).toBe("New");
    });

    it("does not modify non-matching toasts", () => {
      const state = {
        toasts: [
          makeToast({ id: "1", title: "Keep" }),
        ],
      };
      const result = reducer(state, {
        type: "UPDATE_TOAST",
        toast: { id: "other", title: "Change" },
      });
      expect(result.toasts[0].title).toBe("Keep");
    });
  });

  describe("DISMISS_TOAST", () => {
    it("sets open=false for a specific toast", () => {
      const state = { toasts: [makeToast({ id: "1", open: true })] };
      const result = reducer(state, { type: "DISMISS_TOAST", toastId: "1" });
      expect(result.toasts[0].open).toBe(false);
    });

    it("dismisses all toasts when no toastId given", () => {
      const state = {
        toasts: [makeToast({ id: "1", open: true })],
      };
      const result = reducer(state, { type: "DISMISS_TOAST" });
      expect(result.toasts.every((t: any) => t.open === false)).toBe(true);
    });
  });

  describe("REMOVE_TOAST", () => {
    it("removes a specific toast by id", () => {
      const state = { toasts: [makeToast({ id: "1" })] };
      const result = reducer(state, { type: "REMOVE_TOAST", toastId: "1" });
      expect(result.toasts).toHaveLength(0);
    });

    it("removes all toasts when no toastId given", () => {
      const state = { toasts: [makeToast({ id: "1" })] };
      const result = reducer(state, { type: "REMOVE_TOAST" });
      expect(result.toasts).toHaveLength(0);
    });

    it("leaves other toasts intact", () => {
      const state = {
        toasts: [makeToast({ id: "1" }), makeToast({ id: "2" })],
      };
      const result = reducer(state, { type: "REMOVE_TOAST", toastId: "1" });
      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe("2");
    });
  });
});
