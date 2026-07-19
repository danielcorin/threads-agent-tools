import openApiSpecJson from '../openapi/threads.json';
import type { JsonSchema } from './contract.js';

interface OpenApiDocument {
  info: { version: string };
  components: { schemas: Record<string, JsonSchema> };
}

const openApiSpec = openApiSpecJson as unknown as OpenApiDocument;
const COMPONENT_PREFIX = '#/components/schemas/';
const JSON_SCHEMA_DIALECT = 'https://json-schema.org/draft/2020-12/schema';

function referencedComponent(ref: string): string | null {
  return ref.startsWith(COMPONENT_PREFIX) ? ref.slice(COMPONENT_PREFIX.length) : null;
}

function rewriteRefs(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(rewriteRefs);
  if (!value || typeof value !== 'object') return value;

  const rewritten: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === '$ref' && typeof child === 'string') {
      const component = referencedComponent(child);
      rewritten[key] = component ? `#/$defs/${component}` : child;
    } else {
      rewritten[key] = rewriteRefs(child);
    }
  }
  return rewritten;
}

function collectComponents(value: unknown, names: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectComponents(item, names);
    return;
  }
  if (!value || typeof value !== 'object') return;

  const record = value as Record<string, unknown>;
  if (typeof record.$ref === 'string') {
    const component = referencedComponent(record.$ref);
    if (component && !names.has(component)) {
      const schema = openApiSpec.components.schemas[component];
      if (!schema) throw new Error(`OpenAPI schema component not found: ${component}`);
      names.add(component);
      collectComponents(schema, names);
    }
  }

  for (const child of Object.values(record)) collectComponents(child, names);
}

/** Bundle selected OpenAPI component refs into a standalone JSON Schema. */
export function openApiSchema(root: JsonSchema): JsonSchema {
  const components = new Set<string>();
  collectComponents(root, components);

  const definitions = Object.fromEntries(
    [...components].sort().map((name) => [name, rewriteRefs(openApiSpec.components.schemas[name])]),
  );

  return {
    $schema: JSON_SCHEMA_DIALECT,
    ...(rewriteRefs(root) as JsonSchema),
    ...(components.size > 0 ? { $defs: definitions } : {}),
  };
}

export function componentSchema(name: string): JsonSchema {
  const component = openApiSpec.components.schemas[name];
  if (!component) throw new Error(`OpenAPI schema component not found: ${name}`);
  return openApiSchema(component);
}

export function inputSchema(
  properties: Record<string, JsonSchema> = {},
  required: readonly string[] = [],
  extra: JsonSchema = {},
): JsonSchema {
  return {
    $schema: JSON_SCHEMA_DIALECT,
    type: 'object',
    properties,
    ...(required.length > 0 ? { required: [...required] } : {}),
    additionalProperties: false,
    ...extra,
  };
}
