import apiClient from "../api/apiClient";
import type { Student } from "../students/studentApi";

export interface ConnectedStudent extends Student {
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
    parentKey: string
  ): Promise<ConnectStudentResponse> => {
    const response = await apiClient.post<ConnectStudentResponse>(
      "/parent/connect",
      { parentKey }
    );
    return response.data;
  },

  // Disconnect from a student
  disconnectStudent: async (
    studentId: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/parent/students/${studentId}`);
    return response.data;
  },
};
