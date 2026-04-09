interface PlaygroundRequest {
  method: string
  body?: any
  url: string
  headers?: Record<string, string>
}

interface Env {
  ENCRYPTION_KEY: string;
  RM_KV: KVNamespace;
}

const allowedHosts = [
  "sb-open.revenuemonster.my",
  "sb-oauth.revenuemonster.my"
]

const TOKEN_COOKIE = "rm_api_token"
const SESSION_COOKIE = "rm_session_id"
const SESSION_LENGTH = 64
const OAUTH_PATHS = ["/v1/token"]
const KV_TTL = 2592000

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
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Signature, X-Nonce-Str, X-Timestamp, X-Session-Id",
    "Access-Control-Allow-Credentials": "true",
  }
}

function buildCookieParts(name: string, value: string, maxAge: number, isLocalhost: boolean): string {
  const parts = [
    `${name}=${value}`,
    "HttpOnly",
    `Max-Age=${maxAge}`,
    "Path=/",
    ...(isLocalhost ? [] : ["Secure"]),
    isLocalhost ? "SameSite=Lax" : "SameSite=None",
  ]
  return parts.join("; ")
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

function getSessionId(request: Request): string | null {
  const fromCookie = getCookieValue(request.headers.get("Cookie"), SESSION_COOKIE);
  if (fromCookie) return fromCookie;
  return request.headers.get("X-Session-Id");
}

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
    const tokenData = JSON.stringify({ accessToken: oauthData.accessToken, expiresIn: oauthData.expiresIn, storedAt: Date.now() });
    const encryptedToken = await encrypt(tokenData, env);
    await env.RM_KV.put(`token:${sessionId}`, encryptedToken, { expirationTtl: KV_TTL });
    return oauthData.accessToken;
  } catch {
    return null;
  }
}

