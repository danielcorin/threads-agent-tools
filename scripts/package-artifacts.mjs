#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmod, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { resolveArtifactMetadata } from './artifact-metadata.mjs';

const TARGETS = new Map([
  ['linux-x64', { pkg: 'node22-linux-x64' }],
  ['linux-arm64', { pkg: 'node22-linux-arm64' }],
  ['darwin-x64', { pkg: 'node22-macos-x64' }],
  ['darwin-arm64', { pkg: 'node22-macos-arm64' }],
  ['windows-x64', { pkg: 'node22-win-x64' }],
]);
const require = createRequire(import.meta.url);

export function artifactFilename(targetId) {
  if (!TARGETS.has(targetId)) throw new Error(`Unknown CLI target: ${targetId}`);
  return `threads-${targetId}${targetId.startsWith('windows-') ? '.exe' : ''}`;
}

export function targetForHost(platform = process.platform, arch = process.arch) {
  const os = platform === 'win32' ? 'windows' : platform === 'darwin' ? 'darwin' : platform;
  const targetId = `${os}-${arch}`;
  if (!TARGETS.has(targetId)) {
    throw new Error(`The current host ${platform}-${arch} is not a supported CLI target`);
  }
  return targetId;
}

export function resolveTargetIds(
  requested = ['all'],
  host = { platform: process.platform, arch: process.arch },
) {
  const expanded = requested.flatMap((target) => {
    if (target === 'all') return [...TARGETS.keys()];
    if (target === 'host') return [targetForHost(host.platform, host.arch)];
    return target.split(',').filter(Boolean);
  });
  const unique = [...new Set(expanded)];
  for (const targetId of unique) {
    if (!TARGETS.has(targetId)) throw new Error(`Unknown CLI target: ${targetId}`);
  }
  return unique;
}

function parseArgs(args) {
  const targets = [];
  let outputDir;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--target' || arg === '--targets') {
      const value = args[index + 1];
      if (!value) throw new Error(`${arg} requires a value`);
      targets.push(value);
      index += 1;
    } else if (arg === '--output-dir') {
      outputDir = args[index + 1];
      if (!outputDir) throw new Error('--output-dir requires a value');
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return { targets: targets.length > 0 ? targets : ['all'], outputDir };
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${path.basename(command)} exited with status ${result.status}`);
  }
}

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

export async function packageArtifacts({
  rootDir,
  callerDir = rootDir,
  outputDir = path.join(rootDir, 'dist', 'cli'),
  targetIds = ['all'],
  metadata = resolveArtifactMetadata({ rootDir }),
}) {
  const selectedTargets = resolveTargetIds(targetIds);
  const entry = path.join(callerDir, 'dist', 'cli.cjs');
  const pkgPackagePath = require.resolve('@yao-pkg/pkg/package.json');
  const pkgPackage = JSON.parse(await readFile(pkgPackagePath, 'utf8'));
  const pkgScript = path.resolve(path.dirname(pkgPackagePath), pkgPackage.bin.pkg);

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  const files = [];
  for (const targetId of selectedTargets) {
    const filename = artifactFilename(targetId);
    const output = path.join(outputDir, filename);
    run(process.execPath, [
      pkgScript,
      entry,
      '--target',
      TARGETS.get(targetId).pkg,
      '--output',
      output,
      '--compress',
      'GZip',
    ], { cwd: callerDir });

    if (!targetId.startsWith('windows-')) await chmod(output, 0o755);
    if (targetId === targetForHost()) {
      run(output, ['--help'], { cwd: callerDir });
    }
    const fileStat = await stat(output);
    files.push({
      target: targetId,
      file: filename,
      size: fileStat.size,
      sha256: await sha256(output),
    });
  }

  const manifest = {
    name: 'threads-cli',
    version: metadata.version,
    gitSha: metadata.gitSha,
    generatedAt: metadata.generatedAt,
    files,
  };
  await writeFile(
    path.join(outputDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return { outputDir, manifest };
}

const scriptPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : undefined;
if (scriptPath === import.meta.url) {
  const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const callerDir = rootDir;
  const args = parseArgs(process.argv.slice(2));
  const outputDir = args.outputDir ? path.resolve(args.outputDir) : undefined;
  const result = await packageArtifacts({
    rootDir,
    callerDir,
    outputDir,
    targetIds: args.targets,
  });
  console.log(
    `Built ${result.manifest.files.length} CLI artifact(s) in ${path.relative(rootDir, result.outputDir)}`,
  );
}
