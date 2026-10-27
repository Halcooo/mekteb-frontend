import test from "node:test";
import assert from "node:assert/strict";
import axios, { AxiosError } from "axios";
import { QueryClient } from "@tanstack/react-query";
import { createSessionStore, LEGACY_AUTH_KEYS, purgeLegacyCredentials, sessionScope } from "../src/auth/sessionStore.ts";
import { createAuthCoordinator } from "../src/auth/authCoordinator.ts";
import { installSessionInterceptors } from "../src/auth/authenticatedClient.ts";
import { createCookieAuthApi } from "../src/auth/cookieAuthApi.ts";
import { createAuthOperationLock, createBrowserAuthSignals } from "../src/auth/browserAuthSignals.ts";

const expiration = Math.floor(Date.now() / 1000) + 3600;
function user(id) { return { id, username: `user${id}`, email: `user${id}@example.test`, role: "parent" }; }
function credentials(id = 1, revision = 1, sid = `session-${id}`) {
  const payload = Buffer.from(JSON.stringify({ userId: id, sid, exp: expiration, revision })).toString("base64url");
  return { accessToken: `header.${payload}.test`, user: user(id), sessionId: sid };
}
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
function response(config, data = {}) { return { status: 200, statusText: "OK", headers: {}, config, data }; }
function unauthorized(config = {}) {
  return new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, undefined, { ...response(config), status: 401 });
}
function lock() {
  let queue = Promise.resolve();
  return (operation) => {
    const result = queue.then(operation, operation);
    queue = result.then(() => undefined, () => undefined);
    return result;
  };
}
function signalBus(initial = null) {
  let latest = initial;
  let sequence = 0;
  const subscribers = new Map();
  const published = [];
  return {
    published,
    connect(name) {
      return {
        read: () => latest,
        publish(type, intent) {
          latest = { id: `event-${++sequence}`, type, ...(intent ? { intent } : {}) };
          published.push(latest);
          for (const [owner, callback] of subscribers) if (owner !== name) callback(latest);
          return latest;
        },
        subscribe(callback) { subscribers.set(name, callback); return () => subscribers.delete(name); },
      };
    },
  };
}
function fixture({ authenticated = true, transport = {}, bus = signalBus(), name = "tab", operationLock = lock() } = {}) {
  const store = createSessionStore();
  if (authenticated) store.applyCredentials(store.begin(), credentials());
  const api = {
    login: async () => credentials(), register: async () => credentials(),
    refresh: async () => credentials(1, 2), logout: async () => ({ success: true }),
    logoutAll: async () => ({ success: true }), ...transport,
  };
  const coordinator = createAuthCoordinator(store, api, operationLock, bus.connect(name));
  return { store, coordinator, bus, api };
}
function clientWithRefresh(store, coordinator) {
  const observed = [];
  const client = axios.create({ adapter: async (config) => {
    observed.push(config.headers.get("Authorization"));
    if (!config._retry) throw unauthorized(config);
    return response(config, { private: "data" });
  } });
  installSessionInterceptors(client, store, coordinator.refresh);
  return { client, observed };
}
const tick = () => new Promise((resolve) => setImmediate(resolve));

// These are transport assertions against a mocked Axios adapter, never network requests.
test("auth requests use cookies and CSRF header; refresh has no token body", async () => {
  const requests = [];
  const api = createCookieAuthApi("https://app.example.test/backend/api", async (config) => {
    requests.push(config);
    return response(config, { success: true, ...credentials() });
  });
  await api.login({ username: "user", password: "test-password" });
  await api.register({ username: "user", email: "u@example.test", firstName: "A", lastName: "B", password: "test-password" });
  await api.refresh();
  await api.logout();
  await api.logoutAll(credentials().accessToken);
  assert.equal(requests.length, 5);
  for (const request of requests) {
    assert.equal(request.withCredentials, true);
    assert.equal(request.headers.get("X-CSRF-Protection"), "1");
  }
  assert.equal(requests[2].data, undefined);
  assert.equal(requests[3].data, undefined);
  assert.equal(requests[4].headers.get("Authorization"), `Bearer ${credentials().accessToken}`);
});

