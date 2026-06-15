export type Role = "user" | "admin";

export type User = {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
};

export type AuthResponse = {
  user: User;
  tokens: TokenPair;
};

export type TraceEntry = {
  id: string;
  title: string;
  method?: string;
  url?: string;
  rawForm?: unknown;
  parsedPayload?: unknown;
  requestBody?: unknown;
  responseBody?: unknown;
  status?: number;
  error?: unknown;
  createdAt: string;
};
