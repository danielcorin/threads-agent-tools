#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import openapiTS, { astToString } from 'openapi-typescript';

const cliDir = fileURLToPath(new URL('..', import.meta.url));
const repositoryDir = path.resolve(cliDir, '..');
const generatedDir = path.join(cliDir, 'generated');
const sourceFiles = {
  'contracts/threads.json': path.join(repositoryDir, 'contracts', 'threads.json'),
  'contracts/ws-events.yaml': path.join(repositoryDir, 'contracts', 'ws-events.yaml'),
};

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeNewlines(value) {
  return value.replaceAll('\r\n', '\n');
}

async function generatedFiles() {
  const threadsSource = normalizeNewlines(
    await readFile(sourceFiles['contracts/threads.json'], 'utf8'),
  );
  const wsEventsSource = normalizeNewlines(
    await readFile(sourceFiles['contracts/ws-events.yaml'], 'utf8'),
  );
  const openApiDocument = JSON.parse(threadsSource);
  const threadsTypes = normalizeNewlines(
    astToString(await openapiTS(pathToFileURL(sourceFiles['contracts/threads.json']))),
  );
  const wsEventTypes = normalizeNewlines(
    astToString(await openapiTS(pathToFileURL(sourceFiles['contracts/ws-events.yaml']))),
  );
  const manifest = {
    name: 'threads-api-contract',
    version: openApiDocument.info.version,
    files: Object.fromEntries(
      Object.entries({ ...sourceFiles }).map(([name]) => [
        name,
        { sha256: sha256(name === 'contracts/threads.json' ? threadsSource : wsEventsSource) },
      ]),
    ),
  };

  return new Map([
    ['types/threads.d.ts', threadsTypes],
    ['types/ws-events.d.ts', wsEventTypes],
    ['contract-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`],
  ]);
}

const check = process.argv.includes('--check');
let failed = false;
for (const [relativePath, expected] of await generatedFiles()) {
  const outputPath = path.join(generatedDir, relativePath);
  if (check) {
    const actual = await readFile(outputPath, 'utf8')
      .then(normalizeNewlines)
      .catch(() => undefined);
    if (actual !== expected) {
      console.error(`${path.relative(repositoryDir, outputPath)} is stale; run npm run contract:generate`);
      failed = true;
    }
  } else {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, expected);
    console.log(`generated ${path.relative(repositoryDir, outputPath)}`);
  }
}

if (failed) process.exit(1);
