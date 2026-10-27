import type { AuthOperationLock, AuthSignal, AuthSignals } from "./authCoordinator.ts";

const SIGNAL_KEY = "mekteb_auth_event";
const CHANNEL_NAME = "mekteb-auth";

interface SignalEnvironment {
  getStorage: () => Pick<Storage, "getItem" | "setItem">;
  openChannel: () => Pick<BroadcastChannel, "postMessage" | "onmessage">;
  listenStorage: (listener: (event: Pick<StorageEvent, "key" | "newValue">) => void) => void;
  createId: () => string;
  now: () => number;
}
export function createAuthOperationLock(resolveLocks: () => LockManager | undefined): AuthOperationLock {
  let localQueue = Promise.resolve();
  return async <T>(operation: () => Promise<T>): Promise<T> => {
    let started = false;
    try {
      const locks = resolveLocks();
      if (locks) return await locks.request("mekteb-auth-operation", () => {
        started = true;
        return operation();
      });
    } catch (error) {
      // Never run a failed network operation twice. Fall back only if lock access itself failed.
      if (started) throw error;
    }
    const result = localQueue.then(operation, operation);
    localQueue = result.then(() => undefined, () => undefined);
    return result;
  };
}

// The shared lock serializes cookie rotation and Set-Cookie with login/logout in every tab.
export const withAuthOperationLock = createAuthOperationLock(() => navigator.locks);

function parseSignal(raw: string | null): AuthSignal | null {
  try {
    const value = raw ? JSON.parse(raw) as AuthSignal : null;
    if (!value || typeof value.id !== "string" || !["login", "logout-started", "logout-done", "logout-failed"].includes(value.type)) return null;
    if (value.intent !== undefined && value.intent !== "current" && value.intent !== "all") return null;
    if (value.timestamp !== undefined && !Number.isFinite(value.timestamp)) return null;
    return {
      id: value.id, type: value.type,
      ...(value.intent ? { intent: value.intent } : {}),
      ...(value.timestamp !== undefined ? { timestamp: value.timestamp } : {}),
    };
  } catch {
    return null;
  }
}

export function createBrowserAuthSignals(environment: SignalEnvironment = {
  getStorage: () => window.localStorage,
  openChannel: () => new BroadcastChannel(CHANNEL_NAME),
  listenStorage: (listener) => window.addEventListener("storage", listener),
  createId: () => crypto.randomUUID(),
  now: () => Date.now(),
}): AuthSignals {
  const listeners = new Set<(signal: AuthSignal) => void>();
  let latest: AuthSignal | null = null;
  let storage: ReturnType<SignalEnvironment["getStorage"]> | null = null;
  let channel: ReturnType<SignalEnvironment["openChannel"]> | null = null;
  try { storage = environment.getStorage(); } catch { /* Storage may be blocked. */ }
  try { channel = environment.openChannel(); } catch { /* Storage events remain a fallback. */ }

  const newerThanLatest = (signal: AuthSignal) => !latest ||
    (signal.timestamp ?? 0) > (latest.timestamp ?? 0) ||
    ((signal.timestamp ?? 0) === (latest.timestamp ?? 0) && signal.id > latest.id);

  const receive = (signal: AuthSignal | null) => {
    if (!signal || signal.id === latest?.id) return;
    if (!newerThanLatest(signal)) return;
    latest = signal;
    listeners.forEach((listener) => listener(signal));
  };

  environment.listenStorage((event) => {
    if (event.key === SIGNAL_KEY) receive(parseSignal(event.newValue));
  });
  if (channel) channel.onmessage = (event: MessageEvent<unknown>) => {
    receive(parseSignal(JSON.stringify(event.data)));
  };

  return {
    read() {
      try {
        const saved = parseSignal(storage?.getItem(SIGNAL_KEY) ?? null);
        if (saved && newerThanLatest(saved)) latest = saved;
      } catch { storage = null; }
      return latest;
    },
    publish(type, intent) {
      const signal: AuthSignal = {
        id: environment.createId(), type, timestamp: Math.max(environment.now(), (latest?.timestamp ?? 0) + 1),
        ...(intent ? { intent } : {}),
      };
      latest = signal;
      // Only event metadata is persisted or broadcast; never access/refresh tokens.
      try { storage?.setItem(SIGNAL_KEY, JSON.stringify(signal)); } catch { storage = null; }
      try { channel?.postMessage(signal); } catch { /* Local state remains authoritative in this tab. */ }
      return signal;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}
