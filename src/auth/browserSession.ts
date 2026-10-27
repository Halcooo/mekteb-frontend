import { createSessionStore, purgeLegacyCredentials } from "./sessionStore.ts";
import { createAuthCoordinator } from "./authCoordinator.ts";
import { createBrowserAuthSignals, withAuthOperationLock } from "./browserAuthSignals.ts";
import { authApi } from "../api/authApi";

purgeLegacyCredentials(() => window.localStorage);
purgeLegacyCredentials(() => window.sessionStorage);

export const authSession = createSessionStore();
export const authCoordinator = createAuthCoordinator(
  authSession, authApi, withAuthOperationLock, createBrowserAuthSignals(),
);
