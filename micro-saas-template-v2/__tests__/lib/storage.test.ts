import { describe, expect, it } from 'vitest';
import { sanitizeStorageFilename } from '@/lib/storage';

describe('sanitizeStorageFilename', () => {
  it('removes path traversal and unsafe characters', () => {
    expect(sanitizeStorageFilename('../../secret report:final.pdf')).toBe('secret-report-final.pdf');
  });

  it('returns a safe fallback for empty names', () => {
    expect(sanitizeStorageFilename('///')).toBe('file');
  });
});
