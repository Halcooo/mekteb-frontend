import axios from "axios";

// Interfaces
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: "student" | "teacher" | "admin";
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth API functions
export const authApi = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(
      `${import.meta.env.VITE_API_URL}/auth/login`,
      credentials
    );
    return response.data;
  },

  // Register
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(
      `${import.meta.env.VITE_API_URL}/auth/register`,
      userData
    );
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(
      `${import.meta.env.VITE_API_URL}/auth/refresh`,
      { refreshToken }
    );
    return response.data;
  },

  // Logout
  logout: async (): Promise<ApiResponse<null>> => {
    const response = await axios.post<ApiResponse<null>>(
      `${import.meta.env.VITE_API_URL}/auth/logout`
    );
    return response.data;
  },
};

export default authApi;
