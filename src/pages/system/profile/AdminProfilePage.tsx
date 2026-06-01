// src/pages/admin/AdminProfilePage.tsx
import React, { useEffect, useState } from "react";
import {
  getMyProfile,
  updateProfile,
  uploadAvatar,
} from "@/api/core/profile.api";
import { getAssetUrl } from "@/utils/assetUrl";
import { Loader2, UploadCloud, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    public_name: "",
    slug: "",
    bio: "",
    location: "",
    company: "",
    website: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyProfile();
      if (!res.ok) {
        throw new Error(res.error || "Failed to load profile");
      }
      const profileData = res.profile || {};
      setProfile(profileData);
      setForm({
        public_name: profileData.public_name || "",
        slug: profileData.slug || "",
        bio: profileData.bio || "",
        location: profileData.location || "",
        company: profileData.company || "",
        website: profileData.website || "",
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not load profile");
      toast.error(err.message || "Could not load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await updateProfile(form);
      if (!res.ok) throw new Error(res.error || "Update failed");
      toast.success("Profile updated successfully");
      await loadProfile();
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      const res = await uploadAvatar(file);
      if (!res.ok) throw new Error(res.error || "Upload failed");
      toast.success("Avatar uploaded");
      await loadProfile(); // reload to get new avatar_url
    } catch (err: any) {
      toast.error(err.message || "Avatar upload failed");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-sky-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadProfile}
          className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // ✅ Use getAssetUrl – it will handle absolute URLs as well
  const avatarSrc = getAssetUrl(profile?.avatar_url);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="font-['Playfair_Display'] text-4xl font-semibold text-slate-900 mb-6">
        My Admin Profile
      </h1>

      {/* AVATAR */}
      <div className="flex items-center gap-6 mb-10">
        <img
          src={avatarSrc}
          className="h-24 w-24 rounded-full object-cover shadow-md border border-slate-300"
          alt="Avatar"
          onError={(e) => {
            // Fallback to a generated placeholder if image fails to load
            e.currentTarget.src = "https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=User&size=96";
          }}
        />

        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg transition">
          {avatarUploading ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : (
            <UploadCloud className="h-4 w-4" />
          )}
          <span>{avatarUploading ? "Uploading..." : "Upload New"}</span>
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
            disabled={avatarUploading}
          />
        </label>
      </div>

      {/* FORM */}
      <div className="space-y-5">
        {[
          { key: "public_name", label: "Full Name", type: "text" },
          { key: "slug", label: "Slug (profile URL)", type: "text" },
          { key: "bio", label: "Bio", type: "textarea" },
          { key: "location", label: "Location", type: "text" },
          { key: "company", label: "Company", type: "text" },
          { key: "website", label: "Website", type: "url" },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="block text-slate-700 font-medium mb-1">
              {label}
            </label>
            {type === "textarea" ? (
              <textarea
                value={form[key as keyof typeof form] as string}
                onChange={(e) =>
                  setForm({ ...form, [key]: e.target.value })
                }
                className="w-full border rounded-lg p-3 h-28 focus:ring-2 focus:ring-sky-300 dark:bg-slate-900 dark:border-slate-700"
                rows={3}
              />
            ) : (
              <input
                type={type}
                value={form[key as keyof typeof form] as string}
                onChange={(e) =>
                  setForm({ ...form, [key]: e.target.value })
                }
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-sky-300 dark:bg-slate-900 dark:border-slate-700"
              />
            )}
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 bg-sky-700 hover:bg-sky-800 text-white px-6 py-3 rounded-lg text-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {saving && <Loader2 className="animate-spin h-5 w-5" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}