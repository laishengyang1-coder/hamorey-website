import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const distDir = resolve('dist');
const indexPath = resolve(distDir, 'index.html');
const errors = [];

if (!existsSync(indexPath)) {
  errors.push('dist/index.html is missing');
}

if (existsSync(resolve(distDir, '200.html'))) {
  errors.push('dist/200.html must not exist because it can turn missing assets into cached HTML');
}

if (!existsSync(resolve(distDir, '404.html'))) {
  errors.push('dist/404.html is required so missing static assets return 404 instead of the SPA HTML');
}

if (errors.length === 0) {
  const html = readFileSync(indexPath, 'utf8');
  const assetPaths = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map((match) => match[1]);

  if (assetPaths.length === 0) {
    errors.push('dist/index.html does not reference any built assets');
  }

  for (const assetPath of new Set(assetPaths)) {
    const filePath = resolve(distDir, assetPath.slice(1));
    if (!existsSync(filePath) || statSync(filePath).size === 0) {
      errors.push(`referenced asset is missing or empty: ${assetPath}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`SPA build check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log('SPA build check passed: static 404 protection is present and all entry assets exist.');
