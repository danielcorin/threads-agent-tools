#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import openapiTS, { astToString } from 'openapi-typescript';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const generatedDir = path.join(rootDir, 'generated');
const sourceFiles = {
  'openapi/threads.json': path.join(rootDir, 'openapi', 'threads.json'),
  'openapi/ws-events.yaml': path.join(rootDir, 'openapi', 'ws-events.yaml'),
};

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function generatedFiles() {
  const threadsSource = await readFile(sourceFiles['openapi/threads.json'], 'utf8');
  const wsEventsSource = await readFile(sourceFiles['openapi/ws-events.yaml'], 'utf8');
  const openApiDocument = JSON.parse(threadsSource);
  const threadsTypes = astToString(await openapiTS(pathToFileURL(sourceFiles['openapi/threads.json'])));
  const wsEventTypes = astToString(await openapiTS(pathToFileURL(sourceFiles['openapi/ws-events.yaml'])));
  const manifest = {
    name: 'threads-api-contract',
    version: openApiDocument.info.version,
    files: Object.fromEntries(
      Object.entries({ ...sourceFiles }).map(([name]) => [
        name,
        { sha256: sha256(name === 'openapi/threads.json' ? threadsSource : wsEventsSource) },
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
    const actual = await readFile(outputPath, 'utf8').catch(() => undefined);
    if (actual !== expected) {
      console.error(`${path.relative(rootDir, outputPath)} is stale; run npm run contract:generate`);
      failed = true;
    }
  } else {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, expected);
    console.log(`generated ${path.relative(rootDir, outputPath)}`);
  }
}

if (failed) process.exit(1);
