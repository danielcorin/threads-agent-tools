export type JsonSchema = Record<string, unknown>;

export interface ActionAnnotations {
  readonly title: string;
  readonly readOnlyHint: boolean;
  readonly destructiveHint: boolean;
  readonly idempotentHint: boolean;
  readonly openWorldHint: boolean;
}

export interface ActionDescriptor {
  readonly name: string;
  readonly command: readonly string[];
  readonly title: string;
  readonly description: string;
  readonly inputSchema: JsonSchema;
  readonly outputSchema: JsonSchema;
  readonly annotations: ActionAnnotations;
  readonly operationIds: readonly string[];
  readonly requiredScopes: readonly string[];
}

export interface CallerConfig {
  /** API base URL, including /api on a combined Threads deployment. */
  readonly baseUrl: string;
  /** Threads user or bot API token. */
  readonly token: string;
  /** Injectable Fetch implementation for Workers, tests, and in-process adapters. */
  readonly fetch?: typeof globalThis.fetch;
}

export interface Caller {
  /** Serializable definitions consumed by both the CLI and hosted MCP adapter. */
  listActions(): readonly ActionDescriptor[];
  /** Validate, execute, and validate the result of a named caller action. */
  run(actionName: string, input: unknown): Promise<unknown>;
}
