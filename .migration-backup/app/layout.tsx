import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import { Bell, Search } from "lucide-react";
import Link from "next/link";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "MedStudent",
  description: "Your all-in-one medical study companion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${dmSans.variable} antialiased`} style={{ margin: 0, padding: 0, background: "var(--background)" }}>
        
        {/* Top App Bar Header */}
        <header style={{
          position: "fixed", top: 0, left: 0, right: 0, height: "56px",
          background: "var(--surface)", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", zIndex: 100, boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
        }}>
          {/* Logo / Brand Name */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-outfit)", fontWeight: 800, fontSize: "19px", color: "var(--blue)" }}>
              MedStudent
            </span>
          </Link>

          {/* Action Header Icons */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text-muted)" }}>
              <Search size={21} />
            </button>
            
            {/* Top Right Notifications Bell */}
            <Link href="/notifications" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", position: "relative" }}>
              <Bell size={21} />
              <span style={{ position: "absolute", top: "-2px", right: "-2px", width: "7px", height: "7px", background: "#E8445A", borderRadius: "50%" }} />
            </Link>
          </div>
        </header>

        {/* Global Page Content Container Padded Away From Fixed Elements */}
        <main style={{ paddingTop: "72px" }}>
          {children}
        </main>

      </body>
    </html>
  );
}
