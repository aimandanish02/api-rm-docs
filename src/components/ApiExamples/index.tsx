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

type TerminalLine =
  | { type: "prompt"; text: string }
  | { type: "output"; text: string }
  | { type: "success"; text: string }
  | { type: "error"; text: string };

export default function ApiExamples({ shared }: Props) {
  const { frontMatter } = useDoc();
  const examples = (frontMatter as any).examples;
  const exampleResponse = toString(examples?.response);

  const [lang, setLang] = useState<SnippetLang>("cURL");
  const [copied, setCopied] = useState(false);

  // Terminal state
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [openRes, setOpenRes] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  const snippet = generateSnippet(lang, "");
  const curlCommand = generateSnippet("cURL", examples?.request ? toString(examples.request) || "" : "");

  // Blink cursor
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  // Auto scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines, typedText]);

  const typeCommand = async (command: string) => {
    setIsTyping(true);
    setTypedText("");
    for (let i = 0; i <= command.length; i++) {
      await new Promise(r => setTimeout(r, 18 + Math.random() * 20));
      setTypedText(command.slice(0, i));
    }
    setIsTyping(false);
  };

  const handleRun = async () => {
    if (isRunning || isTyping) return;
    setIsRunning(true);
    setHasRun(true);
    setLines([]);

    // Type the command
    await typeCommand(curlCommand);

    // Commit command to lines
    setLines([{ type: "prompt", text: curlCommand }]);
    setTypedText("");

    // Add running indicator
    setLines(prev => [...prev, { type: "output", text: "Sending request..." }]);

    try {
      const result = await shared.send();

      // Remove "Sending request..."
      setLines(prev => prev.filter(l => l.text !== "Sending request..."));

      const statusLine = `HTTP ${result.status} ${result.status >= 200 && result.status < 300 ? "OK" : "Error"}`;
      setLines(prev => [
        ...prev,
        {
          type: result.status >= 200 && result.status < 300 ? "success" : "error",
          text: statusLine,
        },
        {
          type: "output",
          text: JSON.stringify(result.response, null, 2),
        },
      ]);
    } catch (err: any) {
      setLines(prev => [
        ...prev.filter(l => l.text !== "Sending request..."),
        { type: "error", text: `Error: ${err?.message || "Unknown error"}` },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    const code = generateSnippet(lang, toString(examples?.request) || "");
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isBlank(toString(examples?.request)) && isBlank(exampleResponse)) return null;

  return (
    <div className={styles.wrapper}>

      {/* ── TERMINAL ── */}
      {!isBlank(toString(examples?.request)) && (
        <div className={styles.terminal}>
          {/* Title bar */}
          <div className={styles.terminalBar}>
            <div className={styles.terminalDots}>
              <span className={styles.dotRed} />
              <span className={styles.dotYellow} />
              <span className={styles.dotGreen} />
            </div>
            <span className={styles.terminalTitle}>Terminal</span>
            <div className={styles.terminalActions}>
              {/* Language switcher */}
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
              <button
                className={`${styles.runBtn} ${isRunning ? styles.runBtnActive : ""}`}
                onClick={handleRun}
                disabled={isRunning || isTyping}
              >
                {isRunning ? "Running…" : "▶ Run"}
              </button>
            </div>
          </div>

          {/* Terminal body */}
          <div className={styles.terminalBody} ref={terminalRef}>
            {/* Idle state — show prompt waiting */}
            {!hasRun && !isTyping && (
              <div className={styles.terminalLine}>
                <span className={styles.terminalPrompt}>$</span>
                <span
                  className={`${styles.terminalCursor} ${!cursorVisible ? styles.terminalCursorHidden : ""}`}
                />
              </div>
            )}

            {/* Typing animation */}
            {isTyping && (
              <div className={styles.terminalLine}>
                <span className={styles.terminalPrompt}>$</span>
                <span className={styles.terminalCmd}>{typedText}</span>
                <span className={`${styles.terminalCursor} ${!cursorVisible ? styles.terminalCursorHidden : ""}`} />
              </div>
            )}

            {/* Committed lines */}
            {lines.map((line, i) => (
              <div key={i} className={styles.terminalLine}>
                {line.type === "prompt" && (
                  <>
                    <span className={styles.terminalPrompt}>$</span>
                    <span className={styles.terminalCmd}>{line.text}</span>
                  </>
                )}
                {line.type === "output" && (
                  <span className={styles.terminalOutput}>{line.text}</span>
                )}
                {line.type === "success" && (
                  <span className={styles.terminalSuccess}>{line.text}</span>
                )}
                {line.type === "error" && (
                  <span className={styles.terminalError}>{line.text}</span>
                )}
              </div>
            ))}

            {/* Idle cursor after run */}
            {hasRun && !isTyping && !isRunning && (
              <div className={styles.terminalLine}>
                <span className={styles.terminalPrompt}>$</span>
                <span className={`${styles.terminalCursor} ${!cursorVisible ? styles.terminalCursorHidden : ""}`} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EXAMPLE RESPONSE ── */}
      {!isBlank(exampleResponse) && (
        <div className={styles.card}>
          <div className={styles.header} onClick={() => setOpenRes(!openRes)}>
            <span>Example Response</span>
            <span className={styles.chevron}>{openRes ? "▾" : "▸"}</span>
          </div>
          {openRes && (
            <pre className={styles.responseCode}>{exampleResponse}</pre>
          )}
        </div>
      )}
    </div>
  );
}