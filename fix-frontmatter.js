const fs = require("fs");
const path = require("path");

const DOCS_DIR = path.resolve("docs");

function fixFrontmatter(original) {
  let content = original;

  // Fix any case where --- is not at the start of a line (e.g. }--- or provided.---)
  content = content.replace(/([^\n])(---)/g, "$1\n$2");

  // Match frontmatter block
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (match) {
    const frontmatter = match[1];
    const newFrontmatter = frontmatter.replace(/^\s+prod:.*$/gm, "");
    const newBlock = "---\n" + newFrontmatter + "\n---";
    content = newBlock + content.slice(match[0].length);
  }

  return { content, changed: content !== original };
}

function processFile(file) {
  const original = fs.readFileSync(file, "utf8");
  const { content, changed } = fixFrontmatter(original);
  if (!changed) return false;
  fs.writeFileSync(file, content, "utf8");
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

console.log("Fixing frontmatter in docs/...\n");

const files = getAllMdFiles(DOCS_DIR);
let updated = 0;

for (const file of files) {
  if (processFile(file)) {
    console.log(`UPDATED: ${file}`);
    updated++;
  }
}

console.log(`\nDone: ${updated} of ${files.length} files updated`);