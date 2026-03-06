import React from "react";
import { ExternalLink, User } from "lucide-react";

export default function ProfilePreviewCard({ profile }) {
  if (!profile) return null;

  const publicUrl = `/profile/${profile.slug}`;

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm flex items-center gap-4">
      <img
        src={profile.avatar_url || "/default-avatar.png"}
        className="h-16 w-16 rounded-full object-cover"
      />
      <div className="flex-1">
        <p className="text-lg font-semibold">{profile.public_name}</p>
        <p className="text-slate-500 text-sm">{publicUrl}</p>
      </div>
      <a
        href={publicUrl}
        target="_blank"
        className="px-4 py-2 rounded-lg bg-sky-600 text-white flex items-center gap-2 hover:bg-sky-700"
      >
        View <ExternalLink size={16} />
      </a>
    </div>
  );
}
