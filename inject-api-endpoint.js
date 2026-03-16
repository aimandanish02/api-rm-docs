const fs = require("fs");
const path = require("path");

const DOCS_DIR = path.resolve("docs");

function getAllMdFiles(dir) {
    let results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(getAllMdFiles(full));
        } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
            results.push(full);
        }
    }
    return results;
}

function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;
    return { raw: match[0], body: match[1] };
}

function extractApiFields(fmBody) {
    const methodMatch = fmBody.match(/^\s{0,2}api:\s*\n[\s\S]*?method:\s*(\S+)/m);
    const sandboxMatch = fmBody.match(/sandbox:\s*(\S+)/);
    const prodMatch = fmBody.match(/prod:\s*(\S+)/);
    if (!methodMatch || !sandboxMatch || !prodMatch) return null;
    return {
        method: methodMatch[1].trim(),
        sandbox: sandboxMatch[1].trim(),
        prod: prodMatch[1].trim(),
    };
}

function buildInjection(method, sandbox, prod) {
    return (
        `import ApiEndpoint from "@site/src/components/api/ApiEndpoint";\n\n` +
        `<ApiEndpoint\n` +
        `  method="${method}"\n` +
        `  sandbox="${sandbox}"\n` +
        `  prod="${prod}"\n` +
        `/>\n`
    );
}

function removeOldMethodLines(content) {
    return content.replace(
        /\*\*Method\s*:\*\*\s*<span[^>]*>[^<]*<\/span><br\/>\n\n?URL\s*:?\s*`[^`]+`(<br\/>)?\n\n?(Sandbox URL\s*:?\s*`[^`]+`(<br\/>)?\n\n?)?/g,
        ""
    );
}

const files = getAllMdFiles(DOCS_DIR);
let changed = 0;
let skipped = 0;
let noApi = 0;

for (const file of files) {
    let content = fs.readFileSync(file, "utf8");
    const fm = parseFrontmatter(content);

    if (!fm || !fm.body.includes("api:")) {
        noApi++;
        continue;
    }

    // Remove old manual method/URL lines regardless
    content = removeOldMethodLines(content);

    // Skip injecting if ApiEndpoint already exists
    if (content.includes("ApiEndpoint")) {
        fs.writeFileSync(file, content, "utf8"); // still save the cleanup
        console.log(`SKIP inject (already has ApiEndpoint): ${file}`);
        skipped++;
        continue;
    }

    const fields = extractApiFields(fm.body);
    if (!fields) {
        console.log(`SKIP (could not parse api fields): ${file}`);
        skipped++;
        continue;
    }

    const injection = buildInjection(fields.method, fields.sandbox, fields.prod);
    const afterFrontmatter = content.slice(fm.raw.length);
    const newContent = fm.raw + "\n\n" + injection + afterFrontmatter;

    fs.writeFileSync(file, newContent, "utf8");
    console.log(`UPDATED: ${file}`);
    changed++;
}

console.log(`\n✅ Done — ${changed} updated, ${skipped} skipped, ${noApi} had no api block`);