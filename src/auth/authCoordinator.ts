import axios, { CanceledError } from "axios";
import { isTokenExpired, sessionScope } from "./sessionStore.ts";
import type { AuthSession, LogoutIntent, SessionCredentials, SessionStore } from "./sessionStore.ts";

export interface AuthTransport<Login, Register> {
  login: (credentials: Login) => Promise<SessionCredentials>;
  register: (details: Register) => Promise<SessionCredentials>;
  refresh: () => Promise<SessionCredentials>;
  logout: () => Promise<unknown>;
  logoutAll: (accessToken: string) => Promise<unknown>;
}

export interface AuthSignal {
  id: string;
  type: "login" | "logout-started" | "logout-done" | "logout-failed";
  intent?: LogoutIntent;
  timestamp?: number;
}

export interface AuthSignals {
  read: () => AuthSignal | null;
  publish: (type: AuthSignal["type"], intent?: LogoutIntent) => AuthSignal;
  subscribe: (listener: (signal: AuthSignal) => void) => () => void;
}

export type AuthOperationLock = <T>(operation: () => Promise<T>) => Promise<T>;

export function createAuthCoordinator<Login, Register>(
  store: SessionStore,
  transport: AuthTransport<Login, Register>,
  runExclusive: AuthOperationLock,
  signals: AuthSignals,
) {
  let lastSignal = signals.read();
  let restoring: { version: number; promise: Promise<void> } | null = null;
  let refreshing: { version: number; promise: Promise<AuthSession> } | null = null;
  let pendingLogoutAccess: string | null = null;
  const staleSession = () => new CanceledError("Authentication session changed");
  const isUnauthorized = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 401;

  const publishSignal = (type: AuthSignal["type"], intent?: LogoutIntent) => {
    lastSignal = signals.publish(type, intent);
  };

  const syncSignals = () => {
    const signal = signals.read();
    if (signal && signal.id !== lastSignal?.id) receiveSignal(signal);
  };

  const assertVersion = (version: number) => {
    syncSignals();
    if (store.getVersion() !== version) throw staleSession();
  };

  const completeLogout = async (intent: LogoutIntent, accessToken: string | null, version: number) => {
    try {
      await runExclusive(async () => {
        assertVersion(version);
        if (intent === "all") {
          let token = accessToken;
          if (!token || isTokenExpired(token)) token = (await transport.refresh()).accessToken;
          assertVersion(version);
          try {
            await transport.logoutAll(token);
          } catch (error) {
            if (!isUnauthorized(error)) throw error;
            // A retry after an access-token expiry still uses the HttpOnly session.
            const renewed = await transport.refresh();
            assertVersion(version);
            await transport.logoutAll(renewed.accessToken);
          }
        } else {
          await transport.logout();
        }
        assertVersion(version);
        pendingLogoutAccess = null;
        store.setStatus(version, { isLoading: false, isSigningOut: false, pendingLogout: null, problem: null });
        publishSignal("logout-done", intent);
      });
    } catch (error) {
      if (store.getVersion() !== version || axios.isCancel(error)) throw staleSession();
      store.setStatus(version, {
        isLoading: false, isSigningOut: false, pendingLogout: intent,
        problem: intent === "all" ? (isUnauthorized(error) ? "logout-all-auth" : "logout-all") : "logout",
      });
      publishSignal("logout-failed", intent);
      throw error;
    }
  };

  const logout = (intent: LogoutIntent = "current") => {
    syncSignals();
    const accessToken = store.getSnapshot().session?.accessToken ?? pendingLogoutAccess;
    pendingLogoutAccess = intent === "all" ? accessToken : null;
    const version = store.begin({ isSigningOut: true, pendingLogout: intent });
    publishSignal("logout-started", intent);
    return completeLogout(intent, accessToken, version);
  };

  const restore = (): Promise<void> => {
    syncSignals();
    if (restoring?.version === store.getVersion()) return restoring.promise;
    const pendingIntent = store.getSnapshot().pendingLogout ?? (
      lastSignal?.type === "logout-started" || lastSignal?.type === "logout-failed"
        ? lastSignal.intent ?? "current" : null
    );
    if (pendingIntent) return logout(pendingIntent);
    if (store.getSnapshot().session) return Promise.resolve();
    const version = store.begin({ isLoading: true });
    const pending = { version, promise: Promise.resolve() };
    pending.promise = runExclusive(async () => {
      assertVersion(version);
      try {
        const credentials = await transport.refresh();
        assertVersion(version);
        if (!store.applyCredentials(version, credentials)) throw staleSession();
      } catch (error) {
        assertVersion(version);
        store.setStatus(version, { isLoading: false, problem: isUnauthorized(error) ? null : "restore" });
        if (!isUnauthorized(error)) throw error;
      }
    }).finally(() => {
      if (restoring === pending) restoring = null;
    });
    restoring = pending;
    return pending.promise;
  };

  const receiveSignal = (signal: AuthSignal) => {
    if (signal.id === lastSignal?.id) return;
    lastSignal = signal;
    pendingLogoutAccess = null;
    if (signal.type === "login") {
      store.begin({ isLoading: true });
      void restore().catch(() => { /* Restore failures are exposed through the store. */ });
    } else {
      const intent = signal.intent ?? "current";
      store.begin({
        isSigningOut: signal.type === "logout-started",
        pendingLogout: signal.type === "logout-done" ? null : intent,
        problem: signal.type === "logout-failed" ? (intent === "all" ? "logout-all" : "logout") : null,
      });
    }
  };

  signals.subscribe(receiveSignal);
  store.setExternalSync(syncSignals);

  const signIn = async (request: () => Promise<SessionCredentials>) => {
    syncSignals();
    const previous = store.getSnapshot();
    // An expired/revoked cookie cannot authorize another logout-all attempt.
    // Let the user sign in again explicitly, then revoke all sessions from Profile.
    if (previous.pendingLogout && previous.problem !== "logout-all-auth") {
      throw new Error("Finish signing out before signing in again");
    }
    const version = store.begin({ pendingLogout: previous.pendingLogout, problem: previous.problem });
    await runExclusive(async () => {
      assertVersion(version);
      const credentials = await request();
      assertVersion(version);
      if (!store.applyCredentials(version, credentials)) throw staleSession();
      pendingLogoutAccess = null;
      publishSignal("login");
    });
  };

  return {
    restore,
    login: (credentials: Login) => signIn(() => transport.login(credentials)),
    register: (details: Register) => signIn(() => transport.register(details)),
    logout,
    retry: () => store.getSnapshot().pendingLogout ? logout(store.getSnapshot().pendingLogout!) : restore(),
    refresh(expected: AuthSession): Promise<AuthSession> {
      syncSignals();
      const version = store.getVersion();
      if (sessionScope(store.getSnapshot().session) !== sessionScope(expected)) return Promise.reject(staleSession());
      if (refreshing?.version === version) return refreshing.promise;
      const pending = { version, promise: Promise.resolve(expected) };
      pending.promise = runExclusive(async () => {
        assertVersion(version);
        try {
          const credentials = await transport.refresh();
          assertVersion(version);
          // Cookie identity may have changed in another tab before its event arrived.
          if (credentials.user.id !== expected.user.id || (credentials.sessionId && credentials.sessionId !== expected.id)) {
            store.begin();
            throw staleSession();
          }
          const updated = store.applyCredentials(version, credentials, expected);
          if (!updated) {
            store.begin();
            throw staleSession();
          }
          return updated;
        } catch (error) {
          assertVersion(version);
          if (isUnauthorized(error)) store.begin();
          throw error;
        }
      }).finally(() => {
        if (refreshing === pending) refreshing = null;
      });
      refreshing = pending;
      return pending.promise;
    },
  };
}
