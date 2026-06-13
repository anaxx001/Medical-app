/**
 * localStorage-based user preferences for onboarding & tour state
 */

const TOUR_COMPLETED_KEY = "medstudent-tour-completed";
const FIRST_LOGIN_SEEDS_SENT_KEY = "medstudent-first-login-seeds-sent";
const TOUR_LAUNCHED_KEY = "medstudent-tour-launched";

export const userPrefs = {
  // Tour completion tracking
  setTourCompleted(completed: boolean) {
    localStorage.setItem(TOUR_COMPLETED_KEY, String(completed));
  },
  isTourCompleted(): boolean {
    return localStorage.getItem(TOUR_COMPLETED_KEY) === "true";
  },

  // First login seeds tracking
  setFirstLoginSeedsSent(sent: boolean) {
    localStorage.setItem(FIRST_LOGIN_SEEDS_SENT_KEY, String(sent));
  },
  areFirstLoginSeedsSent(): boolean {
    return localStorage.getItem(FIRST_LOGIN_SEEDS_SENT_KEY) === "true";
  },

  // Tour launch tracking (for manual launch from UI)
  setTourLaunched(launched: boolean) {
    localStorage.setItem(TOUR_LAUNCHED_KEY, String(launched));
  },
  isTourLaunched(): boolean {
    return localStorage.getItem(TOUR_LAUNCHED_KEY) === "true";
  },

  // Reset all onboarding state (for testing/reset)
  resetOnboarding() {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    localStorage.removeItem(FIRST_LOGIN_SEEDS_SENT_KEY);
    localStorage.removeItem(TOUR_LAUNCHED_KEY);
  },
};
