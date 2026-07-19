import type { JsonSchema } from './contract.js';

const nullableString: JsonSchema = { type: ['string', 'null'] };
const nullableInteger: JsonSchema = { type: ['integer', 'null'] };
const arbitraryValue: JsonSchema = {};

const reactionSchema: JsonSchema = {
  type: 'object',
  required: ['emoji', 'user_id', 'username'],
  properties: {
    emoji: { type: 'string' },
    user_id: { type: ['string', 'null'] },
    username: nullableString,
  },
  additionalProperties: false,
};

export const agentMessageSchema: JsonSchema = {
  type: 'object',
  required: [
    'id', 'channel_id', 'channel_name', 'user_id', 'username', 'display_name',
    'content', 'thread_id', 'created_at', 'edited_at', 'deleted_at', 'message_type',
    'thread_title', 'thread_title_updated_at', 'metadata', 'reply_count', 'resolved_at', 'resolved_by', 'process_id',
    'process_status', 'process_error_text', 'reactions', 'mentions', 'attachments',
    'link_previews',
  ],
  properties: {
    id: { type: 'string' },
    channel_id: { type: 'string' },
    channel_name: nullableString,
    user_id: nullableString,
    username: nullableString,
    display_name: nullableString,
    content: { type: 'string' },
    thread_id: nullableString,
    thread_title: nullableString,
    thread_title_updated_at: nullableInteger,
    created_at: nullableInteger,
    edited_at: nullableInteger,
    deleted_at: nullableInteger,
    message_type: nullableString,
    metadata: arbitraryValue,
    reply_count: { type: 'integer', minimum: 0 },
    resolved_at: nullableInteger,
    resolved_by: nullableString,
    process_id: nullableString,
    process_status: nullableString,
    process_error_text: nullableString,
    reactions: { type: 'array', items: reactionSchema },
    mentions: { type: 'array', items: arbitraryValue },
    attachments: { type: 'array', items: arbitraryValue },
    link_previews: { type: 'array', items: arbitraryValue },
  },
  additionalProperties: false,
};

export const agentMessagePageSchema: JsonSchema = {
  type: 'object',
  required: ['messages', 'cursor', 'after_cursor', 'has_newer'],
  properties: {
    messages: { type: 'array', items: agentMessageSchema },
    cursor: nullableString,
    after_cursor: nullableString,
    has_newer: { type: 'boolean' },
  },
  additionalProperties: false,
};

const searchMessageSchema: JsonSchema = {
  ...agentMessageSchema,
  required: [...(agentMessageSchema.required as string[]), 'snippet', 'score'],
  properties: {
    ...(agentMessageSchema.properties as Record<string, JsonSchema>),
    snippet: nullableString,
    score: { type: ['number', 'null'] },
  },
};

export const agentSearchSchema: JsonSchema = {
  type: 'object',
  required: ['results', 'total', 'has_more', 'offset', 'limit'],
  properties: {
    results: { type: 'array', items: searchMessageSchema },
    total: { type: 'integer', minimum: 0 },
    has_more: { type: 'boolean' },
    offset: { type: 'integer', minimum: 0 },
    limit: { type: 'integer', minimum: 0 },
  },
  additionalProperties: false,
};

export const agentChannelSchema: JsonSchema = {
  type: 'object',
  required: [
    'id', 'name', 'description', 'is_private', 'is_member', 'member_count',
    'is_dm', 'processing_mode', 'is_ephemeral', 'archived_at', 'notifications',
    'has_unread', 'unread_count',
  ],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: nullableString,
    is_private: { type: 'boolean' },
    is_member: { type: ['boolean', 'null'] },
    member_count: { type: ['integer', 'null'], minimum: 0 },
    is_dm: { type: 'boolean' },
    processing_mode: { type: 'string' },
    is_ephemeral: { type: 'boolean' },
    archived_at: nullableInteger,
    notifications: nullableString,
    has_unread: { type: ['boolean', 'null'] },
    unread_count: { type: ['integer', 'null'], minimum: 0 },
  },
  additionalProperties: false,
};

export const agentUserSchema: JsonSchema = {
  type: 'object',
  required: ['id', 'username', 'display_name', 'name_color', 'avatar_url', 'role'],
  properties: {
    id: { type: 'string' },
    username: { type: 'string' },
    display_name: nullableString,
    name_color: nullableString,
    avatar_url: nullableString,
    role: nullableString,
  },
  additionalProperties: false,
};

export const agentUploadSchema: JsonSchema = {
  type: 'object',
  required: ['id', 'filename', 'content_type', 'size_bytes', 'url'],
  properties: {
    id: { type: 'string' },
    filename: { type: 'string' },
    content_type: { type: 'string' },
    size_bytes: { type: 'integer', minimum: 0 },
    url: { type: 'string' },
  },
  additionalProperties: false,
};

export const messageListOutputSchema = agentMessagePageSchema;
export const messageOutputSchema = agentMessageSchema;
export const searchOutputSchema = agentSearchSchema;

export const channelsOutputSchema: JsonSchema = {
  type: 'object',
  required: ['channels'],
  properties: { channels: { type: 'array', items: agentChannelSchema } },
  additionalProperties: false,
};

