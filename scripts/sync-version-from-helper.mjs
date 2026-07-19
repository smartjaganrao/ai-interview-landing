import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const helperPkgPath = join(__dirname, '..', '..', 'ai-interview-helper', 'package.json');
const landingFile = join(__dirname, '..', 'lib', 'github-release.ts');

const helperPkg = JSON.parse(readFileSync(helperPkgPath, 'utf8'));
const version = helperPkg.version;
const tag = `v${version}`;

let content = readFileSync(landingFile, 'utf8').toString();

const fallbackRe = /const FALLBACK: LatestRelease = \{[\s\S]*?version: '[^']*',/;
const replacement = `const FALLBACK: LatestRelease = {
  version: '${tag}',`;

if (!fallbackRe.test(content)) {
  console.error('Could not find FALLBACK version in github-release.ts');
  process.exit(1);
}

content = content.replace(fallbackRe, replacement);
writeFileSync(landingFile, content, 'utf8');

console.log(`Synced fallback version -> ${tag}`);
