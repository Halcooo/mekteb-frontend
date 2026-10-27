import { jwtDecode } from "jwt-decode";

export interface SessionUser {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt?: string;
}

export interface AuthSession {
  id: string;
  user: SessionUser;
  accessToken: string;
}

export interface SessionCredentials {
  accessToken: string;
  user: SessionUser;
  sessionId?: string;
}

export type LogoutIntent = "current" | "all";
export type AuthProblem = "restore" | "logout" | "logout-all" | "logout-all-auth" | null;

export interface AuthSnapshot {
  session: AuthSession | null;
  version: number;
  isLoading: boolean;
  isSigningOut: boolean;
  pendingLogout: LogoutIntent | null;
  problem: AuthProblem;
}

interface TokenClaims {
  userId: number;
  sid: string;
  exp: number;
}

export const LEGACY_AUTH_KEYS = [
  "mekteb_auth_session", "mekteb_access_token", "mekteb_refresh_token", "mekteb_user",
];

export function purgeLegacyCredentials(resolveStorage: () => Pick<Storage, "removeItem">): void {
  try {
    const storage = resolveStorage();
    for (const key of LEGACY_AUTH_KEYS) {
      try { storage.removeItem(key); } catch { /* Blocked storage is never read or trusted. */ }
    }
  } catch {
    // Browsers can deny access to the localStorage property itself.
  }
}

export function getTokenExpiration(token: string): Date | null {
  try {
    const { exp } = jwtDecode<TokenClaims>(token);
    return Number.isFinite(exp) ? new Date(exp * 1000) : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token);
  return !expiration || expiration.getTime() <= Date.now();
}

export function sessionScope(session: AuthSession | null): string | null {
  return session ? `${session.id}:${session.user.id}:${session.user.role}` : null;
}

function sessionFromCredentials(credentials: SessionCredentials): AuthSession {
  const { user, accessToken } = credentials;
  if (
    !user || !Number.isInteger(user.id) || user.id <= 0 ||
    typeof user.username !== "string" || typeof user.email !== "string" ||
    typeof user.role !== "string" || typeof accessToken !== "string" || isTokenExpired(accessToken)
  ) throw new Error("Invalid authentication response");
  const claims = jwtDecode<TokenClaims>(accessToken);
  if (
    claims.userId !== user.id || typeof claims.sid !== "string" || !claims.sid ||
    (credentials.sessionId !== undefined && credentials.sessionId !== claims.sid)
  ) throw new Error("Invalid authentication response");
  return { id: claims.sid, user, accessToken };
}

// Access tokens exist only in this tab's memory. Refresh credentials are HttpOnly cookies.
export function createSessionStore() {
  const listeners = new Set<() => void>();
  const boundaryListeners = new Set<() => void>();
  let externalSync: (() => void) | undefined;
  let snapshot: AuthSnapshot = {
    session: null, version: 0, isLoading: true, isSigningOut: false,
    pendingLogout: null, problem: null,
  };

  const publish = (next: AuthSnapshot) => {
    if (sessionScope(snapshot.session) !== sessionScope(next.session)) {
      boundaryListeners.forEach((listener) => listener());
    }
    snapshot = next;
    listeners.forEach((listener) => listener());
  };

  return {
    getSnapshot: () => snapshot,
    getCurrent() {
      externalSync?.();
      return snapshot.session;
    },
    getVersion: () => snapshot.version,
    setExternalSync(sync: () => void) { externalSync = sync; },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    onSessionBoundary(listener: () => void) {
      boundaryListeners.add(listener);
      return () => { boundaryListeners.delete(listener); };
    },
    begin(options: Partial<Pick<AuthSnapshot, "isLoading" | "isSigningOut" | "pendingLogout" | "problem">> = {}) {
      publish({
        session: null, version: snapshot.version + 1,
        isLoading: false, isSigningOut: false, pendingLogout: null, problem: null,
        ...options,
      });
      return snapshot.version;
    },
    applyCredentials(version: number, credentials: SessionCredentials, expected?: AuthSession): AuthSession | null {
      if (snapshot.version !== version) return null;
      const session = sessionFromCredentials(credentials);
      if (expected && (session.id !== expected.id || session.user.id !== expected.user.id)) return null;
      publish({ ...snapshot, session, isLoading: false, isSigningOut: false, pendingLogout: null, problem: null });
      return session;
    },
    setStatus(version: number, changes: Partial<Pick<AuthSnapshot, "isLoading" | "isSigningOut" | "pendingLogout" | "problem">>) {
      if (snapshot.version !== version) return;
      publish({ ...snapshot, ...changes });
    },
  };
}

export type SessionStore = ReturnType<typeof createSessionStore>;
