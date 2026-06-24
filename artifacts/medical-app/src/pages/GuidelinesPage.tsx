import AppShell from "@/components/AppShell";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function GuidelinesPage() {
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
            Content Guidelines
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-light)", marginBottom: "24px" }}>
            Last modified: June 21, 2026
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px", color: "var(--text-muted)", fontSize: "14.5px", lineHeight: "1.6" }}>
            <section>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "8px" }}>
                1. Respectful Academic Exchange
              </h3>
              <p>
                Our community is dedicated entirely to collaborative learning. Treat fellow peers with respect. Harassment, insults, hate speech, or derogatory remarks directed at other sub-specialties or medical students will not be tolerated.
              </p>
            </section>

            <section>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "8px" }}>
                2. Academic Integrity & Research Plagiarism
              </h3>
              <p>
                When sharing medical textbooks, journals, or clinical research summaries, credit the original sources and authors. Do not post complete textbook contents directly that infringe on publishers' intellectual property.
              </p>
            </section>

            <section>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "8px" }}>
                3. Precision and False Information Flags
              </h3>
              <p>
                Providing clinical explanations during MCQ revisions requires safety. If you present false clinical guidelines, other users or moderator panels can flag your explanation for revision/editing. Ensure clinical cases and dosage summaries remain verified and professional.
              </p>
            </section>

            <section>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "8px" }}>
                4. Patient Confidentiality & HIPAA Compliance
              </h3>
              <p style={{ fontWeight: 600, color: "var(--text-light)" }}>
                IMPORTANT: When discussing clinical cases seen in teaching hospitals, protect patient privacy. Never use genuine names, specific identification tags, real-world case report numbers, or photo assets containing patient faces or identifiable signs. Keep all presentations hypothetical and fully anonymized.
              </p>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
