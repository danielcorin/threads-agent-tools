package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/danielcorin/threads-agent-tools/bridge/internal/config"
	"github.com/danielcorin/threads-agent-tools/bridge/internal/daemon"
	"github.com/danielcorin/threads-agent-tools/bridge/internal/store"
)

func main() {
	configPath := flag.String("config", "config.json", "path to JSON config")
	flag.Parse()
	if err := run(*configPath); err != nil && !errors.Is(err, context.Canceled) {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(configPath string) error {
	cfg, err := config.Load(configPath)
	if err != nil {
		return err
	}
	st, err := store.Open(cfg.DatabasePath)
	if err != nil {
		return err
	}
	defer st.Close()
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	slog.Info("starting threads agent bridge", "scopes", len(cfg.Scopes), "database", cfg.DatabasePath)
	d := daemon.Daemon{Config: cfg, Store: st}
	return d.Run(ctx)
}
