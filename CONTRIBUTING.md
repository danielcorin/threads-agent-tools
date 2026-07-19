# Contributing

Install Node.js 22+, Go 1.24+, and the dependencies:

```bash
npm ci
```

Run the complete validation suite:

```bash
npm run check
```

Contract changes begin in `contracts/threads.json` or
`contracts/ws-events.yaml`. Regenerate the CLI types with:

```bash
npm run contract:generate
```

Do not edit `cli/generated/` by hand. Bridge changes must pass both `go test`
and `go vet`. A release tag represents the complete contract, CLI, and bridge
artifact set from one source commit.
