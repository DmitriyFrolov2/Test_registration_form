import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { TokenPair, TraceEntry } from "./types";

const API_URL = "http://localhost:9124";
const ACCESS_KEY = "training_access_token";
const REFRESH_KEY = "training_refresh_token";

let traceSink: ((entry: TraceEntry) => void) | null = null;
let onTokens: ((tokens: TokenPair) => void) | null = null;

export function configureApi(options: {
  addTrace: (entry: TraceEntry) => void;
  setTokens: (tokens: TokenPair) => void;
}) {
  traceSink = options.addTrace;
  onTokens = options.setTokens;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY);
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status !== 401 || !original || original._retry || original.url === "/auth/refresh") {
      throw error;
    }

    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) throw error;

    original._retry = true;
    const refreshResponse = await axios.post<TokenPair>(`${API_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    localStorage.setItem(ACCESS_KEY, refreshResponse.data.access_token);
    localStorage.setItem(REFRESH_KEY, refreshResponse.data.refresh_token);
    onTokens?.(refreshResponse.data);
    traceSink?.({
      id: crypto.randomUUID(),
      title: "Auto refresh after 401",
      method: "POST",
      url: "/auth/refresh",
      requestBody: { refresh_token: `${refreshToken.slice(0, 24)}...` },
      responseBody: refreshResponse.data,
      status: refreshResponse.status,
      createdAt: new Date().toLocaleTimeString(),
    });
    return api(original);
  },
);

export async function tracedRequest<T>(input: {
  title: string;
  method: "GET" | "POST";
  url: string;
  rawForm?: unknown;
  parsedPayload?: unknown;
  requestBody?: unknown;
}) {
  try {
    const response = await api.request<T>({
      method: input.method,
      url: input.url,
      data: input.requestBody,
    });
    traceSink?.({
      id: crypto.randomUUID(),
      ...input,
      responseBody: response.data,
      status: response.status,
      createdAt: new Date().toLocaleTimeString(),
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    traceSink?.({
      id: crypto.randomUUID(),
      ...input,
      status: axiosError.response?.status,
      responseBody: axiosError.response?.data,
      error: axiosError.message,
      createdAt: new Date().toLocaleTimeString(),
    });
    throw error;
  }
}
