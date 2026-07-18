package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/danielcorin/threads-agent-bridge/internal/threads"
)

type multiFlag []string

func (m *multiFlag) String() string { return strings.Join(*m, ",") }
func (m *multiFlag) Set(value string) error {
	if strings.TrimSpace(value) == "" {
		return errors.New("empty value")
	}
	*m = append(*m, value)
	return nil
}

func main() {
	if err := run(context.Background(), os.Args[1:], os.Getenv, os.Stdin, os.Stdout, os.Stderr); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(ctx context.Context, args []string, getenv func(string) string, stdin io.Reader, stdout, stderr io.Writer) error {
	if len(args) == 0 || args[0] == "help" || args[0] == "--help" || args[0] == "-h" {
		printUsage(stdout)
		return nil
	}
	switch args[0] {
	case "send":
		return runSend(ctx, args[1:], getenv, stdin, stdout)
	case "react":
		return runReact(ctx, args[1:], getenv, stdout)
	case "title":
		return runTitle(ctx, args[1:], getenv, stdout)
	default:
		return fmt.Errorf("unknown command %q", args[0])
	}
}

func runTitle(ctx context.Context, args []string, getenv func(string) string, stdout io.Writer) error {
	fs := flag.NewFlagSet("title", flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	baseURL := fs.String("base-url", getenvDefault(getenv, "THREADS_BASE_URL", ""), "Threads API base URL")
	token := fs.String("token", getenvDefault(getenv, "THREADS_API_TOKEN", ""), "Threads API token")
	tokenEnv := fs.String("token-env", "", "environment variable containing the Threads API token")
	defaultMessageID := getenvDefault(getenv, "THREADS_THREAD_ID", getenvDefault(getenv, "THREADS_MESSAGE_ID", ""))
	messageID := fs.String("message", defaultMessageID, "target Threads root or reply message id")
	fs.StringVar(messageID, "message-id", *messageID, "target Threads root or reply message id; alias for --message")
	title := fs.String("title", "", "human-readable thread title")
	ifUnset := fs.Bool("if-unset", false, "set the title only when the thread is currently untitled")
	timeout := fs.Duration("timeout", 30*time.Second, "request timeout")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if *baseURL == "" {
		return errors.New("--base-url or THREADS_BASE_URL is required")
	}
	if *tokenEnv != "" {
		*token = getenv(*tokenEnv)
	}
	if *token == "" {
		return errors.New("--token, --token-env, or THREADS_API_TOKEN is required")
	}
	if *messageID == "" {
		return errors.New("--message, --message-id, THREADS_THREAD_ID, or THREADS_MESSAGE_ID is required")
	}
	normalizedTitle := strings.Join(strings.Fields(*title), " ")
	if normalizedTitle == "" {
		return errors.New("--title is required")
	}
	reqCtx, cancel := context.WithTimeout(ctx, *timeout)
	defer cancel()
	client := threads.Client{BaseURL: *baseURL, Token: *token}
	result, err := client.SetThreadTitle(reqCtx, *messageID, threads.SetThreadTitleRequest{Title: normalizedTitle, IfUnset: *ifUnset})
	if err != nil {
		return err
	}
	status := "titled"
	if !result.Applied {
		status = "unchanged"
	}
	_, _ = fmt.Fprintln(stdout, status)
	return nil
}

func runReact(ctx context.Context, args []string, getenv func(string) string, stdout io.Writer) error {
	fs := flag.NewFlagSet("react", flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	baseURL := fs.String("base-url", getenvDefault(getenv, "THREADS_BASE_URL", ""), "Threads API base URL")
	token := fs.String("token", getenvDefault(getenv, "THREADS_API_TOKEN", ""), "Threads API token")
	tokenEnv := fs.String("token-env", "", "environment variable containing the Threads API token")
	messageID := fs.String("message", getenvDefault(getenv, "THREADS_MESSAGE_ID", ""), "target Threads message id")
	fs.StringVar(messageID, "message-id", *messageID, "target Threads message id; alias for --message")
	emoji := fs.String("emoji", "", "emoji reaction to add")
	timeout := fs.Duration("timeout", 30*time.Second, "request timeout")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if *baseURL == "" {
		return errors.New("--base-url or THREADS_BASE_URL is required")
	}
	if *tokenEnv != "" {
		*token = getenv(*tokenEnv)
	}
	if *token == "" {
		return errors.New("--token, --token-env, or THREADS_API_TOKEN is required")
	}
	if *messageID == "" {
		return errors.New("--message, --message-id, or THREADS_MESSAGE_ID is required")
	}
	if strings.TrimSpace(*emoji) == "" {
		return errors.New("--emoji is required")
	}
	reqCtx, cancel := context.WithTimeout(ctx, *timeout)
	defer cancel()
	client := threads.Client{BaseURL: *baseURL, Token: *token}
	if err := client.AddReaction(reqCtx, *messageID, strings.TrimSpace(*emoji)); err != nil {
		return err
	}
	_, _ = fmt.Fprintln(stdout, "reacted")
	return nil
}

func runSend(ctx context.Context, args []string, getenv func(string) string, stdin io.Reader, stdout io.Writer) error {
	fs := flag.NewFlagSet("send", flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	baseURL := fs.String("base-url", getenvDefault(getenv, "THREADS_BASE_URL", ""), "Threads API base URL")
	token := fs.String("token", getenvDefault(getenv, "THREADS_API_TOKEN", ""), "Threads API token")
	tokenEnv := fs.String("token-env", "", "environment variable containing the Threads API token")
	channelID := fs.String("channel", getenvDefault(getenv, "THREADS_CHANNEL_ID", ""), "target Threads channel id")
	threadID := fs.String("thread", getenvDefault(getenv, "THREADS_THREAD_ID", ""), "target Threads thread/root message id")
	messageType := fs.String("type", "agent_update", "Threads message_type value")
	metadataJSON := fs.String("metadata-json", "", "additional metadata JSON object")
	content := fs.String("content", "", "message content; reads stdin when empty and no files are attached")
	timeout := fs.Duration("timeout", 30*time.Second, "request timeout")
	var filePaths multiFlag
	fs.Var(&filePaths, "file", "path to attach; may be repeated")
	fs.Var(&filePaths, "image", "image path to attach; alias for --file and may be repeated")
	attachmentIDsCSV := fs.String("attachment-ids", "", "comma-separated existing Threads attachment ids to include")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if *baseURL == "" {
		return errors.New("--base-url or THREADS_BASE_URL is required")
	}
	if *tokenEnv != "" {
		*token = getenv(*tokenEnv)
	}
	if *token == "" {
		return errors.New("--token, --token-env, or THREADS_API_TOKEN is required")
	}
	if *channelID == "" {
		return errors.New("--channel or THREADS_CHANNEL_ID is required")
	}
	attachmentIDs := parseCSV(*attachmentIDsCSV)
	text := *content
	if text == "" && len(filePaths) == 0 && len(attachmentIDs) == 0 {
		data, err := io.ReadAll(stdin)
		if err != nil {
			return err
		}
		text = strings.TrimSpace(string(data))
	}
	if strings.TrimSpace(text) == "" && len(filePaths) == 0 && len(attachmentIDs) == 0 {
		return errors.New("message content or at least one --file/--image/--attachment-ids value is required")
	}
	metadata := map[string]any{"source": "threads-cli", "kind": "interim"}
	if *metadataJSON != "" {
		var extra map[string]any
		if err := json.Unmarshal([]byte(*metadataJSON), &extra); err != nil {
			return fmt.Errorf("metadata-json must be a JSON object: %w", err)
		}
		for k, v := range extra {
			metadata[k] = v
		}
	}
	reqCtx, cancel := context.WithTimeout(ctx, *timeout)
	defer cancel()
	client := threads.Client{BaseURL: *baseURL, Token: *token}
	for _, path := range filePaths {
		uploaded, err := client.UploadFile(reqCtx, path)
		if err != nil {
			return err
		}
		attachmentIDs = append(attachmentIDs, uploaded.ID)
	}
	if err := client.SendMessage(reqCtx, *channelID, threads.SendMessageRequest{Content: text, ThreadID: *threadID, MessageType: *messageType, AttachmentIDs: attachmentIDs, Metadata: metadata}); err != nil {
		return err
	}
	_, _ = fmt.Fprintln(stdout, "sent")
	return nil
}

func getenvDefault(getenv func(string) string, key, fallback string) string {
	if value := getenv(key); value != "" {
		return value
	}
	return fallback
}

func parseCSV(value string) []string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	var out []string
	for _, part := range strings.Split(value, ",") {
		part = strings.TrimSpace(part)
		if part != "" {
			out = append(out, part)
		}
	}
	return out
}

func printUsage(w io.Writer) {
	fmt.Fprintln(w, `threads is a narrow agent-facing Threads CLI.

Usage:
  threads send [flags]
  threads react [flags]
  threads title [flags]

send posts an immediate side-effect message to Threads. It is for interim
progress/status/artifact messages while an agent loop continues. The agent's
final answer should still be written to stdout for threads-agent-bridge to post
as the final response.

react adds an emoji reaction to any Threads message by id, defaulting to the
trigger message for the current agent run.

title sets or renames a thread title, defaulting to the root message for the
current agent run. Use --if-unset for an automatic title that must not replace
an existing title.

Environment defaults:
  THREADS_BASE_URL, THREADS_API_TOKEN, THREADS_CHANNEL_ID, THREADS_THREAD_ID,
  THREADS_MESSAGE_ID

Examples:
  threads send --content "Working on it..."
  echo "Found the issue" | threads send --type agent_update
  threads send --channel ch_123 --thread msg_123 --content "Still running"
  threads send --content "Log attached" --file ./test.log
  threads send --content "Screenshot" --image ./screenshot.png
  threads send --attachment-ids att_123,att_456
  threads react --emoji "✅"
  threads react --message msg_123 --emoji "👀"
  threads react --message-id msg_456 --emoji "🚀"
  threads title --title "Investigate WebSocket reconnects"
  threads title --message-id msg_456 --title "Release v2 follow-ups"
  threads title --title "Generated first title" --if-unset`)
}
