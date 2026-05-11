'use client';
import { useState } from 'react';
import type { JsonBlock as T } from '@/config/result.schema';

export default function JsonBlock({ block }: { block: T }) {
  const [open, setOpen] = useState(!block.collapsed);
  return (
    <div className="rounded-md border border-gray-200 p-4">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between font-semibold">
        <span>{block.title}</span>
        <span className="text-sm text-gray-500">{open ? '▼' : '▶'}</span>
      </button>
      {open && (
        <pre className="mt-3 overflow-x-auto rounded bg-gray-50 p-3 text-xs text-gray-800">
{JSON.stringify(block.data, null, 2)}
        </pre>
      )}
    </div>
  );
}
