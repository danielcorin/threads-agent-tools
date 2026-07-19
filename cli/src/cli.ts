#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { runCli } from './cli-app.js';

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  '.csv': 'text/csv',
  '.gif': 'image/gif',
  '.htm': 'text/html',
  '.html': 'text/html',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.md': 'text/markdown',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.webp': 'image/webp',
  '.zip': 'application/zip',
};

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return '';
  let input = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) input += String(chunk);
  return input;
}

void runCli(process.argv.slice(2), {
  env: process.env,
  fetch: globalThis.fetch,
  readLocalFile: async (filePath) => {
    const data = await readFile(filePath);
    return {
      filename: path.basename(filePath),
      content_type: CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      base64_data: data.toString('base64'),
    };
  },
  readStdin,
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
}).then(
  (exitCode) => {
    process.exitCode = exitCode;
  },
  (error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  },
);
