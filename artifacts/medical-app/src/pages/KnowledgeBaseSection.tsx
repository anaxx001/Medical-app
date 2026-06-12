import { useMemo, useState } from "react";
import {
  Upload,
  Database,
  FileText,
  Link,
  Search,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

type KnowledgeDocument = {
  id: string;
  title: string;
  profession: string;
  year: string;
  sourceType: "PDF" | "DOCX" | "URL";
  chunks: number;
  status: "Indexed" | "Processing" | "Failed";
  uploadedAt: string;
};

const mockDocuments: KnowledgeDocument[] = [
  {
    id: "1",
    title: "General Anatomy Notes",
    profession: "Medicine",
    year: "200L",
    sourceType: "PDF",
    chunks: 145,
    status: "Indexed",
    uploadedAt: "2026-05-20",
  },
  {
    id: "2",
    title: "Pharmacology Handbook",
    profession: "Pharmacy",
    year: "300L",
    sourceType: "PDF",
    chunks: 203,
    status: "Indexed",
    uploadedAt: "2026-05-22",
  },
  {
    id: "3",
    title: "Clinical Skills Resource",
    profession: "Medicine",
    year: "400L",
    sourceType: "URL",
    chunks: 0,
    status: "Processing",
    uploadedAt: "2026-05-25",
  },
];

export default function KnowledgeBaseSection() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDocs = useMemo(() => {
    return mockDocuments.filter((doc) =>
      doc.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const totalChunks = mockDocuments.reduce(
    (acc, doc) => acc + doc.chunks,
    0
  );

  const indexedCount = mockDocuments.filter(
    (doc) => doc.status === "Indexed"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <Database />
          <h2 className="text-2xl font-bold">
            AI Knowledge Base
          </h2>
        </div>

        <p className="mt-3 text-teal-50">
          Upload and index learning materials that
          power the AI study assistant.
        </p>
      </div>

      {/* Stats */}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm border">
          <p className="text-sm text-slate-500">
            Indexed Documents
          </p>

          <h3 className="mt-2 text-3xl font-bold text-teal-600">
            {indexedCount}
          </h3>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm border">
          <p className="text-sm text-slate-500">
            Total Chunks
          </p>

          <h3 className="mt-2 text-3xl font-bold text-emerald-600">
            {totalChunks}
          </h3>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm border">
          <p className="text-sm text-slate-500">
            Vector Search Status
          </p>

          <h3 className="mt-2 text-lg font-semibold text-green-600">
            Active
          </h3>
        </div>
      </div>

      {/* Upload Area */}

      <div className="rounded-2xl border-2 border-dashed border-teal-300 bg-white p-8">
        <div className="text-center">
          <Upload
            size={48}
            className="mx-auto text-teal-600"
          />

          <h3 className="mt-4 text-lg font-semibold">
            Upload Knowledge Sources
          </h3>

          <p className="mt-2 text-slate-500">
            PDF, DOCX, lecture notes or trusted
            educational resources.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button className="rounded-xl bg-teal-600 px-5 py-3 text-white">
              Upload File
            </button>

            <button className="rounded-xl border border-slate-300 px-5 py-3">
              Add URL
            </button>
          </div>
        </div>
      </div>

      {/* Search */}

      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          placeholder="Search indexed documents..."
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
          className="w-full rounded-xl border bg-white py-3 pl-11 pr-4"
        />
      </div>

      {/* Documents Table */}

      <div className="rounded-2xl bg-white shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left">
                  Document
                </th>
                <th className="px-6 py-4 text-left">
                  Profession
                </th>
                <th className="px-6 py-4 text-left">
                  Year
                </th>
                <th className="px-6 py-4 text-left">
                  Chunks
                </th>
                <th className="px-6 py-4 text-left">
                  Status
                </th>
                <th className="px-6 py-4 text-left">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredDocs.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-t"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {doc.sourceType === "URL" ? (
                        <Link size={18} />
                      ) : (
                        <FileText size={18} />
                      )}

                      {doc.title}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {doc.profession}
                  </td>

                  <td className="px-6 py-4">
                    {doc.year}
                  </td>

                  <td className="px-6 py-4">
                    {doc.chunks}
                  </td>

                  <td className="px-6 py-4">
                    {doc.status === "Indexed" && (
                      <span className="flex items-center gap-2 text-green-600">
                        <CheckCircle size={16} />
                        Indexed
                      </span>
                    )}

                    {doc.status === "Processing" && (
                      <span className="flex items-center gap-2 text-amber-600">
                        <RefreshCw size={16} />
                        Processing
                      </span>
                    )}

                    {doc.status === "Failed" && (
                      <span className="flex items-center gap-2 text-red-600">
                        <AlertCircle size={16} />
                        Failed
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="rounded-lg border px-3 py-2 hover:bg-slate-50">
                        Reindex
                      </button>

                      <button className="rounded-lg border px-3 py-2 text-red-600 hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}