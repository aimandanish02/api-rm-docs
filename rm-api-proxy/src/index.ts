interface PlaygroundRequest {
  method: string
  body?: any
  url: string
  headers?: Record<string, string>
}

interface Env {
  ENCRYPTION_KEY: string;
  RM_KV: KVNamespace;
  RM_RATE_LIMIT: RateLimit;
}

const allowedHosts = [
  "sb-open.revenuemonster.my",
  "sb-oauth.revenuemonster.my"
]

const TOKEN_COOKIE = "rm_api_token"
const SESSION_COOKIE = "rm_session_id"
const SESSION_LENGTH = 64
const OAUTH_PATHS = ["/v1/token"]
const KV_TTL = 2592000 // 30 days in seconds

function isOAuthEndpoint(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      allowedHosts.includes(parsed.hostname) &&
      OAUTH_PATHS.some((p) => parsed.pathname === p)
    )
  } catch {
    return false
  }
}

function buildCorsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Signature, X-Nonce-Str, X-Timestamp",
    "Access-Control-Allow-Credentials": "true",
  }
}

function generateSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(SESSION_LENGTH));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader
    .split(";")
    .map(c => c.trim())
    .find(c => c.startsWith(`${name}=`))
  return match ? match.slice(name.length + 1) : null
}

// ─── Encryption helpers (AES-256-GCM) ───────────────────────────────────

