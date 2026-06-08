export type Profession =
  | "Medical Doctor"
  | "Radiographer"
  | "Nurse"
  | "Anatomist"
  | "Pharmacist"
  | "Physiotherapist"
  | "Dentist"
  | "Other";

export interface UserPrefs {
  profession: Profession;
  name?: string;
}

const KEY = "medstudent_prefs";

export function getPrefs(): UserPrefs | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return null; }
}

export function savePrefs(prefs: UserPrefs): void {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}

export function clearPrefs(): void {
  localStorage.removeItem(KEY);
}

export function getGreeting(profession: Profession): string {
  const greetings: Record<Profession, string> = {
    "Medical Doctor": "Good day, Doctor in training 👋",
    "Radiographer": "Good day, Radiographer in training 👋",
    "Nurse": "Good day, Nurse in training 👋",
    "Anatomist": "Good day, Anatomist in training 👋",
    "Pharmacist": "Good day, Pharmacist in training 👋",
    "Physiotherapist": "Good day, Physio in training 👋",
    "Dentist": "Good day, Dentist in training 👋",
    "Other": "Good day, Health professional in training 👋",
  };
  return greetings[profession];
}