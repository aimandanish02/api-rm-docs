import React, { useState } from "react";
import styles from "./styles.module.css";

type Props = {
  loaded: boolean;
  onLoad: (key: string) => void;
  onClear: () => void;
};

const openModal = () => window.dispatchEvent(new CustomEvent("rm-open-auth"));

export default function PrivateKeyBanner({ loaded, onLoad, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  if (loaded) {
    return (
      <div className={`${styles.banner} ${styles.bannerInfo}`}>
        <span className={styles.bannerDot} />
        <span>Private key loaded · session only (cleared on refresh)</span>
        <button className={styles.bannerAction} onClick={onClear}>
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className={styles.keyPromptWrapper}>
      <div className={`${styles.banner} ${styles.bannerNeutral}`}>
        <span className={styles.bannerDot} />
        <span>Private key required</span>
        <button className={styles.bannerAction} onClick={openModal}>
          Connect ↗
        </button>
        <button
          className={styles.bannerAction}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Cancel" : "Paste manually ↓"}
        </button>
      </div>

      {open && (
        <div className={styles.keyPromptBody}>
          <label className={styles.label}>
            Private Key{" "}
            <span className={styles.labelHint}>(stays in memory only)</span>
          </label>
          <textarea
            className={`${styles.textarea} ${styles.keyTextarea}`}
            placeholder={
              "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
            }
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            className={styles.keySubmit}
            disabled={!draft.trim()}
            onClick={() => {
              onLoad(draft.trim());
              setOpen(false);
              setDraft("");
            }}
          >
            Load key for this session
          </button>
        </div>
      )}
    </div>
  );
}