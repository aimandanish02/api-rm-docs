import React, { useState, useEffect } from "react";
import { setTokenExpiry, clearTokenExpiry } from "../../utils/auth";
import { setPrivateKey, clearPrivateKey } from "../../utils/privateKey";
import styles from "./styles.module.css";

const WORKER_BASE = "https://rm-api-proxy.aiman-danish.workers.dev";

type Step = "form" | "loading" | "success" | "error";

export default function AuthModal() {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [privateKey, setPrivateKeyInput] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("rm-open-auth", handler);
    return () => window.removeEventListener("rm-open-auth", handler);
  }, []);

  const handleConnect = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setErrorMsg("Client ID and Client Secret are required.");
      return;
    }

    setStep("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`${WORKER_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
          privateKey: privateKey.trim() || undefined,
          env: "sandbox",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const rawError = data?.error || data?.message;
        const errorText =
          typeof rawError === "string"
            ? rawError
            : typeof rawError === "object" && rawError !== null
            ? rawError.message || JSON.stringify(rawError)
            : "Authentication failed. Check your credentials.";
        setErrorMsg(errorText);
        setStep("error");
        return;
      }

      setTokenExpiry(data.expiresIn);

      if (privateKey.trim()) {
        setPrivateKey(privateKey.trim());
      }

      setStep("success");

      window.dispatchEvent(new CustomEvent("rm-auth-changed"));
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error. Try again.");
      setStep("error");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${WORKER_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // best effort
    }
    clearTokenExpiry();
    clearPrivateKey();
    setStep("form");
    setClientId("");
    setClientSecret("");
    setPrivateKeyInput("");
    window.dispatchEvent(new CustomEvent("rm-auth-changed"));
  };

  const handleClose = () => {
    setOpen(false);
    setStep("form");
    setErrorMsg("");
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <p className={styles.title}>Connect your account</p>
            <p className={styles.subtitle}>Credentials stay in your browser only</p>
          </div>
          <button className={styles.closeBtn} onClick={handleClose}>✕</button>
        </div>

        {step === "success" ? (
          <div className={styles.successBlock}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.successTitle}>Connected</p>
            <p className={styles.successDesc}>
              Access token stored. All API playgrounds on this page will use it automatically.
            </p>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Sign out &amp; clear session
            </button>
            <button className={styles.doneBtn} onClick={handleClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Login with Dashboard */}
            <a
              href="https://sb-oauth.revenuemonster.my/login?redirectUri=https://sb-merchant.revenuemonster.my/developer/applications"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.dashboardBtn}
            >
              Login with Dashboard
            </a>

            <p className={styles.dividerLabel}>or paste your credentials below</p>

            {step === "error" && (
              <div className={styles.errorBanner}>{errorMsg}</div>
            )}

            <div className={styles.fields}>
              <div className={styles.field}>
                <label className={styles.label}>Client ID</label>
                <input
                  className={styles.input}
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter your client ID"
                  autoComplete="off"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Client secret</label>
                <input
                  className={styles.input}
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter your client secret"
                  autoComplete="off"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Private key
                  <span className={styles.labelBadge}>stays in memory only</span>
                </label>
                <textarea
                  className={styles.textarea}
                  value={privateKey}
                  onChange={(e) => setPrivateKeyInput(e.target.value)}
                  placeholder={"-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"}
                  rows={4}
                />
              </div>
            </div>

            <button
              className={styles.connectBtn}
              onClick={handleConnect}
              disabled={step === "loading"}
            >
              {step === "loading" ? "Connecting…" : "Connect"}
            </button>

            <p className={styles.sessionNote}>
              Session only — everything is cleared when you close this tab
            </p>
          </>
        )}
      </div>
    </div>
  );
}
