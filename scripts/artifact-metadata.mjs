import { spawnSync } from 'node:child_process';

function git(rootDir, args) {
  const result = spawnSync('git', ['-C', rootDir, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return result.status === 0 ? result.stdout.trim() : undefined;
}

function timestampFromEpoch(value) {
  if (!value) return undefined;
  const seconds = Number(value);
  if (!Number.isFinite(seconds)) {
    throw new Error(`SOURCE_DATE_EPOCH must be a number, received: ${value}`);
  }
  return new Date(seconds * 1000).toISOString();
}

/**
 * Resolve one revision identity for every distributable artifact.
 *
 * CI may override the version for a release tag, while gitSha always identifies
 * the exact source. Using the commit timestamp by default keeps repeat builds of
 * the same revision byte-for-byte stable.
 */
export function resolveArtifactMetadata({
  rootDir,
  env = process.env,
  now = () => new Date(),
}) {
  const gitSha = env.THREADS_ARTIFACT_GIT_SHA
    ?? env.GITHUB_SHA
    ?? git(rootDir, ['rev-parse', 'HEAD']);
  if (!gitSha) {
    throw new Error(
      'Cannot determine the artifact git SHA. Build from a git checkout or set THREADS_ARTIFACT_GIT_SHA.',
    );
  }

  const tagVersion = env.GITHUB_REF_TYPE === 'tag' ? env.GITHUB_REF_NAME : undefined;
  const version = env.THREADS_ARTIFACT_VERSION
    ?? env.THREADS_CONTRACT_VERSION
    ?? tagVersion
    ?? gitSha;
  const generatedAt = env.THREADS_ARTIFACT_GENERATED_AT
    ?? timestampFromEpoch(env.SOURCE_DATE_EPOCH)
    ?? git(rootDir, ['show', '-s', '--format=%cI', gitSha])
    ?? now().toISOString();

  return { version, gitSha, generatedAt };
}
