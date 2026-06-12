import { useEffect, useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { createClient } from "@/lib/supabase";

type Category =
  | "Medicine"
  | "Nursing"
  | "Radiography"
  | "Pharmacy"
  | "Dentistry"
  | "Other";

interface FormErrors {
  name?: string;
  displayName?: string;
  description?: string;
  category?: string;
  submit?: string;
}

const categories: Category[] = [
  "Medicine",
  "Nursing",
  "Radiography",
  "Pharmacy",
  "Dentistry",
  "Other",
];

export default function StartCommunityPage() {
  const [, setLocation] = useLocation();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("Medicine");
  const [isPrivate, setIsPrivate] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLocation("/login");
        return;
      }

      setAuthLoading(false);
    }

    checkAuth();
  }, [setLocation, supabase]);

  const validate = () => {
    const nextErrors: FormErrors = {};

    const slugRegex = /^[a-z0-9-]+$/;

    if (!name.trim()) {
      nextErrors.name = "Community name is required.";
    } else if (!slugRegex.test(name)) {
      nextErrors.name =
        "Use lowercase letters, numbers and hyphens only.";
    } else if (name.length < 3) {
      nextErrors.name =
        "Community name must be at least 3 characters.";
    }

    if (!displayName.trim()) {
      nextErrors.displayName = "Display name is required.";
    }

    if (!description.trim()) {
      nextErrors.description = "Description is required.";
    } else if (description.length < 20) {
      nextErrors.description =
        "Description should be at least 20 characters.";
    }

    if (!category) {
      nextErrors.category = "Please select a category.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLocation("/login");
        return;
      }

      const { data: existingCommunity } = await supabase
        .from("communities")
        .select("id")
        .eq("name", name)
        .maybeSingle();

      if (existingCommunity) {
        setErrors({
          name: "This community name already exists.",
        });
        return;
      }

      const { error } = await supabase
        .from("communities")
        .insert({
          name,
          display_name: displayName,
          description,
          category,
          is_private: isPrivate,
          created_by: user.id,
        });

      if (error) {
        throw error;
      }

      setLocation(`/community/${name}`);
    } catch (error: any) {
      setErrors({
        submit:
          error?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-600">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">
              Create a Community
            </h1>

            <p className="mt-2 text-slate-600">
              Build a study community for health
              science students across Nigeria.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Community Name
              </label>

              <div className="flex items-center rounded-lg border border-slate-300 px-3">
                <span className="text-slate-500">
                  r/
                </span>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                    )
                  }
                  placeholder="anatomy101"
                  className="w-full border-0 bg-transparent px-2 py-3 outline-none"
                />
              </div>

              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Display Name
              </label>

              <input
                type="text"
                value={displayName}
                onChange={(e) =>
                  setDisplayName(e.target.value)
                }
                placeholder="Anatomy 101"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600"
              />

              {errors.displayName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.displayName}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                rows={5}
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Describe the purpose of this community..."
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600"
              />

              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Category
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value as Category
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600"
              >
                {categories.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>

              {errors.category && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-700">
                Visibility
              </label>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setIsPrivate(false)
                  }
                  className={`rounded-lg px-4 py-2 font-medium ${
                    !isPrivate
                      ? "bg-teal-600 text-white"
                      : "border border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  Public
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setIsPrivate(true)
                  }
                  className={`rounded-lg px-4 py-2 font-medium ${
                    isPrivate
                      ? "bg-teal-600 text-white"
                      : "border border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  Private
                </button>
              </div>
            </div>

            {errors.submit && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errors.submit}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-teal-600 px-4 py-3 font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating Community..."
                : "Create Community"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
              }