test("reload bootstraps once from the HttpOnly cookie with no persisted credentials", async () => {
  const pending = deferred();
  let calls = 0;
  const { store, coordinator } = fixture({ authenticated: false, transport: { refresh: (...args) => {
    calls++;
    assert.equal(args.length, 0);
    return pending.promise;
  } } });
  assert.equal(store.getSnapshot().isLoading, true);
  const first = coordinator.restore();
  const second = coordinator.restore();
  await tick();
  assert.equal(calls, 1);
  pending.resolve(credentials());
  await Promise.all([first, second]);
  assert.equal(store.getSnapshot().isLoading, false);
  assert.deepEqual(Object.keys(store.getCurrent()).sort(), ["accessToken", "id", "user"]);
  assert.equal(createSessionStore().getCurrent(), null, "another runtime never inherits an in-memory token");
});

test("cookie restore 401 becomes signed out; network failure is visible and retryable", async () => {
  for (const invalid of [true, false]) {
    let fail = true;
    const { store, coordinator } = fixture({ authenticated: false, transport: { refresh: async () => {
      if (fail) throw invalid ? unauthorized() : new AxiosError("Offline", "ERR_NETWORK");
      return credentials();
    } } });
    if (invalid) await coordinator.restore();
    else await assert.rejects(coordinator.restore());
    assert.equal(store.getSnapshot().isLoading, false);
    assert.equal(store.getCurrent(), null);
    assert.equal(store.getSnapshot().problem, invalid ? null : "restore");
    fail = false;
    await coordinator.retry();
    assert.equal(store.getCurrent().user.id, 1);
  }
});

test("parallel API 401s share one cookie refresh and immediately notify the same tab", async () => {
  const pending = deferred();
  let calls = 0;
  const { store, coordinator } = fixture({ transport: { refresh: () => { calls++; return pending.promise; } } });
  let updates = 0;
  let boundaries = 0;
  store.subscribe(() => { updates++; });
  store.onSessionBoundary(() => { boundaries++; });
  const { client, observed } = clientWithRefresh(store, coordinator);
  const requests = Promise.all([client.get("/profile"), client.get("/notifications")]);
  await tick();
  assert.equal(calls, 1);
  pending.resolve(credentials(1, 2));
  await requests;
  assert.equal(updates, 1);
  assert.equal(boundaries, 0);
  assert.deepEqual(observed.slice(-2), [0, 1].map(() => `Bearer ${credentials(1, 2).accessToken}`));
});

for (const initialOperation of ["refresh", "bootstrap", "login"]) {
  test(`logout cannot be undone by a late ${initialOperation} response or its cookie`, async () => {
    const pending = deferred();
    const operations = [];
    let cookie = "old";
    const { store, coordinator } = fixture({ authenticated: initialOperation === "refresh", transport: {
      refresh: async () => { operations.push("refresh-start"); await pending.promise; cookie = "rotated"; return credentials(1, 2); },
      login: async () => { operations.push("login-start"); await pending.promise; cookie = "new-login"; return credentials(); },
      logout: async () => { operations.push("logout"); cookie = null; },
    } });
    const request = initialOperation === "refresh" ? coordinator.refresh(store.getCurrent())
      : initialOperation === "bootstrap" ? coordinator.restore() : coordinator.login({});
    const rejected = assert.rejects(request, (error) => axios.isCancel(error));
    await tick();
    const logout = coordinator.logout();
    assert.equal(store.getCurrent(), null);
    pending.resolve();
    await Promise.all([rejected, logout]);
    assert.equal(store.getCurrent(), null);
    assert.equal(cookie, null);
    assert.equal(operations.at(-1), "logout");
  });
}

test("logout immediately clears private data but exposes offline revoke failure and retry", async () => {
  let offline = true;
  const { store, coordinator, bus } = fixture({ transport: { logout: async () => {
    if (offline) throw new AxiosError("Offline", "ERR_NETWORK");
  } } });
  const queryClient = new QueryClient();
  queryClient.setQueryData(["profile", 1], { secret: "private" });
  store.onSessionBoundary(() => queryClient.clear());
  const rejected = assert.rejects(coordinator.logout());
  assert.equal(store.getCurrent(), null);
  assert.equal(queryClient.getQueryData(["profile", 1]), undefined);
  await rejected;
  assert.equal(store.getSnapshot().problem, "logout");
  assert.equal(bus.published.at(-1).type, "logout-failed");
  offline = false;
  await coordinator.retry();
  assert.equal(store.getSnapshot().problem, null);
  assert.equal(store.getSnapshot().pendingLogout, null);
  assert.equal(bus.published.at(-1).type, "logout-done");
  queryClient.clear();
});

