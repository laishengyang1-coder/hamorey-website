import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const miniRoot = join(root, 'miniprogram');
const functionsRoot = join(root, 'functions', 'api');
const calls = [];
const miniJavaScriptFiles = [];
const miniJsonFiles = [];

function walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (path.endsWith('.js')) {
      miniJavaScriptFiles.push(path);
      inspect(path);
    } else if (path.endsWith('.json')) {
      miniJsonFiles.push(path);
    }
  }
}

function inspect(file) {
  const source = readFileSync(file, 'utf8');
  const pattern = /api\.(get|post|put|del)\(\s*([`'"])(\/[^`'"]+)\2/g;
  for (const match of source.matchAll(pattern)) {
    calls.push({
      method: match[1] === 'del' ? 'Delete' : `${match[1][0].toUpperCase()}${match[1].slice(1)}`,
      route: match[3].replace(/\$\{[^}]+\}/g, '[id]'),
      file: relative(root, file),
    });
  }
}

function routeFiles(route) {
  const clean = route.replace(/^\//, '');
  const direct = join(functionsRoot, `${clean}.ts`);
  const index = join(functionsRoot, clean, 'index.ts');
  return [direct, index];
}

walk(miniRoot);

const failures = [];

for (const file of miniJavaScriptFiles) {
  const source = readFileSync(file, 'utf8');
  try {
    new Function(source);
  } catch (err) {
    failures.push(`${relative(root, file)}: JavaScript syntax error: ${err.message}`);
  }
}

for (const file of miniJsonFiles) {
  try {
    JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    failures.push(`${relative(root, file)}: invalid JSON: ${err.message}`);
  }
}

const appConfig = JSON.parse(readFileSync(join(miniRoot, 'app.json'), 'utf8'));
for (const page of appConfig.pages || []) {
  for (const extension of ['js', 'json', 'wxml', 'wxss']) {
    const file = join(miniRoot, `${page}.${extension}`);
    if (!existsSync(file)) failures.push(`miniprogram/app.json: ${page}.${extension} is missing`);
  }
}
const configuredPages = new Set(appConfig.pages || []);
for (const item of appConfig.tabBar?.list || []) {
  if (!configuredPages.has(item.pagePath)) failures.push(`miniprogram/app.json: tab page ${item.pagePath} is not registered`);
}
for (const call of calls) {
  const candidates = routeFiles(call.route);
  const target = candidates.find(existsSync);
  if (!target) {
    failures.push(`${call.file}: ${call.method.toUpperCase()} ${call.route} has no Pages Function`);
    continue;
  }
  const source = readFileSync(target, 'utf8');
  if (!source.includes(`onRequest${call.method}`)) {
    failures.push(`${call.file}: ${call.method.toUpperCase()} ${call.route} is not exported by ${relative(root, target)}`);
  }
}

const requiredContracts = [
  ['functions/api/public/warranties.ts', "url.searchParams.get('q')"],
  ['functions/api/public/warranties.ts', "url.searchParams.get('id')"],
  ['functions/api/store/upload-url.ts', '/api/r2-upload/'],
  ['functions/api/r2-upload/[[path]].ts', 'context.env.R2.put'],
  ['functions/api/public/certificates/[[path]].ts', 'onRequestGet'],
  ['functions/api/public/photos/[[path]].ts', "headers.set('Vary', 'Authorization')"],
  ['functions/api/_redemptions.ts', "'freeze', ?, ?, 'redemption'"],
  ['functions/api/admin/redemptions.ts', "'release', ?, ?, 'redemption'"],
  ['functions/api/_lib.ts', "'deduct', 'revoke', 'freeze'"],
  ['migrations/phase3_hardening.sql', 'trg_points_freeze_balance'],
  ['migrations/phase3_hardening.sql', 'trg_redemption_item_reserve_stock'],
  ['migrations/phase3_hardening.sql', 'idx_audit_single_approval'],
  ['migrations/phase3_hardening.sql', 'trg_warranty_audit_matches_status'],
  ['miniprogram/utils/api.js', 'downloadProtectedPhoto'],
  ['miniprogram/pages/store/edit/index.js', 'display_url'],
  ['src/shared/components/ProtectedImage.tsx', 'fetchProtectedAsset'],
  ['package.json', 'npm run test:contracts && tsc'],
];

for (const [file, marker] of requiredContracts) {
  const path = join(root, file);
  if (!existsSync(path) || !readFileSync(path, 'utf8').includes(marker)) {
    failures.push(`${file}: missing required contract marker ${marker}`);
  }
}

for (const directory of [join(root, 'src'), miniRoot]) {
  const stack = [directory];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const name of readdirSync(current)) {
      const path = join(current, name);
      if (statSync(path).isDirectory()) stack.push(path);
      else if (/\.(?:ts|tsx|js|wxml)$/.test(path) && readFileSync(path, 'utf8').includes('?token=')) {
        failures.push(`${relative(root, path)}: authentication tokens must not be placed in URLs`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`System contract check passed: ${calls.length} mini-program API calls and cross-client guards verified.`);
