const fs = require("fs");
const path = require("path");

const DOCS_DIR = path.resolve("docs");
const DOCS_INTERNAL_DIR = path.resolve("docs_internal");

function stripProdFromFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { content, changed: false };

  const frontmatter = match[1];
  if (!/^\s+prod:/m.test(frontmatter)) return { content, changed: false };

  const newFrontmatter = frontmatter.replace(/^\s+prod:.*$/gm, "");
  const newContent = "---\n" + newFrontmatter + "---\n" + content.slice(match[0].length);
  return { content: newContent, changed: true };
}

function processFile(file) {
  const content = fs.readFileSync(file, "utf8");
  const { content: newContent, changed } = stripProdFromFrontmatter(content);
  if (!changed) return false;
  fs.writeFileSync(file, newContent, "utf8");
  return true;
}

function getAllMdFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllMdFiles(full));
    } else if (/\.(md|mdx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function processDirectory(dir, label) {
  const files = getAllMdFiles(dir);
  let updated = 0;
  for (const file of files) {
    if (processFile(file)) {
      console.log(`UPDATED: ${file}`);
      updated++;
    }
  }
  console.log(`${label}: ${updated} of ${files.length} files updated`);
  return updated;
}

console.log("Stripping `prod:` lines from frontmatter...\n");
const docsCount = processDirectory(DOCS_DIR, "docs/");
const docsInternalCount = processDirectory(DOCS_INTERNAL_DIR, "docs_internal/");
console.log(`\nTotal: ${docsCount + docsInternalCount} files updated`);