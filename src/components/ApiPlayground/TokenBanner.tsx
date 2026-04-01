import React, { useEffect, useState } from "react";
import { tokenExpiryLabel, deriveTokenStatus } from "../../utils/auth";
import styles from "./styles.module.css";

export type TokenStatus = "missing" | "expired" | "active";

type Props = {
  status: TokenStatus;
  env: "sandbox" | "prod";
  onClear: () => void;
};

const openModal = () => window.dispatchEvent(new CustomEvent("rm-open-auth"));

export default function TokenBanner({ status, env, onClear }: Props) {
  const [currentStatus, setCurrentStatus] = useState<TokenStatus>(status);
  const isProd = env === "prod";

  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  useEffect(() => {
    const sync = () => setCurrentStatus(deriveTokenStatus());
    window.addEventListener("rm-auth-changed", sync);
    return () => window.removeEventListener("rm-auth-changed", sync);
  }, []);

  const ProdWarning = () => (
    <div className={`${styles.banner} ${styles.bannerError}`}>
      <span className={styles.bannerDot} />
      <span>
        <strong>Production mode</strong> — you are making real API calls.
        Token is session-only and will be cleared when you close this tab.
      </span>
    </div>
  );

  if (currentStatus === "active") {
    const label = tokenExpiryLabel();
    return (
      <>
        {isProd && <ProdWarning />}
        <div className={`${styles.banner} ${styles.bannerSuccess}`}>
          <span className={styles.bannerDot} />
          <span>
            Access token active{label ? ` · expires in ${label}` : ""}
          </span>
          <button className={styles.bannerAction} onClick={onClear}>
            Clear
          </button>
        </div>
      </>
    );
  }

  if (currentStatus === "expired") {
    return (
      <>
        {isProd && <ProdWarning />}
        <div className={`${styles.banner} ${styles.bannerError}`}>
          <span className={styles.bannerDot} />
          <span>
            Access token <strong>expired</strong>
          </span>
          <button className={styles.bannerAction} onClick={openModal}>
            Reconnect ↗
          </button>
          <button className={styles.bannerAction} onClick={onClear}>
            Clear
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {isProd && <ProdWarning />}
      <div className={`${styles.banner} ${styles.bannerWarning}`}>
        <span className={styles.bannerDot} />
        <span>No access token</span>
        <button className={styles.bannerAction} onClick={openModal}>
          Connect ↗
        </button>
      </div>
    </>
  );
}