package threads

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"nhooyr.io/websocket"
)

const maxWebSocketMessageBytes int64 = 16 * 1024 * 1024

// presenceReadTimeout bounds each presence-socket read. The server sends a
// heartbeat ping every ~30s, so any read that blocks longer than this means the
// socket has gone half-open (silent TCP teardown — no close frame reaches us).
// Without this deadline the read blocks forever and the presence goroutine never
// reconnects, leaving the bot shown as offline. Mirrors the TS adapter's
// PRESENCE_LIVENESS_TIMEOUT_MS guard.
const presenceReadTimeout = 90 * time.Second

type Client struct {
	BaseURL string
	Token   string
	HTTP    *http.Client
}

func (c Client) Events(ctx context.Context, since string) (<-chan Event, <-chan error) {
	events := make(chan Event)
	errs := make(chan error, 1)
	go func() {
		defer close(events)
		defer close(errs)
		u, err := url.Parse(strings.TrimRight(c.BaseURL, "/") + "/events")
		if err != nil {
			errs <- err
			return
		}
		if since != "" {
			q := u.Query()
			q.Set("since", since)
			u.RawQuery = q.Encode()
		}
		if u.Scheme == "http" {
			u.Scheme = "ws"
		} else {
			u.Scheme = "wss"
		}
		headers := http.Header{}
		if c.Token != "" {
			headers.Set("Authorization", "Bearer "+c.Token)
		}
		conn, _, err := websocket.Dial(ctx, u.String(), &websocket.DialOptions{HTTPHeader: headers})
		if err != nil {
			errs <- err
			return
		}
		conn.SetReadLimit(maxWebSocketMessageBytes)
		defer conn.Close(websocket.StatusNormalClosure, "")
		for {
			_, data, err := conn.Read(ctx)
			if err != nil {
				errs <- err
				return
			}
			var event Event
			if err := json.Unmarshal(data, &event); err != nil {
				errs <- fmt.Errorf("decode event: %w", err)
				return
			}
			select {
			case events <- event:
			case <-ctx.Done():
				errs <- ctx.Err()
				return
			}
		}
	}()
	return events, errs
}

func (c Client) MaintainPresence(ctx context.Context) error {
	u, err := url.Parse(strings.TrimRight(c.BaseURL, "/") + "/ws/presence")
	if err != nil {
		return err
	}
	if u.Scheme == "http" {
		u.Scheme = "ws"
	} else {
		u.Scheme = "wss"
	}
	headers := http.Header{}
	if c.Token != "" {
		headers.Set("Authorization", "Bearer "+c.Token)
	}
	conn, _, err := websocket.Dial(ctx, u.String(), &websocket.DialOptions{HTTPHeader: headers})
	if err != nil {
		return err
	}
	conn.SetReadLimit(maxWebSocketMessageBytes)
	defer conn.Close(websocket.StatusNormalClosure, "")
	for {
		readCtx, cancel := context.WithTimeout(ctx, presenceReadTimeout)
		_, data, err := conn.Read(readCtx)
		cancel()
		if err != nil {
			// A timeout here means the socket went silent past the heartbeat
			// window (half-open). Returning triggers a reconnect in the
			// daemon's maintainPresence retry loop.
			return err
		}
		var msg struct {
			Type string `json:"type"`
		}
		if err := json.Unmarshal(data, &msg); err != nil {
			continue
		}
		if msg.Type == "ping" {
			if err := conn.Write(ctx, websocket.MessageText, []byte(`{"type":"pong"}`)); err != nil {
				return err
			}
		}
	}
}

