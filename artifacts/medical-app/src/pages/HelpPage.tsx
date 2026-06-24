import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, HelpCircle, Mail, Phone, BookOpen, ShieldCheck } from "lucide-react";

export default function HelpPage() {
  const faqs = [
    { q: "Is the student dataset verified by the MDCN?", a: "Yes, our clinical resource cards and syllabus materials undergo active verification reviews by medical consultants." },
    { q: "How does the Low-Data Mode function under grid-limitations?", a: "Go to Settings and toggle Low-Data Mode. It will instantly compress peer audio files, disable fancy animations, and buffer questions offline." },
    { q: "Are study circles completely private?", a: "Private circles have a maximum cap of 8 group members. Discussions are completely secure." }
  ];

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "24px 16px 80px", fontFamily: "var(--font-body)", color: "var(--text)" }}>
      
      <div style={{ marginBottom: "20px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--text-muted)", fontSize: "14px", fontWeight: 600 }}>
          <ArrowLeft size={16} /> Returns to Core Console
        </Link>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "28px" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, color: "#0D9488" }}>SUPPORT HUB</span>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, margin: "4px 0 0" }}>
              Help & Academic Guidance
            </h1>
          </div>
          <HelpCircle color="#0D9488" size={24} />
        </div>

        {/* FAQS */}
        <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 800 }}>Frequently Asked Questions</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", padding: "16px", borderRadius: "12px" }}>
              <strong style={{ display: "block", fontSize: "14px", marginBottom: "6px" }}>{faq.q}</strong>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.4 }}>{faq.a}</p>
            </div>
          ))}
        </div>

        {/* SUPPORT CHANNELS */}
        <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 800 }}>Contact Platform Representatives</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr md:1fr", gap: "12px" }} className="grid-cols-1 md:grid-cols-2">
          <div style={{ border: "1px solid var(--border)", padding: "16px", borderRadius: "12px", display: "flex", gap: "10px", alignItems: "center" }}>
            <Mail size={18} color="#0D9488" />
            <div>
              <strong style={{ display: "block", fontSize: "13px" }}>Academic Support desk</strong>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>academic-support@medstudent.ng</span>
            </div>
          </div>

          <div style={{ border: "1px solid var(--border)", padding: "16px", borderRadius: "12px", display: "flex", gap: "10px", alignItems: "center" }}>
            <Phone size={18} color="#0D9488" />
            <div>
              <strong style={{ display: "block", fontSize: "13px" }}>Student Crisis Counselling</strong>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>+234 (0) 800-MENTAL-HELP</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
