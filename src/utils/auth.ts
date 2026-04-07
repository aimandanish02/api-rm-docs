const WORKER_BASE = "https://rm-api-proxy.aiman-danish.workers.dev";

function isBrowser() {
  return typeof window !== "undefined"
}

const EXPIRY_KEY = "rm_token_expiry"

export function setTokenExpiry(expiresInSeconds: number) {
  if (!isBrowser()) return
  const expiresAt = Date.now() + expiresInSeconds * 1000
  localStorage.setItem(EXPIRY_KEY, expiresAt.toString())
}

export function getTokenExpiry(): number | null {
  if (!isBrowser()) return null
  const raw = localStorage.getItem(EXPIRY_KEY)
  return raw ? parseInt(raw, 10) : null
}

export function tokenSecondsRemaining(): number | null {
  const expiry = getTokenExpiry()
  if (expiry === null) return null
  return Math.floor((expiry - Date.now()) / 1000)
}

export function isTokenExpired(): boolean {
  const secs = tokenSecondsRemaining()
  if (secs === null) return false
  return secs <= 0
}

export function tokenExpiryLabel(): string | null {
  const secs = tokenSecondsRemaining()
  if (secs === null) return null
  if (secs <= 0) return "expired"
  if (secs < 3600) return `${Math.floor(secs / 60)} min`
  if (secs < 86400) return `${Math.floor(secs / 3600)} hr`
  return `${Math.floor(secs / 86400)} days`
}

export function deriveTokenStatus(): "missing" | "expired" | "active" {
  const expiry = getTokenExpiry()
  if (expiry === null) return "missing"
  if (isTokenExpired()) return "expired"
  return "active"
}

export function clearTokenExpiry() {
  if (!isBrowser()) return
  localStorage.removeItem(EXPIRY_KEY)
}

// Sync frontend state with worker session on page load
export async function syncAuthStatus(
  onActive: (expiresIn: number) => void,
  onInactive: () => void
) {
  if (!isBrowser()) return
  try {
    const res = await fetch(`${WORKER_BASE}/auth/status`, {
      method: "GET",
      credentials: "include",
    })
    const data = await res.json()
    if (data.authenticated && typeof data.expiresIn === "number") {
      setTokenExpiry(data.expiresIn)
      onActive(data.expiresIn)
    } else {
      clearTokenExpiry()
      onInactive()
    }
  } catch {
    // network error — leave state as-is
  }
}