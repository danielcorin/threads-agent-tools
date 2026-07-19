import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const callerDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = resolve(callerDir, 'dist/cli.js');
const api = (process.env.THREADS_API ?? process.env.THREADS_API_URL ?? '').replace(/\/+$/, '');
const token = process.env.THREADS_TOKEN ?? process.env.THREADS_BOT_TOKEN;
const allowedOrigins = new Set([
  'https://staging.threads.space',
  'https://threads-staging.wvlenllc.workers.dev',
]);

if (!process.argv.includes('--confirm-writes')) {
  throw new Error('Refusing live audit without --confirm-writes');
}
if (!api || !allowedOrigins.has(new URL(api).origin) || !api.endsWith('/api')) {
  throw new Error(`Refusing non-staging API target: ${api || '(unset)'}`);
}
if (!token) throw new Error('Set THREADS_TOKEN or THREADS_BOT_TOKEN');

const env = {
  ...process.env,
  THREADS_API: api,
  THREADS_API_URL: api,
  THREADS_TOKEN: token,
  THREADS_BOT_TOKEN: token,
};
const passed = new Set();

function invoke(args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: callerDir,
    env,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  const stdout = result.stdout.trim();
  let body = null;
  if (stdout) {
    try {
      body = JSON.parse(stdout);
    } catch {
      body = stdout;
    }
  }
  return {
    status: result.status ?? 1,
    body,
    stdout,
    stderr: result.stderr.trim(),
  };
}

function run(label, args, { record = true } = {}) {
  const result = invoke(args);
  if (result.status !== 0) {
    throw new Error(`${label}: ${result.stderr || result.stdout || `exit ${result.status}`}`);
  }
  if (record && !passed.has(label)) {
    passed.add(label);
    console.log(`PASS ${label}`);
  }
  return result.body;
}

function bestEffort(args) {
  invoke(args);
}

const { createCaller } = await import('../dist/index.js');
const catalog = createCaller({ baseUrl: api, token }).listActions();
const expectedCommands = new Set(catalog.map((action) => action.command.join(' ')));
const suffix = Date.now().toString(36);
const channelName = `cli-audit-${suffix}`;
const marker = channelName;
const ownedMessages = [];
const processIds = [];
let channelId;
let promotedChannelId;
let draftId;
let cardId;
let pinnedMessageId;
let reactedMessageId;

