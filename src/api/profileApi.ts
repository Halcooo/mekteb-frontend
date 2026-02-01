import apiClient from "./apiClient";

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  created_at?: string;
}

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
}

export const profileApi = {
  // Get current user profile
  getCurrentProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>("/users/profile");
    return response.data;
  },

  // Update user profile
  updateProfile: async (
    userId: number,
    data: UpdateProfileData,
  ): Promise<{ message: string; user: UserProfile }> => {
    const response = await apiClient.put<{
      message: string;
      user: UserProfile;
    }>(`/users/${userId}`, data);
    return response.data;
  },
};