test("reload completes an unfinished logout instead of restoring its cookie", async () => {
  const bus = signalBus({ id: "saved-logout", type: "logout-failed", intent: "current" });
  let revoked = 0;
  const { store, coordinator } = fixture({ authenticated: false, bus, transport: {
    refresh: () => assert.fail("pending logout must never restore authentication"),
    logout: async () => { revoked++; },
  } });
  await coordinator.restore();
  assert.equal(revoked, 1);
  assert.equal(store.getCurrent(), null);
  assert.equal(store.getSnapshot().isLoading, false);
});

test("sign-out on all devices sends its captured access token and supports retry without local authentication", async () => {
  let fail = true;
  const received = [];
  const { store, coordinator } = fixture({ transport: { logoutAll: async (access) => {
    received.push(access);
    if (fail) throw new AxiosError("Offline", "ERR_NETWORK");
  } } });
  await assert.rejects(coordinator.logout("all"));
  assert.equal(store.getCurrent(), null);
  assert.equal(store.getSnapshot().problem, "logout-all");
  fail = false;
  await coordinator.retry();
  assert.deepEqual(received, [credentials().accessToken, credentials().accessToken]);
  assert.equal(store.getSnapshot().pendingLogout, null);
});

test("logout-all retry after reload obtains an access token from the cookie without displaying a session", async () => {
  const bus = signalBus({ id: "saved-all", type: "logout-failed", intent: "all" });
  let revoked = false;
  const { store, coordinator } = fixture({ authenticated: false, bus, transport: {
    logoutAll: async (access) => { assert.equal(access, credentials(1, 2).accessToken); revoked = true; },
  } });
  store.subscribe(() => assert.equal(store.getSnapshot().session, null));
  await coordinator.restore();
  assert.equal(revoked, true);
  assert.equal(store.getCurrent(), null);
});

test("cross-tab refreshes are serialized against strict rotating cookies", async () => {
  const bus = signalBus();
  const operationLock = lock();
  let active = 0;
  let maxActive = 0;
  let rotations = 1;
  const refresh = async () => {
    active++;
    maxActive = Math.max(maxActive, active);
    await tick();
    active--;
    return credentials(1, ++rotations);
  };
  const first = fixture({ bus, operationLock, name: "one", transport: { refresh } });
  const second = fixture({ bus, operationLock, name: "two", transport: { refresh } });
  await Promise.all([first.coordinator.refresh(first.store.getCurrent()), second.coordinator.refresh(second.store.getCurrent())]);
  assert.equal(maxActive, 1);
  assert.equal(first.store.getCurrent().user.id, 1);
  assert.equal(second.store.getCurrent().user.id, 1);
});

test("cross-tab logout cancels in-flight refresh and revokes the cookie after it settles", async () => {
  const bus = signalBus();
  const operationLock = lock();
  const pending = deferred();
  const order = [];
  const first = fixture({ bus, operationLock, name: "one", transport: { refresh: async () => {
    order.push("refresh"); await pending.promise; return credentials(1, 2);
  } } });
  const second = fixture({ bus, operationLock, name: "two", transport: { logout: async () => { order.push("revoke"); } } });
  const rejected = assert.rejects(first.coordinator.refresh(first.store.getCurrent()), (error) => axios.isCancel(error));
  await tick();
  const logout = second.coordinator.logout();
  assert.equal(first.store.getCurrent(), null);
  pending.resolve();
  await Promise.all([rejected, logout]);
  assert.deepEqual(order, ["refresh", "revoke"]);
  assert.equal(first.store.getCurrent(), null);
  assert.equal(second.store.getCurrent(), null);
});

test("successful login in another tab clears the old identity before bootstrapping the new cookie", async () => {
  const bus = signalBus();
  const operationLock = lock();
  const first = fixture({ bus, operationLock, name: "one", transport: { refresh: async () => credentials(2) } });
  const second = fixture({ bus, operationLock, name: "two", transport: { login: async () => credentials(2) } });
  const scopes = [];
  first.store.subscribe(() => scopes.push(first.store.getSnapshot().session?.user.id ?? null));
  await second.coordinator.login({});
  await tick();
  assert.equal(first.store.getCurrent().user.id, 2);
  assert.equal(scopes[0], null);
  for (const signal of bus.published) {
    assert.deepEqual(Object.keys(signal).sort(), ["id", "type"]);
  }
});

