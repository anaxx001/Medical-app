/**
 * localStorage-based user preferences for onboarding & tour state
 */

const TOUR_COMPLETED_KEY = "medstudent-tour-completed";
const FIRST_LOGIN_SEEDS_SENT_KEY = "medstudent-first-login-seeds-sent";
const TOUR_LAUNCHED_KEY = "medstudent-tour-launched";
const USER_PREFS_KEY = "medstudent-user-prefs";

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
  profession?: Profession;
  name?: string;
}

export function savePrefs(prefs: UserPrefs) {
  localStorage.setItem(USER_PREFS_KEY, JSON.stringify(prefs));
}

export function loadPrefs(): UserPrefs | null {
  const raw = localStorage.getItem(USER_PREFS_KEY);
  return raw ? JSON.parse(raw) : null;
}

export const userPrefs = {
  setTourCompleted(completed: boolean) {
    localStorage.setItem(TOUR_COMPLETED_KEY, String(completed));
  },
  isTourCompleted(): boolean {
    return localStorage.getItem(TOUR_COMPLETED_KEY) === "true";
  },

  setFirstLoginSeedsSent(sent: boolean) {
    localStorage.setItem(FIRST_LOGIN_SEEDS_SENT_KEY, String(sent));
  },
  areFirstLoginSeedsSent(): boolean {
    return localStorage.getItem(FIRST_LOGIN_SEEDS_SENT_KEY) === "true";
  },

  setTourLaunched(launched: boolean) {
    localStorage.setItem(TOUR_LAUNCHED_KEY, String(launched));
  },
  isTourLaunched(): boolean {
    return localStorage.getItem(TOUR_LAUNCHED_KEY) === "true";
  },

  resetOnboarding() {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    localStorage.removeItem(FIRST_LOGIN_SEEDS_SENT_KEY);
    localStorage.removeItem(TOUR_LAUNCHED_KEY);
    localStorage.removeItem(USER_PREFS_KEY);
  },
};