import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   BASE PATHS (ALIGNED WITH BACKEND)
========================================================= */

const PROFILE = `${API_ROUTES.system}/profile`;
const SECURITY = `${API_ROUTES.system}/security`;

/* =========================================================
   PROFILE
========================================================= */

export async function getMyProfile() {
  return apiFetch(`${PROFILE}/me`);
}

export async function updateProfile(data: any) {
  return apiFetch(PROFILE, {
    method: "PUT",
    body: data,
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
    body: {
      old_password: oldPassword,
      new_password: newPassword,
    },
  });
}

export async function fetchLoginHistory() {
  return apiFetch(`${SECURITY}/logins`);
}

export async function fetchSecurityAlerts() {
  return apiFetch(`${SECURITY}/alerts`);
}
