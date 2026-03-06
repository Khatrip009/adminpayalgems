export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  role_id: number;
}

export interface LoginResponse {
  ok: boolean;
  user: AuthUser;
  token: string;
}