async function getEncryptionKey(env: Env): Promise<CryptoKey> {
  const secret = env.ENCRYPTION_KEY;
  const rawKey = Uint8Array.from(secret.slice(0, 32), (c) => c.charCodeAt(0));
  if (secret.length < 32) {
    const padded = new Uint8Array(32);
    padded.set(rawKey);
    return crypto.subtle.importKey("raw", padded.buffer, "AES-GCM", false, ["encrypt", "decrypt"]);
  }
  return crypto.subtle.importKey("raw", rawKey.buffer, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encrypt(plaintext: string, env: Env): Promise<string> {
  const key = await getEncryptionKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(cipher), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(ciphertext: string, env: Env): Promise<string> {
  const key = await getEncryptionKey(env);
  const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(decrypted);
}

// ─── Token refresh helper ─────────────────────────────────────────────────

async function refreshToken(sessionId: string, env: Env): Promise<string | null> {
  try {
    const encryptedCred = await env.RM_KV.get(`cred:${sessionId}`);
    if (!encryptedCred) return null;

    const { clientId, clientSecret, env: clientEnv } = JSON.parse(await decrypt(encryptedCred, env));

    const base64 = btoa(`${clientId}:${clientSecret}`);
    const oauthUrl = clientEnv === "sandbox"
      ? "https://sb-oauth.revenuemonster.my/v1/token"
      : "https://oauth.revenuemonster.my/v1/token";

    const oauthRes = await fetch(oauthUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${base64}` },
      body: JSON.stringify({ grantType: "client_credentials" })
    });

    if (!oauthRes.ok) return null;

    const oauthData = await oauthRes.json() as { accessToken: string; expiresIn: number };
    const tokenData = JSON.stringify({ accessToken: oauthData.accessToken, expiresIn: oauthData.expiresIn });
    const encryptedToken = await encrypt(tokenData, env);
    await env.RM_KV.put(`token:${sessionId}`, encryptedToken, { expirationTtl: KV_TTL });

    return oauthData.accessToken;
  } catch {
    return null;
  }
}

// ─── Get valid access token (refresh if expired) ──────────────────────────

async function getValidToken(sessionId: string, env: Env): Promise<string | null> {
  try {
    const encryptedToken = await env.RM_KV.get(`token:${sessionId}`);
    if (!encryptedToken) return await refreshToken(sessionId, env);

    const tokenData = JSON.parse(await decrypt(encryptedToken, env));
    const expiresAt = tokenData.storedAt + tokenData.expiresIn * 1000;
    const isExpired = Date.now() > expiresAt;

    if (isExpired) return await refreshToken(sessionId, env);
    return tokenData.accessToken;
  } catch {
    return await refreshToken(sessionId, env);
  }
}

// ─── RSA signing helpers ──────────────────────────────────────────────────

function derLen(n: number): number[] {
  if (n < 0x80) return [n];
  if (n < 0x100) return [0x81, n];
  return [0x82, (n >> 8) & 0xff, n & 0xff];
}

function sortObject(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).sort().reduce((acc: any, key) => {
      acc[key] = sortObject(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

async function importPrivateKeyWorker(pem: string): Promise<CryptoKey> {
  const isPkcs1 = pem.includes("BEGIN RSA PRIVATE KEY");
  const cleaned = pem
    .replace(/-----BEGIN[^-]*-----/, "")
    .replace(/-----END[^-]*-----/, "")
    .replace(/\s/g, "");
  // Fix: use atob() to properly decode base64, not charCodeAt on raw string
  const pkcs1 = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));
  let der: Uint8Array;
  if (isPkcs1) {
    const algoId = new Uint8Array([
      0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00,
    ]);
    const octetString = new Uint8Array([0x04, ...derLen(pkcs1.length), ...pkcs1]);
    const version = new Uint8Array([0x02, 0x01, 0x00]);
    const inner = new Uint8Array([...version, ...algoId, ...octetString]);
    der = new Uint8Array([0x30, ...derLen(inner.length), ...inner]);
  } else {
    der = pkcs1;
  }
  return crypto.subtle.importKey(
    "pkcs8",
    der.buffer as ArrayBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") || "*"
    const corsHeaders = buildCorsHeaders(origin)

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    if (request.method === "GET") {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders
      })
    }

    const urlObj = new URL(request.url)

    // ── Auth endpoints ──────────────────────────────────────────────────

    if (urlObj.pathname === "/auth/login") {

      // ── Rate limiting ──
      if (env.RM_RATE_LIMIT) {
        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        const rateLimitKey = `login:${ip}`;
        const attempts = parseInt(await env.RM_KV.get(rateLimitKey) || "0");
        if (attempts >= 10) {
          return new Response(JSON.stringify({ error: "Too many attempts. Try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        await env.RM_KV.put(rateLimitKey, (attempts + 1).toString(), { expirationTtl: 300 }); // reset after 5 min
      }

      try {
        const body = await request.json() as any;
        const { clientId, clientSecret, privateKey } = body;
        const clientEnv = body.env;

        if (!clientId || !clientSecret || !privateKey) {
          return new Response(JSON.stringify({ error: "Missing credentials" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const sessionId = generateSessionId();
        const credJson = JSON.stringify({ clientId, clientSecret, privateKey, env: clientEnv || "sandbox" });
        const encryptedCred = await encrypt(credJson, env);

        // ── KV TTL applied ──
        await env.RM_KV.put(`cred:${sessionId}`, encryptedCred, { expirationTtl: KV_TTL });

        const base64 = btoa(`${clientId}:${clientSecret}`);
        const oauthUrl = clientEnv === "sandbox"
          ? "https://sb-oauth.revenuemonster.my/v1/token"
          : "https://oauth.revenuemonster.my/v1/token";

        const oauthRes = await fetch(oauthUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Basic ${base64}` },
          body: JSON.stringify({ grantType: "client_credentials" })
        });

        if (!oauthRes.ok) {
          await env.RM_KV.delete(`cred:${sessionId}`);
          return new Response(JSON.stringify({ error: "OAuth failed" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const oauthData = await oauthRes.json() as { accessToken: string; expiresIn: number; tokenType?: string };
        const tokenData = JSON.stringify({
          accessToken: oauthData.accessToken,
          expiresIn: oauthData.expiresIn,
          storedAt: Date.now(), // store time so we can check expiry later
        });
        const encryptedToken = await encrypt(tokenData, env);

        // ── KV TTL applied ──
        await env.RM_KV.put(`token:${sessionId}`, encryptedToken, { expirationTtl: KV_TTL });

        const cookieParts = [
          `${SESSION_COOKIE}=${sessionId}`,
          "HttpOnly",
          "Max-Age=2591999",
          "Path=/",
          "Secure",
          "SameSite=None",
        ];

        return new Response(JSON.stringify({ success: true, expiresIn: oauthData.expiresIn }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Set-Cookie": cookieParts.join("; "),
          }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err?.message || "Login failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    if (urlObj.pathname === "/auth/logout") {
      const cookieHeader = request.headers.get("Cookie");
      const sessionId = getCookieValue(cookieHeader, SESSION_COOKIE);

      if (sessionId) {
        await env.RM_KV.delete(`cred:${sessionId}`);
        await env.RM_KV.delete(`token:${sessionId}`);
      }

      const cookieParts = [
        `${SESSION_COOKIE}=`,
        "HttpOnly",
        "Max-Age=0",
        "Path=/",
        "Secure",
        "SameSite=None",
      ];
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Set-Cookie": cookieParts.join("; "),
        }
      });
    }

    if (urlObj.pathname === "/auth/status") {
      const cookieHeader = request.headers.get("Cookie");
      const sessionId = getCookieValue(cookieHeader, SESSION_COOKIE);

      if (!sessionId) {
        return new Response(JSON.stringify({ authenticated: false }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        const encryptedToken = await env.RM_KV.get(`token:${sessionId}`);
        if (!encryptedToken) {
          return new Response(JSON.stringify({ authenticated: false }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        const tokenData = JSON.parse(await decrypt(encryptedToken, env));

        // Auto-refresh if expired
        const expiresAt = tokenData.storedAt + tokenData.expiresIn * 1000;
        const isExpired = Date.now() > expiresAt;
        const effectiveExpiresIn = isExpired
          ? await refreshToken(sessionId, env).then(() => tokenData.expiresIn)
          : Math.floor((expiresAt - Date.now()) / 1000);

        return new Response(JSON.stringify({
          authenticated: true,
          expiresIn: effectiveExpiresIn,
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch {
        return new Response(JSON.stringify({ authenticated: false }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    if (urlObj.pathname === "/auth/sign") {
      const cookieHeader = request.headers.get("Cookie");
      const sessionId = getCookieValue(cookieHeader, SESSION_COOKIE);

      if (!sessionId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        const encryptedCred = await env.RM_KV.get(`cred:${sessionId}`);
        if (!encryptedCred) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const { privateKey } = JSON.parse(await decrypt(encryptedCred, env)) as { clientId: string; clientSecret: string; privateKey: string; env: string };

        const { method, url, body } = await request.json() as { method: string; url: string; body?: any };

        if (!method || !url) {
          return new Response(JSON.stringify({ error: "Missing method or url" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const nonce = (crypto.randomUUID as () => string)().replace(/-/g, "");
        const timestamp = Math.floor(Date.now() / 1000).toString();

        let base64Data = "";
        if (body && typeof body === "object" && Object.keys(body).length > 0) {
          const sortedBody = sortObject(body);
          base64Data = btoa(JSON.stringify(sortedBody));
        }

        const dataParam = base64Data ? `data=${base64Data}&` : "";
        const plaintext = `${dataParam}method=${method.toLowerCase()}&nonceStr=${nonce}&requestUrl=${url}&signType=sha256&timestamp=${timestamp}`;

        const cryptoKey = await importPrivateKeyWorker(privateKey);
        const signature = await crypto.subtle.sign(
          { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
          cryptoKey,
          new TextEncoder().encode(plaintext)
        );

        const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

        return new Response(JSON.stringify({
          signature: `sha256 ${signatureBase64}`,
          nonceStr: nonce,
          timestamp
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (err: any) {
        return new Response(JSON.stringify({ error: err?.message || "Signing failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ── Proxy endpoint ──────────────────────────────────────────────────

    try {
      const { method, body, url, headers } =
        await request.json() as PlaygroundRequest

      if (!url || !method) {
        return new Response(
          JSON.stringify({ error: "Missing url or method" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        )
      }

      const parsedUrl = new URL(url)
      if (!allowedHosts.includes(parsedUrl.hostname)) {
        return new Response(
          JSON.stringify({ error: "Host not allowed" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        )
      }

      const finalHeaders: Record<string, string> = { ...headers }
      const cookieHeader = request.headers.get("Cookie")
      const sessionId = getCookieValue(cookieHeader, SESSION_COOKIE);

      // Inject token — auto-refresh if expired
      if (sessionId && !isOAuthEndpoint(url)) {
        const accessToken = await getValidToken(sessionId, env);
        if (accessToken && !finalHeaders["Authorization"]) {
          finalHeaders["Authorization"] = `Bearer ${accessToken}`;
        }
      }

      // Legacy cookie fallback
      const tokenFromCookie = getCookieValue(cookieHeader, TOKEN_COOKIE)
      if (tokenFromCookie && !isOAuthEndpoint(url)) {
        if (!finalHeaders["Authorization"]) {
          finalHeaders["Authorization"] = `Bearer ${tokenFromCookie}`
        }
      }

      const requestBody =
        body && typeof body !== "string"
          ? JSON.stringify(body)
          : body

      const response = await fetch(url, {
        method,
        headers: finalHeaders,
        body: requestBody
      })

      const responseText = await response.text()

      if (isOAuthEndpoint(url) && response.ok) {
        try {
          const parsed = JSON.parse(responseText)
          const token = parsed?.accessToken
          const expiresIn = parsed?.expiresIn ?? 2591999

          if (token) {
            const cookieParts = [
              `${TOKEN_COOKIE}=${token}`,
              "HttpOnly",
              `Max-Age=${expiresIn}`,
              "Path=/",
              "Secure",
              "SameSite=None",
            ]

            const sid = getCookieValue(cookieHeader, SESSION_COOKIE);
            if (sid) {
              const tokenData = JSON.stringify({ accessToken: token, expiresIn, storedAt: Date.now() });
              const encryptedToken = await encrypt(tokenData, env);
              await env.RM_KV.put(`token:${sid}`, encryptedToken, { expirationTtl: KV_TTL });
            }

            return new Response(
              JSON.stringify({
                success: true,
                tokenType: parsed.tokenType,
                expiresIn: parsed.expiresIn,
              }),
              {
                status: 200,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                  "Set-Cookie": cookieParts.join("; "),
                }
              }
            )
          }
        } catch {
          // parsing failed, fall through
        }
      }

      return new Response(responseText, {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type":
            response.headers.get("Content-Type") || "application/json"
        }
      })

    } catch (err: any) {
      return new Response(
        JSON.stringify({
          error: "Worker crashed",
          message: err?.message || "Unknown error"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }
  }
}