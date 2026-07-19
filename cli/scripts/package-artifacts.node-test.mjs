import assert from 'node:assert/strict';
import test from 'node:test';

import {
  artifactFilename,
  resolveTargetIds,
  targetForHost,
} from './package-artifacts.mjs';

test('the CLI distribution covers the bridge platforms', () => {
  assert.deepEqual(resolveTargetIds(['all']), [
    'linux-x64',
    'linux-arm64',
    'darwin-x64',
    'darwin-arm64',
    'windows-x64',
  ]);
});

test('target selection accepts host and explicit target ids', () => {
  assert.equal(targetForHost('darwin', 'arm64'), 'darwin-arm64');
  assert.equal(targetForHost('win32', 'x64'), 'windows-x64');
  assert.deepEqual(resolveTargetIds(['host'], { platform: 'linux', arch: 'x64' }), ['linux-x64']);
  assert.deepEqual(resolveTargetIds(['windows-x64', 'linux-arm64']), [
    'windows-x64',
    'linux-arm64',
  ]);
  assert.throws(() => resolveTargetIds(['solaris-x64']), /Unknown CLI target/);
});

test('artifact filenames are stable and Windows executables have an exe suffix', () => {
  assert.equal(artifactFilename('linux-x64'), 'threads-linux-x64');
  assert.equal(artifactFilename('darwin-arm64'), 'threads-darwin-arm64');
  assert.equal(artifactFilename('windows-x64'), 'threads-windows-x64.exe');
});
