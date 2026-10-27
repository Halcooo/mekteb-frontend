import { createContext, Fragment, useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { authSession, authCoordinator } from "../auth/browserSession";
import { getTokenExpiration, isTokenExpired, sessionScope } from "../auth/sessionStore";
import type { SessionUser } from "../auth/sessionStore";
import type { LoginCredentials, RegisterData } from "../api/authApi";

interface AuthContextType {
  user: SessionUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSigningOut: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (details: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  isTokenExpired: (token: string) => boolean;
  getTokenExpiration: (token: string) => Date | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const state = useSyncExternalStore(authSession.subscribe, authSession.getSnapshot);
  const session = state.session;

  useLayoutEffect(() => authSession.onSessionBoundary(() => {
    queryClient.clear();
  }), [queryClient]);

  useEffect(() => {
    void authCoordinator.restore().catch(() => { /* A retryable error is shown below. */ });
  }, []);

  const value: AuthContextType = {
    user: session?.user ?? null,
    accessToken: session?.accessToken ?? null,
    isAuthenticated: Boolean(session),
    isLoading: state.isLoading,
    isSigningOut: state.isSigningOut,
    login: authCoordinator.login,
    register: authCoordinator.register,
    logout: () => authCoordinator.logout(),
    logoutAll: () => authCoordinator.logout("all"),
    isTokenExpired,
    getTokenExpiration,
  };

  const problemKey = state.problem === "logout-all-auth" ? "authSession.logoutAllNeedsLogin"
    : state.problem === "logout-all" ? "authSession.logoutAllFailed"
    : state.problem === "logout" ? "authSession.logoutFailed" : "authSession.restoreFailed";

  return (
    <AuthContext.Provider value={value}>
      {state.problem && (
        <Alert variant="warning" className="m-3" role="alert">
          <p className="mb-2">{t(problemKey)}</p>
          <Button size="sm" variant="outline-dark" disabled={state.isSigningOut || state.isLoading}
            onClick={() => { void authCoordinator.retry().catch(() => { /* Keep the failure visible. */ }); }}>
            {t("authSession.retry", "Retry")}
          </Button>
        </Alert>
      )}
      {state.isSigningOut && (
        <div className="m-3" role="status">
          <Spinner size="sm" animation="border" className="me-2" />
          {t("authSession.signingOut", "Signing out...")}
        </div>
      )}
      <Fragment key={sessionScope(session) ?? "anonymous"}>{children}</Fragment>
    </AuthContext.Provider>
  );
}

export default AuthContext;
