# Option B: Worker Holds Credentials + Server-Side Signing

## Goal
Eliminate the XSS risk of private key living in browser memory after first paste. The Worker encrypts and stores credentials in KV; all RSA signing happens server-side thereafter.

---

## Architecture

### Flow
1. User clicks "Login with Dashboard" → redirected to OAuth → logs in → returns to docs
2. User pastes `clientId` + `clientSecret` + `privateKey` into AuthModal form (first time only, one session)
3. Worker encrypts all 3 with AES-256-GCM using `ENCRYPTION_KEY` secret → stores in KV
4. Worker also fetches OAuth access token → stores encrypted in KV + session ID in HttpOnly cookie
5. Session cookie: `rm_session_id` (HttpOnly, Secure, SameSite=None) — opaque, JS cannot read
6. **Subsequent sessions:** User clicks Connect → Worker reads KV using session ID → auto-signs requests server-side → private key never in browser again

### What Worker Stores (KV, AES-256-GCM encrypted)

| KV key | Value |
|---|---|
| `cred:{sessionId}` | JSON: `{clientId, clientSecret, privateKey, env}` |
| `token:{sessionId}` | JSON: `{accessToken, expiresIn}` |

### Security Properties
- Private key **never in frontend JS after first paste**
- Worker does all RSA signing — docs site is display + response rendering only
- Session ID in HttpOnly cookie — JS cannot read it (prevents XSS theft)
- AES-256-GCM encryption at rest in KV
- `ENCRYPTION_KEY` secret: never in client-side code

---

## Files to Change

### 1. `rm-api-proxy/wrangler.jsonc`
- Add `kv_namespaces` binding: `{ binding = "RM_KV", id = "<namespace-id>" }`
- User must create a KV namespace via `wrangler kv:namespace create "RM_KV"` and paste the id

### 2. `rm-api-proxy/src/index.ts`
**New endpoints:**
- `POST /auth/login` — receives `{clientId, clientSecret, privateKey, env}`, encrypts + stores in KV, fetches OAuth token, sets `rm_session_id` HttpOnly cookie
- `POST /auth/logout` — deletes KV entries, clears cookie (merge with existing `/logout`)
- `GET /auth/status` — returns whether session is active (reads cookie, checks KV expiry)
- `POST /auth/verify` — checks token still valid in KV

**Proxy changes:**
- Add `useServerSigning` boolean — when true, Worker reads credentials from KV, performs RSA signing, returns signed headers to inject
- Keep existing `/logout` (merge into new structure)

**Encryption (added to Worker):**
- AES-256-GCM encrypt/decrypt helpers using `ENCRYPTION_KEY` secret

**Allowed hosts (update):**
- Remove `open.revenuemonster.my` and `oauth.revenuemonster.my` — keep only sandbox (`sb-*`)

### 3. `src/components/AuthModal/index.tsx`
- Remove `env` state and Live/Sandbox toggle UI
- Add "Login with Dashboard" button (redirects to `sb-oauth.revenuemonster.my/login?redirectUri=...`)
- Keep form for first-time paste of credentials
- After form submit: call `/auth/login` Worker endpoint
- Remove `SANDBOX_DEFAULTS`, `PROXY` constant, `handleEnvSwitch`
- On success: dispatch `rm-auth-changed`, close modal

### 4. `src/components/ApiPlayground/UseApiPlayground.tsx`
- Add `useServerSigning: boolean` prop
- When `useServerSigning=true`:
  - Skip client-side `signRSA()` — Worker does it
  - Add `signingRequestId` to track async server-signed results
  - `notReady` changes — token still needed from cookie, but private key no longer required
- Remove `env`, `setEnv`, `hasEnv` state — hardcode sandbox
- Remove `UrlConfig` dual-type — plain `string` only
- Remove `prevEnvRef` effect

### 5. `src/components/ApiPlayground/UseApiSharedState.ts`
- Same changes as UseApiPlayground.tsx

### 6. `src/components/ApiPlayground/index.tsx`
- Remove two-button Sandbox/PROD env switch (always sandbox)
- Remove `hasEnv` conditional — env switch never renders

### 7. `src/components/ApiPlayground/TokenBanner.tsx`
- Remove `env` prop and `isProd` logic — always sandbox
- Remove `ProdWarning` component
- Keep token status display

### 8. `src/components/api/ApiEndpoint.tsx`
- Remove `prod` prop — keep only `path` or `sandbox`
- Simplify to `method` + `path`

### 9. `docs/` frontmatter (all ~90 files)
- Remove `prod:` lines — keep only `sandbox:`
- Run `node strip-api-endpoint-domains.js` if it exists

### 10. `docs_internal/` frontmatter
- Same as docs/

### 11. `src/css/custom.css`
- Remove prod badge styles if any

---

## Files NOT to Change
- `src/utils/auth.ts` — token expiry logic (still valid, but token lives in KV now)
- `src/utils/privateKey.ts` — still used for first-paste, but Worker takes over after
- `sidebars.js`
- `CLAUDE.md`

---

## Implementation Order

### Phase 1: Worker (safety first)
1. `wrangler.jsonc` — add KV binding placeholder
2. `rm-api-proxy/src/index.ts` — add encryption helpers, `/auth/login`, `/auth/logout`, `/auth/status`
3. Restrict `allowedHosts` to sandbox only (`sb-open.*`, `sb-oauth.*`)

### Phase 2: AuthModal
4. Strip env toggle, add "Login with Dashboard" button
5. Wire up `/auth/login` call

### Phase 3: Playground Hooks
6. `UseApiPlayground.tsx` — add `useServerSigning`, remove env state
7. `UseApiSharedState.ts` — same
8. `ApiPlayground/index.tsx` — remove env switch UI

### Phase 4: Cleanup
9. `TokenBanner` — remove prod warning
10. `ApiEndpoint` — simplify props
11. Docs frontmatter — strip `prod:` lines
12. CSS cleanup

### Phase 5: Test
13. `npm start` — verify all playgrounds work, auth flow works

---

## Verification
- Private key never in `localStorage`/`sessionStorage` — only in Worker KV
- No "Live / Sandbox" toggle anywhere in UI
- Worker rejects non-sandbox hosts
- `rm_session_id` cookie is HttpOnly + Secure
- Server-side signing works for all non-OAuth endpoints
- OAuth endpoints still work with client-side signing (or add server-side OAuth too)

---

## Dependencies
- Cloudflare KV namespace must be created: `wrangler kv:namespace create "RM_KV"`
- `ENCRYPTION_KEY` secret must be set: `wrangler secret put ENCRYPTION_KEY`
- User must save the KV namespace id in `wrangler.jsonc`