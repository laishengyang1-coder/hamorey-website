import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(serverDir, '..');
const functionsDir = path.join(repoRoot, 'functions', 'api');
const outFile = path.join(serverDir, 'src', 'generated', 'function-routes.ts');

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (!entry.isFile() || !entry.name.endsWith('.ts')) return [];
    if (entry.name.startsWith('_')) return [];
    return [fullPath];
  });
}

function segmentToRoute(segment) {
  const optionalCatchAll = segment.match(/^\[\[(.+)\]\]$/);
  if (optionalCatchAll) return { kind: 'catchAll', name: optionalCatchAll[1] };

  const dynamic = segment.match(/^\[(.+)\]$/);
  if (dynamic) return { kind: 'param', name: dynamic[1] };

  const embeddedDynamic = segment.match(/^(.*)\[(.+)\](.*)$/);
  if (embeddedDynamic) {
    return {
      kind: 'embeddedParam',
      prefix: embeddedDynamic[1],
      name: embeddedDynamic[2],
      suffix: embeddedDynamic[3],
    };
  }

  return { kind: 'static', value: segment };
}

function scoreSegments(segments) {
  return segments.reduce((score, segment) => {
    if (segment.kind === 'static') return score + 40;
    if (segment.kind === 'embeddedParam') return score + 30;
    if (segment.kind === 'param') return score + 20;
    return score;
  }, segments.length);
}

const files = walk(functionsDir).sort();
const imports = [];
const routeRows = files.map((file, index) => {
  const relativeFromGenerated = path.relative(path.dirname(outFile), file).replaceAll(path.sep, '/');
  const importPath = relativeFromGenerated.startsWith('.') ? relativeFromGenerated : `./${relativeFromGenerated}`;
  imports.push(`import * as route${index} from '${importPath}';`);

  const relativeRoute = path.relative(functionsDir, file).replaceAll(path.sep, '/').replace(/\.ts$/, '');
  const parts = relativeRoute.split('/').filter(Boolean);
  const segments = parts.map(segmentToRoute);
  const routePath = `/api/${parts.map((part) => {
    const route = segmentToRoute(part);
    if (route.kind === 'catchAll') return `:${route.name}*`;
    if (route.kind === 'param') return `:${route.name}`;
    if (route.kind === 'embeddedParam') return `${route.prefix}:${route.name}${route.suffix}`;
    return route.value;
  }).join('/')}`;

  return {
    moduleName: `route${index}`,
    path: routePath,
    score: scoreSegments(segments),
    segments,
  };
});

routeRows.sort((a, b) => b.score - a.score || b.segments.length - a.segments.length || a.path.localeCompare(b.path));

const output = `${imports.join('\n')}

export type RouteSegment =
  | { kind: 'static'; value: string }
  | { kind: 'param'; name: string }
  | { kind: 'embeddedParam'; prefix: string; name: string; suffix: string }
  | { kind: 'catchAll'; name: string };

export interface FunctionRouteDefinition {
  path: string;
  score: number;
  segments: RouteSegment[];
  module: Record<string, unknown>;
}

export const functionRoutes: FunctionRouteDefinition[] = [
${routeRows.map((route) => `  {
    path: ${JSON.stringify(route.path)},
    score: ${route.score},
    segments: ${JSON.stringify(route.segments)},
    module: ${route.moduleName},
  }`).join(',\n')}
];
`;

mkdirSync(path.dirname(outFile), { recursive: true });
writeFileSync(outFile, output);
console.log(`Generated ${routeRows.length} API function routes`);
