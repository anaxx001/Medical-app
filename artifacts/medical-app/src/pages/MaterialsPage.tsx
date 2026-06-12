import { useMemo, useState } from "react";
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

export default function MaterialsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfession, setSelectedProfession] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");

  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      const matchesSearch =
        material.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        material.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesProfession =
        selectedProfession === "All" ||
        material.profession === selectedProfession;

      const matchesYear =
        selectedYear === "All" ||
        material.year === selectedYear;

      return (
        matchesSearch &&
        matchesProfession &&
        matchesYear
      );
    });
  }, [searchTerm, selectedProfession, selectedYear]);

  const getTypeBadge = (type: Material["type"]) => {
    switch (type) {
      case "PDF":
        return "bg-red-100 text-red-700";
      case "Notes":
        return "bg-amber-100 text-amber-700";
      case "Link":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <h1 className="text-3xl font-bold">
            Learning Materials
          </h1>

          <p className="mt-3 max-w-2xl text-teal-50">
            Browse lecture notes, PDFs, study guides, past questions,
            and external learning resources uploaded by administrators.
          </p>

          {/* Search */}
          <div className="relative mt-6 max-w-xl">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl bg-white py-3 pl-11 pr-4 text-slate-700 outline-none"
            />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <div className="mb-4 flex items-center gap-2">
            <Filter size={18} />
            <h2 className="font-semibold text-slate-800">
              Filters
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Profession
              </label>

              <select
                value={selectedProfession}
                onChange={(e) =>
                  setSelectedProfession(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                {professions.map((profession) => (
                  <option
                    key={profession}
                    value={profession}
                  >
                    {profession}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Academic Year
              </label>

              <select
                value={selectedYear}
                onChange={(e) =>
                  setSelectedYear(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
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
      </section>

      {/* Materials Grid */}
      <section className="mx-auto max-w-7xl px-6 pb-10">
        {filteredMaterials.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredMaterials.map((material) => (
              <div
                key={material.id}
                className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypeBadge(
                      material.type
                    )}`}
                  >
                    {material.type}
                  </span>

                  <BookOpen
                    size={20}
                    className="text-teal-600"
                  />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {material.title}
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  {material.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700">
                    {material.profession}
                  </span>

                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                    {material.year}
                  </span>
                </div>

                <p className="mt-4 text-xs text-slate-500">
                  Uploaded by {material.uploadedBy}
                </p>

                <div className="mt-6">
                  {material.type === "Link" ? (
                    <a
                      href={material.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-white hover:bg-teal-700"
                    >
                      <ExternalLink size={18} />
                      Open Resource
                    </a>
                  ) : (
                    <a
                      href={material.fileUrl}
                      download
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-white hover:bg-teal-700"
                    >
                      <Download size={18} />
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <FileText
              size={48}
              className="mx-auto text-teal-500"
            />

            <h3 className="mt-4 text-xl font-semibold text-slate-900">
              No Materials Found
            </h3>

            <p className="mt-2 text-slate-600">
              Try changing your filters or search term.
            </p>

            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedProfession("All");
                setSelectedYear("All");
              }}
              className="mt-5 rounded-xl bg-teal-600 px-5 py-3 text-white hover:bg-teal-700"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}