test("an unexpected cookie account switch during refresh cannot retry an old request as another user", async () => {
  const { store, coordinator } = fixture({ transport: { refresh: async () => credentials(2) } });
  const { client, observed } = clientWithRefresh(store, coordinator);
  await assert.rejects(client.get("/profile"), (error) => axios.isCancel(error));
  assert.equal(observed.length, 1);
  assert.equal(store.getCurrent(), null);
});

test("a mismatched JWT session cannot be briefly published when the safe response sessionId is absent", async () => {
  const changed = credentials(1, 2, "different-session");
  delete changed.sessionId;
  const { store, coordinator } = fixture({ transport: { refresh: async () => changed } });
  const observed = [];
  store.subscribe(() => observed.push(store.getSnapshot().session?.id ?? null));
  await assert.rejects(coordinator.refresh(store.getCurrent()), (error) => axios.isCancel(error));
  assert.deepEqual(observed, [null]);
});

test("late responses from an older session are discarded", async () => {
  const pending = deferred();
  const { store, coordinator } = fixture();
  const client = axios.create({ adapter: async (config) => { await pending.promise; return response(config, { private: "old" }); } });
  installSessionInterceptors(client, store, coordinator.refresh);
  const rejected = assert.rejects(client.get("/profile"), (error) => axios.isCancel(error));
  await tick();
  store.applyCredentials(store.begin(), credentials(2));
  pending.resolve();
  await rejected;
});

test("stale default Authorization is removed after logout", async () => {
  const { store, coordinator } = fixture();
  const client = axios.create({ adapter: async (config) => response(config, { auth: config.headers.get("Authorization") ?? null }) });
  client.defaults.headers.common.Authorization = "Bearer stale";
  installSessionInterceptors(client, store, coordinator.refresh);
  await coordinator.logout();
  assert.equal((await client.get("/news")).data.auth, null);
});

test("refresh 401 clears the session; transient refresh failure preserves it", async () => {
  for (const invalid of [true, false]) {
    const { store, coordinator } = fixture({ transport: { refresh: async () => {
      throw invalid ? unauthorized() : new AxiosError("Offline", "ERR_NETWORK");
    } } });
    await assert.rejects(coordinator.refresh(store.getCurrent()));
    assert.equal(Boolean(store.getCurrent()), !invalid);
  }
});

test("API retry is bounded to prevent a refresh loop", async () => {
  let refreshCalls = 0;
  let requests = 0;
  const { store, coordinator } = fixture({ transport: { refresh: async () => { refreshCalls++; return credentials(1, 2); } } });
  const client = axios.create({ adapter: async (config) => { requests++; throw unauthorized(config); } });
  installSessionInterceptors(client, store, coordinator.refresh);
  await assert.rejects(client.get("/profile"));
  assert.equal(refreshCalls, 1);
  assert.equal(requests, 2);
});

test("all legacy credentials are purged without reading them or writing any tokens", () => {
  const removed = [];
  purgeLegacyCredentials(() => ({
    getItem: () => assert.fail("legacy credentials must never be restored"),
    setItem: () => assert.fail("tokens must never be persisted"),
    removeItem: (key) => removed.push(key),
  }));
  assert.deepEqual(removed, LEGACY_AUTH_KEYS);
  assert.doesNotThrow(() => purgeLegacyCredentials(() => { throw new Error("SecurityError"); }));
  let attempts = 0;
  assert.doesNotThrow(() => purgeLegacyCredentials(() => ({ removeItem() { attempts++; throw new Error("SecurityError"); } })));
  assert.equal(attempts, LEGACY_AUTH_KEYS.length);
  const store = createSessionStore();
  assert.equal(store.getCurrent(), null);
});

