import AppShell from "@/components/AppShell";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Link href="/settings" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--teal)", textDecoration: "none", fontSize: "14px", fontWeight: 700 }}>
            <ArrowLeft size={16} /> Back to Settings
          </Link>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "32px", boxShadow: "var(--shadow)" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "28px", color: "var(--text)", marginBottom: "12px" }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-light)", marginBottom: "24px" }}>
            Last modified: June 21, 2026
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px", color: "var(--text-muted)", fontSize: "14.5px", lineHeight: "1.6" }}>
            <section>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "8px" }}>
                1. Data Collection
              </h3>
              <p>
                We collect your medical credentials, academic details (such as current institution and year of study), display name, and preferences when you complete the onboarding questionnaire. This is used to tailor flashcards, relevant case studies, and localized news parameters to your syllabus.
              </p>
            </section>

            <section>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "8px" }}>
                2. Privacy Settings and Controls
              </h3>
              <p>
                Under our system settings, you can toggle whether other peers see your current institution, year of study, follow graphs, or online status indicator. Direct messages are closed and gated by reciprocal follows if selected in your privacy preferences.
              </p>
            </section>

            <section>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "8px" }}>
                3. Information Storage
              </h3>
              <p>
                All account profiles and discussion feed data are securely persisted in encrypted cloud databases or isolated browser states at sandbox runtime, preventing credential exposures or data leaks.
              </p>
            </section>

            <section>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "8px" }}>
                4. Third-Party Integrations
              </h3>
              <p>
                Our interactive medical tutor leverages our secure, server-side Gemini AI API proxies. We do not expose your email, password, or direct identification logs to any external AI interfaces.
              </p>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
