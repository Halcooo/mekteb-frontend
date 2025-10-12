import apiClient from "../api/apiClient";

// Student interface (camelCase - matches backend response)
export interface Student {
  id: number;
  parentId: number | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gradeLevel: string;
  parentKey: string | null; // Unique key for parent connection (auto-generated)
  createdAt?: string;
  updatedAt?: string;
  // Join fields from users table
  parentName?: string;
  parentUsername?: string;
}

export interface CreateStudentData {
  parentId?: number | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gradeLevel: string;
}

export interface UpdateStudentData {
  parentId?: number | null;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gradeLevel?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
  error?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface GetStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
}

// API functions
export const studentApi = {
  // Get all students with pagination and search
  getAll: async (
    params: GetStudentsParams = {}
  ): Promise<ApiResponse<Student[]>> => {
    const { page = 1, limit = 10, search = "" } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search: search.toString(),
    });

    const url = `/students?${queryParams}`;
    console.log("API Request URL:", url);
    console.log("Search params:", { page, limit, search });

    const response = await apiClient.get<ApiResponse<Student[]>>(url);
    console.log("API Response:", response.data);
    return response.data;
  },

  // Get student by ID
  getById: async (id: number): Promise<Student> => {
    const response = await apiClient.get<ApiResponse<Student>>(
      `/students/${id}`
    );
    return response.data.data;
  },

  // Create new student
  create: async (studentData: CreateStudentData): Promise<Student> => {
    const response = await apiClient.post<ApiResponse<Student>>(
      "/students",
      studentData
    );
    return response.data.data;
  },

  // Update student
  update: async (
    id: number,
    studentData: UpdateStudentData
  ): Promise<Student> => {
    const response = await apiClient.put<ApiResponse<Student>>(
      `/students/${id}`,
      studentData
    );
    return response.data.data;
  },

  // Delete student
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/students/${id}`);
  },

  // Search students
  search: async (searchTerm: string): Promise<Student[]> => {
    const response = await apiClient.get<ApiResponse<Student[]>>(
      `/students/search?q=${encodeURIComponent(searchTerm)}`
    );
    return response.data.data;
  },

  // Get students by grade
  getByGrade: async (grade: string): Promise<Student[]> => {
    const response = await apiClient.get<ApiResponse<Student[]>>(
      `/students/grade/${encodeURIComponent(grade)}`
    );
    return response.data.data;
  },

  // Get students by parent
  getByParent: async (parentId: number): Promise<Student[]> => {
    const response = await apiClient.get<ApiResponse<Student[]>>(
      `/students/parent/${parentId}`
    );
    return response.data.data;
  },

  // Get student statistics
  getStats: async (): Promise<unknown> => {
    const response = await apiClient.get<ApiResponse<unknown>>(
      "/students/stats"
    );
    return response.data.data;
  },
};
