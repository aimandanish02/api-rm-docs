//example request/response component for API reference pages. Expects frontMatter.
import React, { useState } from "react";
import CodeBlock from "@theme/CodeBlock";
import { useDoc } from "@docusaurus/theme-common/internal";
import { SNIPPET_LANGS, SnippetLang, generateSnippet } from "../../utils/snippets";
import styles from "./styles.module.css";


function normalizeCurl(curl: string): string {
  // 1. Convert literal \n sequences → real newlines
  const raw = curl.replace(/\\n/g, "\n").trim();

  // 2. Strip line-continuation backslashes and flatten to one line
  const flat = raw
    .split("\n")
    .map((l) => l.replace(/\\\s*$/, "").trim())
    .filter(Boolean)
    .join(" ");

  // 3. Re-split before each flag (-X / --flag), respecting quoted strings
  const segments: string[] = [];
  let current = "";
  let i = 0;

  while (i < flat.length) {
    const ch = flat[i];

    // Inside a quoted section — never split here
    if (ch === '"' || ch === "'") {
      const q = ch;
      let j = i + 1;
      while (j < flat.length && flat[j] !== q) j++;
      current += flat.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    // Boundary: space immediately before a dash → new flag starts
    if (ch === " " && i + 1 < flat.length && flat[i + 1] === "-") {
      segments.push(current);
      current = "";
      i++; // skip the space; '-' is picked up next iteration
      continue;
    }

    current += ch;
    i++;
  }
  if (current) segments.push(current);

  if (segments.length <= 1) return flat;
  return [segments[0], ...segments.slice(1).map((s) => `  ${s.trim()}`)].join(" \\\n");
}

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

/**
 * If the cURL string has no --data / -d flag but a body exists separately,
 * append it so all generated snippets include the request body.
 */
function mergeBodyIntoCurl(curl: string, body?: string): string {
  if (!body || isBlank(body)) return curl;
  const hasData = /--data|-d\s+['{]/.test(curl);
  if (hasData) return curl;

  // Collapse the body to a single line for --data
  const oneLine = body.trim().replace(/\n\s*/g, " ");
  return `${curl.trimEnd()} \\\n    --data '${oneLine}'`;
}

export default function ApiExamples() {
  const { frontMatter } = useDoc();
  const examples = (frontMatter as any).examples;

const rawRequest = toString(examples?.request)
  ? normalizeCurl(toString(examples.request)!)
  : undefined;  const rawBody = toString(examples?.body);
  const exampleResponse = toString(examples?.response);

  // Produce a complete cURL that always includes the body
  const completeCurl = rawRequest
    ? mergeBodyIntoCurl(rawRequest, rawBody)
    : undefined;

  const [openReq, setOpenReq] = useState(true);
  const [openRes, setOpenRes] = useState(true);
  const [lang, setLang] = useState<SnippetLang>("cURL");
  const [copied, setCopied] = useState(false);

  if (isBlank(completeCurl) && isBlank(exampleResponse)) return null;

  const snippet = completeCurl ? generateSnippet(lang, completeCurl) : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={styles.wrapper}>

      {/* ── EXAMPLE REQUEST ── */}
      {!isBlank(completeCurl) && (
        <div className={styles.card}>
          <div className={styles.header} onClick={() => setOpenReq(!openReq)}>
            <span>Example Request</span>
            <div className={styles.headerRight} onClick={(e) => e.stopPropagation()}>
              <select
                className={styles.langDropdown}
                value={lang}
                onChange={(e) => {
                  setLang(e.target.value as SnippetLang);
                  if (!openReq) setOpenReq(true);
                }}
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
              <span className={styles.chevron}>{openReq ? "▾" : "▸"}</span>
            </div>
          </div>

          {openReq && (
            <CodeBlock language={langToHighlight(lang)} showLineNumbers>
              {snippet}
            </CodeBlock>
          )}
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
            <CodeBlock language="json" showLineNumbers>{exampleResponse!}</CodeBlock>
          )}
        </div>
      )}

    </div>
  );
}

function langToHighlight(lang: SnippetLang): string {
  switch (lang) {
    case "cURL": return "bash";
    case "JS Fetch": return "javascript";
    case "Node / Axios": return "javascript";
    case "Python": return "python";
    case "PHP": return "php";
    default: return "bash";
  }
}