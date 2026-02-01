/**
 * TypeScript interfaces using camelCase for consistency
 * Database uses snake_case, but TypeScript code uses camelCase
 */

export interface NewsImage {
  id: number;
  newsId: number;
  imagePath: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt?: string;
  url: string;
}

export interface NewsItem {
  id: number;
  title: string;
  text: string;
  subtitle?: string;
  createdBy: number;
  createdAt?: string;
  authorUsername?: string;
  authorName?: string;
  images?: NewsImage[];
}

export interface PaginatedNewsResponse {
  success: boolean;
  data: NewsItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "teacher" | "student";
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "teacher" | "student";
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
