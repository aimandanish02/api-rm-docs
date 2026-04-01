import React, { useState, useEffect } from "react";
import { setTokenExpiry, clearTokenExpiry } from "../../utils/auth";
import { setPrivateKey, clearPrivateKey } from "../../utils/privateKey";
import styles from "./styles.module.css";

const PROXY = "https://rm-api-proxy.aiman-danish.workers.dev";

const SANDBOX_DEFAULTS = {
  clientId: "",
  clientSecret: "",
  privateKey: "",
};

type Step = "form" | "loading" | "success" | "error";

export default function AuthModal() {
  const [open, setOpen] = useState(false);
  const [env, setEnv] = useState<"sandbox" | "live">("sandbox");
  const [clientId, setClientId] = useState(SANDBOX_DEFAULTS.clientId);
  const [clientSecret, setClientSecret] = useState(SANDBOX_DEFAULTS.clientSecret);
  const [privateKey, setPrivateKeyInput] = useState(SANDBOX_DEFAULTS.privateKey);
  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("rm-open-auth", handler);
    return () => window.removeEventListener("rm-open-auth", handler);
  }, []);

  const handleEnvSwitch = (next: "sandbox" | "live") => {
    setEnv(next);
    if (next === "sandbox") {
      setClientId(SANDBOX_DEFAULTS.clientId);
      setClientSecret(SANDBOX_DEFAULTS.clientSecret);
      setPrivateKeyInput(SANDBOX_DEFAULTS.privateKey);
    } else {
      setClientId("");
      setClientSecret("");
      setPrivateKeyInput("");
    }
    setStep("form");
    setErrorMsg("");
  };

  const handleConnect = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setErrorMsg("Client ID and Client Secret are required.");
      return;
    }

    setStep("loading");
    setErrorMsg("");

    try {
      const base64 = btoa(`${clientId.trim()}:${clientSecret.trim()}`);
      const baseUrl =
        env === "sandbox"
          ? "https://sb-oauth.revenuemonster.my/v1/token"
          : "https://oauth.revenuemonster.my/v1/token";

const res = await fetch(PROXY, {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: baseUrl,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${base64}`,
    },
    body: { grantType: "client_credentials" },
  }),
});

      const data = await res.json();

      if (!res.ok || !data.success) {
const rawError = data?.error || data?.message;
const errorText = typeof rawError === "string"
  ? rawError
  : typeof rawError === "object" && rawError !== null
  ? (rawError.message || JSON.stringify(rawError))
  : "Authentication failed. Check your credentials.";
setErrorMsg(errorText);        setStep("error");
        return;
      }

      // Store expiry metadata in sessionStorage
      setTokenExpiry(data.expiresIn);

      // Store private key in memory only
      if (privateKey.trim()) {
        setPrivateKey(privateKey.trim());
      }

      setStep("success");

      // Notify all playgrounds to re-check token status
      window.dispatchEvent(new CustomEvent("rm-auth-changed"));

    } catch (err: any) {
      setErrorMsg(err?.message || "Network error. Try again.");
      setStep("error");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${PROXY}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // best effort
    }
    clearTokenExpiry();
    clearPrivateKey();
    setStep("form");
    setClientId(env === "sandbox" ? SANDBOX_DEFAULTS.clientId : "");
    setClientSecret(env === "sandbox" ? SANDBOX_DEFAULTS.clientSecret : "");
    setPrivateKeyInput(env === "sandbox" ? SANDBOX_DEFAULTS.privateKey : "");
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

        {/* Env switch */}
        <div className={styles.envSwitch}>
          <button
            className={`${styles.envBtn} ${env === "sandbox" ? styles.envActive : ""}`}
            onClick={() => handleEnvSwitch("sandbox")}
          >
            Sandbox
          </button>
          <button
            className={`${styles.envBtn} ${env === "live" ? styles.envActive : ""}`}
            onClick={() => handleEnvSwitch("live")}
          >
            Live
          </button>
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
            {env === "sandbox" && (
              <div className={styles.hint}>
                Sandbox mode — enter your sandbox credentials below.
              </div>
            )}

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