func (c Client) UploadFile(ctx context.Context, path string) (Attachment, error) {
	file, err := os.Open(path)
	if err != nil {
		return Attachment{}, err
	}
	defer file.Close()

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	header := make(textproto.MIMEHeader)
	header.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename="%s"`, escapeQuotes(filepath.Base(path))))
	header.Set("Content-Type", detectContentType(path, file))
	part, err := writer.CreatePart(header)
	if err != nil {
		return Attachment{}, err
	}
	if _, err := io.Copy(part, file); err != nil {
		return Attachment{}, err
	}
	if err := writer.Close(); err != nil {
		return Attachment{}, err
	}

	hreq, err := http.NewRequestWithContext(ctx, http.MethodPost, strings.TrimRight(c.BaseURL, "/")+"/uploads", &body)
	if err != nil {
		return Attachment{}, err
	}
	hreq.Header.Set("Content-Type", writer.FormDataContentType())
	if c.Token != "" {
		hreq.Header.Set("Authorization", "Bearer "+c.Token)
	}
	resp, err := c.httpClient().Do(hreq)
	if err != nil {
		return Attachment{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return Attachment{}, fmt.Errorf("threads upload file: status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	var attachment Attachment
	if err := json.NewDecoder(resp.Body).Decode(&attachment); err != nil {
		return Attachment{}, err
	}
	if attachment.ID == "" {
		return Attachment{}, fmt.Errorf("threads upload file: response missing attachment id")
	}
	return attachment, nil
}

func (c Client) SendMessage(ctx context.Context, channelID string, req SendMessageRequest) error {
	u := strings.TrimRight(c.BaseURL, "/") + "/channels/" + url.PathEscape(channelID) + "/messages"
	return c.doJSON(ctx, http.MethodPost, u, req, nil, "threads send message")
}

func (c Client) AddReaction(ctx context.Context, messageID, emoji string) error {
	u := strings.TrimRight(c.BaseURL, "/") + "/messages/" + url.PathEscape(messageID) + "/reactions"
	return c.doJSON(ctx, http.MethodPost, u, map[string]string{"emoji": emoji}, nil, "threads add reaction")
}

func (c Client) SetThreadTitle(ctx context.Context, messageID string, req SetThreadTitleRequest) (SetThreadTitleResponse, error) {
	var out SetThreadTitleResponse
	u := strings.TrimRight(c.BaseURL, "/") + "/messages/" + url.PathEscape(messageID) + "/thread-title"
	err := c.doJSON(ctx, http.MethodPut, u, req, &out, "threads set thread title")
	return out, err
}

func (c Client) CreateProcess(ctx context.Context, req CreateProcessRequest) (CreateProcessResponse, error) {
	var out CreateProcessResponse
	u := strings.TrimRight(c.BaseURL, "/") + "/processes"
	err := c.doJSON(ctx, http.MethodPost, u, req, &out, "threads create process")
	return out, err
}

func (c Client) UpdateProcess(ctx context.Context, processID string, req UpdateProcessRequest) error {
	u := strings.TrimRight(c.BaseURL, "/") + "/processes/" + url.PathEscape(processID)
	return c.doJSON(ctx, http.MethodPatch, u, req, nil, "threads update process")
}

func (c Client) RecordProcessActivity(ctx context.Context, processID string, req ProcessActivityRequest) error {
	u := strings.TrimRight(c.BaseURL, "/") + "/processes/" + url.PathEscape(processID) + "/activity"
	return c.doJSON(ctx, http.MethodPost, u, req, nil, "threads process activity")
}

func (c Client) UpdateMessageProcessStatus(ctx context.Context, messageID string, req UpdateMessageProcessStatusRequest) error {
	u := strings.TrimRight(c.BaseURL, "/") + "/messages/" + url.PathEscape(messageID) + "/process"
	return c.doJSON(ctx, http.MethodPost, u, req, nil, "threads message process status")
}

func (c Client) doJSON(ctx context.Context, method, u string, req any, out any, label string) error {
	body, err := json.Marshal(req)
	if err != nil {
		return err
	}
	hreq, err := http.NewRequestWithContext(ctx, method, u, bytes.NewReader(body))
	if err != nil {
		return err
	}
	hreq.Header.Set("Content-Type", "application/json")
	if c.Token != "" {
		hreq.Header.Set("Authorization", "Bearer "+c.Token)
	}
	resp, err := c.httpClient().Do(hreq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return fmt.Errorf("%s: status %d: %s", label, resp.StatusCode, strings.TrimSpace(string(body)))
	}
	if out != nil {
		return json.NewDecoder(resp.Body).Decode(out)
	}
	return nil
}

func escapeQuotes(value string) string {
	return strings.NewReplacer("\\", "\\\\", "\"", "\\\"").Replace(value)
}

func detectContentType(path string, file *os.File) string {
	if fromExt := mime.TypeByExtension(filepath.Ext(path)); fromExt != "" {
		return fromExt
	}
	buf := make([]byte, 512)
	n, _ := file.Read(buf)
	_, _ = file.Seek(0, io.SeekStart)
	if n == 0 {
		return "application/octet-stream"
	}
	return http.DetectContentType(buf[:n])
}

func (c Client) httpClient() *http.Client {
	if c.HTTP != nil {
		return c.HTTP
	}
	return &http.Client{Timeout: 30 * time.Second}
}
