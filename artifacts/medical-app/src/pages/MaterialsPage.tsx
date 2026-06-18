import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  Search,
  FileText,
  Download,
  ExternalLink,
  Filter,
  BookOpen,
} from "lucide-react";

type Material = {
  id: string;
  title: string;
  description: string;
  profession: string;
  year: string;
  type: "PDF" | "Notes" | "Link";
  fileUrl: string;
  uploadedBy: string;
};

const materials: Material[] = [
  {
    id: "1",
    title: "General Anatomy Lecture Notes",
    description: "Comprehensive anatomy notes covering upper and lower limbs.",
    profession: "Medicine",
    year: "200L",
    type: "PDF",
    fileUrl: "#",
    uploadedBy: "Admin",
  },
  {
    id: "2",
    title: "Pharmacology Revision Guide",
    description: "Quick revision notes for major drug classes.",
    profession: "Pharmacy",
    year: "300L",
    type: "Notes",
    fileUrl: "#",
    uploadedBy: "Admin",
  },
  {
    id: "3",
    title: "Clinical Examination Video Series",
    description: "External learning resource for OSCE preparation.",
    profession: "Medicine",
    year: "400L",
    type: "Link",
    fileUrl: "#",
    uploadedBy: "Admin",
  },
  {
    id: "4",
    title: "Medical Biochemistry Summary",
    description: "Exam-focused summary notes.",
    profession: "MLS",
    year: "200L",
    type: "PDF",
    fileUrl: "#",
    uploadedBy: "Admin",
  },
];

const professions = [
  "All",
  "Medicine",
  "Nursing",
  "Pharmacy",
  "MLS",
  "Physiotherapy",
];

const years = [
  "All",
  "100L",
  "200L",
  "300L",
  "400L",
  "500L",
  "600L",
];

function getTypeBadge(type: Material["type"]) {
  switch (type) {
    case "PDF":
      return { bg: "rgba(239,68,68,0.1)", color: "#DC2626" };
    case "Notes":
      return { bg: "rgba(245,158,11,0.1)", color: "#D97706" };
    case "Link":
      return { bg: "rgba(59,130,246,0.1)", color: "#2563EB" };
    default:
      return { bg: "var(--surface-2)", color: "var(--text-muted)" };
  }
}

export default function MaterialsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfession, setSelectedProfession] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");

  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      const matchesSearch =
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProfession =
        selectedProfession === "All" ||
        material.profession === selectedProfession;

      const matchesYear =
        selectedYear === "All" ||
        material.year === selectedYear;

      return matchesSearch && matchesProfession && matchesYear;
    });
  }, [searchTerm, selectedProfession, selectedYear]);

  return (
    <AppShell>
      {/* Hero Section */}
      <div style={{ background: "linear-gradient(135deg, #0D9488, #14B8A6)", color: "white" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "28px", margin: "0 0 12px" }}>
            Learning Materials
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.85)", maxWidth: "600px", margin: "0 0 24px", lineHeight: 1.5 }}>
            Browse lecture notes, PDFs, study guides, past questions,
            and external learning resources uploaded by administrators.
          </p>

          {/* Search */}
          <div style={{ position: "relative", maxWidth: "500px" }}>
            <Search
              size={18}
              style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px 12px 48px",
                borderRadius: "var(--radius)",
                border: "none",
                background: "white",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--text)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
        <div style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          padding: "20px",
          boxShadow: "var(--shadow)",
          marginBottom: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Filter size={18} color="var(--text-muted)" />
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)", margin: 0 }}>
              Filters
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: "8px",
                fontFamily: "var(--font-display)",
              }}>
                Profession
              </label>
              <select
                value={selectedProfession}
                onChange={(e) => setSelectedProfession(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--text)",
                  outline: "none",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                {professions.map((profession) => (
                  <option key={profession} value={profession}>
                    {profession}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: "8px",
                fontFamily: "var(--font-display)",
              }}>
                Academic Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--text)",
                  outline: "none",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Materials Grid */}
        {filteredMaterials.length > 0 ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}>
            {filteredMaterials.map((material) => {
              const badge = getTypeBadge(material.type);
              return (
                <div
                  key={material.id}
                  style={{
                    background: "var(--surface)",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    padding: "24px",
                    boxShadow: "var(--shadow)",
                    transition: "box-shadow 0.2s ease, transform 0.2s ease",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "var(--shadow)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                    <span style={{
                      padding: "4px 12px",
                      borderRadius: "99px",
                      fontSize: "11px",
                      fontWeight: 700,
                      fontFamily: "var(--font-display)",
                      background: badge.bg,
                      color: badge.color,
                    }}>
                      {material.type}
                    </span>
                    <BookOpen size={20} color="#0D9488" />
                  </div>

                  <h3 style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "17px",
                    color: "var(--text)",
                    margin: "0 0 8px",
                    lineHeight: 1.3,
                  }}>
                    {material.title}
                  </h3>

                  <p style={{
                    fontSize: "13.5px",
                    color: "var(--text-muted)",
                    margin: "0 0 16px",
                    lineHeight: 1.5,
                    fontFamily: "var(--font-body)",
                  }}>
                    {material.description}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "99px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: "rgba(13,148,136,0.08)",
                      color: "#0D9488",
                    }}>
                      {material.profession}
                    </span>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "99px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: "rgba(20,184,166,0.08)",
                      color: "#14B8A6",
                    }}>
                      {material.year}
                    </span>
                  </div>

                  <p style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    margin: "0 0 16px",
                    fontFamily: "var(--font-body)",
                  }}>
                    Uploaded by {material.uploadedBy}
                  </p>

                  <div>
                    {material.type === "Link" ? (
                      <a
                        href={material.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          width: "100%",
                          padding: "12px",
                          borderRadius: "var(--radius-sm)",
                          background: "#0D9488",
                          color: "white",
                          fontFamily: "var(--font-display)",
                          fontWeight: 700,
                          fontSize: "14px",
                          textDecoration: "none",
                          cursor: "pointer",
                          transition: "background 0.2s ease",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#0F766E"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#0D9488"; }}
                      >
                        <ExternalLink size={18} />
                        Open Resource
                      </a>
                    ) : (
                      <a
                        href={material.fileUrl}
                        download
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          width: "100%",
                          padding: "12px",
                          borderRadius: "var(--radius-sm)",
                          background: "#0D9488",
                          color: "white",
                          fontFamily: "var(--font-display)",
                          fontWeight: 700,
                          fontSize: "14px",
                          textDecoration: "none",
                          cursor: "pointer",
                          transition: "background 0.2s ease",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#0F766E"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#0D9488"; }}
                      >
                        <Download size={18} />
                        Download
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "60px 24px",
            background: "var(--surface)",
            borderRadius: "var(--radius)",
            border: "1.5px dashed var(--border)",
          }}>
            <FileText size={48} color="#0D9488" style={{ margin: "0 auto 16px", display: "block", opacity: 0.5 }} />
            <h3 style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "20px",
              color: "var(--text)",
              margin: "0 0 8px",
            }}>
              No Materials Found
            </h3>
            <p style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              margin: "0 0 20px",
              fontFamily: "var(--font-body)",
            }}>
              Try changing your filters or search term.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedProfession("All");
                setSelectedYear("All");
              }}
              style={{
                padding: "11px 24px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "#0D9488",
                color: "white",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#0F766E"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#0D9488"; }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
