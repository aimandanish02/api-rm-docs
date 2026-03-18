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

function splitFrontmatter(content) {
    const match = content.match(/^(---\n[\s\S]*?\n---\n?)/);
    if (!match) return { frontmatter: "", body: content };
    return {
        frontmatter: match[1],
        body: content.slice(match[1].length),
    };
}

function stripDomainsFromApiEndpoint(body) {
    // Match <ApiEndpoint ... /> including multiline
    return body.replace(
        /<ApiEndpoint([\s\S]*?)\/>/g,
        (match, inner) => {
            const updated = inner
                // Strip domain from sandbox="https://..."
                .replace(
                    /(sandbox\s*=\s*")https?:\/\/[^/]+(\/?[^"]*?)(")/g,
                    (_, prefix, urlPath, suffix) => {
                        const cleanPath = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
                        return `${prefix}${cleanPath}${suffix}`;
                    }
                )
                // Strip domain from prod="https://..."
                .replace(
                    /(prod\s*=\s*")https?:\/\/[^/]+(\/?[^"]*?)(")/g,
                    (_, prefix, urlPath, suffix) => {
                        const cleanPath = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
                        return `${prefix}${cleanPath}${suffix}`;
                    }
                );
            return `<ApiEndpoint${updated}/>`;
        }
    );
}

const files = getAllMdFiles(DOCS_DIR);
let changed = 0;
let unchanged = 0;

for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const { frontmatter, body } = splitFrontmatter(content);

    const updatedBody = stripDomainsFromApiEndpoint(body);

    if (updatedBody === body) {
        unchanged++;
        continue;
    }

    fs.writeFileSync(file, frontmatter + updatedBody, "utf8");
    console.log(`UPDATED: ${file}`);
    changed++;
}

console.log(`\n✅ Done — ${changed} updated, ${unchanged} unchanged`);