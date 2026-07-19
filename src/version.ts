declare const __THREADS_CLI_VERSION__: string | undefined;

export const CLI_VERSION = typeof __THREADS_CLI_VERSION__ === 'string'
  ? __THREADS_CLI_VERSION__
  : 'development';
