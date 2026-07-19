import { createCaller } from './caller.js';
import type { ActionDescriptor, JsonSchema } from './contract.js';
import { CallerInputError, ThreadsApiError } from './errors.js';
import { CLI_VERSION } from './version.js';

export interface CliDependencies {
  readonly env: Record<string, string | undefined>;
  readonly fetch: typeof globalThis.fetch;
  readonly readLocalFile?: (filePath: string) => Promise<{
    filename: string;
    content_type: string;
    base64_data: string;
  }>;
  readonly readStdin?: () => Promise<string>;
  readonly version?: string;
  readonly stdout: (text: string) => void;
  readonly stderr: (text: string) => void;
}

interface GlobalOptions {
  api?: string;
  token?: string;
  pretty: boolean;
  help: boolean;
  version: boolean;
  args: string[];
}

function takeValue(args: readonly string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
  return value;
}

function parseGlobals(args: readonly string[]): GlobalOptions {
  const options: GlobalOptions = {
    pretty: false,
    help: false,
    version: false,
    args: [],
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--api') {
      options.api = takeValue(args, index, arg);
      index += 1;
    } else if (arg === '--token') {
      options.token = takeValue(args, index, arg);
      index += 1;
    } else if (arg === '--pretty') {
      options.pretty = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--version' || arg === '-V') {
      options.version = true;
    } else {
      options.args.push(arg);
    }
  }
  return options;
}

function flagName(property: string): string {
  return `--${property.replaceAll('_', '-')}`;
}

function valueLabel(schema: JsonSchema): string {
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum.map((value) => String(value)).join('|');
  }
  if (schema.type === 'boolean') return 'true|false';
  const types = Array.isArray(schema.type)
    ? schema.type.filter((type): type is string => typeof type === 'string')
    : (typeof schema.type === 'string' ? [schema.type] : []);
  if (types.length === 0 || types.some((type) => type === 'array' || type === 'object')) return 'json';
  return types.join('|');
}

function commandUsage(action: ActionDescriptor): string {
  const properties = (action.inputSchema.properties ?? {}) as Record<string, JsonSchema>;
  const required = new Set((action.inputSchema.required ?? []) as string[]);
  const messageAction = action.name === 'send_message' || action.name === 'reply_to_message';
  const flags = Object.entries(properties).map(([property, schema]) => {
    const rendered = `${flagName(property)} <${valueLabel(schema)}>`;
    return required.has(property) && !(messageAction && property === 'content')
      ? rendered
      : `[${rendered}]`;
  });
  if (messageAction) {
    flags.push('[--file <path>]...', '[--image <path>]...');
  }
  return [...action.command, ...flags].join(' ');
}

function renderHelp(actions: readonly ActionDescriptor[]): string {
  const commands = actions
    .map((action) => `  ${commandUsage(action)}\n      ${action.description}`)
    .join('\n');
  return `Threads CLI\n\nUsage:\n  threads [global options] <command> [flags]\n\nGlobal options:\n  --api <url>       API base URL; include /api on combined deployments\n  --token <token>   Threads user or bot API token\n  --input <json>    Supply an action input object; explicit flags override it\n  --pretty          Pretty-print JSON output\n  --help            Show this help\n  --version         Show the artifact version\n\nEnvironment:\n  THREADS_API or THREADS_API_URL\n  THREADS_TOKEN or THREADS_BOT_TOKEN\n\nCommands:\n${commands}\n`;
}

function propertySchema(action: ActionDescriptor, property: string): JsonSchema | undefined {
  const properties = action.inputSchema.properties as Record<string, JsonSchema> | undefined;
  return properties?.[property];
}

function parseValue(raw: string, schema: JsonSchema, flag: string): unknown {
  const types = Array.isArray(schema.type)
    ? schema.type.filter((type): type is string => typeof type === 'string')
    : (typeof schema.type === 'string' ? [schema.type] : []);
  if (raw === 'null' && types.includes('null')) return null;

  const type = types.find((candidate) => candidate !== 'null');
  switch (type) {
    case 'integer': {
      const value = Number(raw);
      if (!Number.isInteger(value)) throw new Error(`${flag} must be an integer`);
      return value;
    }
    case 'number': {
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new Error(`${flag} must be a number`);
      return value;
    }
    case 'boolean':
      if (raw === 'true' || raw === '1') return true;
      if (raw === 'false' || raw === '0') return false;
      throw new Error(`${flag} must be true or false`);
    case 'array':
      if (raw.startsWith('[')) return JSON.parse(raw) as unknown;
      return raw.split(',').filter(Boolean);
    case 'object':
      return JSON.parse(raw) as unknown;
    default:
      if (types.length === 0) {
        try {
          return JSON.parse(raw) as unknown;
        } catch {
          return raw;
        }
      }
      return raw;
  }
}

