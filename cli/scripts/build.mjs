import { chmod, copyFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

import { resolveArtifactMetadata } from './artifact-metadata.mjs';

const callerDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const rootDir = callerDir;
const metadata = resolveArtifactMetadata({ rootDir });
const cliDefine = {
  __THREADS_CLI_VERSION__: JSON.stringify(metadata.version),
};

await mkdir(new URL('../dist', import.meta.url), { recursive: true });

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  outfile: 'dist/index.js',
  sourcemap: true,
});

await build({
  entryPoints: ['src/cli.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  outfile: 'dist/cli.js',
  sourcemap: true,
  define: cliDefine,
});

// pkg consumes one CommonJS entrypoint and embeds it with the Node runtime to
// produce native executables that do not require Node on the target machine.
await build({
  entryPoints: ['src/cli.ts'],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node22',
  outfile: 'dist/cli.cjs',
  define: cliDefine,
});

// Publish only the stable caller declarations at the package root.
const declarationSource = new URL('../dist/cli/src/', import.meta.url);
for (const file of ['index.d.ts', 'caller.d.ts', 'contract.d.ts', 'errors.d.ts']) {
  await copyFile(new URL(file, declarationSource), new URL(`../dist/${file}`, import.meta.url));
}
await rm(new URL('../dist/cli/', import.meta.url), { force: true, recursive: true });
await rm(new URL('../dist/generated/', import.meta.url), { force: true, recursive: true });

await chmod(new URL('../dist/cli.js', import.meta.url), 0o755);
