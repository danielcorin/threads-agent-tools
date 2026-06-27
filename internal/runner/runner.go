package runner

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"os/exec"
	"strings"

	"github.com/danielcorin/threads-agent-bridge/internal/config"
	"github.com/danielcorin/threads-agent-bridge/internal/threads"
)

type Input struct {
	ScopeID string
	Event   threads.Event
}

type Output struct{ Text string }

type Runner interface {
	Run(context.Context, config.Scope, Input) (Output, error)
}

type LocalRunner struct{}

func (LocalRunner) Run(ctx context.Context, scope config.Scope, input Input) (Output, error) {
	args := buildArgs(scope)
	cmd := exec.CommandContext(ctx, scope.Runner.Command, args...)
	if scope.Runner.WorkingDir != "" {
		cmd.Dir = scope.Runner.WorkingDir
	}
	prompt := buildPrompt(input)
	cmd.Stdin = strings.NewReader(prompt)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		if stderr.Len() > 0 {
			return Output{}, errWithStderr{err: err, stderr: stderr.String()}
		}
		return Output{}, err
	}
	text := parseJSONLText(stdout.Bytes())
	if text == "" {
		text = strings.TrimSpace(stdout.String())
	}
	return Output{Text: text}, nil
}

func buildArgs(scope config.Scope) []string {
	args := append([]string{}, scope.Runner.Args...)
	switch scope.Safety.Mode {
	case "", "suggest":
		return args
	case "yolo":
		return append(args, "--dangerously-bypass-approvals-and-sandbox")
	case "read-only", "workspace-write", "danger-full-access":
		return append(args, "--sandbox", scope.Safety.Mode)
	default:
		// Unknown modes are deliberately ignored; users can pass exact runner flags in runner.args.
		return args
	}
}

func buildPrompt(input Input) string {
	return strings.TrimSpace(input.Event.Message.Content) + "\n"
}

type errWithStderr struct {
	err    error
	stderr string
}

func (e errWithStderr) Error() string { return e.err.Error() + ": " + e.stderr }
func (e errWithStderr) Unwrap() error { return e.err }

func parseJSONLText(data []byte) string {
	var parts []string
	s := bufio.NewScanner(bytes.NewReader(data))
	for s.Scan() {
		line := bytes.TrimSpace(s.Bytes())
		if len(line) == 0 {
			continue
		}
		var obj map[string]any
		if err := json.Unmarshal(line, &obj); err != nil {
			continue
		}
		for _, key := range []string{"text", "content", "message", "output"} {
			if value, ok := obj[key].(string); ok && strings.TrimSpace(value) != "" {
				parts = append(parts, strings.TrimSpace(value))
				break
			}
		}
	}
	return strings.Join(parts, "\n")
}
