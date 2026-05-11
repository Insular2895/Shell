/**
 * lib/runSchemaValidator.ts
 *
 * VALIDATEUR SERVEUR pour run.schema.json (FIX v2 — bug v1).
 *
 * BUG v1 : /api/jobs/create acceptait body.input directement, créait le job,
 * envoyait à l'engine. Le frontend valide via le schéma → un attaquant
 * envoie n'importe quel JSON via curl et bypass.
 *
 * FIX : valider côté serveur avec Ajv (parse une fois, réutilise le validator).
 *
 * Limites strictes pour éviter DOS :
 *   - max 256kB de payload JSON
 *   - max 10k caractères par champ string
 *   - max 100 items par array
 *   - additionalProperties: false (refus des keys non déclarées)
 *
 * Référence : kdeldycke/awesome-falsehood — ne jamais regex un email,
 *             utiliser ajv-formats (qui utilise des libs validées).
 */

import Ajv, { type ValidateFunction, type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import runSchema from '@/config/run.schema.json';

const MAX_PAYLOAD_BYTES = 256 * 1024; // 256kB
const MAX_STRING_LENGTH = 10_000;
const MAX_ARRAY_ITEMS = 100;

// Ajv instance partagée (pré-compile le schéma 1x au cold start)
const ajv = new Ajv({
  allErrors: true,
  removeAdditional: false, // strict : on refuse, on ne strip pas
  useDefaults: true,
  coerceTypes: false,
});
addFormats(ajv);

/**
 * Le run.schema.json utilise `inputs[]` avec `{ key, type, required, ... }`
 * pour générer le formulaire UI. On en dérive un JSON Schema strict pour
 * la validation serveur.
 *
 * Types supportés : "text" | "url" | "email" | "number" | "boolean" |
 *                   "select" | "file" | "textarea"
 */
type Input = {
  key: string;
  type: 'text' | 'url' | 'email' | 'number' | 'boolean' | 'select' | 'file' | 'textarea';
  required?: boolean;
  default?: unknown;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    accept?: string[];
    maxSize?: number;
  };
};

function buildJsonSchema(): object {
  const inputs = ((runSchema as { inputs?: Input[] }).inputs ?? []) as Input[];
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const inp of inputs) {
    let prop: Record<string, unknown> = {};
    const v = inp.validation ?? {};

    switch (inp.type) {
      case 'text':
      case 'textarea':
        prop = {
          type: 'string',
          maxLength: Math.min(v.maxLength ?? MAX_STRING_LENGTH, MAX_STRING_LENGTH),
        };
        if (v.minLength !== undefined) prop.minLength = v.minLength;
        if (v.pattern) prop.pattern = v.pattern;
        break;

      case 'url':
        prop = {
          type: 'string',
          format: 'uri',
          maxLength: 2048,
        };
        if (v.pattern) prop.pattern = v.pattern;
        break;

      case 'email':
        prop = {
          type: 'string',
          format: 'email',
          maxLength: 320, // RFC 5321
        };
        break;

      case 'number':
        prop = { type: 'number' };
        if (v.minimum !== undefined) prop.minimum = v.minimum;
        if (v.maximum !== undefined) prop.maximum = v.maximum;
        break;

      case 'boolean':
        prop = { type: 'boolean' };
        break;

      case 'select':
        prop = {
          type: 'string',
          enum: (inp.options ?? []).map((o) => o.value),
        };
        break;

      case 'file':
        // Les fichiers arrivent comme URLs signées Supabase Storage (pas blobs)
        // → on valide que c'est bien une URL https://*.supabase.* / ...
        prop = {
          type: 'string',
          format: 'uri',
          pattern: '^https://[a-z0-9-]+\\.supabase\\.(co|in)/.*',
          maxLength: 2048,
        };
        break;
    }

    properties[inp.key] = prop;
    if (inp.required) required.push(inp.key);
  }

  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false, // refuse les keys non déclarées
  };
}

let cachedValidator: ValidateFunction | null = null;

function getValidator(): ValidateFunction {
  if (!cachedValidator) {
    cachedValidator = ajv.compile(buildJsonSchema());
  }
  return cachedValidator;
}

export type ValidationResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; errors: string[] };

/**
 * Valide un payload `input` envoyé à /api/jobs/create.
 * Retourne ok=false si invalide (avec messages courts, sans fuiter le schéma).
 */
export function validateRunInput(input: unknown): ValidationResult {
  // Garde-fou : pas un objet
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: ['input must be an object'] };
  }

  // Garde-fou : taille du payload (anti-DOS)
  let serialized: string;
  try {
    serialized = JSON.stringify(input);
  } catch {
    return { ok: false, errors: ['input not serializable'] };
  }
  if (serialized.length > MAX_PAYLOAD_BYTES) {
    return {
      ok: false,
      errors: [`payload too large (${serialized.length} > ${MAX_PAYLOAD_BYTES} bytes)`],
    };
  }

  // Garde-fou récursif : pas d'array > MAX_ARRAY_ITEMS, pas de string > MAX_STRING_LENGTH
  const sanityErr = checkSanity(input);
  if (sanityErr) return { ok: false, errors: [sanityErr] };

  const validate = getValidator();
  const value = { ...(input as Record<string, unknown>) };

  if (!validate(value)) {
    const errors = (validate.errors ?? []).map(formatError);
    return { ok: false, errors };
  }

  return { ok: true, value };
}

function checkSanity(value: unknown, depth = 0): string | null {
  if (depth > 10) return 'payload nesting too deep';
  if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
    return `string value too long (max ${MAX_STRING_LENGTH})`;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) return `array too large (max ${MAX_ARRAY_ITEMS})`;
    for (const v of value) {
      const e = checkSanity(v, depth + 1);
      if (e) return e;
    }
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const v of Object.values(value as Record<string, unknown>)) {
      const e = checkSanity(v, depth + 1);
      if (e) return e;
    }
  }
  return null;
}

function formatError(err: ErrorObject): string {
  const path = err.instancePath || '/';
  switch (err.keyword) {
    case 'required':
      return `${(err.params as { missingProperty: string }).missingProperty}: required`;
    case 'additionalProperties':
      return `${(err.params as { additionalProperty: string }).additionalProperty}: not allowed`;
    case 'type':
      return `${path}: must be ${(err.params as { type: string }).type}`;
    case 'maxLength':
      return `${path}: too long`;
    case 'minLength':
      return `${path}: too short`;
    case 'pattern':
      return `${path}: invalid format`;
    case 'format':
      return `${path}: invalid ${(err.params as { format: string }).format}`;
    case 'enum':
      return `${path}: must be one of allowed values`;
    case 'minimum':
    case 'maximum':
      return `${path}: out of range`;
    default:
      return `${path}: invalid`;
  }
}
