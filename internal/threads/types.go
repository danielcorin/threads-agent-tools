package threads

type Event struct {
	ID        string  `json:"id"`
	Cursor    string  `json:"cursor"`
	Type      string  `json:"type"`
	ChannelID string  `json:"channelId"`
	ThreadID  string  `json:"threadId"`
	Message   Message `json:"message"`
}

type Message struct {
	ID       string `json:"id"`
	Content  string `json:"content"`
	SenderID string `json:"senderId"`
}

type SendMessageRequest struct {
	Content  string         `json:"content"`
	ThreadID string         `json:"threadId,omitempty"`
	Metadata map[string]any `json:"metadata,omitempty"`
}
