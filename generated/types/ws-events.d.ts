export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ClientEvent: components["schemas"]["TypingStartClientEvent"] | components["schemas"]["TypingStopClientEvent"] | components["schemas"]["MarkReadClientEvent"] | components["schemas"]["PingClientEvent"] | components["schemas"]["ProcessKillClientEvent"] | components["schemas"]["ProcessRetryClientEvent"] | components["schemas"]["MessageCreateClientEvent"] | components["schemas"]["ReactionAddClientEvent"] | components["schemas"]["ProcessCreateClientEvent"] | components["schemas"]["ProcessUpdateClientEvent"] | components["schemas"]["ProcessActivityClientEvent"] | components["schemas"]["MessageProcessStatusClientEvent"] | components["schemas"]["PresencePongClientEvent"];
        ServerEvent: components["schemas"]["UserJoinedEvent"] | components["schemas"]["UserLeftEvent"] | components["schemas"]["UserTypingEvent"] | components["schemas"]["UserStoppedTypingEvent"] | components["schemas"]["PongEvent"] | components["schemas"]["ActionResultEvent"] | components["schemas"]["ActionErrorEvent"] | components["schemas"]["MessageEvent"] | components["schemas"]["MessageEditedEvent"] | components["schemas"]["MessageDeletedEvent"] | components["schemas"]["ReactionAddedEvent"] | components["schemas"]["ReactionRemovedEvent"] | components["schemas"]["ProcessCreatedEvent"] | components["schemas"]["ProcessUpdatedEvent"] | components["schemas"]["ProcessStatusEvent"] | components["schemas"]["ProcessKillEvent"] | components["schemas"]["ProcessRetryEvent"] | components["schemas"]["ChannelUpdatedEvent"] | components["schemas"]["ChannelArchivedEvent"] | components["schemas"]["ChannelDeletedEvent"] | components["schemas"]["MemberAddedEvent"] | components["schemas"]["MemberRemovedEvent"] | components["schemas"]["MessagePinnedEvent"] | components["schemas"]["MessageUnpinnedEvent"] | components["schemas"]["MessageResolvedEvent"] | components["schemas"]["MessageUnresolvedEvent"] | components["schemas"]["ThreadTitleUpdatedEvent"] | components["schemas"]["LinkPreviewEvent"] | components["schemas"]["BotLoopTrippedEvent"] | components["schemas"]["BoardUpdatedEvent"] | components["schemas"]["CardCreatedEvent"] | components["schemas"]["CardUpdatedEvent"] | components["schemas"]["CardDeletedEvent"] | components["schemas"]["removed_event"] | components["schemas"]["PresenceSnapshotEvent"] | components["schemas"]["PresenceUpdateEvent"] | components["schemas"]["PresencePingEvent"];
        Id: string;
        NullableId: string | null;
        EpochSeconds: number;
        /** Format: date-time */
        IsoDateTime: string;
        /** @enum {string} */
        ProcessStatus: "queued" | "running" | "processing" | "done" | "error" | "killed" | "restarted";
        /** @enum {string} */
        ProcessingMode: "immediate" | "serial";
        /** @enum {string} */
        UserRole: "user" | "bot" | "admin";
        JsonObject: {
            [key: string]: unknown;
        };
        /** @description Optional caller-provided correlation ID echoed by action_result/action_error. */
        ActionId: string | number | null;
        Mention: {
            userId: components["schemas"]["Id"];
            username: string;
        };
        Attachment: {
            id: components["schemas"]["Id"];
            filename: string;
            contentType: string;
            sizeBytes: number;
            url: string;
        };
        Pin: {
            id: components["schemas"]["Id"];
            channel_id: components["schemas"]["Id"];
            message_id: components["schemas"]["Id"];
            pinned_by: components["schemas"]["Id"];
            created_at: components["schemas"]["EpochSeconds"];
        };
        ProcessRecord: {
            id: components["schemas"]["Id"];
            channel_id: components["schemas"]["Id"];
            channel_name: string;
            /** @enum {integer} */
            is_dm: 0 | 1;
            message_id: components["schemas"]["NullableId"];
            thread_id: components["schemas"]["NullableId"];
            /** @description Unix seconds when the linked top-level thread was marked resolved. For processes attached to thread replies, this is inherited from the thread root. */
            resolved_at?: components["schemas"]["EpochSeconds"] | null;
            resolved_by?: components["schemas"]["NullableId"];
            user_id: components["schemas"]["Id"];
            username: string;
            display_name: string | null;
            status: components["schemas"]["ProcessStatus"];
            started_at?: components["schemas"]["IsoDateTime"] | null;
            ended_at?: components["schemas"]["IsoDateTime"] | null;
            updated_at?: components["schemas"]["IsoDateTime"] | null;
            pid?: number | null;
            input_tokens?: number;
            output_tokens?: number;
            cache_creation_input_tokens?: number;
            cache_read_input_tokens?: number;
            tool_call_count?: number;
            reply_count?: number;
            bot_id: components["schemas"]["NullableId"];
            bot_username: string;
            bot_display_name: string | null;
        };
        TypingStartClientEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "TypingStartClientEvent";
        };
        TypingStopClientEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "TypingStopClientEvent";
        };
        MarkReadClientEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "MarkReadClientEvent";
            messageId: components["schemas"]["Id"];
        };
        PingClientEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "PingClientEvent";
        };
        ProcessKillClientEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ProcessKillClientEvent";
            messageId: components["schemas"]["Id"];
            processId: components["schemas"]["Id"];
        };
        ProcessRetryClientEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ProcessRetryClientEvent";
            messageId: components["schemas"]["Id"];
            processId: components["schemas"]["Id"];
        };
        MessageCreateClientEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "MessageCreateClientEvent";
            actionId?: components["schemas"]["ActionId"];
            channelId: components["schemas"]["Id"];
            content: string;
            threadId?: components["schemas"]["NullableId"];
            parentId?: components["schemas"]["NullableId"];
            attachmentIds?: components["schemas"]["Id"][];
            metadata?: components["schemas"]["JsonObject"] | null;
            /** @enum {string} */
            message_type?: "human" | "response" | "progress" | "tool_output" | "thinking";
            /** @enum {string} */
            messageType?: "human" | "response" | "progress" | "tool_output" | "thinking";
        };
        ReactionAddClientEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ReactionAddClientEvent";
            actionId?: components["schemas"]["ActionId"];
            messageId: components["schemas"]["Id"];
            emoji: string;
        };
        ProcessCreateClientEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ProcessCreateClientEvent";
            actionId?: components["schemas"]["ActionId"];
            id?: components["schemas"]["Id"];
            channel_id?: components["schemas"]["Id"];
            channelId?: components["schemas"]["Id"];
            message_id?: components["schemas"]["NullableId"];
            messageId?: components["schemas"]["NullableId"];
            user_id?: components["schemas"]["Id"];
            userId?: components["schemas"]["Id"];
            bot_id?: components["schemas"]["NullableId"];
            botUserId?: components["schemas"]["NullableId"];
            status?: components["schemas"]["ProcessStatus"];
            pid?: number | null;
        };
        ProcessUpdateClientEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ProcessUpdateClientEvent";
            actionId?: components["schemas"]["ActionId"];
            id?: components["schemas"]["Id"];
            processId?: components["schemas"]["Id"];
            status?: components["schemas"]["ProcessStatus"];
            tool_call_count?: number;
            reply_count?: number;
            input_tokens?: number;
            output_tokens?: number;
            cache_creation_input_tokens?: number;
            cache_read_input_tokens?: number;
        };
        ProcessActivityClientEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ProcessActivityClientEvent";
            actionId?: components["schemas"]["ActionId"];
            processId: components["schemas"]["Id"];
            /** @enum {string} */
            activityType?: "tool_call" | "reply" | "token_usage";
            /** @enum {string} */
            activity_type?: "tool_call" | "reply" | "token_usage";
            /** @enum {string} */
            processActivityType?: "tool_call" | "reply" | "token_usage";
            input_tokens?: number;
            output_tokens?: number;
            cache_creation_input_tokens?: number;
            cache_read_input_tokens?: number;
        };
        MessageProcessStatusClientEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "MessageProcessStatusClientEvent";
            actionId?: components["schemas"]["ActionId"];
            messageId: components["schemas"]["Id"];
            processId: components["schemas"]["Id"];
            status: components["schemas"]["ProcessStatus"];
            input_tokens?: number;
            output_tokens?: number;
            cache_creation_input_tokens?: number;
            cache_read_input_tokens?: number;
            error_text?: string | null;
        };
        PresencePongClientEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "PresencePongClientEvent";
        };
        UserJoinedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "UserJoinedEvent";
            userId: components["schemas"]["Id"];
            username: string;
        };
        UserLeftEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "UserLeftEvent";
            userId: components["schemas"]["Id"];
        };
        UserTypingEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "UserTypingEvent";
            userId: components["schemas"]["Id"];
            username: string;
        };
        UserStoppedTypingEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "UserStoppedTypingEvent";
            userId: components["schemas"]["Id"];
        };
        PongEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "PongEvent";
        };
        ActionResultEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ActionResultEvent";
            actionId: components["schemas"]["ActionId"];
            /** @enum {string} */
            action: "message.create" | "reaction.add" | "process.create" | "process.update" | "process.activity" | "message.process_status";
            status: number;
            /** @description JSON response body returned by the underlying action handler. */
            result: unknown;
        };
        ActionErrorEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ActionErrorEvent";
            actionId: components["schemas"]["ActionId"];
            status: number;
            /** @description Error body or message returned by the failed action. */
            error: unknown;
        };
        MessageEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "MessageEvent";
            id: components["schemas"]["Id"];
            channelId: components["schemas"]["Id"];
            userId: components["schemas"]["Id"];
            username: string;
            displayName?: string | null;
            nameColor?: string | null;
            userRole?: components["schemas"]["UserRole"];
            content: string;
            threadId: components["schemas"]["NullableId"];
            createdAt: components["schemas"]["EpochSeconds"];
            mentions: components["schemas"]["Mention"][];
            attachments: components["schemas"]["Attachment"][];
            metadata: components["schemas"]["JsonObject"] | null;
            /** @enum {string} */
            messageType?: "human" | "response" | "progress" | "tool_output" | "thinking";
            autoRespondBotId: components["schemas"]["NullableId"];
            processingMode: components["schemas"]["ProcessingMode"];
        };
        MessageEditedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "MessageEditedEvent";
            id: components["schemas"]["Id"];
            content: string;
            editedAt: components["schemas"]["EpochSeconds"];
        };
        MessageDeletedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "MessageDeletedEvent";
            id: components["schemas"]["Id"];
            threadId: components["schemas"]["NullableId"];
        };
        ReactionAddedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ReactionAddedEvent";
            messageId: components["schemas"]["Id"];
            userId: components["schemas"]["Id"];
            username: string;
            userRole: components["schemas"]["UserRole"];
            messageAuthorRole: components["schemas"]["UserRole"];
            emoji: string;
            autoRespondBotId: components["schemas"]["NullableId"];
            processingMode: components["schemas"]["ProcessingMode"];
        };
        ReactionRemovedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ReactionRemovedEvent";
            messageId: components["schemas"]["Id"];
            userId: components["schemas"]["Id"];
            emoji: string;
        };
        ProcessCreatedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ProcessCreatedEvent";
            process: components["schemas"]["ProcessRecord"];
        };
        ProcessUpdatedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ProcessUpdatedEvent";
            process: components["schemas"]["ProcessRecord"];
        };
        ProcessStatusEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ProcessStatusEvent";
            messageId: components["schemas"]["Id"];
            processId: components["schemas"]["Id"];
            status: components["schemas"]["ProcessStatus"];
            threadId: components["schemas"]["NullableId"];
            input_tokens?: number;
            output_tokens?: number;
            cache_creation_input_tokens?: number;
            cache_read_input_tokens?: number;
            error_text?: string;
        };
        ProcessKillEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ProcessKillEvent";
            messageId: components["schemas"]["Id"];
            processId: components["schemas"]["Id"];
            botUserId?: components["schemas"]["NullableId"];
        };
        ProcessRetryEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ProcessRetryEvent";
            messageId: components["schemas"]["Id"];
            processId: components["schemas"]["Id"];
        };
        ChannelUpdatedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ChannelUpdatedEvent";
            channelId: components["schemas"]["Id"];
            name?: string;
            description?: string | null;
            processing_mode?: components["schemas"]["ProcessingMode"];
            /** @enum {integer} */
            board_enabled?: 0 | 1;
            auto_respond_bot_id?: components["schemas"]["NullableId"];
            /** @enum {integer} */
            is_ephemeral?: 0 | 1;
            auto_named_at?: components["schemas"]["EpochSeconds"] | null;
            archived_at?: components["schemas"]["EpochSeconds"] | null;
        };
        ChannelArchivedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ChannelArchivedEvent";
            channelId: components["schemas"]["Id"];
        };
        ChannelDeletedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ChannelDeletedEvent";
            channelId: components["schemas"]["Id"];
        };
        MemberAddedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "MemberAddedEvent";
            channelId: components["schemas"]["Id"];
            targetUserId: components["schemas"]["Id"];
            username?: string;
            displayName?: string | null;
        };
        MemberRemovedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "MemberRemovedEvent";
            channelId: components["schemas"]["Id"];
            targetUserId: components["schemas"]["Id"];
        };
        MessagePinnedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "MessagePinnedEvent";
            channelId: components["schemas"]["Id"];
            messageId: components["schemas"]["Id"];
            pinnedBy: components["schemas"]["Id"];
            pin: components["schemas"]["Pin"];
        };
        MessageUnpinnedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "MessageUnpinnedEvent";
            channelId: components["schemas"]["Id"];
            messageId: components["schemas"]["Id"];
        };
        MessageResolvedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "MessageResolvedEvent";
            id: components["schemas"]["Id"];
            channelId: components["schemas"]["Id"];
            resolvedBy: components["schemas"]["Id"];
            resolvedAt: number;
        };
        MessageUnresolvedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "MessageUnresolvedEvent";
            id: components["schemas"]["Id"];
            channelId: components["schemas"]["Id"];
        };
        ThreadTitleUpdatedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "ThreadTitleUpdatedEvent";
            channelId: components["schemas"]["Id"];
            threadId: components["schemas"]["Id"];
            title: string;
            updatedAt: components["schemas"]["EpochSeconds"];
        };
        LinkPreviewEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "LinkPreviewEvent";
            messageId: components["schemas"]["Id"];
            /** Format: uri */
            url: string;
            title?: string | null;
            description?: string | null;
            imageUrl?: string | null;
            siteName?: string | null;
        };
        /** @description The per-channel bot-loop circuit breaker tripped: consecutive top-level bot responses exceeded the threshold. Bot sockets are excluded from message fan-out until a human posts or the breaker auto-resets. */
        BotLoopTrippedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "BotLoopTrippedEvent";
            channelId: components["schemas"]["Id"];
            /** @description Epoch milliseconds when the breaker tripped. */
            trippedAt: number;
        };
        BoardUpdatedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "BoardUpdatedEvent";
            id: components["schemas"]["Id"];
            channel_id: components["schemas"]["Id"];
            columns?: string;
            created_at?: string;
            updated_at?: string;
        } & {
            [key: string]: unknown;
        };
        CardCreatedEvent: components["schemas"]["CardEventBase"] & {
            /** @constant */
            type?: "card_created";
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "CardCreatedEvent";
        };
        CardUpdatedEvent: components["schemas"]["CardEventBase"] & {
            /** @constant */
            type?: "card_updated";
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "CardUpdatedEvent";
        };
        CardEventBase: {
            /** @enum {string} */
            type: "card_created" | "card_updated";
            id: components["schemas"]["Id"];
            board_id: components["schemas"]["Id"];
            column_key: string;
            title: string;
            description?: string | null;
            assignee?: components["schemas"]["NullableId"];
            priority?: string;
            position: number;
            source_message_id?: components["schemas"]["NullableId"];
            metadata?: string | components["schemas"]["JsonObject"] | null;
            created_by?: components["schemas"]["NullableId"];
            created_at?: string;
            updated_at?: string;
        } & {
            [key: string]: unknown;
        };
        CardDeletedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "CardDeletedEvent";
            cardId: components["schemas"]["Id"];
            boardId: components["schemas"]["Id"];
        };
        removed_event: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "removed_event";
            requestedBy: components["schemas"]["Id"];
            requestedByUsername?: string;
            reason?: string | null;
        } & {
            [key: string]: unknown;
        };
        PresenceSnapshotEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "PresenceSnapshotEvent";
            users: {
                [key: string]: boolean;
            };
        };
        PresenceUpdateEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "PresenceUpdateEvent";
            userId: components["schemas"]["Id"];
            online: boolean;
        };
        PresencePingEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "PresencePingEvent";
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
