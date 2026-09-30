#!/usr/bin/env node
// ============================================================
// regen-certificate 启动器（部署后自愈）
//
// 背景：部署脚本会清空并覆盖 /opt/hamorey/apps/api/，因此打包产物不能放在那里
// （否则每次部署后工具即失效）。本启动器把产物放在部署不清理的
// /opt/hamorey/scripts/regen/ 下，并在每次运行时自检：
//   1) 产物是否存在？
//   2) 产物 sidecar（<产物>.commit）记录的来源提交是否等于
//      /opt/hamorey/apps/DEPLOYED_COMMIT？
// 任一不满足（首次运行 / 刚部署过 / 切换到别的提交）→ 自动从权威部署产物
// /opt/hamorey/releases/<DEPLOYED_COMMIT>/ 重新构建，然后再执行。
//
// 权威源码是 /opt/hamorey/releases/<DEPLOYED_COMMIT>/（部署时解包 + npm ci）。
// 切勿使用历史遗留的 source 目录与 apps 下的 functions 旧副本（均停留在 2026-08-11）。
//
// 依赖解析：产物为 ESM，bare import 不认 NODE_PATH，故在 /opt/hamorey/scripts/
// 下建立软链 node_modules -> /opt/hamorey/apps/api/node_modules（ESM 向上查找命中）。
// 用 server/scripts/install-regen-tool.sh 安装/修复本启动器与软链。
//
// 用法（与工具本体完全一致）：
//   set -a; . /etc/hamorey/api.env; set +a
//   node /opt/hamorey/scripts/regen-certificate.mjs --cert-no=<证书号> [--dry-run] [--issue-date=YYYY-MM-DD]
//   node /opt/hamorey/scripts/regen-certificate.mjs --restore --cert-no=<证书号> [--backup-key=<key>] [--dry-run]
// ============================================================

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const SCRIPTS_DIR = '/opt/hamorey/scripts';
const TOOL_DIR = join(SCRIPTS_DIR, 'regen');
const ARTIFACT = join(TOOL_DIR, 'regen-certificate.mjs');
const SIDECAR = `${ARTIFACT}.commit`;
const DEPLOYED_COMMIT_FILE = '/opt/hamorey/apps/DEPLOYED_COMMIT';
const RELEASES_DIR = '/opt/hamorey/releases';

// 自愈诊断输出走 stderr，保持 stdout 只属于工具本体。
const log = (msg) => process.stderr.write(`[regen-certificate] ${msg}\n`);

function readText(path) {
  try {
    return readFileSync(path, 'utf8').trim();
  } catch {
    return '';
  }
}

function findEsbuild(root) {
  const candidates = [
    join(root, 'node_modules', '.bin', 'esbuild'),
    join(root, 'server', 'node_modules', '.bin', 'esbuild'),
  ];
  return candidates.find((p) => existsSync(p)) || '';
}

function rebuild() {
  const commit = readText(DEPLOYED_COMMIT_FILE);
  if (!commit) {
    log(`错误：无法读取部署提交（${DEPLOYED_COMMIT_FILE} 为空或不存在）。`);
    process.exit(1);
  }

  const releaseRoot = join(RELEASES_DIR, commit);
  const entry = join(releaseRoot, 'server', 'scripts', 'regen-certificate.ts');
  if (!existsSync(entry)) {
    log(`错误：部署产物中找不到入口文件：${entry}`);
    log(`请确认提交 ${commit} 已被部署脚本解包到 ${releaseRoot}。`);
    process.exit(1);
  }

  const esbuild = findEsbuild(releaseRoot);
  if (!esbuild) {
    log(`错误：在 ${releaseRoot} 下找不到 esbuild（已尝试 node_modules/.bin 与 server/node_modules/.bin）。`);
    process.exit(1);
  }

  log(`检测到部署变更（产物缺失或提交不匹配），正在从 ${releaseRoot} 重建…`);
  mkdirSync(TOOL_DIR, { recursive: true });

  const result = spawnSync(
    esbuild,
    [
      join('server', 'scripts', 'regen-certificate.ts'),
      '--bundle',
      '--platform=node',
      '--format=esm',
      '--target=node22',
      '--charset=utf8',
      `--outfile=${ARTIFACT}`,
      '--packages=external',
    ],
    { cwd: releaseRoot, encoding: 'utf8' },
  );

  if (result.status !== 0 || !existsSync(ARTIFACT)) {
    log('错误：重建失败。');
    log(`  源目录: ${releaseRoot}`);
    log(`  入口  : ${entry}`);
    log(`  esbuild: ${esbuild}`);
    const detail = (result.stderr || result.stdout || '').trim();
    if (detail) log(detail);
    process.exit(1);
  }

  writeFileSync(SIDECAR, `${commit}\n`);
  log(`重建完成（来源提交 ${commit.slice(0, 12)}）。`);
}

const deployedCommit = readText(DEPLOYED_COMMIT_FILE);
const builtCommit = readText(SIDECAR);
if (!existsSync(ARTIFACT) || !deployedCommit || builtCommit !== deployedCommit) {
  rebuild();
}

await import(pathToFileURL(ARTIFACT).href);
