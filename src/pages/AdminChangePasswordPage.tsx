// src/pages/admin/AdminChangePasswordPage.tsx
import React, { useState } from "react";
import { changePassword } from "@/api/core/profile.api";
import { Lock, ShieldCheck } from "lucide-react";

export default function AdminChangePasswordPage() {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e: any) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await changePassword(oldPw, newPw);
      if (!res.ok) throw new Error(res.error || "Failed");

      setMsg("Password updated successfully.");
    } catch (err: any) {
      setMsg(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-['Playfair_Display'] font-semibold mb-4 flex items-center gap-3 text-slate-900">
        <Lock className="text-sky-600" /> Change Password
      </h1>

      <form className="space-y-5" onSubmit={submit}>
        <div>
          <label className="block mb-1 font-medium">Current Password</label>
          <input
            type="password"
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">New Password</label>
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          />
        </div>

        <button
          disabled={loading}
          className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 disabled:opacity-50"
        >
          {loading ? "Updating..." : "Save Password"}
        </button>

        {msg && (
          <p className="mt-3 text-slate-700 font-medium flex items-center gap-2">
            <ShieldCheck className="text-green-600" /> {msg}
          </p>
        )}
      </form>
    </div>
  );
}
