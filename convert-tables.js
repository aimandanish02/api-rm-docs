#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const WRITE = process.argv.includes("--write");

const SCAN_DIRS = ["./docs", "./docs_internal"];
const BACKUP_DIR = "./.backup";

// ─── FILE COLLECTION ─────────────────────────────

function collectFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  let results = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results = results.concat(collectFiles(full));
    } else if (/\.(md|mdx)$/.test(entry.name)) {
      results.push(full);
    }
  }

  return results;
}

// ─── BACKUP ─────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function backupFile(file) {
  const rel = path.relative(process.cwd(), file);
  const dest = path.join(BACKUP_DIR, rel);

  ensureDir(path.dirname(dest));

  if (!fs.existsSync(dest)) {
    fs.copyFileSync(file, dest);
  }
}

// ─── TABLE PARSER ─────────────────────────────

function safe(str) {
  return (str || "").toString();
}

function clean(str) {
  return safe(str)
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function parseRow(line) {
  return line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
}

function isSeparator(line) {
  return /^\|\s*-+/.test(line);
}

function parseTable(block) {
  const lines = block.split("\n").filter((l) => l.trim().startsWith("|"));

  if (lines.length < 2) return null;

  const headers = parseRow(lines[0]).map((h) => h.toLowerCase());

  const col = {
    name: headers.findIndex((h) =>
      h.includes("param") || h.includes("field") || h.includes("name")
    ),
    type: headers.findIndex((h) => h.includes("type")),
    required: headers.findIndex((h) => h.includes("required")),
    description: headers.findIndex((h) => h.includes("desc")),
    example: headers.findIndex((h) => h.includes("example")),
  };

  if (col.name === -1 || col.type === -1) return null;

  const rows = [];

  for (let i = 2; i < lines.length; i++) {
    const cells = parseRow(lines[i]);

    const name = clean(cells[col.name]);
    if (!name) continue;

    const row = {
      name,
      type: clean(cells[col.type]),
    };

    if (col.required !== -1) {
      row.required = /yes|true|required/i.test(clean(cells[col.required]));
    }

    if (col.description !== -1) {
      row.description = clean(cells[col.description]);
    }

    if (col.example !== -1) {
      const ex = clean(cells[col.example]);
      if (ex) row.example = ex;
    }

    rows.push(row);
  }

  return rows.length ? rows : null;
}

// ─── BUILD JSX ─────────────────────────────

function rowToJSX(row) {
  const parts = [`name: ${JSON.stringify(row.name)}`];

  if (row.type) parts.push(`type: ${JSON.stringify(row.type)}`);
  if (row.required) parts.push(`required: true`);
  if (row.description)
    parts.push(`description: ${JSON.stringify(row.description)}`);
  if (row.example)
    parts.push(`example: ${JSON.stringify(row.example)}`);

  return `{ ${parts.join(", ")} }`;
}

function buildTable(title, rows) {
  const body = rows.map((r) => `    ${rowToJSX(r)}`).join(",\n");

  return `<ParamTable
  title=${JSON.stringify(title)}
  rows={[
${body}
  ]}
/>`;
}

// ─── MAIN PROCESSOR ─────────────────────────────

function processContent(content) {
  const lines = content.split("\n");

  let result = [];
  let buffer = [];
  let inTable = false;
  let count = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("|")) {
      inTable = true;
      buffer.push(line);
      continue;
    }

    if (inTable) {
      const tableText = buffer.join("\n");
      const rows = parseTable(tableText);

      if (rows) {
        result.push(buildTable("Parameters", rows));
        count++;
      } else {
        result.push(tableText);
      }

      buffer = [];
      inTable = false;
    }

    result.push(line);
  }

  return {
    newContent: result.join("\n"),
    count,
  };
}

// ─── RUN ─────────────────────────────

const files = SCAN_DIRS.flatMap(collectFiles);

console.log(`📂 Scanning: ${SCAN_DIRS.join(", ")}`);
console.log(`📄 Files: ${files.length}`);
console.log(`✏️ Mode: ${WRITE ? "WRITE" : "DRY RUN"}\n`);

let totalFiles = 0;
let totalTables = 0;

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const { newContent, count } = processContent(original);

  if (!count) continue;

  console.log(`✅ ${file} (${count} tables)`);

  totalFiles++;
  totalTables += count;

  if (WRITE) {
    backupFile(file);
    fs.writeFileSync(file, newContent, "utf8");
  }
}

console.log("\n──────────────");
console.log(`Files: ${totalFiles}`);
console.log(`Tables: ${totalTables}`);