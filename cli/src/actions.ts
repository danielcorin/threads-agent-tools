import type { components } from '../generated/types/threads.js';
import type { ActionDescriptor, JsonSchema } from './contract.js';
import { ThreadsApiClient } from './api-client.js';
import { ThreadsApiError } from './errors.js';
import { componentSchema, inputSchema, openApiSchema } from './schema.js';
import {
  agentChannel,
  agentChannelSchema,
  agentMessage,
  agentMessagePage,
  agentMessageSchema,
  agentSearch,
  agentUpload,
  agentUploadSchema,
  agentUser,
  channelsOutputSchema,
  messageListOutputSchema,
  messageOutputSchema,
  searchOutputSchema,
  usersOutputSchema,
} from './agent-shapes.js';

type SendMessageBody = components['schemas']['SendMessageRequest'];

export interface ActionDefinition<Input = Record<string, unknown>> extends ActionDescriptor {
  execute(api: ThreadsApiClient, input: Input): Promise<unknown>;
}

const stringId = (description: string): JsonSchema => ({ type: 'string', minLength: 1, description });
const nullableStringSchema = (): JsonSchema => ({ type: ['string', 'null'] });
const optionalLimit: JsonSchema = { type: 'integer', minimum: 1, maximum: 100 };
const messageType: JsonSchema = {
  type: 'string',
  enum: ['human', 'response', 'progress', 'tool_output', 'thinking'],
  description: 'Use response for a final agent answer; use progress/tool_output/thinking for traces.',
};
const metadata: JsonSchema = { description: 'Arbitrary JSON metadata preserved on the message.' };
const sendProperties: Record<string, JsonSchema> = {
  content: { type: 'string' },
  attachment_ids: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } },
  metadata,
  message_type: messageType,
  idempotency_key: { type: 'string', maxLength: 128 },
};

function annotations(options: {
  title: string;
  readOnly: boolean;
  destructive?: boolean;
  idempotent: boolean;
}): ActionDescriptor['annotations'] {
  return {
    title: options.title,
    readOnlyHint: options.readOnly,
    destructiveHint: options.destructive ?? false,
    idempotentHint: options.idempotent,
    openWorldHint: false,
  };
}

function defineAction<Input>(definition: ActionDefinition<Input>): ActionDefinition<Input> {
  return Object.freeze(definition);
}

interface ChannelQueryInput {
  channel_id: string;
  cursor?: string;
  around?: string;
  after?: string;
  limit?: number;
}

interface ThreadQueryInput {
  message_id: string;
  cursor?: string;
  around?: string;
  after?: string;
  before?: string;
  latest?: boolean;
  limit?: number;
}

interface SearchInput {
  query?: string;
  channel_id?: string;
  from_user_id?: string;
  since?: number;
  until?: number;
  has?: string;
  offset?: number;
  limit?: number;
}

interface SendInput {
  channel_id: string;
  content: string;
  thread_id?: string;
  attachment_ids?: string[];
  metadata?: unknown;
  message_type?: SendMessageBody['message_type'];
  idempotency_key?: string;
}

interface ReplyInput {
  message_id: string;
  content: string;
  attachment_ids?: string[];
  metadata?: unknown;
  message_type?: SendMessageBody['message_type'];
  idempotency_key?: string;
}

function messageBody(input: SendInput | ReplyInput): SendMessageBody {
  return {
    content: input.content,
    ...('thread_id' in input && input.thread_id ? { threadId: input.thread_id } : {}),
    attachmentIds: input.attachment_ids,
    metadata: input.metadata as SendMessageBody['metadata'],
    message_type: input.message_type ?? 'response',
    idempotencyKey: input.idempotency_key,
  };
}

const listConversationsOutput = openApiSchema({
  type: 'object',
  required: ['channels', 'dms'],
  properties: {
    channels: { type: 'array', items: agentChannelSchema },
    dms: { $ref: '#/components/schemas/DMListResponse' },
  },
  additionalProperties: false,
});

const browseChannelsOutput = channelsOutputSchema;

function arrayOutputSchema(property: string, item: JsonSchema): JsonSchema {
  return {
    type: 'object',
    required: [property],
    properties: { [property]: { type: 'array', items: item } },
    additionalProperties: false,
  };
}

const mentionsOutputSchema = arrayOutputSchema('messages', agentMessageSchema);
const pinsOutputSchema = openApiSchema({
  type: 'object',
  required: ['pins'],
  properties: {
    pins: { type: 'array', items: { $ref: '#/components/schemas/PinnedMessageListItem' } },
  },
  additionalProperties: false,
});
const draftsOutputSchema = openApiSchema({
  type: 'object',
  required: ['drafts'],
  properties: {
    drafts: { type: 'array', items: { $ref: '#/components/schemas/SavedDraft' } },
  },
  additionalProperties: false,
});

