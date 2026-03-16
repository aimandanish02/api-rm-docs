const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const DOCS_PATH = path.join(__dirname, 'docs');

function extractCodeBlock(content, label) {
  const regex = new RegExp(
    `> ${label}\\s*\\n\\s*\\n\`\`\`[a-zA-Z]*\\n([\\s\\S]*?)\`\`\``,
    'm'
  );
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

function removeExampleBlocks(content) {
  const labels = ['Example Request', 'Example Body Request', 'Example Response'];
  let result = content;
  for (const label of labels) {
    const regex = new RegExp(
      `\\n?> ${label}\\s*\\n\\s*\\n\`\`\`[a-zA-Z]*\\n[\\s\\S]*?\`\`\`\\n?`,
      'g'
    );
    result = result.replace(regex, '');
  }
  return result;
}

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');

  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return;

  const frontmatter = frontmatterMatch[1];
  if (!frontmatter.includes('api:')) return;

  // Skip if examples already exist in frontmatter
  if (frontmatter.includes('examples:')) {
    // Still clean up inline example blocks even if frontmatter already has examples
    const cleaned = removeExampleBlocks(raw);
    if (cleaned !== raw) {
      fs.writeFileSync(filePath, cleaned, 'utf8');
      console.log(`CLEANED inline blocks: ${filePath}`);
    }
    return;
  }

  // Extract from inline blocks
  const request = extractCodeBlock(raw, 'Example Request');
  const body = extractCodeBlock(raw, 'Example Body Request');
  const response = extractCodeBlock(raw, 'Example Response');

  const examplesBlock = `
examples:
  request: |
${indent(request || 'There is no example request provided.')}
  body: |
${indent(body || 'There is no example body request.')}
  response: |
${indent(response || 'There is no example response provided.')}
`;

  const newFrontmatter = `---\n${frontmatter.trim()}\n${examplesBlock}---`;
  let updated = raw.replace(/^---\n[\s\S]*?\n---/, newFrontmatter);

  // Remove the inline blocks after migrating to frontmatter
  updated = removeExampleBlocks(updated);

  fs.writeFileSync(filePath, updated, 'utf8');
  console.log(`MIGRATED + CLEANED: ${filePath}`);
}

function indent(text) {
  return text
    .split('\n')
    .map(line => `    ${line}`)
    .join('\n');
}

(async () => {
  const files = await glob(`${DOCS_PATH}/**/*.{md,mdx}`);
  files.forEach(processFile);
})();