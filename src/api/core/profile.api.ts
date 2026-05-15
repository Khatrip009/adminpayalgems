// src/api/core/profile.api.ts
import { apiFetch, API_ROUTES } from "@/lib/apiClient";

const PROFILE  = `${API_ROUTES.system}/profile`;
const SECURITY = `${API_ROUTES.system}/security`;

/* =========================================================
   TYPES
========================================================= */
export interface UserProfile {
  avatar_url?: string | null;
  public_name?: string | null;
  email?: string | null;
  full_name?: string | null;
  [key: string]: any;
}

/* =========================================================
   PROFILE
========================================================= */
export async function getMyProfile(): Promise<UserProfile> {
  return apiFetch(`${PROFILE}/me`);
}

export async function updateProfile(data: any) {
  return apiFetch(PROFILE, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

export async function uploadAvatar(file: File) {
  if (!file) throw new Error("avatar_file_required");

  const fd = new FormData();
  fd.append("avatar", file);

  return apiFetch(`${PROFILE}/avatar`, {
    method: "POST",
    body: fd,
  });
}

/* =========================================================
   SECURITY
========================================================= */
export async function changePassword(
  oldPassword: string,
  newPassword: string
) {
  if (!oldPassword || !newPassword) {
    throw new Error("old_and_new_password_required");
  }

  return apiFetch(`${SECURITY}/change-password`, {
    method: "POST",
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
    }),
    headers: { "Content-Type": "application/json" },
  });
}

export async function fetchLoginHistory() {
  return apiFetch(`${SECURITY}/logins`);
}

export async function fetchSecurityAlerts() {
  return apiFetch(`${SECURITY}/alerts`);
}