import Ajv2020, { type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';
import { ACTIONS, type ActionDefinition } from './actions.js';
import { ThreadsApiClient } from './api-client.js';
import type { ActionDescriptor, Caller, CallerConfig } from './contract.js';
import { CallerContractError, CallerInputError, type ValidationIssue } from './errors.js';

interface CompiledAction {
  readonly definition: ActionDefinition<unknown>;
  readonly validateInput: ValidateFunction;
  readonly validateOutput: ValidateFunction;
}

function issues(errors: ErrorObject[] | null | undefined): ValidationIssue[] {
  return (errors ?? []).map((error) => {
    const allowedValues = error.keyword === 'enum'
      && 'allowedValues' in error.params
      && Array.isArray(error.params.allowedValues)
      ? error.params.allowedValues
      : undefined;
    return {
      path: error.instancePath,
      message: error.message ?? error.keyword,
      ...(allowedValues ? { allowedValues } : {}),
    };
  });
}

function descriptor(definition: ActionDefinition<unknown>): ActionDescriptor {
  const { execute: _execute, ...publicDefinition } = definition;
  return structuredClone(publicDefinition);
}

function compileActions(): Map<string, CompiledAction> {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  const compiled = new Map<string, CompiledAction>();
  for (const definition of ACTIONS) {
    if (compiled.has(definition.name)) throw new Error(`Duplicate Threads action: ${definition.name}`);
    compiled.set(definition.name, {
      definition,
      validateInput: ajv.compile(definition.inputSchema),
      validateOutput: ajv.compile(definition.outputSchema),
    });
  }
  return compiled;
}

const COMPILED_ACTIONS = compileActions();
const PUBLIC_ACTIONS = ACTIONS.map(descriptor);

export function createCaller(config: CallerConfig): Caller {
  const baseUrl = config.baseUrl.trim().replace(/\/+$/, '');
  const token = config.token.trim();
  if (!baseUrl) throw new Error('Threads API base URL is required');
  if (!token) throw new Error('Threads API token is required');

  const api = new ThreadsApiClient(baseUrl, token, config.fetch ?? globalThis.fetch);

  return {
    listActions: () => PUBLIC_ACTIONS.map((action) => structuredClone(action)),
    run: async (actionName, input) => {
      const action = COMPILED_ACTIONS.get(actionName);
      if (!action) throw new Error(`Unknown Threads action: ${actionName}`);

      if (!action.validateInput(input)) {
        throw new CallerInputError(actionName, issues(action.validateInput.errors));
      }

      const output = await action.definition.execute(api, input);
      if (!action.validateOutput(output)) {
        throw new CallerContractError(actionName, issues(action.validateOutput.errors));
      }
      return output;
    },
  };
}
