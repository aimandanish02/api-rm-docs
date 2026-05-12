const fs = require('fs');
const path = require('path');

// Configuration
const DOCS_DIR = './docs';

function getAllMarkdownFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllMarkdownFiles(filePath, fileList);
    } else if (file.match(/\.(md|mdx)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function fixImagePaths(content) {
  let modified = content;
  let changeCount = 0;
  let needsMdx = false;
  
  // Fix HTML img tags: <img src="/img/..." /> -> <img src={require('/img/...').default} />
  const htmlImgRegex = /<img\s+([^>]*)src=["']\/img\/([^"']+)["']([^>]*)>/g;
  const htmlMatches = content.match(htmlImgRegex);
  if (htmlMatches) {
    changeCount += htmlMatches.length;
    needsMdx = true;
    modified = modified.replace(
      htmlImgRegex,
      (match, before, imgPath, after) => {
        // Preserve other attributes
        return `<img ${before}src={require('/img/${imgPath}').default}${after}>`;
      }
    );
  }
  
  // Fix markdown images: ![alt](/img/...) -> ![alt](require('/img/...').default)
  // Note: This syntax works in MDX
  const mdImgRegex = /!\[([^\]]*)\]\(\/img\/([^)]+)\)/g;
  const mdMatches = content.match(mdImgRegex);
  if (mdMatches) {
    changeCount += mdMatches.length;
    needsMdx = true;
    modified = modified.replace(
      mdImgRegex,
      (match, alt, imgPath) => {
        return `<img src={require('/img/${imgPath}').default} alt="${alt}" />`;
      }
    );
  }
  
  return { modified, changeCount, needsMdx };
}

function main() {
  console.log(`🔍 Searching for markdown files in ${DOCS_DIR}...\n`);
  
  const markdownFiles = getAllMarkdownFiles(DOCS_DIR);
  console.log(`📄 Found ${markdownFiles.length} markdown files\n`);
  
  let totalChanges = 0;
  let filesModified = 0;
  let filesRenamed = 0;
  
  markdownFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const { modified, changeCount, needsMdx } = fixImagePaths(content);
    
    if (changeCount > 0) {
      let outputPath = filePath;
      
      // If file has images and is .md, rename to .mdx
      if (needsMdx && filePath.endsWith('.md')) {
        outputPath = filePath.replace(/\.md$/, '.mdx');
        fs.renameSync(filePath, outputPath);
        filesRenamed++;
        console.log(`✅ ${filePath} → ${outputPath}: Fixed ${changeCount} image(s)`);
      } else {
        console.log(`✅ ${filePath}: Fixed ${changeCount} image(s)`);
      }
      
      fs.writeFileSync(outputPath, modified, 'utf8');
      totalChanges += changeCount;
      filesModified++;
    }
  });
  
  console.log(`\n🎉 Done!`);
  console.log(`📊 Modified ${filesModified} files`);
  console.log(`🔄 Renamed ${filesRenamed} .md → .mdx files`);
  console.log(`🖼️  Fixed ${totalChanges} images total`);
  console.log(`\n💡 All images now use require() - works in both dev and prod!`);
}

main();