package threads

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
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

func (c Client) SendMessage(ctx context.Context, channelID string, req SendMessageRequest) error {
	body, err := json.Marshal(req)
	if err != nil {
		return err
	}
	httpClient := c.HTTP
	if httpClient == nil {
		httpClient = &http.Client{Timeout: 30 * time.Second}
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
	resp, err := httpClient.Do(hreq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("threads send message: status %d", resp.StatusCode)
	}
	return nil
}
