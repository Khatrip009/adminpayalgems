// src/pages/admin/AdminProfilePage.tsx
import React, { useEffect, useState } from "react";
import {
  getMyProfile,
  updateProfile,
  uploadAvatar,
} from "@/api/core/profile.api";
import { Loader2, UploadCloud } from "lucide-react";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

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
    const res = await getMyProfile();
    if (res) {
      setProfile(res);
      setForm({
        public_name: res.public_name || "",
        slug: res.slug || "",
        bio: res.bio || "",
        location: res.location || "",
        company: res.company || "",
        website: res.website || "",
      });
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const r = await updateProfile(form);
      if (!r.ok) return alert("Error: " + r.error);

      alert("Profile updated!");
      loadProfile();
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    const res = await uploadAvatar(file);
    setAvatarUploading(false);

    if (!res.ok) return alert("Avatar upload failed");

    loadProfile();
  }

  if (loading)
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="animate-spin h-6 w-6 text-sky-600" />
      </div>
    );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="font-['Playfair_Display'] text-4xl font-semibold text-slate-900 mb-6">
        My Admin Profile
      </h1>

      {/* ------------------ AVATAR ------------------ */}
      <div className="flex items-center gap-6 mb-10">
        <img
          src={profile?.avatar_url || "/images/default_avatar.png"}
          className="h-24 w-24 rounded-full object-cover shadow-md border border-slate-300"
          alt="Avatar"
        />

        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg">
          {avatarUploading ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : (
            <UploadCloud className="h-4 w-4" />
          )}
          <span>Upload New</span>
          <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        </label>
      </div>

      {/* ------------------ FORM ------------------ */}
      <div className="space-y-5">
        {[
          ["public_name", "Full Name"],
          ["slug", "Slug (profile URL)"],
          ["bio", "Bio"],
          ["location", "Location"],
          ["company", "Company"],
          ["website", "Website"],
        ].map(([key, label]) => (
          <div key={key}>
            <label className="block text-slate-700 font-medium mb-1">
              {label}
            </label>
            {key === "bio" ? (
              <textarea
                value={form[key]}
                onChange={(e) =>
                  setForm({ ...form, [key]: e.target.value })
                }
                className="w-full border rounded-lg p-3 h-28 focus:ring-2 focus:ring-sky-300"
              />
            ) : (
              <input
                value={form[key]}
                onChange={(e) =>
                  setForm({ ...form, [key]: e.target.value })
                }
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-sky-300"
              />
            )}
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 bg-sky-700 hover:bg-sky-800 text-white px-6 py-3 rounded-lg text-lg font-semibold flex items-center gap-2"
        >
          {saving && <Loader2 className="animate-spin h-5 w-5" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