export const ACTIONS: readonly ActionDefinition<unknown>[] = [
  defineAction({
    name: 'whoami',
    command: ['whoami'],
    title: 'Get current user',
    description: 'Return the Threads user represented by the current API token.',
    inputSchema: inputSchema(),
    outputSchema: componentSchema('CurrentUser'),
    annotations: annotations({ title: 'Get current user', readOnly: true, idempotent: true }),
    operationIds: ['getUsersMe'],
    requiredScopes: ['threads:read'],
    execute: (api) => api.currentUser(),
  }),
  defineAction({
    name: 'list_conversations',
    command: ['conversations', 'list'],
    title: 'List conversations',
    description: 'List joined channels and direct-message conversations. Use browse_channels for public channels not yet joined.',
    inputSchema: inputSchema(),
    outputSchema: listConversationsOutput,
    annotations: annotations({ title: 'List conversations', readOnly: true, idempotent: true }),
    operationIds: ['getChannels', 'getDms'],
    requiredScopes: ['threads:read'],
    execute: async (api) => {
      const [channels, dms] = await Promise.all([api.listChannels(), api.listDms()]);
      return {
        channels: channels.map((channel) => ({ ...agentChannel(channel), is_member: true })),
        dms,
      };
    },
  }),
  defineAction<{ membership?: 'any' | 'joined' | 'unjoined'; limit?: number }>({
    name: 'browse_channels',
    command: ['channels', 'browse'],
    title: 'Browse public channels',
    description: 'List a bounded page of public channels with membership status. Use find_channels when resolving a known #channel name.',
    inputSchema: inputSchema({
      membership: { type: 'string', enum: ['any', 'joined', 'unjoined'] },
      limit: optionalLimit,
    }),
    outputSchema: browseChannelsOutput,
    annotations: annotations({ title: 'Browse public channels', readOnly: true, idempotent: true }),
    operationIds: ['getChannelsBrowse'],
    requiredScopes: ['threads:read'],
    execute: async (api, input) => {
      const membership = input.membership ?? 'any';
      const channels = (await api.browseChannels())
        .filter((channel) => membership === 'any'
          || (membership === 'joined' && Boolean(channel.is_member))
          || (membership === 'unjoined' && !channel.is_member))
        .slice(0, input.limit ?? 100)
        .map(agentChannel);
      return { channels };
    },
  }),
  defineAction<{ query: string; membership?: 'any' | 'joined' | 'unjoined'; limit?: number }>({
    name: 'find_channels',
    command: ['channels', 'find'],
    title: 'Find public channels',
    description: 'Find public channels by case-insensitive name or description without returning the entire directory.',
    inputSchema: inputSchema({
      query: { type: 'string', minLength: 1, description: 'Channel name or description fragment; a leading # is ignored.' },
      membership: { type: 'string', enum: ['any', 'joined', 'unjoined'], description: 'Optional membership filter.' },
      limit: optionalLimit,
    }, ['query']),
    outputSchema: channelsOutputSchema,
    annotations: annotations({ title: 'Find public channels', readOnly: true, idempotent: true }),
    operationIds: ['getChannelsBrowse'],
    requiredScopes: ['threads:read'],
    execute: async (api, input) => {
      const query = input.query.replace(/^#/, '').toLocaleLowerCase();
      const membership = input.membership ?? 'any';
      const matches = (await api.browseChannels())
        .filter((channel) => {
          const text = `${channel.name} ${channel.description ?? ''}`.toLocaleLowerCase();
          const membershipMatches = membership === 'any'
            || (membership === 'joined' && Boolean(channel.is_member))
            || (membership === 'unjoined' && !channel.is_member);
          return text.includes(query) && membershipMatches;
        })
        .sort((left, right) => {
          const leftExact = left.name.toLocaleLowerCase() === query ? 0 : 1;
          const rightExact = right.name.toLocaleLowerCase() === query ? 0 : 1;
          return leftExact - rightExact || left.name.localeCompare(right.name);
        })
        .slice(0, input.limit ?? 20)
        .map(agentChannel);
      return { channels: matches };
    },
  }),
  defineAction<{ channel_id: string }>({
    name: 'get_channel',
    command: ['channels', 'get'],
    title: 'Get channel',
    description: 'Get metadata for a channel visible to the current user.',
    inputSchema: inputSchema({ channel_id: stringId('Channel id.') }, ['channel_id']),
    outputSchema: agentChannelSchema,
    annotations: annotations({ title: 'Get channel', readOnly: true, idempotent: true }),
    operationIds: ['getChannelsId'],
    requiredScopes: ['threads:read'],
    execute: async (api, input) => agentChannel(await api.getChannel(input.channel_id)),
  }),
  defineAction<{ name: string; description?: string; is_private?: boolean }>({
    name: 'create_channel',
    command: ['channels', 'create'],
    title: 'Create channel',
    description: 'Create a durable public or private channel.',
    inputSchema: inputSchema({
      name: { type: 'string', minLength: 1 },
      description: { type: 'string' },
      is_private: { type: 'boolean' },
    }, ['name']),
    outputSchema: componentSchema('CreateChannelResponse'),
    annotations: annotations({ title: 'Create channel', readOnly: false, idempotent: false }),
    operationIds: ['postChannels'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.createChannel({
      name: input.name,
      description: input.description,
      isPrivate: input.is_private,
    }),
  }),
  defineAction<{
    channel_id: string;
    name?: string;
    description?: string;
    processing_mode?: 'immediate' | 'serial';
    board_enabled?: boolean;
    auto_respond_bot_id?: string | null;
  }>({
    name: 'update_channel',
    command: ['channels', 'update'],
    title: 'Update channel',
    description: 'Update channel name, description, processing mode, board setting, or auto-response bot.',
    inputSchema: inputSchema({
      channel_id: stringId('Channel id.'),
      name: { type: 'string', minLength: 1 },
      description: { type: 'string' },
      processing_mode: { type: 'string', enum: ['immediate', 'serial'] },
      board_enabled: { type: 'boolean' },
      auto_respond_bot_id: nullableStringSchema(),
    }, ['channel_id'], { minProperties: 2 }),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Update channel', readOnly: false, idempotent: true }),
    operationIds: ['patchChannelsId'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.updateChannel(input.channel_id, {
      name: input.name,
      description: input.description,
      processing_mode: input.processing_mode,
      board_enabled: input.board_enabled === undefined ? undefined : (input.board_enabled ? 1 : 0),
      auto_respond_bot_id: input.auto_respond_bot_id,
    }),
  }),
  defineAction<{ channel_id: string }>({
    name: 'delete_channel',
    command: ['channels', 'delete'],
    title: 'Delete channel',
    description: 'Permanently delete a channel and its related data. Only the channel creator or an admin may delete it.',
    inputSchema: inputSchema({ channel_id: stringId('Channel id.') }, ['channel_id']),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Delete channel', readOnly: false, destructive: true, idempotent: true }),
    operationIds: ['deleteChannelsId'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.deleteChannel(input.channel_id),
  }),
  defineAction<{ channel_id: string }>({
    name: 'join_channel',
    command: ['channels', 'join'],
    title: 'Join a public channel',
    description: 'Join a public channel by channel_id from browse_channels. The same channel_id can then be passed to send_message.',
    inputSchema: inputSchema({ channel_id: stringId('Public channel id from browse_channels.') }, ['channel_id']),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Join a public channel', readOnly: false, idempotent: true }),
    operationIds: ['postChannelsIdJoin'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.joinChannel(input.channel_id),
  }),
  defineAction<{ channel_id: string }>({
    name: 'leave_channel',
    command: ['channels', 'leave'],
    title: 'Leave channel',
    description: 'Leave a channel membership. Public channels can be rejoined later.',
    inputSchema: inputSchema({ channel_id: stringId('Channel id.') }, ['channel_id']),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Leave channel', readOnly: false, destructive: true, idempotent: true }),
    operationIds: ['deleteChannelsIdMembership'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.leaveChannel(input.channel_id),
  }),
  defineAction<{ channel_id: string }>({
    name: 'list_channel_members',
    command: ['channels', 'members', 'list'],
    title: 'List channel members',
    description: 'List users and bots currently in a channel.',
    inputSchema: inputSchema({ channel_id: stringId('Channel id.') }, ['channel_id']),
    outputSchema: usersOutputSchema,
    annotations: annotations({ title: 'List channel members', readOnly: true, idempotent: true }),
    operationIds: ['getChannelsIdMembers'],
    requiredScopes: ['threads:read'],
    execute: async (api, input) => ({ users: (await api.listChannelMembers(input.channel_id)).map(agentUser) }),
  }),
  defineAction<{ channel_id: string; username: string }>({
    name: 'add_channel_member',
    command: ['channels', 'members', 'add'],
    title: 'Add channel member',
    description: 'Add a user or bot to a channel by username.',
    inputSchema: inputSchema({
      channel_id: stringId('Channel id.'),
      username: { type: 'string', minLength: 1 },
    }, ['channel_id', 'username']),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Add channel member', readOnly: false, idempotent: true }),
    operationIds: ['postChannelsIdMembers'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.addChannelMember(input.channel_id, { username: input.username }),
  }),
  defineAction<{ channel_id: string; user_id: string }>({
    name: 'remove_channel_member',
    command: ['channels', 'members', 'remove'],
    title: 'Remove channel member',
    description: 'Remove a user or bot from a channel by user id. Any member may remove themselves; removing someone else requires an admin.',
    inputSchema: inputSchema({
      channel_id: stringId('Channel id.'),
      user_id: stringId('User id.'),
    }, ['channel_id', 'user_id']),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Remove channel member', readOnly: false, destructive: true, idempotent: true }),
    operationIds: ['deleteChannelsIdMembersTargetUserId'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.removeChannelMember(input.channel_id, input.user_id),
  }),
  defineAction<{ channel_id: string; tier: 'all' | 'mentions' | 'none' }>({
    name: 'set_channel_notifications',
    command: ['channels', 'notifications'],
    title: 'Set channel notifications',
    description: 'Set the current user\'s notification tier for a channel.',
    inputSchema: inputSchema({
      channel_id: stringId('Channel id.'),
      tier: { type: 'string', enum: ['all', 'mentions', 'none'] },
    }, ['channel_id', 'tier']),
    outputSchema: componentSchema('UpdateChannelNotificationsResponse'),
    annotations: annotations({ title: 'Set channel notifications', readOnly: false, idempotent: true }),
    operationIds: ['patchChannelsIdNotifications'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.updateChannelNotifications(input.channel_id, input.tier),
  }),
  defineAction<{ query: string; exclude_channel_id?: string }>({
    name: 'search_users',
    command: ['users', 'search'],
    title: 'Search users',
    description: 'Resolve a username or display name to a Threads user id.',
    inputSchema: inputSchema({
      query: { type: 'string', minLength: 1 },
      exclude_channel_id: stringId('Exclude users already in this channel.'),
    }, ['query']),
    outputSchema: usersOutputSchema,
    annotations: annotations({ title: 'Search users', readOnly: true, idempotent: true }),
    operationIds: ['getUsersSearch'],
    requiredScopes: ['threads:read'],
    execute: async (api, input) => ({
      users: (await api.searchUsers(input.query, input.exclude_channel_id)).map(agentUser),
    }),
  }),
  defineAction<{ user_id: string }>({
    name: 'create_dm',
    command: ['dms', 'create'],
    title: 'Create or find a DM',
    description: 'Create a direct-message conversation with a user, or return the existing DM.',
    inputSchema: inputSchema({ user_id: stringId('Threads user id to message.') }, ['user_id']),
    outputSchema: componentSchema('DMChannel'),
    annotations: annotations({ title: 'Create or find a DM', readOnly: false, idempotent: true }),
    operationIds: ['postDms'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.createDm(input.user_id),
  }),
  defineAction<{ username: string }>({
    name: 'create_dm_by_username',
    command: ['dms', 'create-by-username'],
    title: 'Create or find a DM by username',
    description: 'Resolve an exact username and create or return the direct-message conversation.',
    inputSchema: inputSchema({ username: { type: 'string', minLength: 1 } }, ['username']),
    outputSchema: componentSchema('DMChannel'),
    annotations: annotations({ title: 'Create or find a DM by username', readOnly: false, idempotent: true }),
    operationIds: ['getUsersSearch', 'postDms'],
    requiredScopes: ['threads:read', 'threads:write'],
    execute: async (api, input) => {
      const users = await api.searchUsers(input.username);
      const exact = users.filter((user) => user.username.toLocaleLowerCase() === input.username.toLocaleLowerCase());
      if (exact.length === 0) {
        throw new ThreadsApiError(404, `No Threads user has username ${input.username}`, { username: input.username });
      }
      if (exact.length > 1) {
        throw new ThreadsApiError(409, `Username ${input.username} is ambiguous`, { username: input.username });
      }
      return api.createDm(exact[0].id);
    },
  }),
  defineAction({
    name: 'list_mentions',
    command: ['mentions', 'list'],
    title: 'List mentions',
    description: 'List recent messages that mention the current user, newest first.',
    inputSchema: inputSchema(),
    outputSchema: mentionsOutputSchema,
    annotations: annotations({ title: 'List mentions', readOnly: true, idempotent: true }),
    operationIds: ['getMentions'],
    requiredScopes: ['threads:read'],
    execute: async (api) => {
      const result = await api.listMentions();
      return { messages: result.messages.map(agentMessage) };
    },
  }),
  defineAction<{ channel_id: string }>({
    name: 'mark_read',
    command: ['channels', 'read'],
    title: 'Mark channel read',
    description: 'Advance the current user\'s read marker to the latest message in a channel or DM.',
    inputSchema: inputSchema({ channel_id: stringId('Channel or DM id.') }, ['channel_id']),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Mark channel read', readOnly: false, idempotent: true }),
    operationIds: ['postChannelsIdRead'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.markRead(input.channel_id),
  }),
  defineAction<ChannelQueryInput>({
    name: 'list_messages',
    command: ['messages', 'list'],
    title: 'List channel messages',
    description: 'Read a page of messages from a channel or DM.',
    inputSchema: inputSchema({
      channel_id: stringId('Channel or DM id.'),
      cursor: stringId('Return messages older than this message id.'),
      around: stringId('Return a window centered around this message id.'),
      after: stringId('Return messages newer than this message id.'),
      limit: optionalLimit,
    }, ['channel_id']),
    outputSchema: messageListOutputSchema,
    annotations: annotations({ title: 'List channel messages', readOnly: true, idempotent: true }),
    operationIds: ['getChannelsIdMessages'],
    requiredScopes: ['threads:read'],
    execute: async (api, input) => agentMessagePage(await api.listMessages(input.channel_id, input)),
  }),
  defineAction<{ message_id: string }>({
    name: 'get_message',
    command: ['messages', 'get'],
    title: 'Get a message',
    description: 'Get one message by id, including its metadata, attachments, and reactions.',
    inputSchema: inputSchema({ message_id: stringId('Message id.') }, ['message_id']),
    outputSchema: messageOutputSchema,
    annotations: annotations({ title: 'Get a message', readOnly: true, idempotent: true }),
    operationIds: ['getMessagesId'],
    requiredScopes: ['threads:read'],
    execute: async (api, input) => agentMessage(await api.getMessage(input.message_id)),
  }),
  defineAction<ThreadQueryInput>({
    name: 'get_thread',
    command: ['messages', 'thread'],
    title: 'Get thread replies',
    description: 'Read a page of replies associated with a message thread.',
    inputSchema: inputSchema({
      message_id: stringId('Thread root or reply message id.'),
      cursor: stringId('Return replies after this reply id.'),
      around: stringId('Return a window centered around this reply id.'),
      after: stringId('Return newer replies after this reply id.'),
      before: stringId('Return replies before this reply id.'),
      latest: { type: 'boolean' },
      limit: optionalLimit,
    }, ['message_id']),
    outputSchema: messageListOutputSchema,
    annotations: annotations({ title: 'Get thread replies', readOnly: true, idempotent: true }),
    operationIds: ['getMessagesIdReplies'],
    requiredScopes: ['threads:read'],
    execute: async (api, input) => agentMessagePage(await api.getThread(input.message_id, input)),
  }),
  defineAction<SearchInput>({
    name: 'search_messages',
    command: ['messages', 'search'],
    title: 'Search messages',
    description: 'Search accessible messages by text and optional channel, author, date, or content filters.',
    inputSchema: inputSchema({
      query: { type: 'string', description: 'Full-text query using Threads search syntax.' },
      channel_id: stringId('Restrict results to a channel or DM.'),
      from_user_id: stringId('Restrict results to messages from this user.'),
      since: { type: 'integer', minimum: 0, description: 'Unix timestamp lower bound.' },
      until: { type: 'integer', minimum: 0, description: 'Unix timestamp upper bound.' },
      has: { type: 'string', description: 'Comma-separated filters: link, reaction, file.' },
      offset: { type: 'integer', minimum: 0 },
      limit: optionalLimit,
    }),
    outputSchema: searchOutputSchema,
    annotations: annotations({ title: 'Search messages', readOnly: true, idempotent: true }),
    operationIds: ['getSearch'],
    requiredScopes: ['threads:read'],
    execute: async (api, input) => agentSearch(await api.search({
      q: input.query,
      channel: input.channel_id,
      from: input.from_user_id,
      since: input.since,
      until: input.until,
      has: input.has,
      offset: input.offset,
      limit: input.limit,
    })),
  }),
  defineAction<SendInput>({
    name: 'send_message',
    command: ['messages', 'send'],
    title: 'Send a message',
    description: 'Send a message to a channel or DM, optionally in a thread and with agent metadata.',
    inputSchema: inputSchema({
      channel_id: stringId('Destination channel or DM id.'),
      thread_id: stringId('Optional thread root id.'),
      ...sendProperties,
    }, ['channel_id', 'content']),
    outputSchema: messageOutputSchema,
    annotations: annotations({ title: 'Send a message', readOnly: false, idempotent: false }),
    operationIds: ['postChannelsIdMessages'],
    requiredScopes: ['threads:write'],
    execute: async (api, input) => agentMessage(await api.sendMessage(input.channel_id, messageBody(input))),
  }),
  defineAction<ReplyInput>({
    name: 'reply_to_message',
    command: ['messages', 'reply'],
    title: 'Reply to a message',
    description: 'Reply in the thread associated with a message id.',
    inputSchema: inputSchema({
      message_id: stringId('Message id whose thread should receive the reply.'),
      ...sendProperties,
    }, ['message_id', 'content']),
    outputSchema: messageOutputSchema,
    annotations: annotations({ title: 'Reply to a message', readOnly: false, idempotent: false }),
    operationIds: ['postMessagesIdReplies'],
    requiredScopes: ['threads:write'],
    execute: async (api, input) => agentMessage(await api.replyToMessage(input.message_id, messageBody(input))),
  }),
  defineAction<{ message_id: string; content: string }>({
    name: 'edit_message',
    command: ['messages', 'edit'],
    title: 'Edit a message',
    description: 'Replace the content of a message owned by the current user.',
    inputSchema: inputSchema({
      message_id: stringId('Message id.'),
      content: { type: 'string', minLength: 1 },
    }, ['message_id', 'content']),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Edit a message', readOnly: false, idempotent: true }),
    operationIds: ['patchMessagesId'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.editMessage(input.message_id, input.content),
  }),
  defineAction<{ message_id: string }>({
    name: 'delete_message',
    command: ['messages', 'delete'],
    title: 'Delete a message',
    description: 'Delete a message owned by the current user.',
    inputSchema: inputSchema({ message_id: stringId('Message id.') }, ['message_id']),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Delete a message', readOnly: false, destructive: true, idempotent: true }),
    operationIds: ['deleteMessagesId'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.deleteMessage(input.message_id),
  }),
  defineAction<{ message_id: string }>({
    name: 'resolve_message',
    command: ['messages', 'resolve'],
    title: 'Resolve a message thread',
    description: 'Mark a top-level message thread resolved.',
    inputSchema: inputSchema({ message_id: stringId('Top-level message id.') }, ['message_id']),
    outputSchema: componentSchema('ResolveMessageResponse'),
    annotations: annotations({ title: 'Resolve a message thread', readOnly: false, idempotent: true }),
    operationIds: ['postMessagesIdResolve'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.resolveMessage(input.message_id),
  }),
  defineAction<{ message_id: string }>({
    name: 'unresolve_message',
    command: ['messages', 'unresolve'],
    title: 'Reopen a message thread',
    description: 'Clear the resolved state of a top-level message thread.',
    inputSchema: inputSchema({ message_id: stringId('Top-level message id.') }, ['message_id']),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Reopen a message thread', readOnly: false, idempotent: true }),
    operationIds: ['deleteMessagesIdResolve'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.unresolveMessage(input.message_id),
  }),
  defineAction<{ message_id: string; title: string; if_unset?: boolean }>({
    name: 'set_thread_title',
    command: ['messages', 'title'],
    title: 'Set thread title',
    description: 'Set or rename the human-readable title of a message thread.',
    inputSchema: inputSchema({
      message_id: stringId('Thread root or reply message id.'),
      title: { type: 'string', minLength: 1, maxLength: 120 },
      if_unset: { type: 'boolean', description: 'Set only when the thread is currently untitled.' },
    }, ['message_id', 'title']),
    outputSchema: componentSchema('ThreadTitleResponse'),
    annotations: annotations({ title: 'Set thread title', readOnly: false, idempotent: true }),
    operationIds: ['putMessagesIdThreadTitle'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.setThreadTitle(input.message_id, input.title, input.if_unset),
  }),
  defineAction<{ message_id: string }>({
    name: 'retry_message',
    command: ['messages', 'retry'],
    title: 'Retry message processing',
    description: 'Requeue a message whose process ended in error, killed, or restarted state.',
    inputSchema: inputSchema({ message_id: stringId('Failed message id.') }, ['message_id']),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Retry message processing', readOnly: false, idempotent: false }),
    operationIds: ['postMessagesIdRetry'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.retryMessage(input.message_id),
  }),
  defineAction<{
    message_id: string;
    process_id: string;
    status: components['schemas']['ProcessStatus'];
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
    error_text?: string | null;
  }>({
    name: 'set_message_process_status',
    command: ['messages', 'process-status'],
    title: 'Set message process status',
    description: 'Attach a process to its trigger message and update the visible status, token usage, and optional error details.',
    inputSchema: inputSchema({
      message_id: stringId('Trigger message id.'),
      process_id: stringId('Process id.'),
      status: { type: 'string', enum: ['queued', 'processing', 'running', 'done', 'error', 'killed', 'restarted'] },
      input_tokens: { type: 'integer', minimum: 0 },
      output_tokens: { type: 'integer', minimum: 0 },
      cache_creation_input_tokens: { type: 'integer', minimum: 0 },
      cache_read_input_tokens: { type: 'integer', minimum: 0 },
      error_text: { type: ['string', 'null'], maxLength: 4000 },
    }, ['message_id', 'process_id', 'status']),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Set message process status', readOnly: false, idempotent: true }),
    operationIds: ['postMessagesIdProcess'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.setMessageProcessStatus(input.message_id, {
      processId: input.process_id,
      status: input.status,
      input_tokens: input.input_tokens,
      output_tokens: input.output_tokens,
      cache_creation_input_tokens: input.cache_creation_input_tokens,
      cache_read_input_tokens: input.cache_read_input_tokens,
      error_text: input.error_text,
    }),
  }),
  defineAction<{ filename: string; content_type: string; base64_data: string }>({
    name: 'upload_attachment',
    command: ['uploads', 'create'],
    title: 'Upload an attachment',
    description: 'Upload base64-encoded file data and return an attachment id for send_message or reply_to_message.',
    inputSchema: inputSchema({
      filename: { type: 'string', minLength: 1 },
      content_type: { type: 'string', minLength: 1 },
      base64_data: { type: 'string', minLength: 1, description: 'Raw base64 data without a data-URL prefix.' },
    }, ['filename', 'content_type', 'base64_data']),
    outputSchema: agentUploadSchema,
    annotations: annotations({ title: 'Upload an attachment', readOnly: false, idempotent: false }),
    operationIds: ['postUploads'],
    requiredScopes: ['threads:write'],
    execute: async (api, input) => agentUpload(
      await api.uploadAttachment(input.filename, input.content_type, input.base64_data),
    ),
  }),
  defineAction<{ message_id: string; emoji: string }>({
    name: 'add_reaction',
    command: ['reactions', 'add'],
    title: 'Add a reaction',
    description: 'Add the current user\'s reaction to a message.',
    inputSchema: inputSchema({
      message_id: stringId('Message id.'),
      emoji: stringId('Emoji or emoji token.'),
    }, ['message_id', 'emoji']),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Add a reaction', readOnly: false, idempotent: true }),
    operationIds: ['postMessagesIdReactions'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.addReaction(input.message_id, input.emoji),
  }),
  defineAction<{ message_id: string; emoji: string }>({
    name: 'remove_reaction',
    command: ['reactions', 'remove'],
    title: 'Remove a reaction',
    description: 'Remove the current user\'s reaction from a message.',
    inputSchema: inputSchema({
      message_id: stringId('Message id.'),
      emoji: stringId('Emoji or emoji token.'),
    }, ['message_id', 'emoji']),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({
      title: 'Remove a reaction',
      readOnly: false,
      destructive: true,
      idempotent: true,
    }),
    operationIds: ['deleteMessagesIdReactionsEmoji'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.removeReaction(input.message_id, input.emoji),
  }),
  defineAction<{ channel_id: string }>({
    name: 'list_pins',
    command: ['pins', 'list'],
    title: 'List pinned messages',
    description: 'List messages pinned in a channel.',
    inputSchema: inputSchema({ channel_id: stringId('Channel id.') }, ['channel_id']),
    outputSchema: pinsOutputSchema,
    annotations: annotations({ title: 'List pinned messages', readOnly: true, idempotent: true }),
    operationIds: ['getChannelsIdPins'],
    requiredScopes: ['threads:read'],
    execute: async (api, input) => ({ pins: await api.listPins(input.channel_id) }),
  }),
  defineAction<{ channel_id: string; message_id: string }>({
    name: 'pin_message',
    command: ['pins', 'add'],
    title: 'Pin a message',
    description: 'Pin a message in its channel.',
    inputSchema: inputSchema({
      channel_id: stringId('Channel id.'),
      message_id: stringId('Message id.'),
    }, ['channel_id', 'message_id']),
    outputSchema: componentSchema('PinnedMessage'),
    annotations: annotations({ title: 'Pin a message', readOnly: false, idempotent: true }),
    operationIds: ['postChannelsIdPins'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.pinMessage(input.channel_id, input.message_id),
  }),
  defineAction<{ channel_id: string; message_id: string }>({
    name: 'unpin_message',
    command: ['pins', 'remove'],
    title: 'Unpin a message',
    description: 'Remove a message pin from a channel.',
    inputSchema: inputSchema({
      channel_id: stringId('Channel id.'),
      message_id: stringId('Message id.'),
    }, ['channel_id', 'message_id']),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Unpin a message', readOnly: false, destructive: true, idempotent: true }),
    operationIds: ['deleteChannelsIdPinsMessageId'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.unpinMessage(input.channel_id, input.message_id),
  }),
  defineAction({
    name: 'create_ephemeral_channel',
    command: ['ephemeral', 'create'],
    title: 'Create ephemeral channel',
    description: 'Create a short-lived private channel using the current user\'s ephemeral-room defaults.',
    inputSchema: inputSchema(),
    outputSchema: agentChannelSchema,
    annotations: annotations({ title: 'Create ephemeral channel', readOnly: false, idempotent: false }),
    operationIds: ['postChannelsEphemeral'],
    requiredScopes: ['threads:write'],
    execute: async (api) => agentChannel(await api.createEphemeralChannel()),
  }),
  defineAction<{ channel_id: string }>({
    name: 'archive_ephemeral_channel',
    command: ['ephemeral', 'archive'],
    title: 'Archive ephemeral channel',
    description: 'Archive an ephemeral channel.',
    inputSchema: inputSchema({ channel_id: stringId('Ephemeral channel id.') }, ['channel_id']),
    outputSchema: componentSchema('EphemeralArchiveResponse'),
    annotations: annotations({ title: 'Archive ephemeral channel', readOnly: false, destructive: true, idempotent: true }),
    operationIds: ['postChannelsIdArchive'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.archiveEphemeralChannel(input.channel_id),
  }),
  defineAction<{ channel_id: string }>({
    name: 'unarchive_ephemeral_channel',
    command: ['ephemeral', 'unarchive'],
    title: 'Unarchive ephemeral channel',
    description: 'Restore an archived ephemeral channel.',
    inputSchema: inputSchema({ channel_id: stringId('Ephemeral channel id.') }, ['channel_id']),
    outputSchema: componentSchema('EphemeralUnarchiveResponse'),
    annotations: annotations({ title: 'Unarchive ephemeral channel', readOnly: false, idempotent: true }),
    operationIds: ['deleteChannelsIdArchive'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.unarchiveEphemeralChannel(input.channel_id),
  }),
  defineAction<{ channel_id: string; slug: string }>({
    name: 'rename_ephemeral_channel',
    command: ['ephemeral', 'rename'],
    title: 'Rename ephemeral channel',
    description: 'Replace the generated slug for an ephemeral channel.',
    inputSchema: inputSchema({
      channel_id: stringId('Ephemeral channel id.'),
      slug: { type: 'string', minLength: 1 },
    }, ['channel_id', 'slug']),
    outputSchema: componentSchema('EphemeralRenameResponse'),
    annotations: annotations({ title: 'Rename ephemeral channel', readOnly: false, idempotent: true }),
    operationIds: ['postChannelsIdRename'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.renameEphemeralChannel(input.channel_id, input.slug),
  }),
  defineAction<{ channel_id: string; name?: string }>({
    name: 'promote_ephemeral_channel',
    command: ['ephemeral', 'promote'],
    title: 'Promote ephemeral channel',
    description: 'Convert an ephemeral channel into a durable private channel.',
    inputSchema: inputSchema({
      channel_id: stringId('Ephemeral channel id.'),
      name: { type: 'string', minLength: 1 },
    }, ['channel_id']),
    outputSchema: componentSchema('EphemeralPromoteResponse'),
    annotations: annotations({ title: 'Promote ephemeral channel', readOnly: false, idempotent: true }),
    operationIds: ['postChannelsIdPromote'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.promoteEphemeralChannel(input.channel_id, input.name),
  }),
  defineAction<{ channel_id: string }>({
    name: 'regenerate_ephemeral_name',
    command: ['ephemeral', 'regenerate-name'],
    title: 'Regenerate ephemeral name',
    description: 'Generate a fresh available name for an ephemeral channel.',
    inputSchema: inputSchema({ channel_id: stringId('Ephemeral channel id.') }, ['channel_id']),
    outputSchema: componentSchema('EphemeralRegenerateNameResponse'),
    annotations: annotations({ title: 'Regenerate ephemeral name', readOnly: false, idempotent: false }),
    operationIds: ['postChannelsIdRegenerateName'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.regenerateEphemeralName(input.channel_id),
  }),
  defineAction<{ status?: Exclude<components['schemas']['ProcessStatus'], 'processing'> }>({
    name: 'list_processes',
    command: ['processes', 'list'],
    title: 'List agent processes',
    description: 'List visible agent processes, optionally filtered by status.',
    inputSchema: inputSchema({
      status: {
        type: 'string',
        enum: ['queued', 'running', 'done', 'error', 'killed', 'restarted'],
      },
    }),
    outputSchema: componentSchema('ProcessListResponse'),
    annotations: annotations({ title: 'List agent processes', readOnly: true, idempotent: true }),
    operationIds: ['getProcesses'],
    requiredScopes: ['threads:read'],
    execute: (api, input) => api.listProcesses(input.status),
  }),
  defineAction<{
    channel_id: string;
    message_id: string;
    user_id?: string;
    status?: 'queued' | 'running' | 'done' | 'error' | 'killed';
  }>({
    name: 'create_process',
    command: ['processes', 'create'],
    title: 'Create agent process',
    description: 'Register a bot-owned process for a message so the turn can be monitored, updated, and cancelled. Bot principals only.',
    inputSchema: inputSchema({
      channel_id: stringId('Channel id.'),
      message_id: stringId('Trigger message id.'),
      user_id: stringId('User id that triggered the turn.'),
      status: { type: 'string', enum: ['queued', 'running', 'done', 'error', 'killed'] },
    }, ['channel_id', 'message_id']),
    outputSchema: componentSchema('CreateProcessResponse'),
    annotations: annotations({ title: 'Create agent process', readOnly: false, idempotent: false }),
    operationIds: ['postProcesses'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.createProcess({
      channel_id: input.channel_id,
      message_id: input.message_id,
      user_id: input.user_id,
      status: input.status,
    }),
  }),
  defineAction<{ process_id: string }>({
    name: 'get_process',
    command: ['processes', 'get'],
    title: 'Get agent process',
    description: 'Get the current status and usage details for an agent process.',
    inputSchema: inputSchema({ process_id: stringId('Process id.') }, ['process_id']),
    outputSchema: componentSchema('ProcessRecord'),
    annotations: annotations({ title: 'Get agent process', readOnly: true, idempotent: true }),
    operationIds: ['getProcessesId'],
    requiredScopes: ['threads:read'],
    execute: (api, input) => api.getProcess(input.process_id),
  }),
  defineAction<{
    process_id: string;
    status?: 'queued' | 'running' | 'done' | 'error' | 'killed';
    tool_call_count?: number;
    reply_count?: number;
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  }>({
    name: 'update_process',
    command: ['processes', 'update'],
    title: 'Update agent process',
    description: 'Advance a bot-owned process status or replace its cumulative activity and token metrics. Bot principals only.',
    inputSchema: inputSchema({
      process_id: stringId('Process id.'),
      status: { type: 'string', enum: ['queued', 'running', 'done', 'error', 'killed'] },
      tool_call_count: { type: 'integer', minimum: 0 },
      reply_count: { type: 'integer', minimum: 0 },
      input_tokens: { type: 'integer', minimum: 0 },
      output_tokens: { type: 'integer', minimum: 0 },
      cache_creation_input_tokens: { type: 'integer', minimum: 0 },
      cache_read_input_tokens: { type: 'integer', minimum: 0 },
    }, ['process_id'], { minProperties: 2 }),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Update agent process', readOnly: false, destructive: true, idempotent: true }),
    operationIds: ['patchProcessesId'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => {
      const { process_id, ...body } = input;
      return api.updateProcess(process_id, body);
    },
  }),
  defineAction<{
    process_id: string;
    type: 'tool_call' | 'reply' | 'token_usage';
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  }>({
    name: 'record_process_activity',
    command: ['processes', 'activity'],
    title: 'Record process activity',
    description: 'Increment a bot-owned process tool/reply count or add token usage. Bot principals only.',
    inputSchema: inputSchema({
      process_id: stringId('Process id.'),
      type: { type: 'string', enum: ['tool_call', 'reply', 'token_usage'] },
      input_tokens: { type: 'integer', minimum: 0 },
      output_tokens: { type: 'integer', minimum: 0 },
      cache_creation_input_tokens: { type: 'integer', minimum: 0 },
      cache_read_input_tokens: { type: 'integer', minimum: 0 },
    }, ['process_id', 'type']),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Record process activity', readOnly: false, idempotent: false }),
    operationIds: ['postProcessesIdActivity'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => {
      const { process_id, ...body } = input;
      return api.recordProcessActivity(process_id, body);
    },
  }),
  defineAction({
    name: 'cleanup_processes_by_bot',
    command: ['processes', 'cleanup'],
    title: 'Reconcile bot processes',
    description: 'Mark the authenticated bot\'s queued or running processes restarted. Intended for one call at bot startup.',
    inputSchema: inputSchema(),
    outputSchema: componentSchema('ProcessCleanupResponse'),
    annotations: annotations({ title: 'Reconcile bot processes', readOnly: false, destructive: true, idempotent: true }),
    operationIds: ['postProcessesCleanupByBot'],
    requiredScopes: ['threads:write'],
    execute: (api) => api.cleanupProcessesByBot(),
  }),
  defineAction<{ process_id: string }>({
    name: 'kill_process',
    command: ['processes', 'kill'],
    title: 'Kill agent process',
    description: 'Request cancellation of a queued or running agent process.',
    inputSchema: inputSchema({ process_id: stringId('Process id.') }, ['process_id']),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Kill agent process', readOnly: false, destructive: true, idempotent: true }),
    operationIds: ['deleteProcessesId'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.killProcess(input.process_id),
  }),
  defineAction({
    name: 'kill_all_processes',
    command: ['processes', 'kill-all'],
    title: 'Kill all visible processes',
    description: 'Cancel every queued or running process visible to the caller. Admins affect all channels.',
    inputSchema: inputSchema(),
    outputSchema: componentSchema('ProcessCleanupResponse'),
    annotations: annotations({ title: 'Kill all visible processes', readOnly: false, destructive: true, idempotent: true }),
    operationIds: ['postProcessesKillAll'],
    requiredScopes: ['threads:write'],
    execute: (api) => api.killAllProcesses(),
  }),
  defineAction<{ channel_id: string }>({
    name: 'get_board',
    command: ['boards', 'get'],
    title: 'Get channel board',
    description: 'Get a channel kanban board and its cards.',
    inputSchema: inputSchema({ channel_id: stringId('Channel id.') }, ['channel_id']),
    outputSchema: componentSchema('KanbanBoardWithCardsResponse'),
    annotations: annotations({ title: 'Get channel board', readOnly: true, idempotent: true }),
    operationIds: ['getChannelsIdBoard'],
    requiredScopes: ['threads:read'],
    execute: (api, input) => api.getBoard(input.channel_id),
  }),
  defineAction<{ channel_id: string }>({
    name: 'create_board',
    command: ['boards', 'create'],
    title: 'Create channel board',
    description: 'Enable and create the default kanban board for a channel.',
    inputSchema: inputSchema({ channel_id: stringId('Channel id.') }, ['channel_id']),
    outputSchema: componentSchema('KanbanBoard'),
    annotations: annotations({ title: 'Create channel board', readOnly: false, idempotent: true }),
    operationIds: ['postChannelsIdBoard'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.createBoard(input.channel_id),
  }),
  defineAction<{ channel_id: string; columns: string[] }>({
    name: 'update_board',
    command: ['boards', 'update'],
    title: 'Update board columns',
    description: 'Replace the ordered column keys on a channel board.',
    inputSchema: inputSchema({
      channel_id: stringId('Channel id.'),
      columns: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } },
    }, ['channel_id', 'columns']),
    outputSchema: componentSchema('KanbanBoard'),
    annotations: annotations({ title: 'Update board columns', readOnly: false, idempotent: true }),
    operationIds: ['putChannelsIdBoard'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.updateBoard(input.channel_id, input.columns),
  }),
  defineAction<{
    channel_id: string;
    title: string;
    description?: string;
    assignee?: string;
    priority?: string;
    column_key?: string;
    source_message_id?: string;
    metadata?: Record<string, unknown>;
  }>({
    name: 'create_board_card',
    command: ['boards', 'cards', 'create'],
    title: 'Create board card',
    description: 'Create a card on a channel board, optionally linked to a source message.',
    inputSchema: inputSchema({
      channel_id: stringId('Channel id.'),
      title: { type: 'string', minLength: 1 },
      description: { type: 'string' },
      assignee: stringId('Assignee user id.'),
      priority: { type: 'string', minLength: 1 },
      column_key: { type: 'string', minLength: 1 },
      source_message_id: stringId('Source message id.'),
      metadata,
    }, ['channel_id', 'title']),
    outputSchema: componentSchema('KanbanCard'),
    annotations: annotations({ title: 'Create board card', readOnly: false, idempotent: false }),
    operationIds: ['postChannelsIdBoardCards'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.createCard(input.channel_id, {
      title: input.title,
      description: input.description,
      assignee: input.assignee,
      priority: input.priority ?? 'normal',
      column_key: input.column_key ?? 'todo',
      source_message_id: input.source_message_id,
      metadata: input.metadata,
    }),
  }),
  defineAction<{
    card_id: string;
    title?: string;
    description?: string;
    column_key?: string;
    assignee?: string | null;
    priority?: string;
    position?: number;
    metadata?: Record<string, unknown>;
  }>({
    name: 'update_board_card',
    command: ['boards', 'cards', 'update'],
    title: 'Update board card',
    description: 'Update card content, placement, assignee, priority, or metadata.',
    inputSchema: inputSchema({
      card_id: stringId('Card id.'),
      title: { type: 'string', minLength: 1 },
      description: { type: 'string' },
      column_key: { type: 'string', minLength: 1 },
      assignee: nullableStringSchema(),
      priority: { type: 'string', minLength: 1 },
      position: { type: 'integer', minimum: 0 },
      metadata,
    }, ['card_id'], { minProperties: 2 }),
    outputSchema: componentSchema('KanbanCard'),
    annotations: annotations({ title: 'Update board card', readOnly: false, idempotent: true }),
    operationIds: ['putBoardsCardsCardId'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.updateCard(input.card_id, {
      title: input.title,
      description: input.description,
      column_key: input.column_key,
      assignee: input.assignee,
      priority: input.priority,
      position: input.position,
      metadata: input.metadata,
    }),
  }),
  defineAction<{ card_id: string }>({
    name: 'delete_board_card',
    command: ['boards', 'cards', 'delete'],
    title: 'Delete board card',
    description: 'Delete a card from a channel board.',
    inputSchema: inputSchema({ card_id: stringId('Card id.') }, ['card_id']),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Delete board card', readOnly: false, destructive: true, idempotent: true }),
    operationIds: ['deleteBoardsCardsCardId'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.deleteCard(input.card_id),
  }),
  defineAction<{ channel_id: string }>({
    name: 'list_saved_drafts',
    command: ['drafts', 'list'],
    title: 'List saved drafts',
    description: 'List saved or scheduled drafts for the current user in a channel.',
    inputSchema: inputSchema({ channel_id: stringId('Channel id.') }, ['channel_id']),
    outputSchema: draftsOutputSchema,
    annotations: annotations({ title: 'List saved drafts', readOnly: true, idempotent: true }),
    operationIds: ['getChannelsIdSavedDrafts'],
    requiredScopes: ['threads:read'],
    execute: async (api, input) => ({ drafts: await api.listSavedDrafts(input.channel_id) }),
  }),
  defineAction<{ channel_id: string; content: string }>({
    name: 'create_saved_draft',
    command: ['drafts', 'create'],
    title: 'Create saved draft',
    description: 'Save a message draft for the current user in a channel.',
    inputSchema: inputSchema({
      channel_id: stringId('Channel id.'),
      content: { type: 'string', minLength: 1 },
    }, ['channel_id', 'content']),
    outputSchema: componentSchema('SavedDraft'),
    annotations: annotations({ title: 'Create saved draft', readOnly: false, idempotent: false }),
    operationIds: ['postChannelsIdSavedDrafts'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.createSavedDraft(input.channel_id, input.content),
  }),
  defineAction<{ draft_id: string; scheduled_at: string | null }>({
    name: 'schedule_saved_draft',
    command: ['drafts', 'schedule'],
    title: 'Schedule saved draft',
    description: 'Set or clear the delivery time for a saved draft using an ISO-8601 timestamp.',
    inputSchema: inputSchema({
      draft_id: stringId('Saved draft id.'),
      scheduled_at: nullableStringSchema(),
    }, ['draft_id', 'scheduled_at']),
    outputSchema: componentSchema('SavedDraft'),
    annotations: annotations({ title: 'Schedule saved draft', readOnly: false, idempotent: true }),
    operationIds: ['patchSavedDraftsIdSchedule'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.scheduleSavedDraft(input.draft_id, input.scheduled_at),
  }),
  defineAction<{ draft_id: string }>({
    name: 'delete_saved_draft',
    command: ['drafts', 'delete'],
    title: 'Delete saved draft',
    description: 'Delete a saved or scheduled draft.',
    inputSchema: inputSchema({ draft_id: stringId('Saved draft id.') }, ['draft_id']),
    outputSchema: componentSchema('OkResponse'),
    annotations: annotations({ title: 'Delete saved draft', readOnly: false, destructive: true, idempotent: true }),
    operationIds: ['deleteSavedDraftsId'],
    requiredScopes: ['threads:write'],
    execute: (api, input) => api.deleteSavedDraft(input.draft_id),
  }),
] as readonly ActionDefinition<unknown>[];
