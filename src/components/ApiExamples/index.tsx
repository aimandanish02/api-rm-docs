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

type TerminalProps = {
  title: string;
  content: string;
  prompt?: string;
  showLangSwitcher?: boolean;
  rawCurl?: string;
};

function Terminal({ title, content, prompt = "$", showLangSwitcher = false, rawCurl = "" }: TerminalProps) {
  const [lang, setLang] = useState<SnippetLang>("cURL");
  const [copied, setCopied] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  const displayContent = showLangSwitcher
    ? generateSnippet(lang, rawCurl)
    : content;

  const copyContent = showLangSwitcher
    ? generateSnippet(lang, rawCurl)
    : content;

  // Blink cursor
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  // Auto scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [typedText, hasTyped]);

  // Auto-type on mount
  useEffect(() => {
    if (!content || hasStarted.current) return;
    hasStarted.current = true;

    const type = async () => {
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 200));

      for (let i = 0; i <= content.length; i++) {
        await new Promise(r => setTimeout(r, 2 + Math.random() * 3));
        setTypedText(content.slice(0, i));
      }

      setIsTyping(false);
      setHasTyped(true);
    };

    type();
  }, [content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(copyContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={styles.terminal}>
      {/* Title bar */}
      <div className={styles.terminalBar}>
        <div className={styles.terminalDots}>
          <span className={styles.dotRed} />
          <span className={styles.dotYellow} />
          <span className={styles.dotGreen} />
        </div>
        <span className={styles.terminalTitle}>{title}</span>
        <div className={styles.terminalActions}>
          {showLangSwitcher && (
            <select
              className={styles.langDropdown}
              value={lang}
              onChange={(e) => setLang(e.target.value as SnippetLang)}
            >
              {SNIPPET_LANGS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          )}
          <button
            className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ""}`}
            onClick={handleCopy}
          >
            {copied ? "✓" : "Copy"}
          </button>
        </div>
      </div>

      {/* Terminal body */}
      <div className={styles.terminalBody} ref={terminalRef}>
        {/* Idle */}
        {!isTyping && !hasTyped && (
          <div className={styles.terminalLine}>
            <span className={styles.terminalPrompt}>{prompt}</span>
            <span className={`${styles.terminalCursor} ${!cursorVisible ? styles.terminalCursorHidden : ""}`} />
          </div>
        )}

        {/* Typing */}
        {isTyping && (
          <div className={styles.terminalLine}>
            <span className={styles.terminalPrompt}>{prompt}</span>
            <span className={styles.terminalCmd}>{typedText}</span>
            <span className={`${styles.terminalCursor} ${!cursorVisible ? styles.terminalCursorHidden : ""}`} />
          </div>
        )}

        {/* Done — show full content */}
        {hasTyped && (
          <>
            <div className={styles.terminalLine}>
              <span className={styles.terminalPrompt}>{prompt}</span>
              <span className={styles.terminalCmd}>{displayContent}</span>
            </div>
            <div className={styles.terminalLine}>
              <span className={styles.terminalPrompt}>{prompt}</span>
              <span className={`${styles.terminalCursor} ${!cursorVisible ? styles.terminalCursorHidden : ""}`} />
            </div>
          </>
        )}
      </div>

      {/* Notice */}
      <div className={styles.terminalNotice}>
        Example only — use the playground above to make real calls
      </div>
    </div>
  );
}

export default function ApiExamples({ shared }: Props) {
  const { frontMatter } = useDoc();
  const examples = (frontMatter as any).examples;
  const rawRequest = toString(examples?.request);
  const exampleResponse = toString(examples?.response);

  if (isBlank(rawRequest) && isBlank(exampleResponse)) return null;

  return (
    <div className={styles.wrapper}>
      {!isBlank(rawRequest) && (
        <Terminal
          title="Example Request"
          content={generateSnippet("cURL", rawRequest!)}
          prompt="$"
          showLangSwitcher={true}
          rawCurl={rawRequest!}
        />
      )}

      {!isBlank(exampleResponse) && (
        <Terminal
          title="Example Response"
          content={exampleResponse!}
          prompt=">"
          showLangSwitcher={false}
        />
      )}
    </div>
  );
}