import apiClient from "../api/apiClient";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface Attendance {
  id: number;
  student_id: number;
  date: string;
  status: AttendanceStatus;
  created_at?: string;
  updated_at?: string;
  // Join fields from students and users tables
  student_first_name?: string;
  student_last_name?: string;
  grade_level?: string;
  parent_name?: string;
}

export interface CreateAttendanceData {
  student_id: number;
  date: string; // YYYY-MM-DD format
  status: AttendanceStatus;
}

export interface UpdateAttendanceData {
  status: AttendanceStatus;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendanceRate: number;
}

export interface AttendanceSummaryTotals {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  presentRate: number;
}

export interface AttendanceSummaryByGrade {
  grade_level: string | null;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
}

export interface AttendanceSummary {
  totals: AttendanceSummaryTotals;
  byGrade: AttendanceSummaryByGrade[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  date?: string;
  message?: string;
  error?: string;
}

export interface BulkAttendanceData {
  attendanceList: {
    student_id: number;
    date: string;
    status: AttendanceStatus;
  }[];
}

// API functions
export const attendanceApi = {
  // Get all attendance records (optional date filter)
  getAll: async (date?: string): Promise<ApiResponse<Attendance[]>> => {
    const url = date ? `/attendance?date=${date}` : "/attendance";
    const response = await apiClient.get<ApiResponse<Attendance[]>>(url);
    return response.data;
  },

  // Get attendance by date
  getByDate: async (date: string): Promise<ApiResponse<Attendance[]>> => {
    const response = await apiClient.get<ApiResponse<Attendance[]>>(
      `/attendance/date/${date}`,
    );
    return response.data;
  },

  // Get attendance summary by date
  getSummaryByDate: async (
    date: string,
  ): Promise<ApiResponse<AttendanceSummary>> => {
    const response = await apiClient.get<ApiResponse<AttendanceSummary>>(
      `/attendance/date/${date}/summary`,
    );
    return response.data;
  },

  // Get attendance by student
  getByStudent: async (
    studentId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<Attendance[]>> => {
    let url = `/attendance/student/${studentId}`;
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (params.toString()) url += `?${params}`;

    const response = await apiClient.get<ApiResponse<Attendance[]>>(url);
    return response.data;
  },

  // Get student attendance stats
  getStudentStats: async (
    studentId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<AttendanceStats>> => {
    let url = `/attendance/student/${studentId}/stats`;
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (params.toString()) url += `?${params}`;

    const response = await apiClient.get<ApiResponse<AttendanceStats>>(url);
    return response.data;
  },

  // Create single attendance record
  create: async (
    attendanceData: CreateAttendanceData,
  ): Promise<ApiResponse<Attendance>> => {
    const response = await apiClient.post<ApiResponse<Attendance>>(
      "/attendance",
      attendanceData,
    );
    return response.data;
  },

  // Create multiple attendance records (bulk)
  createBulk: async (
    bulkData: BulkAttendanceData,
  ): Promise<ApiResponse<Attendance[]>> => {
    const response = await apiClient.post<ApiResponse<Attendance[]>>(
      "/attendance/bulk",
      bulkData,
    );
    return response.data;
  },

  // Update attendance record
  update: async (
    id: number,
    attendanceData: UpdateAttendanceData,
  ): Promise<ApiResponse<Attendance>> => {
    const response = await apiClient.put<ApiResponse<Attendance>>(
      `/attendance/${id}`,
      attendanceData,
    );
    return response.data;
  },

  // Delete attendance record
  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/attendance/${id}`,
    );
    return response.data;
  },
};

// Helper functions
export const getStatusColor = (status: AttendanceStatus): string => {
  switch (status) {
    case "PRESENT":
      return "success";
    case "ABSENT":
      return "danger";
    case "LATE":
      return "warning";
    case "EXCUSED":
      return "info";
    default:
      return "secondary";
  }
};

export const getStatusIcon = (status: AttendanceStatus): string => {
  switch (status) {
    case "PRESENT":
      return "bi-check-circle-fill";
    case "ABSENT":
      return "bi-x-circle-fill";
    case "LATE":
      return "bi-clock-fill";
    case "EXCUSED":
      return "bi-info-circle-fill";
    default:
      return "bi-question-circle";
  }
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatDateForInput = (date: string | Date): string => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};
