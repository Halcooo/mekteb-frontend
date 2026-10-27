import axios from "axios";
import type { AxiosAdapter } from "axios";
import type { SessionCredentials, SessionUser } from "./sessionStore.ts";

export interface LoginCredentials { username: string; password: string; }
export interface RegisterData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}
export type User = SessionUser;
export interface AuthResponse extends SessionCredentials { success: boolean; message?: string; }
export interface ApiResponse<T> { success: boolean; data?: T; message?: string; error?: string; }

export function createCookieAuthApi(baseURL: string, adapter?: AxiosAdapter) {
  const client = axios.create({
    baseURL: `${baseURL}/auth`, timeout: 10000, withCredentials: true,
    headers: { "X-CSRF-Protection": "1" }, ...(adapter ? { adapter } : {}),
  });
  return {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
      return (await client.post<AuthResponse>("/login", credentials)).data;
    },
    async register(details: RegisterData): Promise<AuthResponse> {
      return (await client.post<AuthResponse>("/register", details)).data;
    },
    async refresh(): Promise<AuthResponse> {
      return (await client.post<AuthResponse>("/refresh")).data;
    },
    async logout(): Promise<ApiResponse<null>> {
      return (await client.post<ApiResponse<null>>("/logout")).data;
    },
    async logoutAll(accessToken: string): Promise<ApiResponse<null>> {
      return (await client.post<ApiResponse<null>>("/logout-all", undefined, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })).data;
    },
  };
}