function parseActionInput(action: ActionDescriptor, args: readonly string[]): Record<string, unknown> {
  let input: Record<string, unknown> = {};
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (!flag.startsWith('--')) throw new Error(`Unexpected argument: ${flag}`);

    if (flag === '--input') {
      const value = takeValue(args, index, flag);
      const parsed = JSON.parse(value) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('--input must be a JSON object');
      }
      input = { ...input, ...parsed as Record<string, unknown> };
      index += 1;
      continue;
    }

    const property = flag.slice(2).replaceAll('-', '_');
    const schema = propertySchema(action, property);
    if (!schema) throw new Error(`Unknown flag for ${action.command.join(' ')}: ${flag}`);
    const value = takeValue(args, index, flag);
    input[property] = parseValue(value, schema, flag);
    index += 1;
  }
  return input;
}

function extractLocalFilePaths(
  action: ActionDescriptor,
  args: readonly string[],
): { args: string[]; filePaths: string[] } {
  if (action.name !== 'send_message' && action.name !== 'reply_to_message') {
    return { args: [...args], filePaths: [] };
  }

  const remaining: string[] = [];
  const filePaths: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--file' || arg === '--image') {
      filePaths.push(takeValue(args, index, arg));
      index += 1;
    } else {
      remaining.push(arg);
    }
  }
  return { args: remaining, filePaths };
}

function findAction(actions: readonly ActionDescriptor[], args: readonly string[]): ActionDescriptor | undefined {
  return [...actions]
    .sort((left, right) => right.command.length - left.command.length)
    .find((action) => action.command.every((part, index) => args[index] === part));
}

function errorText(error: unknown): string {
  if (error instanceof ThreadsApiError) return `HTTP ${error.status}: ${error.message}`;
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function runCli(args: readonly string[], dependencies: CliDependencies): Promise<number> {
  try {
    const options = parseGlobals(args);
    if (options.version) {
      dependencies.stdout(`threads ${dependencies.version ?? CLI_VERSION}\n`);
      return 0;
    }
    // A placeholder credential is sufficient to inspect the serializable catalog;
    // it is never sent when rendering help.
    const catalogCaller = createCaller({ baseUrl: 'http://localhost:8788', token: 'help', fetch: dependencies.fetch });
    const actions = catalogCaller.listActions();

    if (options.help || options.args.length === 0) {
      dependencies.stdout(renderHelp(actions));
      return 0;
    }

    const action = findAction(actions, options.args);
    if (!action) {
      dependencies.stderr(`Unknown command: ${options.args.filter((arg) => !arg.startsWith('--')).join(' ')}\n`);
      return 2;
    }

    const api = options.api ?? dependencies.env.THREADS_API ?? dependencies.env.THREADS_API_URL ?? 'http://localhost:8788';
    const token = options.token ?? dependencies.env.THREADS_TOKEN ?? dependencies.env.THREADS_BOT_TOKEN;
    if (!token) {
      dependencies.stderr('No API token provided. Use --token, THREADS_TOKEN, or THREADS_BOT_TOKEN.\n');
      return 2;
    }

    const actionArgs = options.args.slice(action.command.length);
    const localFiles = extractLocalFilePaths(action, actionArgs);
    const input = parseActionInput(action, localFiles.args);
    const caller = createCaller({ baseUrl: api, token, fetch: dependencies.fetch });

    if (localFiles.filePaths.length > 0) {
      if (!dependencies.readLocalFile) {
        throw new Error('This Threads CLI build cannot read local --file or --image paths.');
      }
      const attachmentIds = Array.isArray(input.attachment_ids)
        ? input.attachment_ids.filter((value): value is string => typeof value === 'string')
        : [];
      for (const filePath of localFiles.filePaths) {
        const localFile = await dependencies.readLocalFile(filePath);
        const uploaded = await caller.run('upload_attachment', localFile);
        const attachmentId = uploaded && typeof uploaded === 'object' && 'id' in uploaded
          ? (uploaded as { id?: unknown }).id
          : undefined;
        if (typeof attachmentId !== 'string' || attachmentId.length === 0) {
          throw new Error(`Upload response for ${filePath} did not contain an attachment id.`);
        }
        attachmentIds.push(attachmentId);
      }
      input.attachment_ids = attachmentIds;
    }

    if (
      (action.name === 'send_message' || action.name === 'reply_to_message')
      && typeof input.content !== 'string'
    ) {
      const hasAttachments = Array.isArray(input.attachment_ids) && input.attachment_ids.length > 0;
      const stdin = !hasAttachments && dependencies.readStdin
        ? (await dependencies.readStdin()).trim()
        : '';
      if (stdin.length > 0 || hasAttachments) input.content = stdin;
    }

    const output = await caller.run(action.name, input);
    dependencies.stdout(`${JSON.stringify(output, null, options.pretty ? 2 : undefined)}\n`);
    return 0;
  } catch (error) {
    const prefix = error instanceof CallerInputError ? 'Invalid input' : 'Error';
    dependencies.stderr(`${prefix}: ${errorText(error)}\n`);
    return error instanceof CallerInputError ? 2 : 1;
  }
}
