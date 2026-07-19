# Contributing

Run the complete local verification suite before opening a pull request:

```bash
npm install
npm run check
```

API changes begin in `openapi/threads.json` or `openapi/ws-events.yaml`.
Regenerate committed derived files with:

```bash
npm run contract:generate
```

Do not edit `generated/` by hand.
