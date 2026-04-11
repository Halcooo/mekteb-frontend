import apiClient from "../api/apiClient";
import type { Student } from "../students/studentApi";

export interface ConnectedStudent extends Student {
  connectedAt?: string;
  lastAttendanceDate?: string;
  attendanceRate?: number;
}

export interface ConnectStudentRequest {
  parentKey: string;
}

export interface ConnectStudentResponse {
  success: boolean;
  message: string;
  student?: Student;
}

export type ParentAttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface ParentAttendanceRecord {
  id: number;
  studentId: number;
  date: string;
  status: ParentAttendanceStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParentAttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendanceRate: number;
}

// Parent API functions
export const parentApi = {
  // Get connected students for the current parent
  getConnectedStudents: async (): Promise<ConnectedStudent[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: ConnectedStudent[];
    }>("/parent/students");
    return response.data.data;
  },

  // Connect to a student using parent key
  connectStudent: async (
    parentKey: string,
  ): Promise<ConnectStudentResponse> => {
    const response = await apiClient.post<ConnectStudentResponse>(
      "/parent/connect",
      { parentKey },
    );
    return response.data;
  },

  // Disconnect from a student
  disconnectStudent: async (
    studentId: number,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/parent/students/${studentId}`);
    return response.data;
  },

  // Get attendance records for connected student
  getStudentAttendance: async (
    studentId: number,
    limit: number = 10,
  ): Promise<ParentAttendanceRecord[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: ParentAttendanceRecord[];
    }>(`/parent/students/${studentId}/attendance?limit=${limit}`);

    return response.data.data;
  },

  // Get attendance stats for connected student
  getStudentAttendanceStats: async (
    studentId: number,
  ): Promise<ParentAttendanceStats> => {
    const response = await apiClient.get<{
      success: boolean;
      data: ParentAttendanceStats;
    }>(`/parent/students/${studentId}/attendance/stats`);

    return response.data.data;
  },
};
