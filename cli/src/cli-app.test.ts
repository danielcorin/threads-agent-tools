import { describe, expect, it, vi } from 'vitest';
import { runCli } from './cli-app.js';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Threads CLI adapter', () => {
  it('reports the source revision embedded in a distributable executable', async () => {
    let stdout = '';
    const code = await runCli(['--version'], {
      env: {},
      fetch: vi.fn(),
      version: 'v1.2.3',
      stdout: (text) => { stdout += text; },
      stderr: vi.fn(),
    });

    expect(code).toBe(0);
    expect(stdout).toBe('threads v1.2.3\n');
  });

  it('generates help from the shared action catalog without requiring a token', async () => {
    let stdout = '';
    const code = await runCli(['--help'], {
      env: {},
      fetch: vi.fn(),
      stdout: (text) => { stdout += text; },
      stderr: vi.fn(),
    });

    expect(code).toBe(0);
    expect(stdout).toContain('conversations list');
    expect(stdout).toContain('channels browse');
    expect(stdout).toContain('channels browse [--membership <any|joined|unjoined>]');
    expect(stdout).toContain('channels delete --channel-id <string>');
    expect(stdout).toContain('channels join');
    expect(stdout).toContain('messages send');
    expect(stdout).toContain('--channel-id <string>');
    expect(stdout).toContain('[--content <string>]');
    expect(stdout).toContain('[--file <path>]...');
    expect(stdout).toContain('drafts schedule --draft-id <string> --scheduled-at <string|null>');
  });

  it('parses generic flags from action schemas and prints JSON', async () => {
    const fetchMock = vi.fn(async () => json({ results: [], total: 0, hasMore: false, offset: 0, limit: 5 }));
    let stdout = '';
    const code = await runCli([
      '--pretty',
      'messages',
      'search',
      '--query',
      'build status',
      '--channel-id',
      'channel-1',
      '--limit',
      '5',
    ], {
      env: {
        THREADS_API: 'https://example.threads.space/api',
        THREADS_TOKEN: 'secret',
      },
      fetch: fetchMock as any,
      stdout: (text) => { stdout += text; },
      stderr: vi.fn(),
    });

    expect(code).toBe(0);
    expect(stdout).toBe(`${JSON.stringify({ results: [], total: 0, has_more: false, offset: 0, limit: 5 }, null, 2)}\n`);
    const request = (fetchMock.mock.calls as any[][])[0][0] as Request;
    expect(request.url).toBe('https://example.threads.space/api/search?q=build%20status&channel=channel-1&limit=5');
  });

  it('accepts complex values through --input JSON with flags taking precedence', async () => {
    const fetchMock = vi.fn(async () => json({ id: 'message-1', content: 'from flag' }, 201));
    const code = await runCli([
      'messages',
      'send',
      '--input',
      '{"channel_id":"channel-1","content":"from json","metadata":{"source":"test"}}',
      '--content',
      'from flag',
    ], {
      env: { THREADS_API_URL: 'https://example.test/api', THREADS_BOT_TOKEN: 'secret' },
      fetch: fetchMock as any,
      stdout: vi.fn(),
      stderr: vi.fn(),
    });

    expect(code).toBe(0);
    const request = (fetchMock.mock.calls as any[][])[0][0] as Request;
    expect(await request.json()).toMatchObject({ content: 'from flag', metadata: { source: 'test' } });
  });

  it('uploads repeated local files before sending a message', async () => {
    let uploadNumber = 0;
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const request = input instanceof Request ? input : new Request(input);
      if (new URL(request.url).pathname === '/api/uploads') {
        uploadNumber += 1;
        return json({
          id: `attachment-${uploadNumber}`,
          filename: uploadNumber === 1 ? 'build.log' : 'screenshot.png',
          contentType: 'text/plain',
          sizeBytes: 5,
          url: `/uploads/attachment-${uploadNumber}`,
        }, 201);
      }
      return json({
        id: 'message-1',
        content: '',
        attachmentIds: ['attachment-1', 'attachment-2'],
      }, 201);
    });
    const readLocalFile = vi.fn(async (filePath: string) => ({
      filename: filePath.split('/').at(-1) ?? filePath,
      content_type: 'text/plain',
      base64_data: 'aGVsbG8=',
    }));

    const code = await runCli([
      'messages',
      'send',
      '--channel-id',
      'channel-1',
      '--file',
      './build.log',
      '--image',
      './screenshot.png',
    ], {
      env: { THREADS_API: 'https://example.test/api', THREADS_TOKEN: 'secret' },
      fetch: fetchMock as any,
      readLocalFile,
      stdout: vi.fn(),
      stderr: vi.fn(),
    });

    expect(code).toBe(0);
    expect(readLocalFile.mock.calls).toEqual([
      ['./build.log'],
      ['./screenshot.png'],
    ]);
    const sendRequest = (fetchMock.mock.calls as any[][])
      .map((call) => call[0])
      .find((input) => input instanceof Request && new URL(input.url).pathname.endsWith('/messages')) as Request;
    expect(await sendRequest.json()).toMatchObject({
      content: '',
      attachmentIds: ['attachment-1', 'attachment-2'],
    });
  });

  it('reads piped stdin when message content is omitted', async () => {
    const fetchMock = vi.fn(async () => json({ id: 'message-1', content: 'from stdin' }, 201));
    const code = await runCli([
      'messages',
      'send',
      '--channel-id',
      'channel-1',
    ], {
      env: { THREADS_API: 'https://example.test/api', THREADS_TOKEN: 'secret' },
      fetch: fetchMock as any,
      readStdin: async () => '  from stdin\n',
      stdout: vi.fn(),
      stderr: vi.fn(),
    });

    expect(code).toBe(0);
    const request = (fetchMock.mock.calls as any[][])[0][0] as Request;
    expect(await request.json()).toMatchObject({ content: 'from stdin' });
  });

  it('parses null for nullable union flags', async () => {
    const fetchMock = vi.fn(async () => json({ ok: true }));
    const code = await runCli([
      'channels',
      'update',
      '--channel-id',
      'channel-1',
      '--auto-respond-bot-id',
      'null',
    ], {
      env: { THREADS_API: 'https://example.test/api', THREADS_TOKEN: 'secret' },
      fetch: fetchMock as any,
      stdout: vi.fn(),
      stderr: vi.fn(),
    });

    expect(code).toBe(0);
    const request = (fetchMock.mock.calls as any[][])[0][0] as Request;
    expect(await request.json()).toMatchObject({ auto_respond_bot_id: null });
  });

  it('prints enum choices when validation rejects a CLI value', async () => {
    let stderr = '';
    const code = await runCli([
      'channels', 'browse', '--membership', 'member',
    ], {
      env: { THREADS_API: 'https://example.test/api', THREADS_TOKEN: 'secret' },
      fetch: vi.fn(),
      stdout: vi.fn(),
      stderr: (text) => { stderr += text; },
    });

    expect(code).toBe(2);
    expect(stderr).toContain('allowed: "any", "joined", "unjoined"');
  });

  it('returns a concise error and non-zero status when credentials are missing', async () => {
    let stderr = '';
    const code = await runCli(['whoami'], {
      env: {},
      fetch: vi.fn(),
      stdout: vi.fn(),
      stderr: (text) => { stderr += text; },
    });

    expect(code).toBe(2);
    expect(stderr).toContain('No API token provided');
    expect(stderr).not.toContain('undefined');
  });
});
