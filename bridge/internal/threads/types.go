package threads

import "encoding/json"

type Event struct {
	ID        string         `json:"id"`
	Cursor    string         `json:"cursor"`
	Type      string         `json:"type"`
	ChannelID string         `json:"channelId"`
	ThreadID  string         `json:"threadId"`
	MessageID string         `json:"messageId"`
	ProcessID string         `json:"processId"`
	Emoji     string         `json:"emoji"`
	ActorID   string         `json:"-"`
	Metadata  map[string]any `json:"metadata"`
	Message   Message        `json:"message"`
}

type Message struct {
	ID       string `json:"id"`
	Content  string `json:"content"`
	SenderID string `json:"senderId"`
}

func isReactionType(eventType string) bool {
	return eventType == "reaction_added" || eventType == "reaction.created" || eventType == "reaction"
}

func (e *Event) UnmarshalJSON(data []byte) error {
	type eventAlias Event
	var raw struct {
		eventAlias
		ChannelIDSnake string          `json:"channel_id"`
		ThreadIDSnake  string          `json:"thread_id"`
		MessageID      string          `json:"messageId"`
		MessageIDSnake string          `json:"message_id"`
		ProcessIDSnake string          `json:"process_id"`
		EmojiSnake     string          `json:"reaction_emoji"`
		UserID         string          `json:"userId"`
		UserIDSnake    string          `json:"user_id"`
		Content        string          `json:"content"`
		MessageRaw     json.RawMessage `json:"message"`
	}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	*e = Event(raw.eventAlias)
	if e.ChannelID == "" {
		e.ChannelID = raw.ChannelIDSnake
	}
	if e.ThreadID == "" {
		e.ThreadID = raw.ThreadIDSnake
	}
	if len(raw.MessageRaw) > 0 && string(raw.MessageRaw) != "null" {
		var msg struct {
			Message
			SenderIDSnake string `json:"sender_id"`
			UserID        string `json:"userId"`
			UserIDSnake   string `json:"user_id"`
		}
		if err := json.Unmarshal(raw.MessageRaw, &msg); err != nil {
			return err
		}
		e.Message = msg.Message
		if e.Message.SenderID == "" {
			switch {
			case msg.SenderIDSnake != "":
				e.Message.SenderID = msg.SenderIDSnake
			case msg.UserID != "":
				e.Message.SenderID = msg.UserID
			case msg.UserIDSnake != "":
				e.Message.SenderID = msg.UserIDSnake
			}
		}
	}
	if e.MessageID == "" {
		switch {
		case raw.MessageID != "":
			e.MessageID = raw.MessageID
		case raw.MessageIDSnake != "":
			e.MessageID = raw.MessageIDSnake
		}
	}
	if e.ProcessID == "" {
		e.ProcessID = raw.ProcessIDSnake
	}
	if e.Emoji == "" {
		e.Emoji = raw.EmojiSnake
	}
	switch {
	case raw.UserID != "":
		e.ActorID = raw.UserID
	case raw.UserIDSnake != "":
		e.ActorID = raw.UserIDSnake
	}
	if e.Message.ID == "" {
		switch {
		case e.MessageID != "":
			e.Message.ID = e.MessageID
		case e.ID != "":
			e.Message.ID = e.ID
		}
	}
	if e.Message.Content == "" {
		e.Message.Content = raw.Content
	}
	if e.Message.SenderID == "" && !isReactionType(e.Type) {
		e.Message.SenderID = e.ActorID
	}
	return nil
}

type Attachment struct {
	ID          string `json:"id"`
	Filename    string `json:"filename"`
	ContentType string `json:"contentType"`
	SizeBytes   int64  `json:"sizeBytes"`
	URL         string `json:"url"`
}

type SendMessageRequest struct {
	Content       string         `json:"content"`
	ThreadID      string         `json:"threadId,omitempty"`
	MessageType   string         `json:"message_type,omitempty"`
	AttachmentIDs []string       `json:"attachmentIds,omitempty"`
	Metadata      map[string]any `json:"metadata,omitempty"`
}

type SetThreadTitleRequest struct {
	Title   string `json:"title"`
	IfUnset bool   `json:"if_unset,omitempty"`
}

type SetThreadTitleResponse struct {
	OK                   bool   `json:"ok"`
	Applied              bool   `json:"applied"`
	ThreadID             string `json:"thread_id"`
	ThreadTitle          string `json:"thread_title"`
	ThreadTitleUpdatedAt int64  `json:"thread_title_updated_at"`
}

type CreateProcessRequest struct {
	ID        string `json:"id,omitempty"`
	ChannelID string `json:"channel_id"`
	MessageID string `json:"message_id"`
	UserID    string `json:"user_id,omitempty"`
	Status    string `json:"status,omitempty"`
	PID       int    `json:"pid,omitempty"`
}

type CreateProcessResponse struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

type UpdateProcessRequest struct {
	Status string `json:"status,omitempty"`
}

type ProcessActivityRequest struct {
	Type string `json:"type"`
}

type UpdateMessageProcessStatusRequest struct {
	ProcessID string `json:"processId"`
	Status    string `json:"status"`
	ErrorText string `json:"error_text,omitempty"`
}
