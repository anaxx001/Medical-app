import { createClient } from "@/lib/supabase";
import { userPrefs } from "@/lib/userPrefs";

/**
 * Seeds 3 welcome notifications on first login
 */
export async function seedFirstLoginNotifications(userId: string) {
  // Check if already sent
  if (userPrefs.areFirstLoginSeedsSent()) {
    return;
  }

  const supabase = createClient();

  try {
    const seedNotifications = [
      {
        user_id: userId,
        type: "welcome" as const,
        content: "Welcome to MedStudent! 🎉 You've joined a vibrant community of medical students sharing knowledge, resources, and support.",
        post_id: null,
        triggered_by_user_id: null,
        read: false,
      },
      {
        user_id: userId,
        type: "moderator_guide" as const,
        content: "💡 Tip: Help the community! You can submit complaints, suggestions, or apply for a moderator role in Settings > Support & Feedback.",
        post_id: null,
        triggered_by_user_id: null,
        read: false,
      },
      {
        user_id: userId,
        type: "tour_guide" as const,
        content: "🚀 New here? Relaunch the interactive app tour anytime from Settings to learn all the features and how to use them.",
        post_id: null,
        triggered_by_user_id: null,
        read: false,
      },
    ];

    const { error } = await supabase.from("notifications").insert(seedNotifications);

    if (error) throw error;

    userPrefs.setFirstLoginSeedsSent(true);
    console.log("First login welcome notifications seeded successfully");
  } catch (err) {
    console.error("Error seeding first login notifications:", err);
  }
}
