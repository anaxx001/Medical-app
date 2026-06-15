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

type GroupSize = "under_50" | "50_200" | "200_plus";

interface FormErrors {
  name?: string;
  displayName?: string;
  description?: string;
  category?: string;
  justification?: string;
  groupSize?: string;
  agreement?: string;
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

// Suggested tags students can pick from. Feel free to edit this list -
// e.g. add more schools, levels or subject hashtags as your user base grows.
const suggestedTags = [
  "UNILAG",
  "UI",
  "UNIBEN",
  "UNN",
  "OAU",
  "ABU",
  "LUTH",
  "100 Level",
  "200 Level",
  "300 Level",
  "400 Level",
  "Clinicals",
  "#Anatomy",
  "#Physiology",
  "#Biochemistry",
  "#Pathology",
  "#Pharmacology",
];

const groupSizeOptions: { value: GroupSize; label: string; hint: string }[] = [
  { value: "under_50", label: "Under 50", hint: "Class group" },
  { value: "50_200", label: "50–200", hint: "Departmental" },
  { value: "200_plus", label: "200+", hint: "Inter-university" },
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
  const [tags, setTags] = useState<string[]>([]);
  const [justification, setJustification] = useState("");
  const [groupSize, setGroupSize] = useState<GroupSize | "">("");
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);

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

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const validate = () => {
    const nextErrors: FormErrors = {};

    const slugRegex = /^[a-z0-9-]+$/;

    if (!name.trim()) {
      nextErrors.name = "Community name is required.";
    } else if (!slugRegex.test(name)) {
      nextErrors.name = "Use lowercase letters, numbers and hyphens only.";
    } else if (name.length < 3) {
      nextErrors.name = "Community name must be at least 3 characters.";
    }

    if (!displayName.trim()) {
      nextErrors.displayName = "Display name is required.";
    }

    if (!description.trim()) {
      nextErrors.description = "Description is required.";
    } else if (description.length < 20) {
      nextErrors.description = "Description should be at least 20 characters.";
    }

    if (!category) {
      nextErrors.category = "Please select a category.";
    }

    if (!justification.trim()) {
      nextErrors.justification = "Please describe the academic purpose and student benefit of this community.";
    } else if (justification.trim().length < 50) {
      nextErrors.justification =
        `Please add more detail — at least 50 characters (${justification.trim().length}/50 so far).`;
    }

    if (!groupSize) {
      nextErrors.groupSize = "Please choose an estimated group size.";
    }

    if (!agreedToGuidelines) {
      nextErrors.agreement = "You need to agree to the community guidelines.";
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

      // Check both live communities and pending requests for name clashes,
      // so two students can't queue up the same slug.
      const { data: existingCommunity } = await supabase
        .from("communities")
        .select("id")
        .eq("name", name)
        .maybeSingle();

      if (existingCommunity) {
        setErrors({ name: "This community name already exists." });
        setLoading(false);
        return;
      }

      const { data: existingRequest } = await supabase
        .from("community_requests")
        .select("id")
        .eq("name", name)
        .in("status", ["pending", "info_requested"])
        .maybeSingle();

      if (existingRequest) {
        setErrors({
          name: "A request for this community name is already pending review.",
        });
        setLoading(false);
        return;
      }

      // Instead of creating the community directly, this submits a request
      // for admin review. An admin approving it (see AdminCommunityReviewPage)
      // is what actually creates the row in `communities`.
      const { data: request, error } = await supabase
        .from("community_requests")
        .insert({
          name,
          slug: name,
          display_name: displayName,
          description,
          category,
          is_private: isPrivate,
          tags,
          justification,
          stated_purpose: justification,
          estimated_size: groupSize,
          status: "pending",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      setLocation(`/community/pending/${request.id}`);
    } catch (error: any) {
      setErrors({
        submit: error?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading...</div>
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
              Build a study community for health science students across
              Nigeria.
            </p>

            <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">
              New communities are reviewed by an admin before they go live.
              This usually takes less than 24 hours.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Community Name
              </label>

              <div className="flex items-center rounded-lg border border-slate-300 px-3">
                <span className="text-slate-500">r/</span>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value.toLowerCase().replace(/\s+/g, "-")
                    )
                  }
                  placeholder="anatomy101"
                  className="w-full border-0 bg-transparent px-2 py-3 outline-none"
                />
              </div>

              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Display Name
              </label>

              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
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
                onChange={(e) => setDescription(e.target.value)}
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
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Tags{" "}
                <span className="font-normal text-slate-400">
                  (school, level, subject — pick any that apply)
                </span>
              </label>

              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => {
                  const active = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        active
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-teal-400"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Academic Purpose / Student Benefit
              </label>

              <p className="mb-2 text-sm text-slate-500">
                Describe the academic purpose of this community. Examples:
              </p>
              <ul className="mb-3 list-disc pl-5 text-sm text-slate-500 space-y-0.5">
                <li>Histology revision for 300L Medicine</li>
                <li>Anatomy mnemonics and dissection guides</li>
                <li>Clinical OSCE prep and mock stations</li>
                <li>Pharmacology board preparation</li>
                <li>Departmental announcements for Nursing students</li>
              </ul>

              <textarea
                rows={4}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="e.g. There's no active group for 200L Anatomy at UNILAG. I want a space to share dissection guides, past questions, and revision schedules ahead of exams. This will directly support clinical preparation."
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600"
              />

              <div className="mt-1 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Shown to admins only — helps your request get reviewed faster.
                </p>
                <span className={`text-xs font-medium ${justification.trim().length >= 50 ? "text-teal-600" : "text-slate-400"}`}>
                  {justification.trim().length}/50 min
                </span>
              </div>

              {errors.justification && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.justification}
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
                  onClick={() => setIsPrivate(false)}
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
                  onClick={() => setIsPrivate(true)}
                  className={`rounded-lg px-4 py-2 font-medium ${
                    isPrivate
                      ? "bg-teal-600 text-white"
                      : "border border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  Private
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                {isPrivate
                  ? "Hidden from search — members join by invite only."
                  : "Visible to all app users once approved."}
              </p>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-700">
                Estimated Group Size
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {groupSizeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGroupSize(option.value)}
                    className={`rounded-lg border px-4 py-3 text-left transition ${
                      groupSize === option.value
                        ? "border-teal-600 bg-teal-50"
                        : "border-slate-300 bg-white hover:border-teal-400"
                    }`}
                  >
                    <div className="font-medium text-slate-900">
                      {option.label}
                    </div>
                    <div className="text-sm text-slate-500">
                      {option.hint}
                    </div>
                  </button>
                ))}
              </div>

              {errors.groupSize && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.groupSize}
                </p>
              )}
            </div>

            <div>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-300 p-4">
                <input
                  type="checkbox"
                  checked={agreedToGuidelines}
                  onChange={(e) => setAgreedToGuidelines(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-teal-600"
                />
                <span className="text-sm text-slate-700">
                  I agree to moderate this group according to the app's
                  community guidelines.
                </span>
              </label>

              {errors.agreement && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.agreement}
                </p>
              )}
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
              {loading ? "Submitting..." : "Submit for Approval"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}