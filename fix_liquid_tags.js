const fs = require('fs');
const path = require('path');

// Directories to scan (relative to script location)
const TARGET_DIRS = ['docs', 'docs_internal/payment_v1'];
const EXTENSIONS = ['.md', '.mdx'];

// Recursively collect files with given extensions
function collectFiles(dir, files = []) {
  const fullDir = path.resolve(dir);
  if (!fs.existsSync(fullDir)) return files;
  const entries = fs.readdirSync(fullDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(fullDir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
    } else if (entry.isFile() && EXTENSIONS.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

// Check if a file contains '{{' in its body (after front matter)
function hasBraceInBody(content) {
  const lines = content.split(/\r?\n/);
  let dashes = 0;
  let body = '';
  for (const line of lines) {
    if (/^---\s*$/.test(line)) {
      dashes++;
    } else if (dashes >= 2) {
      body += line + '\n';
    }
  }
  return body.includes('{{');
}

// Wrap body with {% raw %} … {% endraw %} after front matter
function wrapWithRaw(content) {
  const lines = content.split(/\r?\n/);
  let dashCount = 0;
  const frontMatterLines = [];
  let bodyLines = [];
  let inBody = false;
  for (const line of lines) {
    if (!inBody && /^---\s*$/.test(line)) {
      dashCount++;
      frontMatterLines.push(line);
      if (dashCount === 2) {
        inBody = true;
      }
    } else if (!inBody) {
      frontMatterLines.push(line);
    } else {
      bodyLines.push(line);
    }
  }

  // Rebuild: front matter + raw open + body + raw close
  const newContent = [
    ...frontMatterLines,
    '{% raw %}',
    ...bodyLines,
    '{% endraw %}'
  ].join('\n');

  // Ensure trailing newline if original had one
  return newContent + (content.endsWith('\n') ? '\n' : '');
}

// Main processing
function processFiles() {
  let allFiles = [];
  for (const dir of TARGET_DIRS) {
    allFiles = allFiles.concat(collectFiles(dir));
  }

  let modifiedCount = 0;
  for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Skip if already contains raw tag
    if (/{%-?\s*raw\s*-?%}/i.test(content)) {
      continue;
    }

    // Only proceed if '{{' appears in the body
    if (!hasBraceInBody(content)) {
      continue;
    }

    const fixed = wrapWithRaw(content);
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
    modifiedCount++;
  }

  console.log(`\n🎉 Done! Modified ${modifiedCount} files.`);
}

// Run
processFiles();