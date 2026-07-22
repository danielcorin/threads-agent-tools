export interface paths {
    "/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * POST /auth/login
         * @description Authenticate with username and password. Returns the user record without password_hash and sets the session cookie.
         */
        post: operations["postAuthLogin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * POST /auth/logout
         * @description Delete the current session token when present and clear the session cookie.
         */
        post: operations["postAuthLogout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/change-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * POST /auth/change-password
         * @description Change the authenticated user password after validating the current password.
         */
        post: operations["postAuthChangePassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/email/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Confirm ownership of an email address
         * @description Consume the single-use verification token sent by email, make the pending address the user's verified recovery email, and redirect to the application settings screen.
         */
        get: operations["getAuthEmailConfirm"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * POST /users
         * @description Create a human or bot user with an initial password. Human users require a unique recovery email and the API immediately attempts to send its confirmation link; delivery status is returned without making a temporary mail outage block account creation. Bot email is optional. Requires an admin session or an admin bearer token with users:provision.
         */
        post: operations["postUsers"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /events
         * @description Owner-scoped event WebSocket upgrade endpoint. One socket carries events across all of the authenticated user's channels; payloads are the channel event schemas defined in api/openapi/ws-events.yaml, each enriched with channelId and a room object. HTTP upgrade is represented here.
         */
        get: operations["getEvents"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ws/presence": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /ws/presence
         * @description WebSocket upgrade endpoint. HTTP upgrade is represented here; event payloads are defined in api/openapi/ws-events.yaml.
         */
        get: operations["getWsPresence"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ws/{channelId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /ws/:channelId
         * @description WebSocket upgrade endpoint. HTTP upgrade is represented here; event payloads are defined in api/openapi/ws-events.yaml.
         */
        get: operations["getWsChannelId"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/presence": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /presence
         * @description Return online/offline presence for a comma-separated userIds query parameter via the presence Durable Object.
         */
        get: operations["getPresence"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/uploads/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /uploads/:key{.+}
         * @description Return a previously uploaded R2 object. Dangerous stored content types are served as application/octet-stream.
         */
        get: operations["getUploadsKey"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/uploads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * POST /uploads
         * @description Upload one multipart file field named file to R2 and create an unattached attachment record.
         */
        post: operations["postUploads"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/transcribe": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * POST /transcribe
         * @description Transcribe a short audio clip (voice memo) to text with Workers AI Whisper. The request body is raw audio bytes (audio/webm, audio/mp4, audio/ogg); Whisper detects the container. Returns the transcription text, which the client drops into the message composer.
         */
        post: operations["postTranscribe"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/link-previews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /link-previews
         * @description Fetch a safe HTTP(S) URL preview or return a cached preview. Returns preview: null when no usable preview is available.
         */
        get: operations["getLinkPreviews"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /users/me
         * @description Return the authenticated user profile used by the client session.
         */
        get: operations["getUsersMe"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * PATCH /users/me
         * @description Update mutable authenticated-user profile preferences. At least one recognized field is required.
         */
        patch: operations["patchUsersMe"];
        trace?: never;
    };
    "/users/me/email/change": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Set or change the current user's recovery email
         * @description Re-authorize with the current password and send a single-use verification link to the requested address. An existing verified address remains active until the replacement is confirmed. Requesting the already-verified address cancels any pending replacement. Browser session authentication is required; bearer tokens are rejected.
         */
        post: operations["postUsersMeEmailChange"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me/email/verification/resend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Resend the pending email verification
         * @description Invalidate the prior token and send a fresh verification link for the current pending address. Subject to per-user cooldown and daily limits. Browser session authentication is required; bearer tokens are rejected.
         */
        post: operations["postUsersMeEmailVerificationResend"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me/frequent-emojis": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /users/me/frequent-emojis
         * @description Return exactly three frequently used reaction emojis, backfilled with defaults when needed.
         */
        get: operations["getUsersMeFrequentEmojis"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me/api-tokens": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /users/me/api-tokens
         * @description List the authenticated admin's API tokens. Requires an interactive session. Returns non-secret metadata including scopes, expiry, and last use — never the token value.
         */
        get: operations["getUsersMeApiTokens"];
        put?: never;
        /**
         * POST /users/me/api-tokens
         * @description Create a scoped API bearer token for the authenticated admin. Requires an interactive session. The token is returned once, stored only as a keyed one-way verifier, and cannot be retrieved later. Scopes default to read/write and expiry defaults to 90 days.
         */
        post: operations["postUsersMeApiTokens"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me/api-tokens/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * DELETE /users/me/api-tokens/:id
         * @description Revoke one of the authenticated admin's own API tokens by its hashed id (from GET /users/me/api-tokens). Requires an interactive session and immediately closes sockets using that credential.
         */
        delete: operations["deleteUsersMeApiTokensId"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me/webhooks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /users/me/webhooks
         * @description List webhook registrations owned by the authenticated user. Bot agents should call this with the bot's bearer token to inspect the bot's own delivery URLs. Secrets are never returned after creation.
         */
        get: operations["getUsersMeWebhooks"];
        put?: never;
        /**
         * POST /users/me/webhooks
         * @description Register one webhook URL for the authenticated user. Bot agents should call this with the bot's bearer token. The signing secret is returned once and cannot be retrieved later.
         */
        post: operations["postUsersMeWebhooks"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me/webhooks/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * DELETE /users/me/webhooks/:id
         * @description Delete one webhook registration owned by the authenticated user. Deleting and recreating a webhook is the rotation path for the signing secret.
         */
        delete: operations["deleteUsersMeWebhooksId"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{id}/api-tokens": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * POST /users/:id/api-tokens
         * @description Create an API bearer token for another user by id. Requires an admin session or an admin bearer token with tokens:manage. The token is returned once, stored only as a keyed one-way verifier, and cannot be retrieved later.
         */
        post: operations["postUsersIdApiTokens"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bots/self/capabilities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * POST /bots/self/capabilities
         * @description Allow bot users to advertise their own model and DM capabilities. Non-bot users receive 403.
         */
        post: operations["postBotsSelfCapabilities"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /users/search
         * @description Search users by username or display name. Optional channel filters out existing channel members.
         */
        get: operations["getUsersSearch"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/bots": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /users/bots
         * @description List all bot users (role='bot'). Used to populate the per-user ephemeral-channel bot picker.
         */
        get: operations["getUsersBots"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/dms": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /dms
         * @description List visible direct message channels for the authenticated user, including partner details, unread state, and sendability metadata.
         */
        get: operations["getDms"];
        put?: never;
        /**
         * POST /dms
         * @description Create or reopen a direct message channel with another user. Existing DMs return 200; newly-created DMs return 201.
         */
        post: operations["postDms"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/dms/reorder": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * PUT /dms/reorder
         * @description Persist the authenticated user's custom ordering for visible direct message channels.
         */
        put: operations["putDmsReorder"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/dms/{id}/hide": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * PATCH /dms/:id/hide
         * @description Hide a direct message channel for the authenticated user without deleting the conversation.
         */
        patch: operations["patchDmsIdHide"];
        trace?: never;
    };
    "/channels": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /channels
         * @description List non-DM, non-archived channels the authenticated user belongs to, including notification tier and unread metadata.
         */
        get: operations["getChannels"];
        put?: never;
        /**
         * POST /channels
         * @description Create a channel and add the authenticated user as its first member.
         */
        post: operations["postChannels"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/browse": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /channels/browse
         * @description List public non-DM channels, including whether the authenticated user is a current member and each channel member count.
         */
        get: operations["getChannelsBrowse"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /channels/:id
         * @description Get channel metadata by id. Private channels are only visible to current members.
         */
        get: operations["getChannelsId"];
        put?: never;
        post?: never;
        /**
         * DELETE /channels/:id
         * @description Delete a channel and its related data. Only the channel creator or an admin may delete it.
         */
        delete: operations["deleteChannelsId"];
        options?: never;
        head?: never;
        /**
         * PATCH /channels/:id
         * @description Update mutable channel metadata and settings for a channel the authenticated user belongs to.
         */
        patch: operations["patchChannelsId"];
        trace?: never;
    };
    "/channels/{id}/join": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * POST /channels/:id/join
         * @description Join a public channel, or rejoin one that the authenticated user previously left.
         */
        post: operations["postChannelsIdJoin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/leave": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * POST /channels/:id/leave
         * @description Hard-remove the authenticated user from a channel membership.
         */
        post: operations["postChannelsIdLeave"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /channels/:id/members
         * @description List current channel members. Private channel member lists are only visible to current members.
         */
        get: operations["getChannelsIdMembers"];
        put?: never;
        /**
         * POST /channels/:id/members
         * @description Add a user to a channel by user id or username. The caller must be a current member.
         */
        post: operations["postChannelsIdMembers"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/members/{targetUserId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * DELETE /channels/:id/members/:targetUserId
         * @description Remove a member from a channel. Non-admin users may only remove themselves.
         */
        delete: operations["deleteChannelsIdMembersTargetUserId"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/membership": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * DELETE /channels/:id/membership
         * @description Soft-leave a non-DM channel, hiding it from the user while preserving channel history.
         */
        delete: operations["deleteChannelsIdMembership"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * PATCH /channels/:id/notifications
         * @description Update the authenticated user's notification tier for a channel membership.
         */
        patch: operations["patchChannelsIdNotifications"];
        trace?: never;
    };
    "/folders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /folders
         * @description List channel folders for the authenticated user, including ordered channel ids assigned to each folder.
         */
        get: operations["getFolders"];
        put?: never;
        /**
         * POST /folders
         * @description Create a channel folder for the authenticated user at the next folder position.
         */
        post: operations["postFolders"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/folders/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * DELETE /folders/:id
         * @description Delete one of the authenticated user's folders. Channel records are not deleted.
         */
        delete: operations["deleteFoldersId"];
        options?: never;
        head?: never;
        /**
         * PATCH /folders/:id
         * @description Update the authenticated user's folder name, position, and/or collapsed state.
         */
        patch: operations["patchFoldersId"];
        trace?: never;
    };
    "/folders/{id}/channels": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * POST /folders/:id/channels
         * @description Move a channel into one of the authenticated user's folders, optionally at an explicit position.
         */
        post: operations["postFoldersIdChannels"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/folders/{id}/channels/{channelId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * DELETE /folders/:id/channels/:channelId
         * @description Remove a channel from one of the authenticated user's folders.
         */
        delete: operations["deleteFoldersIdChannelsChannelId"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/folders/reorder": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * PUT /folders/reorder
         * @description Bulk update folder positions and/or channel-folder item positions for the authenticated user.
         */
        put: operations["putFoldersReorder"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /channels/:id/messages
         * @description List non-thread messages in a channel. Supports cursor pagination, fetching newer messages, and anchoring around a message id.
         */
        get: operations["getChannelsIdMessages"];
        put?: never;
        /**
         * POST /channels/:id/messages
         * @description Send a top-level message to a channel.
         */
        post: operations["postChannelsIdMessages"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * POST /channels/:id/read
         * @description Mark the latest visible message in a channel as read for the current user.
         */
        post: operations["postChannelsIdRead"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/messages/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /messages/:id
         * @description Get a single message by id after verifying channel membership.
         */
        get: operations["getMessagesId"];
        put?: never;
        post?: never;
        /**
         * DELETE /messages/:id
         * @description Soft-delete a message owned by the current user.
         */
        delete: operations["deleteMessagesId"];
        options?: never;
        head?: never;
        /**
         * PATCH /messages/:id
         * @description Edit a message owned by the current user.
         */
        patch: operations["patchMessagesId"];
        trace?: never;
    };
    "/messages/{id}/resolve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * POST /messages/:id/resolve
         * @description Mark a top-level message as resolved. The thread dims in place rather than being deleted, distinguishing threads the author is finished with from ones still needing work. Any channel member may resolve, which also lets a bot resolve on a user's behalf via an API token.
         */
        post: operations["postMessagesIdResolve"];
        /**
         * DELETE /messages/:id/resolve
         * @description Clear the resolved state of a message so its thread is no longer dimmed.
         */
        delete: operations["deleteMessagesIdResolve"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/messages/{id}/thread-title": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Set or rename a thread title
         * @description Set a human-readable title on a message thread. The id may identify either the top-level message or one of its replies; the title is stored on the thread root. Titles preserve case and punctuation and do not need to be unique. Any current channel member may rename the thread. Automatic callers can request set-if-empty behavior so they do not overwrite an existing title.
         */
        put: operations["putMessagesIdThreadTitle"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/messages/{id}/replies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /messages/:id/replies
         * @description List replies in a message thread.
         */
        get: operations["getMessagesIdReplies"];
        put?: never;
        /**
         * POST /messages/:id/replies
         * @description Send a reply to a message thread.
         */
        post: operations["postMessagesIdReplies"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/messages/{id}/reactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * POST /messages/:id/reactions
         * @description Add a reaction to a message as the current user. Creating a new reaction returns 201; adding the same emoji again is idempotent and returns 200.
         */
        post: operations["postMessagesIdReactions"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/messages/{id}/reactions/{emoji}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * DELETE /messages/:id/reactions/:emoji
         * @description Remove the current user's reaction emoji from a message. The emoji path segment is URL-decoded by the API.
         */
        delete: operations["deleteMessagesIdReactionsEmoji"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/messages/{id}/process": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Update message process status
         * @description Attach or update process status and token usage metadata for a message, then broadcast the process_status event to channel subscribers.
         */
        post: operations["postMessagesIdProcess"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/messages/{id}/retry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Retry message processing
         * @description Reset a failed, killed, or restarted message process back to queued, clear its process error text, and broadcast process_status and process_retry events.
         */
        post: operations["postMessagesIdRetry"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/mentions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /mentions
         * @description List the latest messages that mention the authenticated user across channels they belong to.
         */
        get: operations["getMentions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /search
         * @description Search messages visible to the authenticated user. Supports FTS query syntax plus channel, sender, date, and attachment/reaction/link filters.
         */
        get: operations["getSearch"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/w/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Render widget runtime shell
         * @description Return the public sandboxed HTML runtime for a widget iframe. The parentOrigin query parameter must match an allowed Threads client origin.
         */
        get: operations["getWId"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/ephemeral": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create ephemeral channel
         * @description Create a private ephemeral channel for the authenticated user, optionally adding the Tela bot as the auto-responder when that bot account exists.
         */
        post: operations["postChannelsEphemeral"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/archive": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Archive ephemeral channel
         * @description Soft-archive an ephemeral channel so it disappears from the sidebar while preserving history and searchability. Only the creator or an admin may archive.
         */
        post: operations["postChannelsIdArchive"];
        /**
         * Unarchive ephemeral channel
         * @description Clear the archive timestamp for an ephemeral channel. The caller must still be a channel member.
         */
        delete: operations["deleteChannelsIdArchive"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/rename": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Rename ephemeral channel
         * @description Set the inferred slug for an ephemeral channel that has not already been auto-named. The slug is sanitized server-side and collisions are disambiguated.
         */
        post: operations["postChannelsIdRename"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/promote": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Promote ephemeral channel
         * @description Promote an ephemeral channel into a first-class channel while preserving its id, members, history, and metadata in place.
         */
        post: operations["postChannelsIdPromote"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/regenerate-name": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Regenerate ephemeral channel name
         * @description Clear auto_named_at for an ephemeral channel so the next message can trigger the agent-loop name inference again. Only the creator or an admin may regenerate.
         */
        post: operations["postChannelsIdRegenerateName"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/pins": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /channels/:id/pins
         * @description List pinned messages for a channel visible to the authenticated member, newest pin first.
         */
        get: operations["getChannelsIdPins"];
        put?: never;
        /**
         * POST /channels/:id/pins
         * @description Pin an existing message in the channel. The message must belong to the channel and not already be pinned.
         */
        post: operations["postChannelsIdPins"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/pins/{messageId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * DELETE /channels/:id/pins/:messageId
         * @description Remove a pin for a message in the channel.
         */
        delete: operations["deleteChannelsIdPinsMessageId"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/board": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /channels/:id/board
         * @description Return the kanban board for a channel with its cards ordered by position.
         */
        get: operations["getChannelsIdBoard"];
        /**
         * PUT /channels/:id/board
         * @description Replace the kanban board column key list for the channel.
         */
        put: operations["putChannelsIdBoard"];
        /**
         * POST /channels/:id/board
         * @description Create a kanban board for the channel using the server default columns. Fails with 409 if one already exists.
         */
        post: operations["postChannelsIdBoard"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/board/cards": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * POST /channels/:id/board/cards
         * @description Create a card on the channel board at the next position in the selected column.
         */
        post: operations["postChannelsIdBoardCards"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/boards/cards/{cardId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * PUT /boards/cards/:cardId
         * @description Update mutable fields for a kanban card. Moving to in-progress may emit a channel message for bot processing.
         */
        put: operations["putBoardsCardsCardId"];
        post?: never;
        /**
         * DELETE /boards/cards/:cardId
         * @description Delete a kanban card and its activity log.
         */
        delete: operations["deleteBoardsCardsCardId"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/boards/cards/{cardId}/activity": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /boards/cards/:cardId/activity
         * @description List activity entries for a kanban card, newest first.
         */
        get: operations["getBoardsCardsCardIdActivity"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/widgets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List widgets
         * @description Return all registered widgets without their executable code, ordered newest first.
         */
        get: operations["getWidgets"];
        put?: never;
        /**
         * Create widget
         * @description Create a widget owned by the authenticated user. name and code are required; icon defaults to PuzzlePiece.
         */
        post: operations["postWidgets"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/widgets/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get widget
         * @description Return one widget, including its executable code.
         */
        get: operations["getWidgetsId"];
        /**
         * Update widget
         * @description Update fields on a widget. Only the widget creator can update it, and at least one field is required.
         */
        put: operations["putWidgetsId"];
        post?: never;
        /**
         * Delete widget
         * @description Delete a widget and remove it from all channels. Only the widget creator can delete it.
         */
        delete: operations["deleteWidgetsId"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/widgets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List channel widgets
         * @description Return widgets added to a channel. Private channels require membership.
         */
        get: operations["getChannelsIdWidgets"];
        put?: never;
        /**
         * Add widget to channel
         * @description Add an existing widget to a channel. Private channels require membership; duplicate adds are ignored.
         */
        post: operations["postChannelsIdWidgets"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/widgets/{widgetId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Remove widget from channel
         * @description Remove a widget from a channel. Private channels require membership.
         */
        delete: operations["deleteChannelsIdWidgetsWidgetId"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/widgets/{id}/data/kv/{key}/all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read all user values for a widget KV key
         * @description Return all per-user values for a widget KV key. This endpoint is restricted to bot users.
         */
        get: operations["getWidgetsIdDataKvKeyAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/widgets/{id}/data/kv/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read widget KV value
         * @description Return the authenticated user's value for a widget-scoped key.
         */
        get: operations["getWidgetsIdDataKvKey"];
        /**
         * Store widget KV value
         * @description Create or replace the authenticated user's value for a widget-scoped key. Values are serialized as JSON.
         */
        put: operations["putWidgetsIdDataKvKey"];
        post?: never;
        /**
         * Delete widget KV value
         * @description Delete the authenticated user's value for a widget-scoped key. The response is successful even if the key did not exist.
         */
        delete: operations["deleteWidgetsIdDataKvKey"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/push/vapid-key": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /push/vapid-key
         * @description Return the VAPID public key the client uses to create browser push subscriptions.
         */
        get: operations["getPushVapidKey"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/push/subscribe": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * POST /push/subscribe
         * @description Register or update the authenticated user's browser push subscription and enable push notifications.
         */
        post: operations["postPushSubscribe"];
        /**
         * DELETE /push/subscribe
         * @description Remove one browser push subscription for the authenticated user by endpoint.
         */
        delete: operations["deletePushSubscribe"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/push/preferences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /push/preferences
         * @description Return the authenticated user's push notification preferences, defaulting to enabled and all notifications when no row exists.
         */
        get: operations["getPushPreferences"];
        /**
         * PUT /push/preferences
         * @description Upsert the authenticated user's push notification preferences.
         */
        put: operations["putPushPreferences"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/sync-state": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /sync-state
         * @description List sync-state rows whose keys start with the required prefix query parameter.
         */
        get: operations["getSyncState"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/sync-state/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /sync-state/:key{.+}
         * @description Return one sync-state row by exact key.
         */
        get: operations["getSyncStateKey"];
        /**
         * PUT /sync-state/:key{.+}
         * @description Create or update one sync-state value by key.
         */
        put: operations["putSyncStateKey"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/drafts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List channels with saved drafts
         * @description Returns channel IDs where the authenticated user has non-empty draft text or draft attachments.
         */
        get: operations["getDrafts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/draft": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a channel draft
         * @description Returns the authenticated user’s draft text and attachments for a channel. Missing drafts return empty content and no attachments.
         */
        get: operations["getChannelsIdDraft"];
        /**
         * Update a channel draft
         * @description Creates, replaces, or clears the authenticated user’s draft for a channel. Empty content with no attachment IDs clears the draft.
         */
        put: operations["putChannelsIdDraft"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/{id}/saved-drafts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List saved drafts for a channel
         * @description Returns saved drafts owned by the authenticated user in the requested channel, newest first. Requires channel membership.
         */
        get: operations["getChannelsIdSavedDrafts"];
        put?: never;
        /**
         * Create a saved draft
         * @description Persists non-empty draft content for the authenticated user in the requested channel. Requires channel membership.
         */
        post: operations["postChannelsIdSavedDrafts"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/saved-drafts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Delete a saved draft
         * @description Deletes a saved draft owned by the authenticated user. Drafts owned by other users are treated as not found.
         */
        delete: operations["deleteSavedDraftsId"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/saved-drafts/{id}/schedule": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Schedule or unschedule a saved draft
         * @description Sets a saved draft delivery time to a future ISO timestamp, or clears scheduling with null. Only the draft owner can schedule it.
         */
        patch: operations["patchSavedDraftsIdSchedule"];
        trace?: never;
    };
    "/processes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List agent processes
         * @description Lists agent process runs visible to the caller (channel members see their channels' runs; admins see all). Optionally filtered by status. Stale running runs are swept to killed on read.
         */
        get: operations["getProcesses"];
        put?: never;
        /**
         * Create an agent process
         * @description Called by a bot when it begins a turn, to register a run that the management UI can track and cancel. The run is identified by its own id (there is no OS pid). Bot principals only.
         */
        post: operations["postProcesses"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/processes/cleanup-by-bot": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Reconcile interrupted bot processes
         * @description Called once by a bot at startup, before it consumes new events. Marks all running or queued processes owned by the authenticated bot as restarted, updates their triggering messages, and broadcasts the terminal state. Bot principals only; this operation assumes one active runtime per bot identity.
         */
        post: operations["postProcessesCleanupByBot"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/processes/kill-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Cancel all running processes
         * @description Cancels every running or queued process the caller can see (admins: all). Each cancellation marks the run killed and signals the owning agent over WebSocket and webhook.
         */
        post: operations["postProcessesKillAll"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/processes/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get one process
         * @description Returns a single process run. Requires channel membership (admins: any).
         */
        get: operations["getProcessesId"];
        put?: never;
        post?: never;
        /**
         * Cancel a process
         * @description Cooperatively cancels a running or queued process: marks it killed and signals the owning agent over WebSocket and webhook so it can stop. Any channel member (or admin) may cancel.
         */
        delete: operations["deleteProcessesId"];
        options?: never;
        head?: never;
        /**
         * Update a process
         * @description Called by the owning bot to advance status (running/done/error) and report cumulative metrics (tool/reply counts, token usage). Bot principals only.
         */
        patch: operations["patchProcessesId"];
        trace?: never;
    };
    "/processes/{id}/activity": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Record process activity
         * @description Called by the owning bot to increment a tool-call/reply counter or add token usage as a turn progresses. Bot principals only.
         */
        post: operations["postProcessesIdActivity"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{id}/reset-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * POST /users/:id/reset-password
         * @description Reset another user's password by id. Requires an interactive admin session and revokes all of the target user's sessions.
         */
        post: operations["postUsersIdResetPassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{id}/api-tokens/{tokenId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * DELETE /users/:id/api-tokens/:tokenId
         * @description Revoke another user's API token by its hashed id. Requires an admin session or an admin bearer token with tokens:manage and immediately closes sockets using that credential.
         */
        delete: operations["deleteUsersIdApiTokensTokenId"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * DELETE /users/:id
         * @description Delete a user by id. Requires an interactive admin session.
         */
        delete: operations["deleteUsersId"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/errors": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * GET /errors
         * @description List the 50 most recent server error-log rows. Requires an interactive admin session.
         */
        get: operations["getErrors"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/account": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * DELETE /account
         * @description Permanently delete this entire workspace (tenant) and all of its Cloudflare infrastructure. Owner-only: the caller must be the workspace owner, and must confirm by typing the exact workspace name and re-entering their password. Irreversible — removes data for every user in the workspace. The teardown itself runs asynchronously in the provisioner.
         */
        delete: operations["deleteAccount"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export interface webhooks {
    threadsEventDelivery: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Receive Threads event webhook
         * @description Threads sends this HTTPS POST to each active webhook URL owned by a bot user when that bot would receive the same channel event over WebSocket. Delivery is at-least-once; receivers must verify the signature, handle duplicates by delivery id, and reply with any 2xx status to acknowledge.
         */
        post: operations["postThreadsWebhookEventDelivery"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export interface components {
    schemas: {
        /** @description Standard JSON error envelope returned by documented 4xx/5xx responses. Generated clients expose this as a normal parsed response for documented error statuses; truly undocumented statuses should be handled via the generator's unexpected-status mechanism. */
        Error: {
            /** @description Human-readable error message. Callers should branch on HTTP status codes, not parse this string. */
            error: string;
        };
        PlaceholderObject: {
            [key: string]: unknown;
        };
        /** @description Placeholder response schema until the operation is modeled precisely. */
        PlaceholderData: unknown;
        /** @description Authenticated user record returned by login. password_hash is intentionally excluded. */
        UserRecord: {
            id: string;
            username: string;
            /** Format: email */
            email: string | null;
            /** @description Unix timestamp when ownership of the email was confirmed; null until verified. */
            email_verified_at: number | null;
            display_name: string | null;
            name_color: string | null;
            code_theme: components["schemas"]["CodeThemeNullable"];
            /** @enum {integer} */
            is_admin: 0 | 1;
            avatar_url: string | null;
            role: string;
            /** @description Raw JSON string stored for bot capability metadata. */
            bot_capabilities_json: string | null;
            created_at: number;
        } & {
            [key: string]: unknown;
        };
        CurrentUser: {
            id: string;
            username: string;
            /** Format: email */
            email: string | null;
            /** @description Unix timestamp when ownership of the email was confirmed; null until verified. */
            email_verified_at: number | null;
            /**
             * Format: email
             * @description Unverified replacement address awaiting confirmation, when present.
             */
            pending_email: string | null;
            /** @description Unix expiry timestamp for the pending email verification token. */
            email_verification_expires_at: number | null;
            display_name: string | null;
            name_color: string | null;
            code_theme: components["schemas"]["CodeThemeNullable"];
            role: string;
            /** @description Bot user auto-added to ephemeral channels this user creates (null = none). */
            ephemeral_bot_id: string | null;
            bot_capabilities: components["schemas"]["BotCapabilities"] | null;
        };
        PublicUser: {
            id: string;
            username: string;
            display_name: string | null;
            name_color: string | null;
            avatar_url: string | null;
            role: string;
        };
        BotCapabilities: {
            models?: string[];
            dm_allowed_usernames?: string[];
            dm_allowed_user_ids?: string[];
        } & {
            [key: string]: unknown;
        };
        LoginRequest: {
            username: string;
            password: string;
        };
        MetricProcess: {
            pid: number;
            name: string;
            cpu: number;
            /** @description Memory usage in megabytes. */
            memory: number;
            state: string;
        };
        MetricsCron: {
            name: string;
            expression: string;
            description: string;
            enabled: boolean;
        } & {
            [key: string]: unknown;
        };
        MetricsScheduledTask: {
            id: string;
            type: string;
            description?: string;
            executeAt?: string;
            createdAt?: string;
        } & {
            [key: string]: unknown;
        };
        MetricsLaunchdService: {
            name: string;
            pid: number | null;
            status: string;
        };
        OkResponse: {
            /** @enum {boolean} */
            ok: true;
            /** @description For credential revocation responses, the number of established WebSockets closed immediately. Omitted by other operations. */
            connections_closed?: number;
        };
        ResolveMessageResponse: {
            /** @enum {boolean} */
            ok: true;
            /** @description Unix timestamp when the thread was resolved. */
            resolved_at: number;
            /** @description User id that resolved the thread. */
            resolved_by: string;
        };
        ThreadTitleResponse: {
            /** @enum {boolean} */
            ok: true;
            /** @description Whether this request changed the stored title. */
            applied: boolean;
            /** @description Top-level message id that identifies the thread. */
            thread_id: string;
            /** @description Human-readable thread title. */
            thread_title: string;
            /** @description Unix timestamp when the title was last changed. */
            thread_title_updated_at: number;
        };
        ChangePasswordRequest: {
            currentPassword: string;
            newPassword: string;
        };
        EmailChangeRequest: {
            /** Format: email */
            email: string;
            /** @description Current account password used for re-authorization. */
            currentPassword: string;
        };
        EmailVerificationResponse: {
            /** @enum {boolean} */
            ok: true;
            /** @description True only when the requested address was already the verified address. */
            verified: boolean;
            /** Format: email */
            email?: string | null;
            /** Format: email */
            pendingEmail: string | null;
            expiresAt: number | null;
        };
        /** @enum {string} */
        CodeTheme: "monokai-sublime" | "monokai" | "github-dark" | "github" | "atom-one-dark" | "dracula" | "solarized-dark" | "solarized-light" | "nord";
        CodeThemeNullable: components["schemas"]["CodeTheme"] | null;
        UpdateMeRequest: {
            /** @description Trimmed server-side and truncated to 100 characters. */
            displayName?: string;
            /** @description Empty string is also accepted by the API to clear the color. */
            nameColor?: string | null;
            codeTheme?: components["schemas"]["CodeThemeNullable"];
            /** @description Bot user id auto-added to ephemeral channels this user creates. Must reference an existing bot user; null (or empty string) clears it (no bot auto-added). */
            ephemeralBotId?: string | null;
        };
        UpdateMeResponse: {
            /** @enum {boolean} */
            ok: true;
            displayName: string | null;
            nameColor: string | null;
            codeTheme: components["schemas"]["CodeThemeNullable"];
            ephemeralBotId: string | null;
        };
        /** @description Exactly three frequently used reaction emojis for the current user, backfilled with defaults. */
        FrequentEmojisResponse: string[];
        UpdateSelfCapabilitiesRequest: {
            models?: string[];
            dm_allowed_usernames?: string[];
            dm_allowed_user_ids?: string[];
        } & {
            [key: string]: unknown;
        };
        UpdateSelfCapabilitiesResponse: {
            /** @enum {boolean} */
            ok: true;
            capabilities: components["schemas"]["BotCapabilities"];
        };
        UserSearchResponse: components["schemas"]["PublicUser"][];
        /** @enum {string} */
        MessageType: "human" | "response" | "progress" | "tool_output" | "thinking";
        /** @enum {string} */
        ProcessStatus: "queued" | "processing" | "running" | "done" | "error" | "killed" | "restarted";
        MessageMention: {
            userId: string;
            username: string;
        };
        /** @description A reaction attached to a message or thread reply. */
        MessageReaction: {
            /** @description Reaction emoji or emoji token. */
            emoji: string;
            /** @description User id of the reacting user. */
            userId: string;
            /** @description Username of the reacting user, or null if unavailable. */
            username: string | null;
        };
        MessageAttachment: {
            id: string;
            filename: string;
            contentType: string;
            sizeBytes: number;
            url: string;
        };
        LinkPreview: {
            url: string;
            urlHash?: string | null;
            title?: string | null;
            description?: string | null;
            imageUrl?: string | null;
            siteName?: string | null;
        };
        /** @description Message read model. The API preserves legacy snake_case DB fields and exposes camelCase aliases for newer clients. */
        Message: {
            type?: string | null;
            id: string;
            channel_id?: string | null;
            channelId?: string | null;
            channel_name?: string | null;
            user_id?: string | null;
            userId?: string | null;
            username?: string | null;
            display_name?: string | null;
            displayName?: string | null;
            name_color?: string | null;
            nameColor?: string | null;
            avatar_url?: string | null;
            avatarUrl?: string | null;
            userRole?: string | null;
            content: string;
            thread_id?: string | null;
            threadId?: string | null;
            /** @description Optional human-readable title stored on a top-level message thread. */
            thread_title?: string | null;
            threadTitle?: string | null;
            thread_title_updated_at?: number | null;
            threadTitleUpdatedAt?: number | null;
            created_at?: number | null;
            createdAt?: number | null;
            edited_at?: number | null;
            editedAt?: number | null;
            deleted_at?: number | null;
            deletedAt?: number | null;
            message_type?: components["schemas"]["MessageType"] | null;
            messageType?: components["schemas"]["MessageType"] | null;
            reply_count?: number | null;
            replyCount?: number | null;
            pinned?: number | boolean | null;
            mentions?: components["schemas"]["MessageMention"][];
            reactions?: components["schemas"]["MessageReaction"][];
            attachments?: components["schemas"]["MessageAttachment"][];
            linkPreviews?: components["schemas"]["LinkPreview"][];
            /** @description Arbitrary JSON metadata. */
            metadata?: {
                [key: string]: unknown;
            } | unknown[] | string | number | boolean | null;
            process_id?: string | null;
            processId?: string | null;
            process_status?: components["schemas"]["ProcessStatus"] | string | null;
            processStatus?: components["schemas"]["ProcessStatus"] | string | null;
            process_error_text?: string | null;
            processErrorText?: string | null;
            autoRespondBotId?: string | null;
            processingMode?: string | null;
        } & {
            [key: string]: unknown;
        };
        MessagePage: {
            messages: components["schemas"]["Message"][];
            cursor?: string | null;
            hasNewer?: boolean;
            afterCursor?: string | null;
        };
        SendMessageRequest: {
            /** @description Required unless attachmentIds is non-empty. */
            content?: string;
            threadId?: string;
            attachmentIds?: string[];
            /** @description Arbitrary JSON metadata. */
            metadata?: {
                [key: string]: unknown;
            } | unknown[] | string | number | boolean | null;
            message_type?: components["schemas"]["MessageType"];
            /** @description Optional client-generated key. Re-sending with the same key returns the already-created message (200) instead of creating a duplicate. */
            idempotencyKey?: string;
        };
        EditMessageRequest: {
            content: string;
        };
        SetThreadTitleRequest: {
            /** @description Human-readable title; case and punctuation are preserved. */
            title: string;
            /**
             * @description When true, set the title only if the thread is currently untitled.
             * @default false
             */
            if_unset: boolean;
        };
        AddReactionRequest: {
            /** @description Reaction emoji or emoji token to add for the current user. */
            emoji: string;
        };
        ChannelFolder: {
            id: string;
            name: string;
            position: number;
            /**
             * @description SQLite boolean flag; 1 when collapsed, 0 when expanded.
             * @enum {integer}
             */
            collapsed: 0 | 1;
            /** @description Channel ids assigned to the folder, ordered by folder item position. */
            channels: string[];
        };
        ChannelFolderListResponse: components["schemas"]["ChannelFolder"][];
        CreateFolderRequest: {
            name: string;
        };
        UpdateFolderRequest: {
            name?: string;
            position?: number;
            /** @enum {integer} */
            collapsed?: 0 | 1;
        };
        AddChannelToFolderRequest: {
            channelId: string;
            position?: number;
        };
        ReorderFolderEntry: {
            id: string;
            position: number;
        };
        ReorderFolderItemEntry: {
            folderId: string;
            channelId: string;
            position: number;
        };
        ReorderFoldersRequest: {
            folders?: components["schemas"]["ReorderFolderEntry"][];
            items?: components["schemas"]["ReorderFolderItemEntry"][];
        };
        /** @enum {string} */
        NotificationTier: "all" | "mentions" | "none";
        DMPartner: {
            id: string;
            username: string;
            display_name: string | null;
            name_color: string | null;
            role: string;
            bot_capabilities: components["schemas"]["BotCapabilities"] | null;
        };
        DMChannel: {
            id: string;
            name: string;
            /**
             * @description SQLite boolean flag; DMs always return 1.
             * @enum {integer}
             */
            is_dm: 1;
            dm_partner_id: string | null;
            created_at: number;
            position?: number | null;
            last_read_message_id?: string | null;
            notifications?: components["schemas"]["NotificationTier"];
            /** @description SQLite boolean flag in list responses; omitted or null when creating a DM. */
            has_unread?: number | boolean | null;
            unread_count?: number | null;
            last_message_content?: string | null;
            last_message_at?: number | null;
            partner: components["schemas"]["DMPartner"];
            can_send_messages: boolean;
            disabled_reason: string | null;
        };
        DMListResponse: components["schemas"]["DMChannel"][];
        CreateDMRequest: {
            userId: string;
        };
        ReorderDMEntry: {
            id: string;
            position: number;
        };
        ReorderDMsRequest: {
            items: components["schemas"]["ReorderDMEntry"][];
        };
        /** @enum {string} */
        ProcessingMode: "immediate" | "serial";
        /** @description Channel database read model. The API currently returns legacy snake_case fields. */
        Channel: {
            id: string;
            name: string;
            description?: string | null;
            /**
             * @description SQLite boolean flag; 1 for true, 0 for false.
             * @enum {integer}
             */
            is_private?: 0 | 1;
            /**
             * @description SQLite boolean flag; 1 for true, 0 for false.
             * @enum {integer|null}
             */
            is_dm?: 0 | 1 | null;
            /**
             * @description SQLite boolean flag; 1 for true, 0 for false.
             * @enum {integer|null}
             */
            is_ephemeral?: 0 | 1 | null;
            processing_mode?: components["schemas"]["ProcessingMode"];
            /**
             * @description SQLite boolean flag; 1 for true, 0 for false.
             * @enum {integer|null}
             */
            board_enabled?: 0 | 1 | null;
            auto_respond_bot_id?: string | null;
            auto_named_at?: number | null;
            archived_at?: number | null;
            created_by?: string | null;
            created_at?: number | null;
        } & {
            [key: string]: unknown;
        };
        ChannelListItem: components["schemas"]["Channel"] & ({
            notifications: components["schemas"]["NotificationTier"];
            last_read_message_id?: string | null;
            /**
             * @description SQLite boolean flag; 1 for true, 0 for false.
             * @enum {integer}
             */
            has_unread: 0 | 1;
            unread_count: number;
        } & {
            [key: string]: unknown;
        });
        ChannelBrowseItem: components["schemas"]["Channel"] & ({
            /**
             * @description SQLite boolean flag; 1 for true, 0 for false.
             * @enum {integer}
             */
            is_member: 0 | 1;
            member_count: number;
        } & {
            [key: string]: unknown;
        });
        ChannelListResponse: components["schemas"]["ChannelListItem"][];
        ChannelBrowseResponse: components["schemas"]["ChannelBrowseItem"][];
        CreateChannelRequest: {
            name: string;
            description?: string | null;
            isPrivate?: boolean;
        };
        CreateChannelResponse: {
            id: string;
            name: string;
            description: string | null;
            isPrivate: boolean;
        };
        UpdateChannelRequest: {
            name?: string;
            description?: string | null;
            processingMode?: components["schemas"]["ProcessingMode"];
            processing_mode?: components["schemas"]["ProcessingMode"];
            /**
             * @description SQLite boolean flag accepted by the API; use 1 for true and 0 for false.
             * @enum {integer}
             */
            board_enabled?: 0 | 1;
            auto_respond_bot_id?: string | null;
            autoRespondBotId?: string | null;
        };
        ChannelMember: {
            id: string;
            username: string;
            display_name?: string | null;
            avatar_url?: string | null;
            role?: string | null;
        } & {
            [key: string]: unknown;
        };
        ChannelMemberListResponse: components["schemas"]["ChannelMember"][];
        /** @description Provide either userId or username. */
        AddChannelMemberRequest: {
            userId?: string;
            username?: string;
        };
        UpdateChannelNotificationsRequest: {
            tier: components["schemas"]["NotificationTier"];
        };
        UpdateChannelNotificationsResponse: {
            /** @enum {boolean} */
            ok: true;
            tier: components["schemas"]["NotificationTier"];
        };
        DraftListResponse: {
            channel_ids: string[];
        };
        DraftAttachment: {
            id: string;
            filename: string;
            contentType: string;
            sizeBytes: number;
            url: string;
        };
        ChannelDraftResponse: {
            content: string;
            attachments: components["schemas"]["DraftAttachment"][];
        };
        UpdateDraftRequest: {
            content: string;
            attachment_ids?: string[];
        };
        /** @description Search result row: message columns plus joined user/channel fields and optional FTS ranking/snippet fields. */
        SearchMessage: components["schemas"]["Message"] & ({
            /** @description FTS snippet with sentinel markers around matches, or null for filter-only searches. */
            snippet?: string | null;
            /** @description FTS bm25 score. Filter-only searches return 0. */
            bm25_score?: number;
            channel_name?: string | null;
        } & {
            [key: string]: unknown;
        });
        SearchResponse: {
            results: components["schemas"]["SearchMessage"][];
            total: number;
            hasMore: boolean;
            offset: number;
            limit: number;
        };
        MentionsResponse: {
            /** @description Mentioned messages ordered newest first. */
            messages: components["schemas"]["Message"][];
        };
        PinMessageRequest: {
            /** @description Message ID to pin in the channel. */
            messageId: string;
        };
        PinnedMessage: {
            id: string;
            channel_id: string;
            message_id: string;
            pinned_by: string;
            /** @description Unix timestamp when the pin was created. */
            created_at: number;
        };
        PinnedMessageListItem: {
            id: string;
            channel_id: string;
            message_id: string;
            pinned_by: string;
            /** @description Unix timestamp when the pin was created. */
            pin_created_at: number;
            content: string;
            /** @description Unix timestamp when the pinned message was created. */
            message_created_at: number;
            user_id: string | null;
            username?: string | null;
            display_name?: string | null;
            name_color?: string | null;
            avatar_url?: string | null;
            pinned_by_username?: string | null;
        };
        PinnedMessageListResponse: components["schemas"]["PinnedMessageListItem"][];
        /** @description Raw kanban board record. columns is the JSON-encoded column key array stored by the API. */
        KanbanBoard: {
            id: string;
            channel_id: string;
            /** @description JSON-encoded array of column keys, e.g. ["todo","in-progress","review","done"]. */
            columns: string;
            created_by: string;
            created_at: string;
        };
        /** @enum {string} */
        KanbanCardPriority: "low" | "normal" | "high" | "urgent";
        /** @description Raw kanban card record returned by board endpoints. metadata is stored as a JSON string when present. */
        KanbanCard: {
            id: string;
            board_id: string;
            column_key: string;
            title: string;
            description?: string | null;
            assignee?: string | null;
            /** @description Server defaults to normal; existing data may contain custom priority strings. */
            priority?: string | null;
            position: number;
            source_message_id?: string | null;
            /** @description JSON-encoded metadata object, or null. */
            metadata?: string | null;
            created_by: string;
            created_at: string;
            updated_at: string;
        };
        KanbanBoardWithCardsResponse: {
            board: components["schemas"]["KanbanBoard"];
            cards: components["schemas"]["KanbanCard"][];
        };
        UpdateKanbanBoardRequest: {
            columns: string[];
        };
        CreateKanbanCardRequest: {
            title: string;
            description?: string;
            assignee?: string;
            /** @default normal */
            priority: string;
            /** @default todo */
            column_key: string;
            source_message_id?: string;
            metadata?: {
                [key: string]: unknown;
            };
        };
        UpdateKanbanCardRequest: {
            title?: string;
            description?: string;
            column_key?: string;
            assignee?: string | null;
            priority?: string;
            position?: number;
            metadata?: {
                [key: string]: unknown;
            };
        };
        KanbanActivity: {
            id: string;
            card_id: string;
            user_id: string;
            action: string;
            from_value?: string | null;
            to_value?: string | null;
            created_at: string;
        };
        KanbanActivityListResponse: components["schemas"]["KanbanActivity"][];
        /** @description Map of requested user ids to online status. */
        PresenceMapResponse: {
            [key: string]: boolean;
        };
        UploadResponse: {
            id: string;
            filename: string;
            contentType: string;
            sizeBytes: number;
            url: string;
        };
        LinkPreviewResponse: {
            preview: components["schemas"]["LinkPreview"] | null;
        };
        PushVapidKeyResponse: {
            key: string;
        };
        PushSubscriptionRequest: {
            /** Format: uri */
            endpoint: string;
            p256dh: string;
            auth: string;
            userAgent?: string;
        };
        PushUnsubscribeRequest: {
            /** Format: uri */
            endpoint: string;
        };
        PushPreferences: {
            /** @enum {integer} */
            enabled: 0 | 1;
            /** @enum {integer} */
            notifyMentionsOnly: 0 | 1;
        };
        UpdatePushPreferencesRequest: {
            /** @enum {integer} */
            enabled?: 0 | 1;
            /** @enum {integer} */
            notifyMentionsOnly?: 0 | 1;
        };
        SyncStateEntry: {
            key: string;
            value: string;
            updated_at: number;
        };
        SyncStateListResponse: components["schemas"]["SyncStateEntry"][];
        PutSyncStateRequest: {
            value: string;
        };
        PutSyncStateResponse: {
            key: string;
            value: string;
        };
        /** @description Process read model returned by the process monitor APIs. Includes raw DB fields plus joined user/channel/bot display fields when available. */
        ProcessRecord: {
            id: string;
            channel_id: string;
            message_id: string;
            thread_id?: string | null;
            /** @description Unix seconds when the linked top-level thread was marked resolved. For processes attached to thread replies, this is inherited from the thread root. */
            resolved_at?: number | null;
            /** @description User id that marked the linked top-level thread resolved. */
            resolved_by?: string | null;
            user_id: string;
            username?: string | null;
            display_name?: string | null;
            channel_name?: string | null;
            is_dm?: number | boolean | null;
            dm_partner_id?: string | null;
            dm_partner_display_name?: string | null;
            dm_partner_username?: string | null;
            status: components["schemas"]["ProcessStatus"];
            /** @description ISO-8601 timestamp, normalized from SQLite datetime when needed. */
            started_at: string;
            ended_at?: string | null;
            updated_at?: string | null;
            pid?: number | null;
            bot_id?: string | null;
            bot_username?: string | null;
            bot_display_name?: string | null;
            tool_call_count?: number;
            reply_count?: number;
            input_tokens?: number;
            output_tokens?: number;
            cache_creation_input_tokens?: number;
            cache_read_input_tokens?: number;
        } & {
            [key: string]: unknown;
        };
        ProcessListResponse: {
            processes: components["schemas"]["ProcessRecord"][];
        };
        CreateProcessRequest: {
            id?: string;
            channel_id: string;
            message_id: string;
            user_id?: string;
            status?: components["schemas"]["ProcessStatus"];
            /** @description Owning bot id. Bot callers may only use their own id; admins may create a process on a bot's behalf. */
            bot_id?: string;
        };
        CreateProcessResponse: {
            id: string;
            status: components["schemas"]["ProcessStatus"];
        };
        ProcessCleanupResponse: {
            cleaned: number;
            process_ids: string[];
        };
        UpdateProcessRequest: {
            status?: components["schemas"]["ProcessStatus"];
            tool_call_count?: number;
            reply_count?: number;
            input_tokens?: number;
            output_tokens?: number;
            cache_creation_input_tokens?: number;
            cache_read_input_tokens?: number;
        };
        ProcessActivityRequest: {
            /** @enum {string} */
            type: "tool_call" | "reply" | "token_usage";
            input_tokens?: number;
            output_tokens?: number;
            cache_creation_input_tokens?: number;
            cache_read_input_tokens?: number;
        };
        SavedDraft: {
            id: string;
            channel_id: string;
            user_id: string;
            content: string;
            /** Format: date-time */
            created_at: string;
            /** Format: date-time */
            updated_at: string;
            /** Format: date-time */
            scheduled_at: string | null;
        };
        CreateSavedDraftRequest: {
            content: string;
        };
        ScheduleSavedDraftRequest: {
            /** Format: date-time */
            scheduled_at: string | null;
        };
        DeliverSavedDraftsResponse: {
            delivered: number;
        };
        UpdateMessageProcessStatusRequest: {
            /** @description Process identifier associated with the message. */
            processId: string;
            status: components["schemas"]["ProcessStatus"];
            input_tokens?: number;
            output_tokens?: number;
            cache_creation_input_tokens?: number;
            cache_read_input_tokens?: number;
            /** @description Optional process error text; server caps stored and broadcast value to 4000 characters. */
            error_text?: string | null;
        };
        AdminCreateUserRequest: {
            username: string;
            password: string;
            /**
             * Format: email
             * @description Required for human users and optional for bots. Must be unique within the workspace after normalization.
             */
            email?: string;
            displayName?: string | null;
            /** @enum {string} */
            role?: "human" | "bot";
        };
        AdminCreateUserResponse: {
            id: string;
            username: string;
            /** Format: email */
            email: string | null;
            displayName: string | null;
            /** @description Whether the initial confirmation email was accepted by the delivery provider. Always false for bots. */
            emailVerificationSent: boolean;
            /** @description Unix expiry timestamp for the initial verification link when it was sent. */
            emailVerificationExpiresAt: number | null;
        };
        AdminResetPasswordRequest: {
            password: string;
        };
        /**
         * Format: uri
         * @description Webhook receiver URL. Must use https and a public hostname; credentials, localhost, private IPs, and internal hostnames are rejected.
         */
        WebhookUrl: string;
        /** @description Event type from the embedded payload. Values match the WebSocket ServerEvent `type` values documented in api/openapi/ws-events.yaml. */
        WebhookEventType: string;
        /** @description The event payload exactly as it is sent on channel WebSockets. See `ServerEvent` in api/openapi/ws-events.yaml for the complete per-type schemas. */
        WebhookEventData: {
            type: components["schemas"]["WebhookEventType"];
        } & {
            [key: string]: unknown;
        };
        /** @description Signed event delivery sent by Threads to a registered webhook URL. */
        WebhookDelivery: {
            /** @description Stable id across retries. Store this id to make webhook handling idempotent. */
            event_id: string;
            type: components["schemas"]["WebhookEventType"];
            /** @description Unix epoch seconds when the delivery body was created. */
            timestamp: number;
            /** @description Bot user id this delivery targets, so one URL can serve multiple bot identities. */
            bot_user_id: string;
            /** @description Channel or DM id that produced the event, so one webhook URL can handle all rooms for a bot. */
            channel_id: string;
            data: components["schemas"]["WebhookEventData"];
        };
        WebhookRegistration: {
            id: string;
            url: components["schemas"]["WebhookUrl"];
            active: boolean;
            failure_count: number;
            last_status: number | null;
            /** @description Unix epoch seconds for the most recent successful delivery, or null when none has succeeded. */
            last_delivered_at: number | null;
            disabled_reason: string | null;
            created_at: number;
            /** @description Stable SHA-256 token id for the API token this webhook belongs to. */
            token_id: string;
            token_name: string;
        };
        WebhookRegistrationWithSecret: {
            id: string;
            url: components["schemas"]["WebhookUrl"];
            /** @description Webhook signing secret returned once at creation. Store it securely; later list responses never include it. */
            secret: string;
        };
        WebhookListResponse: {
            webhooks: components["schemas"]["WebhookRegistration"][];
        };
        CreateWebhookRequest: {
            url: components["schemas"]["WebhookUrl"];
            /** @description Optional SHA-256 token id to attach the webhook to when authenticated by session. Bearer-authenticated requests infer the current token. */
            token_id?: string;
        };
        CreateWebhookResponse: {
            id: string;
            url: components["schemas"]["WebhookUrl"];
            secret: string;
        };
        /** @enum {string} */
        ApiTokenScope: "threads:read" | "threads:write" | "users:provision" | "tokens:manage";
        AdminCreateApiTokenRequest: {
            name: string;
            /** @description Token permissions. Omitted defaults to both read and write. */
            scopes?: components["schemas"]["ApiTokenScope"][];
            /** @description Lifetime in days. Omitted defaults to 90; null explicitly disables expiry. */
            expires_in_days?: number | null;
            /** @description Optional webhook URLs to register for the token owner at token creation time. Created webhook secrets are returned once in the token creation response. */
            webhook_urls?: components["schemas"]["WebhookUrl"][];
        };
        AdminCreateApiTokenResponse: {
            token: string;
            /** @description Stable SHA-256 token id for later token-scoped operations. */
            id: string;
            name: string;
            scopes: components["schemas"]["ApiTokenScope"][];
            /** @description Unix epoch seconds when the token expires, or null for no expiry. */
            expires_at: number | null;
            /** @description Webhook registrations created from `webhook_urls`, including one-time signing secrets. Omitted when no webhooks were requested. */
            webhooks: components["schemas"]["WebhookRegistrationWithSecret"][];
        };
        MyApiTokenSummary: {
            /** @description Stable, non-secret identifier (SHA-256 of the token value). Used to revoke the token. */
            id: string;
            name: string;
            scopes: components["schemas"]["ApiTokenScope"][];
            /** @description Unix epoch seconds when the token expires, or null for no expiry. */
            expires_at: number | null;
            /** @description Unix epoch seconds when the token was created. */
            created_at: number;
            /** @description Unix epoch seconds when authentication last used the token, or null when it has never been used. */
            last_used_at: number | null;
        };
        MyApiTokenListResponse: {
            tokens: components["schemas"]["MyApiTokenSummary"][];
        };
        AdminSqlRequest: {
            sql: string;
        };
        AdminSqlResponse: {
            /** @enum {boolean} */
            ok: true;
            results: {
                [key: string]: unknown;
            }[];
            meta: {
                [key: string]: unknown;
            };
        };
        AdminSqlWriteResponse: {
            /** @enum {boolean} */
            ok: true;
            meta: {
                [key: string]: unknown;
            };
        };
        AdminErrorLog: {
            id: number;
            method: string | null;
            path: string | null;
            error_message: string | null;
            stack: string | null;
            timestamp: string | null;
        };
        AdminErrorLogListResponse: components["schemas"]["AdminErrorLog"][];
        /** @description Ephemeral channel create response. Shape matches the channel read model with ephemeral-specific flag values. */
        EphemeralChannelResponse: components["schemas"]["Channel"];
        RenameEphemeralChannelRequest: {
            /** @description Free-form slug candidate; sanitized to a short kebab-case channel name server-side. */
            slug: string;
        };
        PromoteEphemeralChannelRequest: {
            /** @description Optional replacement name before promotion; sanitized server-side. */
            name?: string;
        };
        EphemeralArchiveResponse: {
            /** @enum {boolean} */
            ok: true;
            /** @description Unix timestamp when the channel was archived. */
            archived_at: number;
        };
        EphemeralUnarchiveResponse: {
            /** @enum {boolean} */
            ok: true;
            archived_at: null;
        };
        EphemeralRenameResponse: {
            /** @enum {boolean} */
            ok: true;
            name: string;
            /** @description Unix timestamp when the channel was auto-named. */
            auto_named_at: number;
        };
        EphemeralPromoteResponse: {
            /** @enum {boolean} */
            ok: true;
            id: string;
            channelId: string;
            name: string;
        };
        EphemeralRegenerateNameResponse: {
            /** @enum {boolean} */
            ok: true;
            auto_named_at: null;
        };
        WidgetSummary: {
            id: string;
            name: string;
            description: string | null;
            icon: string | null;
            created_by: string;
            /** @description SQLite timestamp. */
            created_at: string;
            /** @description SQLite timestamp. */
            updated_at: string | null;
        } & {
            [key: string]: unknown;
        };
        Widget: components["schemas"]["WidgetSummary"] & ({
            /** @description User-authored widget HTML/JavaScript payload. */
            code: string;
        } & {
            [key: string]: unknown;
        });
        ChannelWidget: components["schemas"]["WidgetSummary"] & ({
            added_by: string;
            /** @description SQLite timestamp. */
            added_at: string;
        } & {
            [key: string]: unknown;
        });
        CreateWidgetRequest: {
            name: string;
            description?: string;
            icon?: string;
            code: string;
        };
        UpdateWidgetRequest: {
            name?: string;
            description?: string;
            icon?: string;
            code?: string;
        };
        AddChannelWidgetRequest: {
            widgetId: string;
        };
        /** @description Any JSON value accepted or returned by widget data endpoints. Kept non-recursive for OpenAPI client-generator compatibility. */
        JsonValue: {
            [key: string]: unknown;
        } | unknown[] | string | number | boolean | null;
        WidgetKvEntry: {
            key: string;
            value: components["schemas"]["JsonValue"];
        };
        WidgetKvGlobalEntry: {
            userId: string;
            value: components["schemas"]["JsonValue"];
        };
        WidgetKvGlobalResponse: {
            key: string;
            values: components["schemas"]["WidgetKvGlobalEntry"][];
        };
        WidgetKvPutRequest: {
            value: components["schemas"]["JsonValue"];
        };
    };
    responses: {
        /** @description Successful response. Schema is intentionally broad until this operation is modeled precisely. */
        PlaceholderSuccess: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["PlaceholderData"];
            };
        };
        /** @description Error response */
        Error: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Message page response */
        MessagePage: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["MessagePage"];
            };
        };
        /** @description Message response */
        Message: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Message"];
            };
        };
        /** @description Success response */
        Ok: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["OkResponse"];
            };
        };
        /** @description Search results response */
        SearchResponse: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["SearchResponse"];
            };
        };
        /** @description Mention list response */
        MentionsResponse: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["MentionsResponse"];
            };
        };
        /** @description Successful response */
        PinnedMessageList: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["PinnedMessageListResponse"];
            };
        };
        /** @description Successful response */
        PinnedMessage: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["PinnedMessage"];
            };
        };
        /** @description Kanban board record. */
        KanbanBoard: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["KanbanBoard"];
            };
        };
        /** @description Kanban board created. */
        KanbanBoardCreated: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["KanbanBoard"];
            };
        };
        /** @description Kanban board and ordered cards. */
        KanbanBoardWithCards: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["KanbanBoardWithCardsResponse"];
            };
        };
        /** @description Kanban card record. */
        KanbanCard: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["KanbanCard"];
            };
        };
        /** @description Kanban card created. */
        KanbanCardCreated: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["KanbanCard"];
            };
        };
        /** @description Kanban card activity, newest first. */
        KanbanActivityList: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["KanbanActivityListResponse"];
            };
        };
        /** @description Presence state keyed by user id. */
        PresenceMap: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["PresenceMapResponse"];
            };
        };
        /** @description Uploaded attachment metadata. */
        UploadCreated: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["UploadResponse"];
            };
        };
        /** @description Fetched or cached link preview; preview is null when unavailable. */
        LinkPreviewResponse: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["LinkPreviewResponse"];
            };
        };
    };
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    postAuthLogin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginRequest"];
            };
        };
        responses: {
            /** @description Authenticated user and Set-Cookie session header. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserRecord"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            429: components["responses"]["Error"];
        };
    };
    postAuthLogout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OkResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
        };
    };
    postAuthChangePassword: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangePasswordRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OkResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getAuthEmailConfirm: {
        parameters: {
            query: {
                token: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Email verified; redirect to the application. */
            303: {
                headers: {
                    Location?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description The token is invalid or expired; an informational HTML page is returned. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description The pending email is already associated with another account; an informational HTML page is returned. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    postUsers: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminCreateUserRequest"];
            };
        };
        responses: {
            /** @description Created user response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminCreateUserResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            409: components["responses"]["Error"];
        };
    };
    getEvents: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description WebSocket upgrade accepted */
            101: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Non-upgrade request response; websocket clients should expect 101 on successful upgrade. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
        };
    };
    getWsPresence: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description WebSocket upgrade accepted */
            101: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Non-upgrade request response; websocket clients should expect 101 on successful upgrade. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
        };
    };
    getWsChannelId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                channelId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description WebSocket upgrade accepted */
            101: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Non-upgrade request response; websocket clients should expect 101 on successful upgrade. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
        };
    };
    getPresence: {
        parameters: {
            query: {
                /** @description Comma-separated user ids to query. */
                userIds: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["PresenceMap"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
        };
    };
    getUploadsKey: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Uploaded object bytes. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": string;
                    "*/*": string;
                };
            };
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postUploads: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    file: string;
                };
            };
        };
        responses: {
            201: components["responses"]["UploadCreated"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            413: components["responses"]["Error"];
        };
    };
    postTranscribe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "audio/webm": string;
                "audio/mp4": string;
                "audio/ogg": string;
                "application/octet-stream": string;
            };
        };
        responses: {
            /** @description Transcription result. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description The transcribed text; empty when no speech was detected. */
                        text: string;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            413: components["responses"]["Error"];
            415: components["responses"]["Error"];
            501: components["responses"]["Error"];
            502: components["responses"]["Error"];
        };
    };
    getLinkPreviews: {
        parameters: {
            query: {
                /** @description HTTP(S) URL to preview. */
                url: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["LinkPreviewResponse"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
        };
    };
    getUsersMe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CurrentUser"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    patchUsersMe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateMeRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UpdateMeResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postUsersMeEmailChange: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EmailChangeRequest"];
            };
        };
        responses: {
            /** @description Verification sent, or the requested address was already verified. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmailVerificationResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            502: components["responses"]["Error"];
            503: components["responses"]["Error"];
        };
    };
    postUsersMeEmailVerificationResend: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A fresh verification message was sent. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmailVerificationResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            429: components["responses"]["Error"];
            502: components["responses"]["Error"];
            503: components["responses"]["Error"];
        };
    };
    getUsersMeFrequentEmojis: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FrequentEmojisResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getUsersMeApiTokens: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyApiTokenListResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postUsersMeApiTokens: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminCreateApiTokenRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminCreateApiTokenResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteUsersMeApiTokensId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OkResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getUsersMeWebhooks: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Webhook registrations for the authenticated user. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WebhookListResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postUsersMeWebhooks: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateWebhookRequest"];
            };
        };
        responses: {
            /** @description Created webhook registration with one-time signing secret. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreateWebhookResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteUsersMeWebhooksId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OkResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postUsersIdApiTokens: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminCreateApiTokenRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminCreateApiTokenResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postBotsSelfCapabilities: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateSelfCapabilitiesRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UpdateSelfCapabilitiesResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getUsersSearch: {
        parameters: {
            query?: {
                /** @description Case-insensitive username/display-name search. Empty or omitted returns users up to the server limit. */
                q?: string;
                /** @description When provided, existing members of this channel are excluded from results. */
                channel?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserSearchResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getUsersBots: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserSearchResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getDms: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description DM list response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DMListResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postDms: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateDMRequest"];
            };
        };
        responses: {
            /** @description Existing DM channel response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DMChannel"];
                };
            };
            /** @description Created DM channel response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DMChannel"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    putDmsReorder: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReorderDMsRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OkResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    patchDmsIdHide: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OkResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getChannels: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Channel list response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChannelListResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postChannels: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateChannelRequest"];
            };
        };
        responses: {
            /** @description Created channel response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreateChannelResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
        };
    };
    getChannelsBrowse: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Browsable channel list response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChannelBrowseResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getChannelsId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Channel response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Channel"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteChannelsId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    patchChannelsId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateChannelRequest"];
            };
        };
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postChannelsIdJoin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postChannelsIdLeave: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getChannelsIdMembers: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Channel member list response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChannelMemberListResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postChannelsIdMembers: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddChannelMemberRequest"];
            };
        };
        responses: {
            200: components["responses"]["Ok"];
            201: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteChannelsIdMembersTargetUserId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                targetUserId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteChannelsIdMembership: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    patchChannelsIdNotifications: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateChannelNotificationsRequest"];
            };
        };
        responses: {
            /** @description Updated notification tier response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UpdateChannelNotificationsResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getFolders: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Folder list response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChannelFolderListResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postFolders: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateFolderRequest"];
            };
        };
        responses: {
            /** @description Created folder response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChannelFolder"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteFoldersId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    patchFoldersId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateFolderRequest"];
            };
        };
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postFoldersIdChannels: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddChannelToFolderRequest"];
            };
        };
        responses: {
            201: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteFoldersIdChannelsChannelId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                channelId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    putFoldersReorder: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReorderFoldersRequest"];
            };
        };
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getChannelsIdMessages: {
        parameters: {
            query?: {
                /** @description Return messages older than this message id. */
                cursor?: string;
                /** @description Return a window centered around this message id. */
                around?: string;
                /** @description Return messages newer than this message id. */
                after?: string;
                limit?: number;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["MessagePage"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postChannelsIdMessages: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SendMessageRequest"];
            };
        };
        responses: {
            201: components["responses"]["Message"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postChannelsIdRead: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getMessagesId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Message"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteMessagesId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    patchMessagesId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EditMessageRequest"];
            };
        };
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postMessagesIdResolve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Message resolved. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResolveMessageResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteMessagesIdResolve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    putMessagesIdThreadTitle: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SetThreadTitleRequest"];
            };
        };
        responses: {
            /** @description Thread title updated. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ThreadTitleResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getMessagesIdReplies: {
        parameters: {
            query?: {
                /** @description Return replies after this message id. */
                cursor?: string;
                /** @description Return a window centered around this reply id. */
                around?: string;
                /** @description Return newer replies after this message id. */
                after?: string;
                /** @description Return replies before this message id. Used with latest-first thread views to page older replies. */
                before?: string;
                latest?: boolean;
                limit?: number;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["MessagePage"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postMessagesIdReplies: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SendMessageRequest"];
            };
        };
        responses: {
            201: components["responses"]["Message"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postMessagesIdReactions: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddReactionRequest"];
            };
        };
        responses: {
            200: components["responses"]["Ok"];
            201: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteMessagesIdReactionsEmoji: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                emoji: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postMessagesIdProcess: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateMessageProcessStatusRequest"];
            };
        };
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postMessagesIdRetry: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getMentions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["MentionsResponse"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getSearch: {
        parameters: {
            query?: {
                /** @description Full-text search query. Supports quoted phrases, uppercase OR, -term exclusions, and term* prefix matching. Empty query is allowed when at least one filter is provided. */
                q?: string;
                /** @description Restrict results to a channel id. */
                channel?: string;
                /** @description Restrict results to messages sent by this user id. */
                from?: string;
                /** @description Unix timestamp lower bound for message created_at. Invalid or negative values are ignored. */
                since?: number;
                /** @description Unix timestamp upper bound for message created_at. Invalid or negative values are ignored. */
                until?: number;
                /** @description Comma-separated content filters. Recognized values: link, reaction, file. */
                has?: string;
                offset?: number;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["SearchResponse"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getWId: {
        parameters: {
            query: {
                /** @description Channel id exposed to widget code via ThreadsWidget.getContext(). */
                channelId?: string;
                /** @description Embedding Threads client origin; must be allowlisted. */
                parentOrigin: string;
            };
            header?: never;
            path: {
                /** @description Widget id. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Widget runtime HTML. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/html": string;
                };
            };
            400: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postChannelsEphemeral: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ephemeral channel created. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EphemeralChannelResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            409: components["responses"]["Error"];
        };
    };
    postChannelsIdArchive: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Channel id. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Archive timestamp response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EphemeralArchiveResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteChannelsIdArchive: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Channel id. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Archive timestamp cleared. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EphemeralUnarchiveResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postChannelsIdRename: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Channel id. */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RenameEphemeralChannelRequest"];
            };
        };
        responses: {
            /** @description Rename result. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EphemeralRenameResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
        };
    };
    postChannelsIdPromote: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Channel id. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PromoteEphemeralChannelRequest"];
            };
        };
        responses: {
            /** @description Promotion result. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EphemeralPromoteResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
        };
    };
    postChannelsIdRegenerateName: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Channel id. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Regeneration state response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EphemeralRegenerateNameResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getChannelsIdPins: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["PinnedMessageList"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postChannelsIdPins: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PinMessageRequest"];
            };
        };
        responses: {
            201: components["responses"]["PinnedMessage"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
        };
    };
    deleteChannelsIdPinsMessageId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                messageId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getChannelsIdBoard: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["KanbanBoardWithCards"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    putChannelsIdBoard: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateKanbanBoardRequest"];
            };
        };
        responses: {
            200: components["responses"]["KanbanBoard"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postChannelsIdBoard: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: components["responses"]["KanbanBoardCreated"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
        };
    };
    postChannelsIdBoardCards: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateKanbanCardRequest"];
            };
        };
        responses: {
            201: components["responses"]["KanbanCardCreated"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    putBoardsCardsCardId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                cardId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateKanbanCardRequest"];
            };
        };
        responses: {
            200: components["responses"]["KanbanCard"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteBoardsCardsCardId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                cardId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getBoardsCardsCardIdActivity: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                cardId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["KanbanActivityList"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getWidgets: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Widgets ordered newest first. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WidgetSummary"][];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postWidgets: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateWidgetRequest"];
            };
        };
        responses: {
            /** @description Created widget. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Widget"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getWidgetsId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Widget id. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Widget detail. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Widget"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    putWidgetsId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Widget id. */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateWidgetRequest"];
            };
        };
        responses: {
            /** @description Updated widget. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Widget"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteWidgetsId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Widget id. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Widget deleted. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OkResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getChannelsIdWidgets: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Channel id. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Channel widgets ordered by most recently added. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChannelWidget"][];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postChannelsIdWidgets: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Channel id. */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddChannelWidgetRequest"];
            };
        };
        responses: {
            /** @description Widget added to channel. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OkResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteChannelsIdWidgetsWidgetId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Channel id. */
                id: string;
                /** @description Widget id. */
                widgetId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Widget removed from channel. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OkResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getWidgetsIdDataKvKeyAll: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Widget id. */
                id: string;
                /** @description Widget-scoped KV key. */
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Global widget KV values for the key. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WidgetKvGlobalResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getWidgetsIdDataKvKey: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Widget id. */
                id: string;
                /** @description Widget-scoped KV key. */
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Widget KV entry. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WidgetKvEntry"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    putWidgetsIdDataKvKey: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Widget id. */
                id: string;
                /** @description Widget-scoped KV key. */
                key: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WidgetKvPutRequest"];
            };
        };
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteWidgetsIdDataKvKey: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Widget id. */
                id: string;
                /** @description Widget-scoped KV key. */
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getPushVapidKey: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description VAPID public key response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PushVapidKeyResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
        };
    };
    postPushSubscribe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PushSubscriptionRequest"];
            };
        };
        responses: {
            201: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
        };
    };
    deletePushSubscribe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PushUnsubscribeRequest"];
            };
        };
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
        };
    };
    getPushPreferences: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Push preference response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PushPreferences"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
        };
    };
    putPushPreferences: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdatePushPreferencesRequest"];
            };
        };
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
        };
    };
    getSyncState: {
        parameters: {
            query: {
                /** @description Key prefix to match. SQL LIKE wildcards are escaped before querying. */
                prefix: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Sync-state entries matching the requested prefix. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SyncStateListResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
        };
    };
    getSyncStateKey: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Sync-state entry response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SyncStateEntry"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    putSyncStateKey: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PutSyncStateRequest"];
            };
        };
        responses: {
            /** @description Updated sync-state value. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PutSyncStateResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
        };
    };
    getDrafts: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Channels that currently have a draft for the authenticated user. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DraftListResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getChannelsIdDraft: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Draft content and attachments for the channel. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChannelDraftResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    putChannelsIdDraft: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateDraftRequest"];
            };
        };
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getChannelsIdSavedDrafts: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Saved drafts for the authenticated user in this channel. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SavedDraft"][];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    postChannelsIdSavedDrafts: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateSavedDraftRequest"];
            };
        };
        responses: {
            /** @description Created saved draft. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SavedDraft"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteSavedDraftsId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Ok"];
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    patchSavedDraftsIdSchedule: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScheduleSavedDraftRequest"];
            };
        };
        responses: {
            /** @description Updated saved draft with the new scheduled_at value. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SavedDraft"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getProcesses: {
        parameters: {
            query?: {
                status?: "queued" | "running" | "done" | "error" | "killed" | "restarted";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The visible processes, newest first. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        processes: {
                            [key: string]: unknown;
                        }[];
                    };
                };
            };
            401: components["responses"]["Error"];
        };
    };
    postProcesses: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    id?: string;
                    channel_id: string;
                    message_id: string;
                    user_id?: string;
                    /** @description Owning bot id. Bot callers may only use their own id; admins may create a process on a bot's behalf. */
                    bot_id?: string;
                    /** @enum {string} */
                    status?: "queued" | "running" | "done" | "error" | "killed";
                };
            };
        };
        responses: {
            /** @description The created process id and status. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        /** @enum {string} */
                        status: "queued" | "running" | "done" | "error" | "killed";
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
        };
    };
    postProcessesCleanupByBot: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The reconciled process ids. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProcessCleanupResponse"];
                };
            };
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
        };
    };
    postProcessesKillAll: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description How many runs were cancelled and their ids. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        cleaned: number;
                        process_ids: string[];
                    };
                };
            };
            401: components["responses"]["Error"];
        };
    };
    getProcessesId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The process run. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            401: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteProcessesId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acknowledged. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        ok: boolean;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    patchProcessesId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    status?: "queued" | "running" | "done" | "error" | "killed";
                    tool_call_count?: number;
                    reply_count?: number;
                    input_tokens?: number;
                    output_tokens?: number;
                    cache_creation_input_tokens?: number;
                    cache_read_input_tokens?: number;
                };
            };
        };
        responses: {
            /** @description Acknowledged. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        ok: boolean;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
        };
    };
    postProcessesIdActivity: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    type: "tool_call" | "reply" | "token_usage";
                    input_tokens?: number;
                    output_tokens?: number;
                    cache_creation_input_tokens?: number;
                    cache_read_input_tokens?: number;
                };
            };
        };
        responses: {
            /** @description Acknowledged. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        ok: boolean;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
        };
    };
    postUsersIdResetPassword: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminResetPasswordRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OkResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteUsersIdApiTokensTokenId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                tokenId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OkResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteUsersId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OkResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    getErrors: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminErrorLogListResponse"];
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
        };
    };
    deleteAccount: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Must exactly equal the workspace name (TENANT_NAME). */
                    confirm: string;
                    /** @description The owner's current password, re-entered to authorize the deletion. */
                    password: string;
                };
            };
        };
        responses: {
            /** @description Teardown accepted and started. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description Deprovision workflow status, e.g. "deleting". */
                        status: string;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            501: components["responses"]["Error"];
        };
    };
    postThreadsWebhookEventDelivery: {
        parameters: {
            query?: never;
            header: {
                /** @description Stable event id for this webhook delivery. Use this id for idempotency. */
                "X-Threads-Event-Id": string;
                /** @description Unix epoch seconds used when computing the signature. */
                "X-Threads-Timestamp": number;
                /** @description HMAC SHA-256 signature of '<timestamp>.<raw request body>' with the webhook secret, formatted as 'sha256=<hex>'. */
                "X-Threads-Signature": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WebhookDelivery"];
            };
        };
        responses: {
            /** @description Any 2xx response acknowledges delivery. Non-2xx responses and timeouts are retried within the delivery budget. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
