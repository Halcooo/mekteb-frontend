import apiClient from "./apiClient";

export interface StudentComment {
  id: number;
  studentId: number;
  authorId: number;
  authorName?: string;
  authorRole: "admin" | "teacher" | "parent";
  content: string;
  date: string; // YYYY-MM-DD format
  createdAt: string;
  updatedAt?: string;
  parentCommentId?: number; // If this is a parent reply
  // Student details for admin view
  studentName?: string;
  studentGrade?: string;
  repliesCount?: number;
}

export interface CreateCommentRequest {
  studentId: number;
  content: string;
  date: string; // YYYY-MM-DD format
  parentCommentId?: number; // For parent replies
}

export interface GetCommentsParams {
  studentId?: number;
  date?: string;
  authorRole?: "admin" | "teacher" | "parent";
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
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

// Comments API functions
export const commentsApi = {
  // Get comments for a student on a specific date or date range
  getComments: async (
    params: GetCommentsParams = {}
  ): Promise<StudentComment[]> => {
    const queryParams = new URLSearchParams();

    if (params.studentId)
      queryParams.append("studentId", params.studentId.toString());
    if (params.date) queryParams.append("date", params.date);
    if (params.authorRole) queryParams.append("authorRole", params.authorRole);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const url = `/comments?${queryParams}`;
    const response = await apiClient.get<ApiResponse<StudentComment[]>>(url);
    return response.data.data;
  },

  // Get comments for a specific student (for parents)
  getStudentComments: async (
    studentId: number,
    date?: string
  ): Promise<StudentComment[]> => {
    const queryParams = new URLSearchParams();
    if (date) queryParams.append("date", date);

    const url = `/comments/student/${studentId}?${queryParams}`;
    const response = await apiClient.get<ApiResponse<StudentComment[]>>(url);
    return response.data.data;
  },

  // Create a new comment (admin/teacher) or reply (parent)
  createComment: async (
    commentData: CreateCommentRequest
  ): Promise<StudentComment> => {
    const response = await apiClient.post<ApiResponse<StudentComment>>(
      "/comments",
      commentData
    );
    return response.data.data;
  },

  // Update a comment (only by author)
  updateComment: async (
    id: number,
    content: string
  ): Promise<StudentComment> => {
    const response = await apiClient.put<ApiResponse<StudentComment>>(
      `/comments/${id}`,
      { content }
    );
    return response.data.data;
  },

  // Delete a comment (only by author)
  deleteComment: async (id: number): Promise<void> => {
    await apiClient.delete(`/comments/${id}`);
  },

  // Get daily comments for all students (admin view)
  getDailyComments: async (date: string): Promise<StudentComment[]> => {
    const response = await apiClient.get<ApiResponse<StudentComment[]>>(
      `/comments/daily/${date}`
    );
    return response.data.data;
  },
};
