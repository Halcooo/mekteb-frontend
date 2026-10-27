import axios, { CanceledError } from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { sessionScope } from "./sessionStore.ts";
import type { AuthSession, SessionStore } from "./sessionStore.ts";

interface SessionRequest extends InternalAxiosRequestConfig {
  _sessionScope?: string | null;
  _sessionVersion?: number;
  _accessToken?: string | null;
  _retry?: boolean;
}

export function installSessionInterceptors(
  client: AxiosInstance,
  store: SessionStore,
  refreshSession: (expected: AuthSession) => Promise<AuthSession>,
) {
  const staleSession = () => new CanceledError("Authentication session changed");
  const assertCurrent = (config: SessionRequest) => {
    const current = store.getCurrent();
    if (config._sessionScope !== sessionScope(current) || config._sessionVersion !== store.getVersion()) throw staleSession();
    return current;
  };

  client.interceptors.request.use((request) => {
    const config = request as SessionRequest;
    const current = store.getCurrent();
    if ("_sessionScope" in config) assertCurrent(config);
    config._sessionScope = sessionScope(current);
    config._sessionVersion = store.getVersion();
    config._accessToken = current?.accessToken ?? null;
    config.headers.delete("Authorization");
    if (current?.accessToken) config.headers.set("Authorization", `Bearer ${current.accessToken}`);
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      assertCurrent(response.config as SessionRequest);
      return response;
    },
    async (error: unknown) => {
      if (!axios.isAxiosError(error) || !error.config) return Promise.reject(error);
      const config = error.config as SessionRequest;
      const current = assertCurrent(config);
      if (error.response?.status !== 401 || config._retry || !current) return Promise.reject(error);
      config._retry = true;
      if (current.accessToken !== config._accessToken) return client(config);
      await refreshSession(current);
      assertCurrent(config);
      return client(config);
    },
  );
}
