import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getPrefs,
  savePrefs,
  clearPrefs,
  getGreeting,
  type Profession,
  type UserPrefs,
} from "./userPrefs";

const STORAGE_KEY = "medstudent_prefs";

describe("userPrefs", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getPrefs", () => {
    it("returns null when nothing is stored", () => {
      expect(getPrefs()).toBeNull();
    });

    it("returns parsed prefs from localStorage", () => {
      const prefs: UserPrefs = { profession: "Nurse", name: "Ada" };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      expect(getPrefs()).toEqual(prefs);
    });

    it("returns null for malformed JSON", () => {
      localStorage.setItem(STORAGE_KEY, "not-json{{");
      expect(getPrefs()).toBeNull();
    });

    it("returns prefs with all optional fields", () => {
      const prefs: UserPrefs = {
        profession: "Dentist",
        name: "Ade",
        username: "ade123",
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      const result = getPrefs();
      expect(result).toEqual(prefs);
      expect(result?.username).toBe("ade123");
    });
  });

  describe("savePrefs", () => {
    it("persists prefs to localStorage", () => {
      const prefs: UserPrefs = { profession: "Pharmacist" };
      savePrefs(prefs);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(prefs);
    });

    it("overwrites previous prefs", () => {
      savePrefs({ profession: "Nurse" });
      savePrefs({ profession: "Dentist", name: "Ayo" });
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.profession).toBe("Dentist");
      expect(stored.name).toBe("Ayo");
    });
  });

  describe("clearPrefs", () => {
    it("removes prefs from localStorage", () => {
      savePrefs({ profession: "Nurse" });
      clearPrefs();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("is safe to call when nothing is stored", () => {
      expect(() => clearPrefs()).not.toThrow();
    });
  });

  describe("getGreeting", () => {
    const cases: [Profession, string][] = [
      ["Medical Doctor", "Good day, Doctor in training 👋"],
      ["Radiographer", "Good day, Radiographer in training 👋"],
      ["Nurse", "Good day, Nurse in training 👋"],
      ["Anatomist", "Good day, Anatomist in training 👋"],
      ["Pharmacist", "Good day, Pharmacist in training 👋"],
      ["Physiotherapist", "Good day, Physio in training 👋"],
      ["Dentist", "Good day, Dentist in training 👋"],
      ["Other", "Good day, Health professional in training 👋"],
    ];

    it.each(cases)("returns correct greeting for %s", (profession, expected) => {
      expect(getGreeting(profession)).toBe(expected);
    });
  });
});
