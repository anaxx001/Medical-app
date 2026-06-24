import AppShell from "@/components/AppShell";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-light)", marginBottom: "24px" }}>
            Last modified: June 21, 2026
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px", color: "var(--text-muted)", fontSize: "14.5px", lineHeight: "1.6" }}>
            <section>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "8px" }}>
                1. Acceptance of Terms
              </h3>
              <p>
                By accessing or using the MedStudent Platform, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "8px" }}>
                2. Eligibility and User Conduct
              </h3>
              <p>
                This platform is dedicated to medical students and healthcare professionals in Nigeria. You agree to use the platform solely for educational, professional collaboration, and peer discussion. Impersonating licensed medical practitioners or presenting false research credentials/clinical advice is strictly prohibited.
              </p>
            </section>

            <section>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "8px" }}>
                3. Content Ownership and Fair Use
              </h3>
              <p>
                You retain initial ownership over any study notes, custom questions, or clinical explanations you post. However, by uploading content, you grant MedStudent a perpetual, free royalty license to distribute and display your materials to other subscribed students for collective revision purposes.
              </p>
            </section>

            <section>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "8px" }}>
                4. Professional Disclaimer
              </h3>
              <p style={{ fontWeight: 600, color: "var(--text-light)" }}>
                IMPORTANT: Content shared on our platform represents collective study notes, peers' discussion, and AI simulations. It is NOT structured or certified medical/clinical advice. Never use resources on this platform in place of formal teaching or official clinical guidelines published by the Medical and Dental Council of Nigeria.
              </p>
            </section>

            <section>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "8px" }}>
                5. Account Moderation and Suspension
              </h3>
              <p>
                Our administration panel monitors posts and community channels. Violating academic integrity, posting plagiarized questions, or engaging in abusive peer-to-peer messaging will result in instant account suspension or a formal ban.
              </p>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
