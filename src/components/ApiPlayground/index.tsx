import React, { useState } from "react";
import { lookupError, extractErrorCodes } from "../../utils/errorCodes";
import TokenBanner from "./TokenBanner";
import PrivateKeyBanner from "./PrivateKeyBanner";
import { SharedState } from "./UseApiSharedState";
import styles from "./styles.module.css";

const highlightJson = (json: string) =>
  json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")\s*:/g,
      `<span class="${styles.jsonKey}">$1</span>:`
    )
    .replace(
      /:\s*("(\\u[a-zA-Z0-9]{4}|\\[^\\"])*")/g,
      `: <span class="${styles.jsonValue}">$1</span>`
    )
    .replace(
      /:\s*(\d+|true|false|null)/g,
      `: <span class="${styles.jsonValue}">$1</span>`
    );

type Props = {
  shared: SharedState;
};

export default function ApiPlayground({ shared }: Props) {
  const {
    baseUrl,
    params, setParams,
    tokenStatus, keyLoaded,
    handleClearToken, handleLoadKey, handleClearKey,
    headers, setHeaders, jsonBody, setJsonBody,
    requiresSignature, requiresAccessToken, notReady,
    method, send,
  } = shared;

  const [response, setResponse] = useState<any>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [missedSignature, setMissedSignature] = useState(false);

  const handleSend = async () => {
    try {
      setLoading(true);
      setResponse(null);
      setStatus(null);
      setMissedSignature(false);
      const result = await send();
      setResponse(result.response);
      setStatus(result.status);
      setMissedSignature(result.missedSignature);
    } catch (err: any) {
      alert("Request failed: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  if (!baseUrl) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={`${styles.method} ${styles[method.toLowerCase()]}`}>
          {method}
        </span>
        <span className={styles.url}>
          {baseUrl.split(/({[^}]+})/g).map((part, i) => {
            const match = part.match(/{([^}]+)}/);
            if (!match) return <span key={i}>{part}</span>;
            const key = match[1];
            return (
              <span
                key={i}
                contentEditable
                suppressContentEditableWarning
                className={styles.urlParam}
                onBlur={(e) =>
                  setParams({ ...params, [key]: e.currentTarget.innerText.trim() })
                }
              >
                {params[key] ?? key}
              </span>
            );
          })}
        </span>
      </div>

      {requiresAccessToken && (
        <TokenBanner status={tokenStatus} onClear={handleClearToken} />
      )}
      {requiresSignature && (
        <PrivateKeyBanner
          loaded={keyLoaded}
          onLoad={handleLoadKey}
          onClear={handleClearKey}
        />
      )}

      <div className={styles.blockHeader}>
        <label className={styles.label}>Headers</label>
      </div>
      <pre
        className={styles.editor}
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          try { setHeaders(JSON.parse(e.currentTarget.innerText)); } catch { }
        }}
        dangerouslySetInnerHTML={{
          __html: highlightJson(JSON.stringify(headers, null, 2)),
        }}
      />

      {method !== "GET" && (
        <>
          <div className={styles.blockHeader}>
            <label className={styles.label}>Body</label>
          </div>
          <pre
            className={styles.editor}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => setJsonBody(e.currentTarget.innerText)}
            dangerouslySetInnerHTML={{ __html: highlightJson(jsonBody) }}
          />
        </>
      )}

      <button
        className={`${styles.send} ${notReady ? styles.sendBlocked : ""}`}
        onClick={handleSend}
        disabled={loading}
        title={notReady ? "Resolve the warnings above before sending" : undefined}
      >
        {loading ? "Sending…" : "▶ Send Request"}
      </button>

      {missedSignature && (
        <div className={`${styles.banner} ${styles.bannerWarning}`} style={{ marginTop: 12 }}>
          <span className={styles.bannerDot} />
          <span>
            Request sent <strong>without a signature</strong> — the server will likely reject it.
            Paste your private key above and send again.
          </span>
        </div>
      )}

      {status !== null && (
        <div>
          <div className={styles.statusLine}>
            <span className={status >= 200 && status < 300 ? styles.statusOk : styles.statusErr}>
              {status}
            </span>
            {response?._error && (
              <span className={styles.statusHint}>{response._error}</span>
            )}
          </div>
          {!response?._error && (
            <pre className={styles.response}>
              {JSON.stringify(response, null, 2)}
            </pre>
          )}
          {status >= 300 && !response?._error && (() => {
            const codes = extractErrorCodes(response);
            if (codes.length === 0) return null;
            return (
              <div className={styles.errorLookup}>
                <div className={styles.errorLookupHeader}>
                  <span className={styles.errorLookupIcon}>⚑</span>
                  <span>Error Code Reference</span>
                </div>
                {codes.map((code) => {
                  const entry = lookupError(code);
                  return (
                    <div key={code} className={styles.errorLookupEntry}>
                      <div className={styles.errorLookupCode}>{code}</div>
                      {entry ? (
                        <>
                          <div className={styles.errorLookupDesc}>{entry.description}</div>
                          {entry.solution && (
                            <div className={styles.errorLookupSolution}>
                              <span className={styles.errorLookupSolutionLabel}>💡 Fix</span>
                              {entry.solution}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className={styles.errorLookupDesc}>
                          No description found.{" "}
                          <a href="/docs/error-codes" className={styles.errorLookupLink}>
                            View all error codes →
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className={styles.errorLookupFooter}>
                  <a href="/docs/error-codes" className={styles.errorLookupLink}>
                    View full error code reference →
                  </a>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}