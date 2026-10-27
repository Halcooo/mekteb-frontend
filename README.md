# Mekteb E-Dnevnik Frontend

React 19, TypeScript, Vite, Bootstrap and TanStack Query frontend for the mekteb register.

## HTTPS deploy

Izdanje `20261027T202834552Z-cpanel` je aktivno od 27.10.2026. Produkcijska migracija, HTTPS provjere i pozadinski cron prolaze; test stvarnog telefona je odgođen po odluci vlasnika. Za naredno izdanje koristiti [kratki plan sigurnog deploya](https://github.com/Halcooo/mekteb-backend/blob/main/deploy/DEPLOY_RUNBOOK.md), bez ponavljanja početne pripreme hostinga i stare sheme. Lokalni `.env` ostaje van Gita; u repozitoriju su samo javni primjeri konfiguracije.

Koristiti [ponovljivi plan deploya](../backend/deploy/DEPLOY_RUNBOOK.md) i [cPanel korake](../backend/deploy/CPANEL_DEPLOY.md). Zajednički paket nastaje komandom `npm run release:prepare` iz backend repozitorija, s javnim API URL-om `https://api.mekteb-pazaric.com/backend/api`. Produkcijski build odbija neispravan ili HTTP API URL. `.cpanel.yml` priprema staging kandidata; aktivacija slijedi tek poslije provjere baze, backupa i oba dijela aplikacije.

## Plan provjere i korisnička uputstva — 27.10.2026.

[Plan cjelovite provjere](docs/PLAN_PROVJERE.md) izvršen je lokalno na izdvojenoj MySQL instanci s izmišljenim podacima. [Rezultati, ispravke i preostale provjere](docs/REZULTATI_PROVJERE.md) sadrže stvarni obuhvat svake grupe. Prošla su 42 frontend testa, lint i produkcijski build, 108 backend testova, 18 funkcionalnih HTTP testova i zasebna integracijska provjera migracija/sesija/chata/push reda. Urađena je i proba vraćanja baze iz kopije, uz poređenje svih redova 14 tabela. Stvarna push dostava na Android/iPhone i konfiguracija hostinga još čekaju završnu provjeru.

Dogovoreni način rada: efendija koristi `admin` račun, a vlasnik projekta zaseban `admin` račun s istim ovlastima nad učenicima, prisustvom, novostima i svim razgovorima. Posebna uloga `superadmin` trenutno nije implementirana. Obavijesti i sesije ostaju vezane za pojedinačni račun. Dodatna postojeća uloga `teacher` ima pristup učenicima i razgovorima; unos prisustva i upravljanje novostima ostaju administratorske radnje.

PDF uputstva sa slikama: [za efendiju, 8 stranica](output/pdf/Uputstvo-za-efendiju.pdf) i [za roditelje, 2 stranice](output/pdf/Kratko-uputstvo-za-roditelje.pdf). Izvor je [docs/generate_manuals.py](docs/generate_manuals.py), a originalni snimci su u `docs/images/`. Za ponovno generisanje trebaju Python, ReportLab, Pillow i Windows Segoe UI fontovi; pokrenuti `python docs/generate_manuals.py`. PDF-ovi su renderovani i vizuelno pregledani. Korisnik je zatražio PDF, pa zasebna HTML isporuka nije potrebna.

U ovoj rundi popravljeni su pomjeranje datuma iz MySQL DATE polja, netačni procenti i tretiranje neunesenog prisustva kao odsustva, učitavanje samo prvih 100 učenika, istovremeno spremanje prisustva i transakcije grupnog unosa. Neuspjelo spremanje više ne ostavlja lažan status na ekranu. Uređene su greške i ponavljanje učitavanja slika, njihove putanje/ograničenja/brisanje te stvarna imena povezanih roditelja. Chat je provjeren s 20 otvorenih kartica i zasebnim nacrtima; aktivna kartica se automatski dovodi u vidljivi dio trake. Datumi ostaju `27.10.2026.` u oba jezika, a bosanski procenti koriste decimalni zarez.

## Setup and commands

Use Node.js 22.14 or newer, then run `npm ci`. Configure the public API URL in `.env.local` for development:

```env
VITE_API_URL=http://localhost:5000/backend/api
```

Vite variables are bundled into browser code. Never put passwords or private keys in `VITE_*` variables. The backend's `FRONTEND_URL` allowlist must contain the frontend's exact origin, including its port. Use the same hostname for both local servers, for example `localhost` on ports 5173 and 5000.

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server. |
| `npm test` | Run session, chat, push-worker, translation and date regression tests, including a real QueryClient and date checks in multiple time zones. No database or external network is used. |
| `npm run lint` | Check the full source tree with ESLint. |
| `npm run build` | Run TypeScript checks and generate the tracked production `dist` directory. |
| `npm run preview` | Preview the production build locally. Allow its exact origin in the backend when testing authenticated requests. |

Create accounts through the configured backend or a controlled seed process. No shared default credentials are provided. New passwords require at least 12 characters and at most 72 UTF-8 bytes; the stricter registration rule does not change existing passwords.

## Authentication and API contract

Access JWTs exist only in this tab's memory. The browser holds the refresh credential in an HttpOnly cookie; JavaScript never receives or stores it. On a page reload, the app waits for `POST /auth/refresh` before resolving protected routes. A missing or expired session shows the signed-out view. A temporary connection failure shows a retry action.

All paths below are relative to `VITE_API_URL`:

| Endpoint | Request | Expected behavior |
|---|---|---|
| `POST /auth/login` | Username and password | Create a session, set the refresh cookie and return access credentials. |
| `POST /auth/register` | Registration fields | Create an account/session, set the cookie and return access credentials. |
| `POST /auth/refresh` | No body; browser sends the cookie | Rotate the refresh credential and return fresh access credentials. |
| `POST /auth/logout` | Browser sends the cookie | Revoke the current server session and clear the cookie; a missing cookie is handled idempotently. |
| `POST /auth/logout-all` | Cookie and access JWT in `Authorization` | Revoke all sessions belonging to the authenticated account and clear the cookie. Available from Profile. |

Authentication responses contain `{ success, user, accessToken, sessionId }`; the access JWT contains the stable `sid` claim. There is no refresh-token response field. Auth POSTs use `withCredentials: true` and `X-CSRF-Protection: 1`. The backend requires an allowed `Origin` and returns credential-compatible CORS headers. Other API requests use the in-memory JWT as a bearer token.

The production refresh cookie is host-only, HttpOnly, Secure, `SameSite=Lax`, and scoped to `/backend/api/auth`. Use HTTPS with a same-site frontend and API, or a same-origin reverse proxy. Arbitrary cross-site frontend/API deployments are not supported by this cookie policy. Local development uses the backend's non-Secure development cookie. The configured backend defaults are 15 minutes for access tokens and an absolute 30-day session lifetime; refresh does not extend that session deadline.

## Session isolation and sign-out behavior

Logout and account changes immediately clear private query caches and component state. Late HTTP, login, bootstrap and refresh responses cannot restore an earlier identity. Profile, student and attendance query keys are scoped to the current user. Backend authorization remains authoritative; hidden routes are not a security boundary. Parent API responses exclude invitation keys.

Parallel 401 responses share one refresh within a tab. Where available, Web Locks serializes refresh, login and logout operations across tabs so strict cookie rotation and `Set-Cookie` responses cannot race. Other tabs receive token-free account-change events, clear their previous identity, and restore the new cookie session after a successful login. Storage/BroadcastChannel messages contain event metadata only; access credentials are not shared through these channels.

Local data is cleared even when the server cannot be reached during logout. The app then explicitly says that server-side revocation is unconfirmed and offers retry. A token-free unfinished-logout marker lets a subsequent reload attempt revocation before restoring a session. Sign-out on all devices has the same failure reporting. If its cookie is already expired or revoked and the result cannot be confirmed, the user is told to sign in again and retry the all-device action from Profile.

Support limits:

- Without Web Locks, auth requests are serialized only within each tab. Simultaneous refreshes in multiple tabs can be rejected by the backend's strict rotation policy and require a new login.
- A lost refresh response may leave the browser with a consumed credential; recovery can require signing in again. The client does not silently replay refresh indefinitely.
- If browser storage and BroadcastChannel are unavailable, local authentication still works, but cross-tab coordination and unfinished-logout recovery across reloads may be unavailable. Failed server revocation is never reported as successful.
- Automated tests cover simulated cookie transport, lifecycle races, cache isolation and browser API failures. They do not replace testing real browser cookies, CORS, HTTPS or the hosting proxy.

## Rollout and remaining work

Deploy compatible backend and frontend versions together. Apply the reviewed backend schema/session migrations before enabling the new authentication endpoints, then run tests and rebuild this frontend. Old localStorage tokens are not migrated into the new scheme: known legacy credential keys are deleted where browser storage permits, and existing users must sign in again. Old JWTs without a persisted session and `sid` are not accepted by the new backend.

Before publishing, verify login, reload restoration, refresh, two-tab account changes, current-device logout and all-device logout against the actual deployment origin. Confirm the cookie flags and path, credentialed CORS responses, CSRF rejection for an untrusted origin, and behavior after session expiry/revocation. Check the logout error/retry experience when connectivity is interrupted.

The repositories track build output, so rebuild after final source changes. The replacement `.cpanel.yml` stages a candidate only. Use the shared release package and backend deployment runbook to verify backups, migrations, API activation and HTTPS before publishing the frontend.

Messages now has a shared conversation workspace for staff and parents, with searchable/unread inboxes, multiple open conversations, per-conversation memory drafts, cursor history, quoted replies, editing and soft deletion. Parent-initiated conversations use the new chat API; existing attendance comments remain available. Message, inbox and push-job persistence is transactional and sending uses a stable idempotency receipt.

## Chat workspace and Web Push

The Messages page keeps the inbox visible beside the active conversation on desktop. Teachers can switch through quick conversation tabs without losing unsent drafts; active selection stays fixed when other conversations receive messages. On phones the inbox and conversation use separate views with a back action. Drafts and unconfirmed receipts are held in tab memory and cleared on logout/account change; reloading the page clears drafts. Messages are sent with Ctrl+Enter or the Send button. An unconfirmed send exposes retry using the same receipt. The UI never implies that another participant is online or has read a message without server evidence.

The newest50 messages load first, with older cursor pages on demand. Quoted replies retain their original date and cannot cross student boundaries. Only the author or an administrator can edit/delete. Deletion leaves a tombstone and preserves other participants' replies. Message reads acknowledge only the fetched range while the conversation is visible at its newest end; opening a background tab does not mark everything read. Live events trigger refresh, with5second active-history and10second inbox polling as fallback.

Enable phone notifications from Profile or the bell settings on Messages. This is an explicit user action; the app does not request permission on first load. It uses a root service worker, the manifest and install icons in `public`. It requires HTTPS outside loopback. On iPhone/iPad, add the app to the Home Screen and launch that installed app before enabling notifications. [Apple documents this requirement](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers).

The backend must have migration006, `web-push` and a stable `WEB_PUSH_PUBLIC_KEY`/`WEB_PUSH_PRIVATE_KEY`/`WEB_PUSH_SUBJECT` configuration. The public key comes from the authenticated API and is not a build-time Vite secret. See the backend README for key generation, queue behavior and rollout. Serve `/sw.js` as JavaScript without a long cache lifetime; the worker does not cache private data or make the authenticated app available offline.

Push remains available when the page is closed, subject to browser/OS support, granted permission and connectivity. Notifications intentionally contain a generic message and no student details or conversation content. The click URL is constructed locally from a numeric notification ID and resolves through the authenticated API. Session-bound worker state prevents late notifications from an older account being shown after switching accounts. A browser or OS may delay or suppress delivery; real Android and iPhone testing is required on the deployment origin.

Tests include receipt identity, cursor overlap reconciliation, separate drafts, worker handling when no app window is open, generic notification content, stale-account rejection and same-origin navigation. Local browser smoke checks cover synthetic accounts and conversation switching. They do not claim end-to-end delivery on physical phones.

## Language, dates and interface

Bosnian and English resources live in `src/locales/bs.json` and `en.json`. Supported browser variants resolve to these two languages; other languages fall back to Bosnian. The document language follows the selection. Tests check key coverage against application calls, resource parity, interpolation parameters and Bosnian plural forms. Push notifications use the last selected UI language, with the same generic content and session checks.

All displayed dates use the required Bosnian format **27.10.2026.**, including the final full stop, even when the interface is in English. Time uses **14:30**. API and form state retain `YYYY-MM-DD`. The shared date utilities distinguish local calendar dates from timestamps, reject impossible dates and preserve birthdays/attendance dates across time zones. Date pickers show the same numeric format, use translated keyboard-accessible controls and navigate from the first day of a month to avoid skipping February after January 31.

The shared theme unifies navigation, forms, cards, tables, dialogs and messaging. The notification bell and account menu remain accessible when mobile navigation is collapsed. Chat uses separate scroll areas for the inbox and history, visible draft previews, open-conversation tabs and a composer that stays within the viewport. Profile settings use a separate notification panel on desktop and stack on phones. Keyboard focus and reduced-motion preferences are supported. Query devtools are opt-in during development with `VITE_QUERY_DEVTOOLS=true` and are absent from production builds.
