import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const miniRoot = join(root, 'miniprogram');
const functionsRoot = join(root, 'functions', 'api');
const calls = [];

function walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (path.endsWith('.js')) inspect(path);
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
];

for (const [file, marker] of requiredContracts) {
  const path = join(root, file);
  if (!existsSync(path) || !readFileSync(path, 'utf8').includes(marker)) {
    failures.push(`${file}: missing required contract marker ${marker}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`API contract check passed: ${calls.length} mini-program calls verified.`);