test("private query cache is cleared before a new identity is visible and late query completion cannot repopulate it", async () => {
  const { store } = fixture();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const pending = deferred();
  queryClient.setQueryData(["profile", 1], { private: "data" });
  store.onSessionBoundary(() => queryClient.clear());
  store.subscribe(() => assert.equal(queryClient.getQueryCache().getAll().length, 0));
  const rejected = assert.rejects(queryClient.fetchQuery({ queryKey: ["students", 1], queryFn: () => pending.promise }));
  store.applyCredentials(store.begin(), credentials(2));
  pending.resolve(["private"]);
  await rejected;
  assert.equal(queryClient.getQueryData(["students", 1]), undefined);
  queryClient.clear();
});

test("an invalid sid or expired access response is not installed", () => {
  const store = createSessionStore();
  const version = store.begin();
  assert.throws(() => store.applyCredentials(version, { ...credentials(), sessionId: "mismatch" }));
  const expired = `header.${Buffer.from(JSON.stringify({ userId: 1, sid: "session-1", exp: 1 })).toString("base64url")}.test`;
  assert.throws(() => store.applyCredentials(version, { ...credentials(), accessToken: expired }));
  assert.equal(sessionScope(store.getCurrent()), null);
});

test("an unconfirmable logout-all permits explicit reauthentication without claiming success", async () => {
  const bus = signalBus({ id: "saved-all", type: "logout-failed", intent: "all" });
  const { store, coordinator } = fixture({ authenticated: false, bus, transport: {
    refresh: async () => { throw unauthorized(); },
  } });
  await assert.rejects(coordinator.restore());
  assert.equal(store.getSnapshot().problem, "logout-all-auth");
  assert.equal(bus.published.some((signal) => signal.type === "logout-done"), false);
  await coordinator.login({});
  assert.equal(store.getCurrent().user.id, 1);
});

test("Web Locks serializes auth; blocked lock access falls back without repeating operations", async () => {
  for (const unavailable of [false, true]) {
    const webQueue = lock();
    let requests = 0;
    const runExclusive = createAuthOperationLock(() => {
      if (unavailable) throw new Error("SecurityError");
      return { request: (name, operation) => {
        assert.equal(name, "mekteb-auth-operation");
        requests++;
        return webQueue(operation);
      } };
    });
    let active = 0;
    let maximum = 0;
    const operation = async () => { active++; maximum = Math.max(maximum, active); await tick(); active--; };
    await Promise.all([runExclusive(operation), runExclusive(operation)]);
    assert.equal(maximum, 1);
    assert.equal(requests, unavailable ? 0 : 2);
    let attempts = 0;
    await assert.rejects(runExclusive(async () => { attempts++; throw new Error("network failure"); }));
    assert.equal(attempts, 1);
  }
});

test("browser signals persist metadata only and ignore delayed older events", () => {
  const saved = new Map();
  const broadcasts = [];
  let storageEvent;
  let sequence = 0;
  const channel = { onmessage: null, postMessage: (message) => broadcasts.push(message) };
  const signals = createBrowserAuthSignals({
    getStorage: () => ({ getItem: (key) => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) }),
    openChannel: () => channel,
    listenStorage: (listener) => { storageEvent = listener; },
    createId: () => `signal-${++sequence}`, now: () => 100,
  });
  const login = signals.publish("login");
  const logout = signals.publish("logout-started", "current");
  assert.equal(saved.size, 1);
  assert.deepEqual(Object.keys(JSON.parse([...saved.values()][0])).sort(), ["id", "intent", "timestamp", "type"]);
  assert.equal(broadcasts.length, 2);
  channel.onmessage({ data: login });
  storageEvent({ key: "mekteb_auth_event", newValue: JSON.stringify(login) });
  assert.equal(signals.read().id, logout.id);
});

test("blocked signal storage or channels do not prevent local logout intent and cannot restore stale metadata", () => {
  for (const blockedGetter of [true, false]) {
    let reads = 0;
    const signals = createBrowserAuthSignals({
      getStorage: () => {
        if (blockedGetter) throw new Error("SecurityError");
        return {
          getItem: () => { reads++; return JSON.stringify({ id: "old", type: "login", timestamp: 1 }); },
          setItem: () => { throw new Error("QuotaExceededError"); },
        };
      },
      openChannel: () => { throw new Error("NotSupportedError"); },
      listenStorage: () => {}, createId: () => "logout", now: () => 100,
    });
    signals.read();
    signals.publish("logout-failed", "current");
    const before = reads;
    assert.equal(signals.read().type, "logout-failed");
    assert.equal(reads, before, "failed persistence must not rehydrate stale state");
  }
});