export const usersOutputSchema: JsonSchema = {
  type: 'object',
  required: ['users'],
  properties: { users: { type: 'array', items: agentUserSchema } },
  additionalProperties: false,
};

function value(record: Record<string, unknown>, snake: string, camel: string): unknown {
  return record[snake] ?? record[camel] ?? null;
}

function boolOrNull(input: unknown): boolean | null {
  if (input === null || input === undefined) return null;
  return input === true || input === 1;
}

export function agentMessage(message: unknown): Record<string, unknown> {
  const row = (message ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id ?? ''),
    channel_id: String(value(row, 'channel_id', 'channelId') ?? ''),
    channel_name: row.channel_name ?? null,
    user_id: value(row, 'user_id', 'userId'),
    username: row.username ?? null,
    display_name: value(row, 'display_name', 'displayName'),
    content: typeof row.content === 'string' ? row.content : '',
    thread_id: value(row, 'thread_id', 'threadId'),
    thread_title: value(row, 'thread_title', 'threadTitle'),
    thread_title_updated_at: value(row, 'thread_title_updated_at', 'threadTitleUpdatedAt'),
    created_at: value(row, 'created_at', 'createdAt'),
    edited_at: value(row, 'edited_at', 'editedAt'),
    deleted_at: value(row, 'deleted_at', 'deletedAt'),
    message_type: value(row, 'message_type', 'messageType'),
    metadata: row.metadata ?? null,
    reply_count: Number(value(row, 'reply_count', 'replyCount') ?? 0),
    resolved_at: value(row, 'resolved_at', 'resolvedAt'),
    resolved_by: value(row, 'resolved_by', 'resolvedBy'),
    process_id: value(row, 'process_id', 'processId'),
    process_status: value(row, 'process_status', 'processStatus'),
    process_error_text: value(row, 'process_error_text', 'processErrorText'),
    reactions: Array.isArray(row.reactions)
      ? row.reactions.map((reaction) => {
        const item = reaction as Record<string, unknown>;
        return {
          emoji: String(item.emoji ?? ''),
          user_id: value(item, 'user_id', 'userId'),
          username: item.username ?? null,
        };
      })
      : [],
    mentions: Array.isArray(row.mentions) ? row.mentions : [],
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    link_previews: Array.isArray(row.linkPreviews)
      ? row.linkPreviews
      : (Array.isArray(row.link_previews) ? row.link_previews : []),
  };
}

export function agentMessagePage(page: unknown): Record<string, unknown> {
  const record = (page ?? {}) as Record<string, unknown>;
  return {
    messages: Array.isArray(record.messages) ? record.messages.map(agentMessage) : [],
    cursor: record.cursor ?? null,
    after_cursor: record.afterCursor ?? record.after_cursor ?? null,
    has_newer: Boolean(record.hasNewer ?? record.has_newer ?? false),
  };
}

function cleanSnippet(snippet: unknown): string | null {
  if (typeof snippet !== 'string') return null;
  return snippet.replaceAll('\u0002MS\u0002', '').replaceAll('\u0002ME\u0002', '');
}

export function agentSearch(result: unknown): Record<string, unknown> {
  const record = (result ?? {}) as Record<string, unknown>;
  return {
    results: Array.isArray(record.results)
      ? record.results.map((resultRow) => {
        const row = resultRow as Record<string, unknown>;
        return {
          ...agentMessage(row),
          snippet: cleanSnippet(row.snippet),
          score: typeof row.bm25_score === 'number' ? row.bm25_score : null,
        };
      })
      : [],
    total: Number(record.total ?? 0),
    has_more: Boolean(record.hasMore ?? record.has_more ?? false),
    offset: Number(record.offset ?? 0),
    limit: Number(record.limit ?? 0),
  };
}

export function agentChannel(channel: unknown): Record<string, unknown> {
  const row = (channel ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    description: row.description ?? null,
    is_private: boolOrNull(row.is_private) ?? false,
    is_member: boolOrNull(row.is_member),
    member_count: typeof row.member_count === 'number' ? row.member_count : null,
    is_dm: boolOrNull(row.is_dm) ?? false,
    processing_mode: String(row.processing_mode ?? 'immediate'),
    is_ephemeral: boolOrNull(row.is_ephemeral) ?? false,
    archived_at: row.archived_at ?? null,
    notifications: row.notifications ?? null,
    has_unread: boolOrNull(row.has_unread),
    unread_count: typeof row.unread_count === 'number' ? row.unread_count : null,
  };
}

export function agentUser(user: unknown): Record<string, unknown> {
  const row = (user ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id ?? ''),
    username: String(row.username ?? ''),
    display_name: value(row, 'display_name', 'displayName'),
    name_color: value(row, 'name_color', 'nameColor'),
    avatar_url: value(row, 'avatar_url', 'avatarUrl'),
    role: row.role ?? null,
  };
}

export function agentUpload(upload: unknown): Record<string, unknown> {
  const row = (upload ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id ?? ''),
    filename: String(row.filename ?? ''),
    content_type: String(value(row, 'content_type', 'contentType') ?? ''),
    size_bytes: Number(value(row, 'size_bytes', 'sizeBytes') ?? 0),
    url: String(row.url ?? ''),
  };
}
