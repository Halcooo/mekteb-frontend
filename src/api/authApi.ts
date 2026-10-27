import { createCookieAuthApi } from "../auth/cookieAuthApi";

export type { LoginCredentials, RegisterData, User, AuthResponse, ApiResponse } from "../auth/cookieAuthApi";

// Refresh credentials are sent only by the browser's HttpOnly cookie mechanism.
export const authApi = createCookieAuthApi(import.meta.env.VITE_API_URL as string);
export default authApi;
