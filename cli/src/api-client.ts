import createClient from 'openapi-fetch';
import type { components, paths } from '../generated/types/threads.js';
import { ThreadsApiError } from './errors.js';

type Schemas = components['schemas'];
type MessageQuery = {
  cursor?: string;
  around?: string;
  after?: string;
  before?: string;
  latest?: boolean;
  limit?: number;
};
type SearchQuery = {
  q?: string;
  channel?: string;
  from?: string;
  since?: number;
  until?: number;
  has?: string;
  offset?: number;
  limit?: number;
};
type ProcessQueryStatus = Exclude<Schemas['ProcessStatus'], 'processing'>;
type AgentProcessStatus = Exclude<Schemas['ProcessStatus'], 'processing' | 'restarted'>;
type CreateProcessBody = Omit<Schemas['CreateProcessRequest'], 'status'> & {
  status?: AgentProcessStatus;
};
type UpdateProcessBody = Omit<Schemas['UpdateProcessRequest'], 'status'> & {
  status?: AgentProcessStatus;
};

interface ApiResult<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

function errorMessage(error: unknown, response: Response): string {
  if (error && typeof error === 'object' && 'error' in error) {
    const message = (error as { error?: unknown }).error;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return response.statusText || `Threads API request failed with HTTP ${response.status}`;
}

function unwrap<T>(result: ApiResult<T>): T {
  if (!result.response.ok || result.error !== undefined) {
    throw new ThreadsApiError(
      result.response.status,
      errorMessage(result.error, result.response),
      result.error,
    );
  }
  if (result.data === undefined) {
    throw new ThreadsApiError(
      result.response.status,
      'Threads API returned no JSON response body',
      undefined,
    );
  }
  return result.data;
}

export class ThreadsApiClient {
  readonly #client: ReturnType<typeof createClient<paths>>;
  readonly #baseUrl: string;
  readonly #token: string;
  readonly #fetch: typeof globalThis.fetch;

  constructor(baseUrl: string, token: string, fetchImplementation: typeof globalThis.fetch) {
    this.#baseUrl = baseUrl.replace(/\/+$/, '');
    this.#token = token;
    this.#fetch = fetchImplementation;
    this.#client = createClient<paths>({
      baseUrl: this.#baseUrl,
      fetch: fetchImplementation,
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async currentUser(): Promise<Schemas['CurrentUser']> {
    return unwrap(await this.#client.GET('/users/me'));
  }

  async listChannels(): Promise<Schemas['ChannelListResponse']> {
    return unwrap(await this.#client.GET('/channels'));
  }

  async browseChannels(): Promise<Schemas['ChannelBrowseResponse']> {
    return unwrap(await this.#client.GET('/channels/browse'));
  }

  async getChannel(channelId: string): Promise<Schemas['Channel']> {
    return unwrap(await this.#client.GET('/channels/{id}', {
      params: { path: { id: channelId } },
    }));
  }

  async createChannel(body: Schemas['CreateChannelRequest']): Promise<Schemas['CreateChannelResponse']> {
    return unwrap(await this.#client.POST('/channels', { body }));
  }

  async updateChannel(channelId: string, body: Schemas['UpdateChannelRequest']): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.PATCH('/channels/{id}', {
      params: { path: { id: channelId } },
      body,
    }));
  }

  async deleteChannel(channelId: string): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.DELETE('/channels/{id}', {
      params: { path: { id: channelId } },
    }));
  }

  async joinChannel(channelId: string): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.POST('/channels/{id}/join', {
      params: { path: { id: channelId } },
    }));
  }

  async leaveChannel(channelId: string): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.DELETE('/channels/{id}/membership', {
      params: { path: { id: channelId } },
    }));
  }

  async listChannelMembers(channelId: string): Promise<Schemas['ChannelMemberListResponse']> {
    return unwrap(await this.#client.GET('/channels/{id}/members', {
      params: { path: { id: channelId } },
    }));
  }

  async addChannelMember(channelId: string, body: Schemas['AddChannelMemberRequest']): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.POST('/channels/{id}/members', {
      params: { path: { id: channelId } },
      body,
    }));
  }

  async removeChannelMember(channelId: string, userId: string): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.DELETE('/channels/{id}/members/{targetUserId}', {
      params: { path: { id: channelId, targetUserId: userId } },
    }));
  }

  async updateChannelNotifications(
    channelId: string,
    tier: Schemas['NotificationTier'],
  ): Promise<Schemas['UpdateChannelNotificationsResponse']> {
    return unwrap(await this.#client.PATCH('/channels/{id}/notifications', {
      params: { path: { id: channelId } },
      body: { tier },
    }));
  }

  async listDms(): Promise<Schemas['DMListResponse']> {
    return unwrap(await this.#client.GET('/dms'));
  }

  async createDm(userId: string): Promise<Schemas['DMChannel']> {
    return unwrap(await this.#client.POST('/dms', { body: { userId } }));
  }

  async searchUsers(query?: string, channelId?: string): Promise<Schemas['UserSearchResponse']> {
    return unwrap(await this.#client.GET('/users/search', {
      params: { query: { q: query, channel: channelId } },
    }));
  }

  async listMentions(): Promise<Schemas['MentionsResponse']> {
    return unwrap(await this.#client.GET('/mentions'));
  }

  async markRead(channelId: string): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.POST('/channels/{id}/read', {
      params: { path: { id: channelId } },
    }));
  }

  async listMessages(channelId: string, query: MessageQuery): Promise<Schemas['MessagePage']> {
    const { before: _before, latest: _latest, ...channelQuery } = query;
    return unwrap(await this.#client.GET('/channels/{id}/messages', {
      params: { path: { id: channelId }, query: channelQuery },
    }));
  }

  async getMessage(messageId: string): Promise<Schemas['Message']> {
    return unwrap(await this.#client.GET('/messages/{id}', {
      params: { path: { id: messageId } },
    }));
  }

  async getThread(messageId: string, query: MessageQuery): Promise<Schemas['MessagePage']> {
    return unwrap(await this.#client.GET('/messages/{id}/replies', {
      params: { path: { id: messageId }, query },
    }));
  }

  async editMessage(messageId: string, content: string): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.PATCH('/messages/{id}', {
      params: { path: { id: messageId } },
      body: { content },
    }));
  }

  async deleteMessage(messageId: string): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.DELETE('/messages/{id}', {
      params: { path: { id: messageId } },
    }));
  }

  async resolveMessage(messageId: string): Promise<Schemas['ResolveMessageResponse']> {
    return unwrap(await this.#client.POST('/messages/{id}/resolve', {
      params: { path: { id: messageId } },
    }));
  }

  async unresolveMessage(messageId: string): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.DELETE('/messages/{id}/resolve', {
      params: { path: { id: messageId } },
    }));
  }

  async setThreadTitle(messageId: string, title: string, ifUnset?: boolean): Promise<Schemas['ThreadTitleResponse']> {
    return unwrap(await this.#client.PUT('/messages/{id}/thread-title', {
      params: { path: { id: messageId } },
      body: { title, if_unset: ifUnset ?? false },
    }));
  }

  async retryMessage(messageId: string): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.POST('/messages/{id}/retry', {
      params: { path: { id: messageId } },
    }));
  }

  async setMessageProcessStatus(
    messageId: string,
    body: Schemas['UpdateMessageProcessStatusRequest'],
  ): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.POST('/messages/{id}/process', {
      params: { path: { id: messageId } },
      body,
    }));
  }

  async search(query: SearchQuery): Promise<Schemas['SearchResponse']> {
    return unwrap(await this.#client.GET('/search', { params: { query } }));
  }

  async sendMessage(
    channelId: string,
    body: Schemas['SendMessageRequest'],
  ): Promise<Schemas['Message']> {
    return unwrap(await this.#client.POST('/channels/{id}/messages', {
      params: { path: { id: channelId } },
      body,
    }));
  }

  async replyToMessage(
    messageId: string,
    body: Schemas['SendMessageRequest'],
  ): Promise<Schemas['Message']> {
    return unwrap(await this.#client.POST('/messages/{id}/replies', {
      params: { path: { id: messageId } },
      body,
    }));
  }

  async addReaction(messageId: string, emoji: string): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.POST('/messages/{id}/reactions', {
      params: { path: { id: messageId } },
      body: { emoji },
    }));
  }

  async removeReaction(messageId: string, emoji: string): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.DELETE('/messages/{id}/reactions/{emoji}', {
      params: { path: { id: messageId, emoji } },
    }));
  }

  async listPins(channelId: string): Promise<Schemas['PinnedMessageListResponse']> {
    return unwrap(await this.#client.GET('/channels/{id}/pins', {
      params: { path: { id: channelId } },
    }));
  }

  async pinMessage(channelId: string, messageId: string): Promise<Schemas['PinnedMessage']> {
    return unwrap(await this.#client.POST('/channels/{id}/pins', {
      params: { path: { id: channelId } },
      body: { messageId },
    }));
  }

  async unpinMessage(channelId: string, messageId: string): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.DELETE('/channels/{id}/pins/{messageId}', {
      params: { path: { id: channelId, messageId } },
    }));
  }

  async createEphemeralChannel(): Promise<Schemas['EphemeralChannelResponse']> {
    return unwrap(await this.#client.POST('/channels/ephemeral'));
  }

  async archiveEphemeralChannel(channelId: string): Promise<Schemas['EphemeralArchiveResponse']> {
    return unwrap(await this.#client.POST('/channels/{id}/archive', {
      params: { path: { id: channelId } },
    }));
  }

  async unarchiveEphemeralChannel(channelId: string): Promise<Schemas['EphemeralUnarchiveResponse']> {
    return unwrap(await this.#client.DELETE('/channels/{id}/archive', {
      params: { path: { id: channelId } },
    }));
  }

  async renameEphemeralChannel(channelId: string, slug: string): Promise<Schemas['EphemeralRenameResponse']> {
    return unwrap(await this.#client.POST('/channels/{id}/rename', {
      params: { path: { id: channelId } },
      body: { slug },
    }));
  }

  async promoteEphemeralChannel(channelId: string, name?: string): Promise<Schemas['EphemeralPromoteResponse']> {
    return unwrap(await this.#client.POST('/channels/{id}/promote', {
      params: { path: { id: channelId } },
      body: { name },
    }));
  }

  async regenerateEphemeralName(channelId: string): Promise<Schemas['EphemeralRegenerateNameResponse']> {
    return unwrap(await this.#client.POST('/channels/{id}/regenerate-name', {
      params: { path: { id: channelId } },
    }));
  }

  async uploadAttachment(
    filename: string,
    contentType: string,
    base64Data: string,
  ): Promise<Schemas['UploadResponse']> {
    let bytes: Uint8Array;
    try {
      const binary = atob(base64Data);
      bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    } catch {
      throw new ThreadsApiError(400, 'Attachment data is not valid base64', undefined);
    }

    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: contentType }), filename);
    const response = await this.#fetch(`${this.#baseUrl}/uploads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.#token}` },
      body: form,
    });
    const payload = await response.json().catch(() => undefined) as unknown;
    return unwrap({
      response,
      ...(response.ok ? { data: payload as Schemas['UploadResponse'] } : { error: payload }),
    });
  }

  async listProcesses(status?: ProcessQueryStatus): Promise<Schemas['ProcessListResponse']> {
    return unwrap(await this.#client.GET('/processes', {
      params: { query: { status } },
    }) as ApiResult<Schemas['ProcessListResponse']>);
  }

  async createProcess(
    body: CreateProcessBody,
  ): Promise<Schemas['CreateProcessResponse']> {
    return unwrap(await this.#client.POST('/processes', { body }));
  }

  async getProcess(processId: string): Promise<Schemas['ProcessRecord']> {
    return unwrap(await this.#client.GET('/processes/{id}', {
      params: { path: { id: processId } },
    }) as ApiResult<Schemas['ProcessRecord']>);
  }

  async updateProcess(
    processId: string,
    body: UpdateProcessBody,
  ): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.PATCH('/processes/{id}', {
      params: { path: { id: processId } },
      body,
    }) as ApiResult<Schemas['OkResponse']>);
  }

  async recordProcessActivity(
    processId: string,
    body: Schemas['ProcessActivityRequest'],
  ): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.POST('/processes/{id}/activity', {
      params: { path: { id: processId } },
      body,
    }) as ApiResult<Schemas['OkResponse']>);
  }

  async cleanupProcessesByBot(): Promise<Schemas['ProcessCleanupResponse']> {
    return unwrap(await this.#client.POST('/processes/cleanup-by-bot'));
  }

  async killAllProcesses(): Promise<Schemas['ProcessCleanupResponse']> {
    return unwrap(await this.#client.POST('/processes/kill-all'));
  }

  async killProcess(processId: string): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.DELETE('/processes/{id}', {
      params: { path: { id: processId } },
    }) as ApiResult<Schemas['OkResponse']>);
  }

  async getBoard(channelId: string): Promise<Schemas['KanbanBoardWithCardsResponse']> {
    return unwrap(await this.#client.GET('/channels/{id}/board', {
      params: { path: { id: channelId } },
    }));
  }

  async createBoard(channelId: string): Promise<Schemas['KanbanBoard']> {
    return unwrap(await this.#client.POST('/channels/{id}/board', {
      params: { path: { id: channelId } },
    }));
  }

  async updateBoard(channelId: string, columns: string[]): Promise<Schemas['KanbanBoard']> {
    return unwrap(await this.#client.PUT('/channels/{id}/board', {
      params: { path: { id: channelId } },
      body: { columns },
    }));
  }

  async createCard(channelId: string, body: Schemas['CreateKanbanCardRequest']): Promise<Schemas['KanbanCard']> {
    return unwrap(await this.#client.POST('/channels/{id}/board/cards', {
      params: { path: { id: channelId } },
      body,
    }));
  }

  async updateCard(cardId: string, body: Schemas['UpdateKanbanCardRequest']): Promise<Schemas['KanbanCard']> {
    return unwrap(await this.#client.PUT('/boards/cards/{cardId}', {
      params: { path: { cardId } },
      body,
    }));
  }

  async deleteCard(cardId: string): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.DELETE('/boards/cards/{cardId}', {
      params: { path: { cardId } },
    }));
  }

  async listSavedDrafts(channelId: string): Promise<Schemas['SavedDraft'][]> {
    return unwrap(await this.#client.GET('/channels/{id}/saved-drafts', {
      params: { path: { id: channelId } },
    }));
  }

  async createSavedDraft(channelId: string, content: string): Promise<Schemas['SavedDraft']> {
    return unwrap(await this.#client.POST('/channels/{id}/saved-drafts', {
      params: { path: { id: channelId } },
      body: { content },
    }));
  }

  async scheduleSavedDraft(draftId: string, scheduledAt: string | null): Promise<Schemas['SavedDraft']> {
    return unwrap(await this.#client.PATCH('/saved-drafts/{id}/schedule', {
      params: { path: { id: draftId } },
      body: { scheduled_at: scheduledAt },
    }));
  }

  async deleteSavedDraft(draftId: string): Promise<Schemas['OkResponse']> {
    return unwrap(await this.#client.DELETE('/saved-drafts/{id}', {
      params: { path: { id: draftId } },
    }));
  }
}
