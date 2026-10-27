import axios from "axios";
import { authSession, authCoordinator } from "../auth/browserSession";
import { installSessionInterceptors } from "../auth/authenticatedClient";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

installSessionInterceptors(apiClient, authSession, authCoordinator.refresh);

export default apiClient;
