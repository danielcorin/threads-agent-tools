import { describe, expect, it, vi } from 'vitest';
import openApiSpec from '../../contracts/threads.json';
import {
  CallerContractError,
  CallerInputError,
  ThreadsApiError,
  createCaller,
} from './index.js';

const currentUser = {
  id: 'user-1',
  username: 'dan',
  email: 'dan@example.com',
  email_verified_at: 1,
  pending_email: null,
  email_verification_expires_at: null,
  display_name: null,
  name_color: null,
  code_theme: null,
  role: 'human',
  ephemeral_bot_id: null,
  bot_capabilities: null,
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function operationsById(): Map<string, unknown> {
  const operations = Object.values(openApiSpec.paths).flatMap((pathItem) =>
    Object.values(pathItem)
      .filter((operation): operation is { operationId: string } =>
        typeof operation === 'object' && operation !== null && 'operationId' in operation,
      )
      .map((operation) => [operation.operationId, operation] as const),
  );
  return new Map(operations);
}

describe('caller action contract', () => {
  it('publishes a curated, closed catalog backed by real OpenAPI operations', () => {
    const caller = createCaller({
      baseUrl: 'https://example.threads.space/api',
      token: 'secret',
      fetch: vi.fn(),
    });

    const actions = caller.listActions();
    expect(actions.map((action) => action.name)).toEqual([
      'whoami',
      'list_conversations',
      'browse_channels',
      'find_channels',
      'get_channel',
      'create_channel',
      'update_channel',
      'delete_channel',
      'join_channel',
      'leave_channel',
      'list_channel_members',
      'add_channel_member',
      'remove_channel_member',
      'set_channel_notifications',
      'search_users',
      'create_dm',
      'create_dm_by_username',
      'list_mentions',
      'mark_read',
      'list_messages',
      'get_message',
      'get_thread',
      'search_messages',
      'send_message',
      'reply_to_message',
      'edit_message',
      'delete_message',
      'resolve_message',
      'unresolve_message',
      'set_thread_title',
      'retry_message',
      'set_message_process_status',
      'upload_attachment',
      'add_reaction',
      'remove_reaction',
      'list_pins',
      'pin_message',
      'unpin_message',
      'create_ephemeral_channel',
      'archive_ephemeral_channel',
      'unarchive_ephemeral_channel',
      'rename_ephemeral_channel',
      'promote_ephemeral_channel',
      'regenerate_ephemeral_name',
      'list_processes',
      'create_process',
      'get_process',
      'update_process',
      'record_process_activity',
      'cleanup_processes_by_bot',
      'kill_process',
      'kill_all_processes',
      'get_board',
      'create_board',
      'update_board',
      'create_board_card',
      'update_board_card',
      'delete_board_card',
      'list_saved_drafts',
      'create_saved_draft',
      'schedule_saved_draft',
      'delete_saved_draft',
    ]);

    const knownOperations = operationsById();
    for (const action of actions) {
      expect(action.inputSchema.type, action.name).toBe('object');
      expect(action.outputSchema.type, action.name).toBe('object');
      expect(action.inputSchema).toHaveProperty('properties');
      expect(action.outputSchema).toHaveProperty('properties');
      expect(action.inputSchema).not.toHaveProperty('anyOf');
      expect(action.inputSchema.additionalProperties, action.name).toBe(false);
      expect(action.operationIds.length, action.name).toBeGreaterThan(0);
      expect(action).not.toHaveProperty('execute');
      for (const operationId of action.operationIds) {
        const operation = knownOperations.get(operationId);
        expect(operation, `${action.name}: ${operationId}`).toBeDefined();
        expect(JSON.stringify(operation), `${action.name}: ${operationId}`).not.toContain('Placeholder');
      }
    }
  });

  it('serializes bearer-authenticated requests through the generated client', async () => {
    const fetchMock = vi.fn(async () => json(currentUser));
    const caller = createCaller({
      baseUrl: 'https://example.threads.space/api/',
      token: 'top-secret',
      fetch: fetchMock as any,
    });

    await expect(caller.run('whoami', {})).resolves.toEqual(currentUser);

    const request = (fetchMock.mock.calls as any[][])[0][0] as Request;
    expect(request.url).toBe('https://example.threads.space/api/users/me');
    expect(request.method).toBe('GET');
    expect(request.headers.get('Authorization')).toBe('Bearer top-secret');
  });

  it('composes goal-level actions from multiple API operations', async () => {
    const fetchMock = vi.fn(async (request: Request) => {
      const path = new URL(request.url).pathname;
      if (path.endsWith('/channels')) return json([{
        id: 'channel-1',
        name: 'joined-channel',
        description: null,
        is_private: 0,
        is_dm: 0,
        processing_mode: 'immediate',
        is_ephemeral: 0,
        archived_at: null,
        notifications: 'all',
        has_unread: 0,
        unread_count: 0,
      }]);
      if (path.endsWith('/dms')) return json([]);
      return json({ error: 'not found' }, 404);
    });
    const caller = createCaller({ baseUrl: 'https://example.test/api', token: 'secret', fetch: fetchMock as any });

    await expect(caller.run('list_conversations', {})).resolves.toMatchObject({
      channels: [{ id: 'channel-1', is_member: true }],
      dms: [],
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('includes enum values in input validation issues', async () => {
    const caller = createCaller({ baseUrl: 'https://example.test/api', token: 'secret', fetch: vi.fn() });

    await expect(caller.run('browse_channels', { membership: 'member' })).rejects.toThrow(
      'allowed: "any", "joined", "unjoined"',
    );
  });

  it('discovers public channels and joins one through the generated client', async () => {
    const fetchMock = vi.fn(async (request: Request) => {
      const url = new URL(request.url);
      if (request.method === 'GET' && url.pathname.endsWith('/channels/browse')) return json([]);
      if (request.method === 'POST' && url.pathname.endsWith('/channels/channel-1/join')) return json({ ok: true });
      return json({ error: 'not found' }, 404);
    });
    const caller = createCaller({ baseUrl: 'https://example.test/api', token: 'secret', fetch: fetchMock as any });

    await expect(caller.run('browse_channels', {})).resolves.toEqual({ channels: [] });
    await expect(caller.run('join_channel', { channel_id: 'channel-1' })).resolves.toEqual({ ok: true });

    const requests = (fetchMock.mock.calls as any[][]).map((call) => call[0] as Request);
    expect(requests.map((request) => [request.method, request.url])).toEqual([
      ['GET', 'https://example.test/api/channels/browse'],
      ['POST', 'https://example.test/api/channels/channel-1/join'],
    ]);
  });

  it('deletes a channel through the generated client', async () => {
    const fetchMock = vi.fn(async () => json({ ok: true }));
    const caller = createCaller({ baseUrl: 'https://example.test/api', token: 'secret', fetch: fetchMock as any });

    await expect(caller.run('delete_channel', { channel_id: 'channel-1' })).resolves.toEqual({ ok: true });

    const request = (fetchMock.mock.calls as any[][])[0][0] as Request;
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe('https://example.test/api/channels/channel-1');
  });

  it('maps stable action inputs to the current API wire shape', async () => {
    const fetchMock = vi.fn(async () => json({ id: 'message-1', content: 'hello' }, 201));
    const caller = createCaller({ baseUrl: 'https://example.test/api', token: 'secret', fetch: fetchMock as any });

    await caller.run('send_message', {
      channel_id: 'channel-1',
      content: 'hello',
      thread_id: 'thread-1',
      attachment_ids: ['upload-1'],
      metadata: { source: 'cli' },
      message_type: 'response',
      idempotency_key: 'attempt-1',
    });

    const request = (fetchMock.mock.calls as any[][])[0][0] as Request;
    expect(request.url).toBe('https://example.test/api/channels/channel-1/messages');
    expect(await request.json()).toEqual({
      content: 'hello',
      threadId: 'thread-1',
      attachmentIds: ['upload-1'],
      metadata: { source: 'cli' },
      message_type: 'response',
      idempotencyKey: 'attempt-1',
    });
  });

  it('accepts valid process records with canonical statuses', async () => {
    const process = {
      id: 'process-1',
      channel_id: 'channel-1',
      message_id: 'message-1',
      user_id: 'user-1',
      status: 'killed',
      started_at: '2026-07-14T12:00:00.000Z',
    };
    const caller = createCaller({
      baseUrl: 'https://example.test/api',
      token: 'secret',
      fetch: vi.fn(async () => json({ processes: [process] })),
    });

    await expect(caller.run('list_processes', {})).resolves.toEqual({ processes: [process] });
  });

  it('maps the complete process lifecycle to the generated API client', async () => {
    const fetchMock = vi.fn(async (request: Request) => {
      const url = new URL(request.url);
      if (request.method === 'POST' && url.pathname.endsWith('/processes')) {
        return json({ id: 'process-1', status: 'queued' }, 201);
      }
      if (url.pathname.endsWith('/processes/cleanup-by-bot') || url.pathname.endsWith('/processes/kill-all')) {
        return json({ cleaned: 0, process_ids: [] });
      }
      return json({ ok: true });
    });
    const caller = createCaller({ baseUrl: 'https://example.test/api', token: 'secret', fetch: fetchMock as any });

    await caller.run('create_process', {
      channel_id: 'channel-1',
      message_id: 'message-1',
      status: 'queued',
    });
    await caller.run('set_message_process_status', {
      message_id: 'message-1',
      process_id: 'process-1',
      status: 'processing',
      input_tokens: 10,
    });
    await caller.run('record_process_activity', {
      process_id: 'process-1',
      type: 'token_usage',
      input_tokens: 10,
      output_tokens: 2,
    });
    await caller.run('update_process', {
      process_id: 'process-1',
      status: 'done',
      tool_call_count: 1,
    });
    await caller.run('cleanup_processes_by_bot', {});
    await caller.run('kill_all_processes', {});

    const requests = (fetchMock.mock.calls as any[][]).map((call) => call[0] as Request);
    expect(requests.map((request) => [request.method, new URL(request.url).pathname])).toEqual([
      ['POST', '/api/processes'],
      ['POST', '/api/messages/message-1/process'],
      ['POST', '/api/processes/process-1/activity'],
      ['PATCH', '/api/processes/process-1'],
      ['POST', '/api/processes/cleanup-by-bot'],
      ['POST', '/api/processes/kill-all'],
    ]);
    expect(await requests[0].json()).toEqual({
      channel_id: 'channel-1',
      message_id: 'message-1',
      status: 'queued',
    });
    expect(await requests[1].json()).toEqual({
      processId: 'process-1',
      status: 'processing',
      input_tokens: 10,
    });
  });

  it('rejects invalid inputs before making a request', async () => {
    const fetchMock = vi.fn();
    const caller = createCaller({ baseUrl: 'https://example.test/api', token: 'secret', fetch: fetchMock });

    await expect(caller.run('send_message', { content: 'missing channel' })).rejects.toBeInstanceOf(CallerInputError);
    await expect(caller.run('update_process', { process_id: 'process-1' })).rejects.toBeInstanceOf(CallerInputError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('turns documented API errors into a stable error type', async () => {
    const caller = createCaller({
      baseUrl: 'https://example.test/api',
      token: 'secret',
      fetch: vi.fn(async () => json({ error: 'Forbidden' }, 403)),
    });

    const error = await caller.run('whoami', {}).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ThreadsApiError);
    expect(error).toMatchObject({ status: 403, message: 'Forbidden', details: { error: 'Forbidden' } });
  });

  it('detects API response drift at the caller seam', async () => {
    const caller = createCaller({
      baseUrl: 'https://example.test/api',
      token: 'secret',
      fetch: vi.fn(async () => json({ id: 'user-1', username: 'dan' })),
    });

    await expect(caller.run('whoami', {})).rejects.toBeInstanceOf(CallerContractError);
  });

  it('rejects unknown actions without touching the network', async () => {
    const fetchMock = vi.fn();
    const caller = createCaller({ baseUrl: 'https://example.test/api', token: 'secret', fetch: fetchMock });

    await expect(caller.run('delete_everything', {})).rejects.toThrow('Unknown Threads action');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