try {
  const me = run('whoami', ['whoami']);
  if (me.username !== 'test-bot' || me.role !== 'bot') {
    throw new Error('whoami returned the wrong staging principal');
  }

  const initialProcesses = invoke(['processes', 'list']);
  if (initialProcesses.status !== 0) throw new Error(`process safety check: ${initialProcesses.stderr}`);
  const initialActive = initialProcesses.body.processes.filter(
    (process) => process.status === 'queued' || process.status === 'running',
  );
  if (initialActive.length > 0) {
    throw new Error(`refusing audit with active processes: ${initialActive.map((process) => process.id).join(', ')}`);
  }

  const conversations = run('conversations list', ['conversations', 'list']);
  if (conversations.channels.some((channel) => channel.is_member !== true)) {
    throw new Error('joined conversation returned is_member other than true');
  }
  run('channels browse', ['channels', 'browse', '--membership', 'joined', '--limit', '50']);
  const users = run('users search', ['users', 'search', '--query', 'admin']);
  const admin = users.users.find((user) => user.username === 'admin');
  if (!admin) throw new Error('admin user was not found in staging');

  const created = run('channels create', [
    'channels', 'create', '--name', channelName, '--description', 'Disposable CLI staging audit', '--is-private', 'false',
  ]);
  channelId = created.id;
  if (!channelId) throw new Error('channels create returned no id');

  run('channels find', ['channels', 'find', '--query', channelName, '--limit', '5']);
  run('channels get', ['channels', 'get', '--channel-id', channelId]);
  run('channels update', [
    'channels', 'update', '--channel-id', channelId, '--description', 'CLI staging audit in progress',
    '--processing-mode', 'serial', '--board-enabled', 'false', '--auto-respond-bot-id', 'null',
  ]);
  run('channels notifications', ['channels', 'notifications', '--channel-id', channelId, '--tier', 'mentions']);
  run('channels members list', ['channels', 'members', 'list', '--channel-id', channelId]);
  run('channels members add', ['channels', 'members', 'add', '--channel-id', channelId, '--username', 'admin']);
  run('channels members remove', ['channels', 'members', 'remove', '--channel-id', channelId, '--user-id', me.id]);
  run('channels join', ['channels', 'join', '--channel-id', channelId]);

  run('dms create', ['dms', 'create', '--user-id', admin.id]);
  run('dms create-by-username', ['dms', 'create-by-username', '--username', 'admin']);
  run('mentions list', ['mentions', 'list']);

  const root = run('messages send', [
    'messages', 'send', '--channel-id', channelId, '--content', `${marker} root`,
    '--metadata', JSON.stringify({ audit: marker }), '--idempotency-key', `${marker}-root`,
  ]);
  ownedMessages.push(root.id);
  run('messages get', ['messages', 'get', '--message-id', root.id]);
  run('messages list', ['messages', 'list', '--channel-id', channelId, '--limit', '25']);
  run('messages edit', ['messages', 'edit', '--message-id', root.id, '--content', `${marker} root edited`]);

  const reply = run('messages reply', [
    'messages', 'reply', '--message-id', root.id, '--content', `${marker} reply`, '--message-type', 'response',
    '--metadata', JSON.stringify({ audit: marker }), '--idempotency-key', `${marker}-reply`,
  ]);
  ownedMessages.push(reply.id);
  run('messages thread', ['messages', 'thread', '--message-id', root.id, '--latest', 'true', '--limit', '25']);
  run('messages title', [
    'messages', 'title', '--message-id', root.id, '--title', `${marker} thread`,
  ]);
  run('messages resolve', ['messages', 'resolve', '--message-id', root.id]);
  run('messages unresolve', ['messages', 'unresolve', '--message-id', root.id]);
  run('messages search', ['messages', 'search', '--query', marker, '--channel-id', channelId, '--limit', '25']);
  run('channels read', ['channels', 'read', '--channel-id', channelId]);

  run('reactions add', ['reactions', 'add', '--message-id', root.id, '--emoji', 'white_check_mark']);
  reactedMessageId = root.id;
  run('reactions remove', ['reactions', 'remove', '--message-id', root.id, '--emoji', 'white_check_mark']);
  reactedMessageId = undefined;

  run('pins add', ['pins', 'add', '--channel-id', channelId, '--message-id', root.id]);
  pinnedMessageId = root.id;
  run('pins list', ['pins', 'list', '--channel-id', channelId]);
  run('pins remove', ['pins', 'remove', '--channel-id', channelId, '--message-id', root.id]);
  pinnedMessageId = undefined;

  const upload = run('uploads create', [
    'uploads', 'create', '--filename', `${marker}.txt`, '--content-type', 'text/plain',
    '--base64-data', 'Y2xpIHN0YWdpbmcgc21va2UK',
  ]);
  const attachmentMessage = run('messages send', [
    'messages', 'send', '--channel-id', channelId, '--content', `${marker} attachment`,
    '--attachment-ids', JSON.stringify([upload.id]), '--message-type', 'progress',
  ]);
  ownedMessages.push(attachmentMessage.id);

  run('boards create', ['boards', 'create', '--channel-id', channelId]);
  run('boards get', ['boards', 'get', '--channel-id', channelId]);
  run('boards update', [
    'boards', 'update', '--channel-id', channelId, '--columns', JSON.stringify(['todo', 'in-progress', 'done']),
  ]);
  const card = run('boards cards create', [
    'boards', 'cards', 'create', '--channel-id', channelId, '--title', `${marker} card`,
    '--description', 'Disposable staging card', '--priority', 'normal', '--column-key', 'todo',
    '--source-message-id', root.id, '--metadata', JSON.stringify({ audit: marker }),
  ]);
  cardId = card.id;
  run('boards cards update', [
    'boards', 'cards', 'update', '--card-id', cardId, '--title', `${marker} card updated`,
    '--column-key', 'in-progress', '--assignee', admin.id, '--priority', 'high',
    '--position', '0', '--metadata', JSON.stringify({ audit: marker, updated: true }),
  ]);
  run('boards cards delete', ['boards', 'cards', 'delete', '--card-id', cardId]);
  cardId = undefined;

  const draft = run('drafts create', ['drafts', 'create', '--channel-id', channelId, '--content', `${marker} draft`]);
  draftId = draft.id;
  run('drafts list', ['drafts', 'list', '--channel-id', channelId]);
  run('drafts schedule', [
    'drafts', 'schedule', '--draft-id', draftId, '--scheduled-at', '2099-01-01T00:00:00.000Z',
  ]);
  run('drafts schedule', ['drafts', 'schedule', '--draft-id', draftId, '--scheduled-at', 'null'], { record: false });
  run('drafts delete', ['drafts', 'delete', '--draft-id', draftId]);
  draftId = undefined;

  const ephemeral = run('ephemeral create', ['ephemeral', 'create']);
  promotedChannelId = ephemeral.id;
  run('ephemeral regenerate-name', ['ephemeral', 'regenerate-name', '--channel-id', promotedChannelId]);
  run('ephemeral rename', ['ephemeral', 'rename', '--channel-id', promotedChannelId, '--slug', `cli-eph-${suffix}`]);
  run('ephemeral archive', ['ephemeral', 'archive', '--channel-id', promotedChannelId]);
  run('ephemeral unarchive', ['ephemeral', 'unarchive', '--channel-id', promotedChannelId]);
  run('ephemeral promote', ['ephemeral', 'promote', '--channel-id', promotedChannelId, '--name', `cli-private-${suffix}`]);

  run('processes list', ['processes', 'list']);

  const trigger1 = run('messages send', ['messages', 'send', '--channel-id', channelId, '--content', `${marker} process done`]);
  ownedMessages.push(trigger1.id);
  const process1 = run('processes create', [
    'processes', 'create', '--channel-id', channelId, '--message-id', trigger1.id, '--status', 'running',
  ]);
  processIds.push(process1.id);
  run('messages process-status', [
    'messages', 'process-status', '--message-id', trigger1.id, '--process-id', process1.id,
    '--status', 'processing', '--error-text', 'null',
  ]);
  run('processes get', ['processes', 'get', '--process-id', process1.id]);
  run('processes activity', ['processes', 'activity', '--process-id', process1.id, '--type', 'tool_call']);
  run('processes activity', ['processes', 'activity', '--process-id', process1.id, '--type', 'reply']);
  run('processes activity', [
    'processes', 'activity', '--process-id', process1.id, '--type', 'token_usage',
    '--input-tokens', '11', '--output-tokens', '7', '--cache-creation-input-tokens', '3', '--cache-read-input-tokens', '2',
  ]);
  run('processes update', [
    'processes', 'update', '--process-id', process1.id, '--status', 'done', '--tool-call-count', '2',
    '--reply-count', '1', '--input-tokens', '11', '--output-tokens', '7',
    '--cache-creation-input-tokens', '3', '--cache-read-input-tokens', '2',
  ]);

  const trigger2 = run('messages send', ['messages', 'send', '--channel-id', channelId, '--content', `${marker} process retry`]);
  ownedMessages.push(trigger2.id);
  const process2 = run('processes create', [
    'processes', 'create', '--channel-id', channelId, '--message-id', trigger2.id, '--status', 'running',
  ]);
  processIds.push(process2.id);
  run('processes kill', ['processes', 'kill', '--process-id', process2.id]);
  run('messages retry', ['messages', 'retry', '--message-id', trigger2.id]);

  const trigger3 = run('messages send', ['messages', 'send', '--channel-id', channelId, '--content', `${marker} process cleanup`]);
  ownedMessages.push(trigger3.id);
  const process3 = run('processes create', [
    'processes', 'create', '--channel-id', channelId, '--message-id', trigger3.id, '--status', 'running',
  ]);
  processIds.push(process3.id);
  run('processes cleanup', ['processes', 'cleanup']);
  const cleaned = invoke(['processes', 'get', '--process-id', process3.id]);
  if (cleaned.status !== 0 || cleaned.body.status !== 'restarted') {
    throw new Error(`process cleanup did not mark ${process3.id} restarted`);
  }

  const trigger4 = run('messages send', ['messages', 'send', '--channel-id', channelId, '--content', `${marker} process kill all`]);
  ownedMessages.push(trigger4.id);
  const process4 = run('processes create', [
    'processes', 'create', '--channel-id', channelId, '--message-id', trigger4.id, '--status', 'queued',
  ]);
  processIds.push(process4.id);
  const visible = invoke(['processes', 'list']);
  if (visible.status !== 0) throw new Error(`active process guard failed: ${visible.stderr}`);
  const active = visible.body.processes.filter(
    (process) => process.status === 'queued' || process.status === 'running',
  );
  if (active.length !== 1 || active[0].id !== process4.id) {
    throw new Error(`refusing kill-all: active process ids are ${active.map((process) => process.id).join(', ') || '(none)'}`);
  }
  run('processes kill-all', ['processes', 'kill-all']);
  const killed = invoke(['processes', 'get', '--process-id', process4.id]);
  if (killed.status !== 0 || killed.body.status !== 'killed') {
    throw new Error('kill-all did not kill the disposable process');
  }
  run('processes list', ['processes', 'list', '--status', 'killed']);

  for (const [index, messageId] of [...ownedMessages].reverse().entries()) {
    run('messages delete', ['messages', 'delete', '--message-id', messageId], { record: index === 0 });
  }
  ownedMessages.length = 0;

  run('channels leave', ['channels', 'leave', '--channel-id', promotedChannelId]);
  run('channels delete', ['channels', 'delete', '--channel-id', promotedChannelId]);
  promotedChannelId = undefined;
  run('channels delete', ['channels', 'delete', '--channel-id', channelId], { record: false });
  channelId = undefined;

  const missing = [...expectedCommands].filter((command) => !passed.has(command));
  const unexpected = [...passed].filter((command) => !expectedCommands.has(command));
  if (missing.length > 0 || unexpected.length > 0) {
    throw new Error(`catalog mismatch; missing=${missing.join(', ') || '(none)'}; unexpected=${unexpected.join(', ') || '(none)'}`);
  }
  console.log(`SUMMARY ${passed.size}/${catalog.length} actions passed; fixtures deleted`);
} catch (error) {
  console.error(`AUDIT FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  if (draftId) bestEffort(['drafts', 'delete', '--draft-id', draftId]);
  if (cardId) bestEffort(['boards', 'cards', 'delete', '--card-id', cardId]);
  if (pinnedMessageId && channelId) {
    bestEffort(['pins', 'remove', '--channel-id', channelId, '--message-id', pinnedMessageId]);
  }
  if (reactedMessageId) bestEffort(['reactions', 'remove', '--message-id', reactedMessageId, '--emoji', 'white_check_mark']);
  for (const processId of processIds) bestEffort(['processes', 'kill', '--process-id', processId]);
  for (const messageId of [...ownedMessages].reverse()) bestEffort(['messages', 'delete', '--message-id', messageId]);
  if (promotedChannelId) bestEffort(['channels', 'delete', '--channel-id', promotedChannelId]);
  if (channelId) bestEffort(['channels', 'delete', '--channel-id', channelId]);
}
