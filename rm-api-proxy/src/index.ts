interface PlaygroundRequest {
  method: string
  body?: any
  url: string
  headers?: Record<string, string>
}

// ENCRYPTION_KEY is bound as a Cloudflare secret — available as a global at runtime
declare const ENCRYPTION_KEY: string;

// KV namespace binding
declare const RM_KV: KVNamespace;

const allowedHosts = [
  "sb-open.revenuemonster.my",
  "sb-oauth.revenuemonster.my"
]

const TOKEN_COOKIE = "rm_api_token"
const SESSION_COOKIE = "rm_session_id"
const SESSION_LENGTH = 64 // bytes for session ID
const OAUTH_PATHS = ["/v1/token"]

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

async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = ENCRYPTION_KEY;
  const rawKey = Uint8Array.from(secret.slice(0, 32), (c) => c.charCodeAt(0));
  if (secret.length < 32) {
    const padded = new Uint8Array(32);
    padded.set(rawKey);
    return crypto.subtle.importKey("raw", padded.buffer, "AES-GCM", false, ["encrypt", "decrypt"]);
  }
  return crypto.subtle.importKey("raw", rawKey.buffer, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(cipher), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(ciphertext: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(decrypted);
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
  const pkcs1 = Uint8Array.from(cleaned, (c) => c.charCodeAt(0));
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
  async fetch(request: Request): Promise<Response> {
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
      try {
        const { clientId, clientSecret, privateKey, env } = await request.json() as any;

        if (!clientId || !clientSecret || !privateKey) {
          return new Response(JSON.stringify({ error: "Missing credentials" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const sessionId = generateSessionId();
        const credJson = JSON.stringify({ clientId, clientSecret, privateKey, env: env || "sandbox" });
        const encryptedCred = await encrypt(credJson);
        await RM_KV.put(`cred:${sessionId}`, encryptedCred);

        const base64 = btoa(`${clientId}:${clientSecret}`);
        const oauthUrl = env === "sandbox"
          ? "https://sb-oauth.revenuemonster.my/v1/token"
          : "https://oauth.revenuemonster.my/v1/token";

        const oauthRes = await fetch(oauthUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Basic ${base64}` },
          body: JSON.stringify({ grantType: "client_credentials" })
        });

        if (!oauthRes.ok) {
          await RM_KV.delete(`cred:${sessionId}`);
          return new Response(JSON.stringify({ error: "OAuth failed" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const oauthData = await oauthRes.json() as { accessToken: string; expiresIn: number; tokenType?: string };
        const tokenData = JSON.stringify({ accessToken: oauthData.accessToken, expiresIn: oauthData.expiresIn });
        const encryptedToken = await encrypt(tokenData);
        await RM_KV.put(`token:${sessionId}`, encryptedToken);

        const cookieParts = [
          `${SESSION_COOKIE}=${sessionId}`,
          "HttpOnly",
          "Max-Age=2591999",
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
        await RM_KV.delete(`cred:${sessionId}`);
        await RM_KV.delete(`token:${sessionId}`);
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
        const encryptedToken = await RM_KV.get(`token:${sessionId}`);
        if (!encryptedToken) {
          return new Response(JSON.stringify({ authenticated: false }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        const tokenData = JSON.parse(await decrypt(encryptedToken));
        return new Response(JSON.stringify({
          authenticated: true,
          expiresIn: tokenData.expiresIn
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
        const encryptedCred = await RM_KV.get(`cred:${sessionId}`);
        if (!encryptedCred) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const { privateKey } = JSON.parse(await decrypt(encryptedCred)) as { clientId: string; clientSecret: string; privateKey: string; env: string };

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

      const urlObj = new URL(url)
      if (!allowedHosts.includes(urlObj.hostname)) {
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

      // Inject token from KV via session cookie
      const sessionId = getCookieValue(cookieHeader, SESSION_COOKIE);
      if (sessionId && !isOAuthEndpoint(url)) {
        try {
          const encryptedToken = await RM_KV.get(`token:${sessionId}`);
          if (encryptedToken) {
            const tokenData = JSON.parse(await decrypt(encryptedToken));
            if (tokenData.accessToken && !finalHeaders["Authorization"]) {
              finalHeaders["Authorization"] = `Bearer ${tokenData.accessToken}`;
            }
          }
        } catch {
          // session invalid, fall through
        }
      }

      // Also check legacy TOKEN_COOKIE for backwards compatibility
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

      // Intercept OAuth token endpoint — set cookie, hide raw token
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

            const cookie = cookieParts.join("; ")

            const sid = getCookieValue(cookieHeader, SESSION_COOKIE);
            if (sid) {
              const tokenData = JSON.stringify({ accessToken: token, expiresIn });
              const encryptedToken = await encrypt(tokenData);
              await RM_KV.put(`token:${sid}`, encryptedToken);
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
                  "Set-Cookie": cookie,
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