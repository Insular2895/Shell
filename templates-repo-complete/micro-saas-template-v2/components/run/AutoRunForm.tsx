'use client';

/**
 * AutoRunForm
 *
 * Génère un formulaire à partir de config/run.schema.json.
 *
 * Particularité : pour les inputs `type: file`, le composant fait un upload
 * vers /api/upload AVANT le submit, puis remplace la valeur du champ par la
 * signed URL retournée. L'engine reçoit donc TOUJOURS une URL, jamais un blob.
 */

import { useState } from 'react';
import schema from '@/config/run.schema.json';

type SchemaInput =
  | { key: string; type: 'text' | 'textarea' | 'url' | 'email'; label: string; placeholder?: string; required?: boolean; default?: string; validation?: { pattern?: string; errorMessage?: string } }
  | { key: string; type: 'number'; label: string; required?: boolean; default?: number; min?: number; max?: number }
  | { key: string; type: 'select'; label: string; required?: boolean; default?: string; options: Array<{ value: string; label: string }> }
  | { key: string; type: 'multiselect'; label: string; required?: boolean; default?: string[]; options: Array<{ value: string; label: string }> }
  | { key: string; type: 'boolean'; label: string; default?: boolean }
  | { key: string; type: 'file'; label: string; required?: boolean; accept?: string };

type RunSchema = {
  title: string;
  description?: string;
  submitLabel?: string;
  estimatedRuntime?: string;
  inputs: SchemaInput[];
};

type Props = {
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  isSubmitting?: boolean;
};

export default function AutoRunForm({ onSubmit, isSubmitting }: Props) {
  const runSchema = schema as RunSchema;

  const initialValues: Record<string, unknown> = {};
  for (const input of runSchema.inputs) {
    if ('default' in input && input.default !== undefined) {
      initialValues[input.key] = input.default;
    }
  }

  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const setField = (key: string, value: unknown) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const input of runSchema.inputs) {
      const v = values[input.key];
      if ('required' in input && input.required && (v === undefined || v === '' || v === null)) {
        newErrors[input.key] = 'Ce champ est requis.';
        continue;
      }
      if (input.type === 'url' || input.type === 'text' || input.type === 'email' || input.type === 'textarea') {
        const pattern = input.validation?.pattern;
        if (pattern && typeof v === 'string' && v && !new RegExp(pattern).test(v)) {
          newErrors[input.key] = input.validation?.errorMessage || 'Format invalide.';
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Upload tous les File en URL avant le submit
  const resolveFiles = async (raw: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const resolved = { ...raw };
    setUploading(true);
    try {
      for (const input of runSchema.inputs) {
        if (input.type !== 'file') continue;
        const file = raw[input.key];
        if (!(file instanceof File)) continue;

        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) {
          throw new Error(`Upload failed for ${input.key}: ${res.status}`);
        }
        const { url } = await res.json();
        // On remplace le File par l'URL signée → c'est ce que reçoit l'engine
        resolved[input.key] = url;
      }
    } finally {
      setUploading(false);
    }
    return resolved;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      const resolved = await resolveFiles(values);
      await onSubmit(resolved);
    } catch (err) {
      setErrors({ _global: err instanceof Error ? err.message : 'Erreur upload' });
    }
  };

  const busy = isSubmitting || uploading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{runSchema.title}</h2>
        {runSchema.description && <p className="mt-1 text-sm text-gray-600">{runSchema.description}</p>}
        {runSchema.estimatedRuntime && (
          <p className="mt-2 text-xs text-gray-500">⏱ Durée estimée : {runSchema.estimatedRuntime}</p>
        )}
      </div>

      {errors._global && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {errors._global}
        </div>
      )}

      <div className="space-y-4">
        {runSchema.inputs.map((input) => (
          <FieldRenderer
            key={input.key}
            input={input}
            value={values[input.key]}
            error={errors[input.key]}
            onChange={(v) => setField(input.key, v)}
          />
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={busy}
        className="w-full rounded-md bg-black px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {uploading ? 'Upload en cours…' : isSubmitting ? 'Lancement…' : runSchema.submitLabel || 'Lancer'}
      </button>
    </div>
  );
}

function FieldRenderer({
  input,
  value,
  error,
  onChange,
}: {
  input: SchemaInput;
  value: unknown;
  error?: string;
  onChange: (v: unknown) => void;
}) {
  const labelEl = (
    <label className="block text-sm font-medium text-gray-900">
      {input.label}
      {'required' in input && input.required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
  const errorEl = error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null;
  const inputClass =
    'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black';

  switch (input.type) {
    case 'text':
    case 'url':
    case 'email':
      return (
        <div>{labelEl}
          <input type={input.type} value={(value as string) || ''}
            placeholder={'placeholder' in input ? input.placeholder : undefined}
            onChange={(e) => onChange(e.target.value)} className={inputClass} />
          {errorEl}</div>
      );
    case 'textarea':
      return (
        <div>{labelEl}
          <textarea value={(value as string) || ''} rows={5}
            placeholder={'placeholder' in input ? input.placeholder : undefined}
            onChange={(e) => onChange(e.target.value)} className={inputClass} />
          {errorEl}</div>
      );
    case 'number':
      return (
        <div>{labelEl}
          <input type="number" value={(value as number) ?? ''}
            min={input.min} max={input.max}
            onChange={(e) => onChange(Number(e.target.value))} className={inputClass} />
          {errorEl}</div>
      );
    case 'select':
      return (
        <div>{labelEl}
          <select value={(value as string) || ''} onChange={(e) => onChange(e.target.value)} className={inputClass}>
            <option value="">— Choisir —</option>
            {input.options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>{errorEl}</div>
      );
    case 'multiselect':
      return (
        <div>{labelEl}
          <div className="mt-2 space-y-2">
            {input.options.map((opt) => {
              const arr = (value as string[]) || [];
              const checked = arr.includes(opt.value);
              return (
                <label key={opt.value} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={checked}
                    onChange={(e) => onChange(e.target.checked ? [...arr, opt.value] : arr.filter((x) => x !== opt.value))} />
                  {opt.label}
                </label>
              );
            })}
          </div>{errorEl}</div>
      );
    case 'boolean':
      return (
        <div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
            <span className="font-medium text-gray-900">{input.label}</span>
          </label>{errorEl}
        </div>
      );
    case 'file':
      return (
        <div>{labelEl}
          <input type="file" accept={input.accept}
            onChange={(e) => onChange(e.target.files?.[0] || null)}
            className="mt-1 block w-full text-sm" />
          {value instanceof File && (
            <p className="mt-1 text-xs text-gray-500">{value.name} ({Math.round(value.size / 1024)} Ko)</p>
          )}
          {errorEl}</div>
      );
    default:
      return null;
  }
}