async function getValidToken(sessionId: string, env: Env): Promise<string | null> {
  try {
    const encryptedToken = await env.RM_KV.get(`token:${sessionId}`);
    if (!encryptedToken) return await refreshToken(sessionId, env);
    const tokenData = JSON.parse(await decrypt(encryptedToken, env));
    const expiresAt = tokenData.storedAt + tokenData.expiresIn * 1000;
    if (Date.now() > expiresAt) return await refreshToken(sessionId, env);
    return tokenData.accessToken;
  } catch {
    return await refreshToken(sessionId, env);
  }
}

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
  const pkcs1 = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));
  let der: Uint8Array;
  if (isPkcs1) {
    const algoId = new Uint8Array([48, 13, 6, 9, 42, 134, 72, 134, 247, 13, 1, 1, 1, 5, 0]);
    const octetString = new Uint8Array([4, ...derLen(pkcs1.length), ...pkcs1]);
    const version = new Uint8Array([2, 1, 0]);
    const inner = new Uint8Array([...version, ...algoId, ...octetString]);
    der = new Uint8Array([48, ...derLen(inner.length), ...inner]);
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
    const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1")
    const urlObj = new URL(request.url)

    // ── CORS preflight ───────────────────────────────────────────────────
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    // ── Health check ─────────────────────────────────────────────────────
    if (request.method === "GET" && (urlObj.pathname === "/" || urlObj.pathname === "")) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // ── /auth/status (GET) ───────────────────────────────────────────────
    if (request.method === "GET" && urlObj.pathname === "/auth/status") {
      const sessionId = getSessionId(request);
      if (!sessionId) {
        return new Response(JSON.stringify({ authenticated: false }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      try {
        const encryptedCred = await env.RM_KV.get(`cred:${sessionId}`);
        if (!encryptedCred) {
          return new Response(JSON.stringify({ authenticated: false }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        const accessToken = await getValidToken(sessionId, env);
        if (!accessToken) {
          return new Response(JSON.stringify({ authenticated: false }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        return new Response(JSON.stringify({ authenticated: true, expiresIn: 3600 }), {
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

    // ── Block non-POST beyond this point ─────────────────────────────────
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders })
    }

    // ── /auth/login ──────────────────────────────────────────────────────
    if (urlObj.pathname === "/auth/login") {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const rateLimitKey = `ratelimit:${ip}`;
      const attempts = parseInt(await env.RM_KV.get(rateLimitKey) || "0");
      if (attempts >= 10) {
        return new Response(JSON.stringify({ error: "Too many attempts. Try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      await env.RM_KV.put(rateLimitKey, (attempts + 1).toString(), { expirationTtl: 300 });

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
        const tokenData = JSON.stringify({ accessToken: oauthData.accessToken, expiresIn: oauthData.expiresIn, storedAt: Date.now() });
        const encryptedToken = await encrypt(tokenData, env);
        await env.RM_KV.put(`token:${sessionId}`, encryptedToken, { expirationTtl: KV_TTL });

        return new Response(JSON.stringify({ success: true, expiresIn: oauthData.expiresIn, sessionId }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Set-Cookie": buildCookieParts(SESSION_COOKIE, sessionId, 2591999, isLocalhost),
          }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err?.message || "Login failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ── /auth/logout ─────────────────────────────────────────────────────
    if (urlObj.pathname === "/auth/logout") {
      const sessionId = getSessionId(request);
      if (sessionId) {
        await env.RM_KV.delete(`cred:${sessionId}`);
        await env.RM_KV.delete(`token:${sessionId}`);
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Set-Cookie": buildCookieParts(SESSION_COOKIE, "", 0, isLocalhost),
        }
      });
    }

    // ── /auth/sign ───────────────────────────────────────────────────────
    if (urlObj.pathname === "/auth/sign") {
      const sessionId = getSessionId(request);
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
        const { privateKey } = JSON.parse(await decrypt(encryptedCred, env));
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
          base64Data = btoa(JSON.stringify(sortObject(body)));
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
        return new Response(JSON.stringify({ signature: `sha256 ${signatureBase64}`, nonceStr: nonce, timestamp }), {
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

    // ── Proxy ────────────────────────────────────────────────────────────
    try {
      const { method, body, url, headers } = await request.json() as PlaygroundRequest
      if (!url || !method) {
        return new Response(JSON.stringify({ error: "Missing url or method" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }
      const parsedUrl = new URL(url)
      if (!allowedHosts.includes(parsedUrl.hostname)) {
        return new Response(JSON.stringify({ error: "Host not allowed" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      const finalHeaders: Record<string, string> = { ...headers }
      const sessionId = getSessionId(request);

      // For OAuth endpoints, inject Basic auth from stored credentials
      if (isOAuthEndpoint(url) && sessionId) {
        try {
          const encryptedCred = await env.RM_KV.get(`cred:${sessionId}`);
          if (encryptedCred) {
            const { clientId, clientSecret } = JSON.parse(await decrypt(encryptedCred, env));
            finalHeaders["Authorization"] = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
          }
        } catch { }
      }

      // For non-OAuth endpoints, inject Bearer token from KV
      if (!isOAuthEndpoint(url) && sessionId) {
        const accessToken = await getValidToken(sessionId, env);
        if (accessToken && !finalHeaders["Authorization"]) {
          finalHeaders["Authorization"] = `Bearer ${accessToken}`;
        }
      }

      // Legacy cookie fallback
      const tokenFromCookie = getCookieValue(request.headers.get("Cookie"), TOKEN_COOKIE)
      if (tokenFromCookie && !isOAuthEndpoint(url) && !finalHeaders["Authorization"]) {
        finalHeaders["Authorization"] = `Bearer ${tokenFromCookie}`
      }

      const requestBody = body && typeof body !== "string" ? JSON.stringify(body) : body
      const response = await fetch(url, { method, headers: finalHeaders, body: requestBody })
      const responseText = await response.text()

      // Intercept OAuth response to store new token in KV
      if (isOAuthEndpoint(url) && response.ok) {
        try {
          const parsed = JSON.parse(responseText)
          const token = parsed?.accessToken
          const expiresIn = parsed?.expiresIn ?? 2591999
          if (token && sessionId) {
            const tokenData = JSON.stringify({ accessToken: token, expiresIn, storedAt: Date.now() });
            const encryptedToken = await encrypt(tokenData, env);
            await env.RM_KV.put(`token:${sessionId}`, encryptedToken, { expirationTtl: KV_TTL });
          }
          return new Response(
            JSON.stringify({ success: true, tokenType: parsed.tokenType, expiresIn }),
            {
              status: 200,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "Set-Cookie": buildCookieParts(TOKEN_COOKIE, token, expiresIn, isLocalhost),
              }
            }
          )
        } catch { }
      }

      return new Response(responseText, {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": response.headers.get("Content-Type") || "application/json" }
      })
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: "Worker crashed", message: err?.message || "Unknown error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
  }
}