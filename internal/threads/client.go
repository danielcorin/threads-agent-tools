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
	body, err := json.Marshal(req)
	if err != nil {
		return err
	}
	u := strings.TrimRight(c.BaseURL, "/") + "/channels/" + url.PathEscape(channelID) + "/messages"
	hreq, err := http.NewRequestWithContext(ctx, http.MethodPost, u, bytes.NewReader(body))
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
		return fmt.Errorf("threads send message: status %d", resp.StatusCode)
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
