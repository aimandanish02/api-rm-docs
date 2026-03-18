import React, { useState, useEffect, useRef } from "react";
import { useDoc } from "@docusaurus/theme-common/internal";
import { SNIPPET_LANGS, SnippetLang, generateSnippet } from "../../utils/snippets";
import { SharedState } from "../ApiPlayground/UseApiSharedState";
import styles from "./styles.module.css";

function toString(val: any): string | undefined {
  if (!val) return undefined;
  if (typeof val === "string") return val.trim();
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  return String(val).trim();
}

function isBlank(val: any): boolean {
  const str = toString(val);
  if (!str) return true;
  return str.toLowerCase().startsWith("there is no");
}

type Props = {
  shared: SharedState;
};

type RequestTerminalProps = {
  rawCurl: string;
  env: "sandbox" | "prod";
  onDone: () => void;
};

function TerminalPrompt({ env }: { env: "sandbox" | "prod" }) {
  const host = env === "sandbox" ? "sandbox-revenuemonster" : "prod-revenuemonster";
  return (
    <span className={styles.terminalPrompt}>
      <span className={styles.terminalPromptHost}>{host}</span>
      <span className={styles.terminalPromptDollar}>$</span>
    </span>
  );
}

function RequestTerminal({ rawCurl, env, onDone }: RequestTerminalProps) {
  const [lang, setLang] = useState<SnippetLang>("cURL");
  const [copied, setCopied] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [requestDone, setRequestDone] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  const curlCommand = generateSnippet("cURL", rawCurl);
  const snippet = generateSnippet(lang, rawCurl);

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [typedText]);

  useEffect(() => {
    if (!curlCommand || hasStarted.current) return;
    hasStarted.current = true;

    const run = async () => {
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 200));
      for (let i = 0; i <= curlCommand.length; i++) {
        await new Promise(r => setTimeout(r, 2 + Math.random() * 3));
        setTypedText(curlCommand.slice(0, i));
      }
      setIsTyping(false);
      setRequestDone(true);
      await new Promise(r => setTimeout(r, 300));
      onDone();
    };

    run();
  }, [curlCommand]);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={styles.terminal}>
      <div className={styles.terminalBar}>
        <div className={styles.terminalDots}>
          <span className={styles.dotRed} />
          <span className={styles.dotYellow} />
          <span className={styles.dotGreen} />
        </div>
        <span className={styles.terminalTitle}>Example Request</span>
        <div className={styles.terminalActions}>
          <select
            className={styles.langDropdown}
            value={lang}
            onChange={(e) => setLang(e.target.value as SnippetLang)}
          >
            {SNIPPET_LANGS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <button
            className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ""}`}
            onClick={handleCopy}
          >
            {copied ? "✓" : "Copy"}
          </button>
        </div>
      </div>

      <div className={styles.terminalBody} ref={terminalRef}>
        {!isTyping && !requestDone && (
          <div className={styles.terminalLine}>
            <TerminalPrompt env={env} />
            <span className={`${styles.terminalCursor} ${!cursorVisible ? styles.terminalCursorHidden : ""}`} />
          </div>
        )}
        {isTyping && (
          <div className={styles.terminalLine}>
            <TerminalPrompt env={env} />
            <span className={styles.terminalCmd}>{typedText}</span>
            <span className={`${styles.terminalCursor} ${!cursorVisible ? styles.terminalCursorHidden : ""}`} />
          </div>
        )}
        {requestDone && (
          <>
            <div className={styles.terminalLine}>
              <TerminalPrompt env={env} />
              <span className={styles.terminalCmd}>{snippet}</span>
            </div>
            <div className={styles.terminalLine}>
              <TerminalPrompt env={env} />
              <span className={`${styles.terminalCursor} ${!cursorVisible ? styles.terminalCursorHidden : ""}`} />
            </div>
          </>
        )}
      </div>

      <div className={styles.terminalNotice}>
        Example only — use the playground above to make real calls
      </div>
    </div>
  );
}

type ResponseTerminalProps = {
  response: string;
  env: "sandbox" | "prod";
};

function ResponseTerminal({ response, env }: ResponseTerminalProps) {
  const [copied, setCopied] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(response).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={styles.terminal}>
      <div className={styles.terminalBar}>
        <div className={styles.terminalDots}>
          <span className={styles.dotRed} />
          <span className={styles.dotYellow} />
          <span className={styles.dotGreen} />
        </div>
        <span className={styles.terminalTitle}>Example Response</span>
        <div className={styles.terminalActions}>
          <button
            className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ""}`}
            onClick={handleCopy}
          >
            {copied ? "✓" : "Copy"}
          </button>
        </div>
      </div>

      <div className={styles.terminalBody}>
        <div className={styles.terminalLine}>
          <span className={styles.terminalSuccess}>HTTP 200 OK</span>
        </div>
        <div className={styles.terminalLine}>
          <span className={styles.terminalOutput}>{response}</span>
        </div>
        <div className={styles.terminalLine}>
          <TerminalPrompt env={env} />
          <span className={`${styles.terminalCursor} ${!cursorVisible ? styles.terminalCursorHidden : ""}`} />
        </div>
      </div>
    </div>
  );
}

export default function ApiExamples({ shared }: Props) {
  const { frontMatter } = useDoc();
  const examples = (frontMatter as any).examples;
  const rawRequest = toString(examples?.request);
  const exampleResponse = toString(examples?.response);
  const [showResponse, setShowResponse] = useState(false);

  if (isBlank(rawRequest) && isBlank(exampleResponse)) return null;

  return (
    <div className={styles.wrapper}>
      {!isBlank(rawRequest) && (
        <RequestTerminal
          rawCurl={rawRequest!}
          env={shared.env}
          onDone={() => setShowResponse(true)}
        />
      )}
      {!isBlank(exampleResponse) && showResponse && (
        <ResponseTerminal
          response={exampleResponse!}
          env={shared.env}
        />
      )}
    </div>
  );
}