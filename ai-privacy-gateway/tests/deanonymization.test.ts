import { describe, it, expect } from 'vitest';
import { saveMapping } from '../src/mapping-store.js';

describe('deanonymize', () => {
  it('restores original text from mapping', async () => {
    const { deanonymize } = await import('../src/anonymize.js');
    const mappingId = await saveMapping(new Map([['<PERSON_1>', 'Jean Dupont']]));
    await expect(deanonymize('Bonjour <PERSON_1>', mappingId)).resolves.toBe('Bonjour Jean Dupont');
  });
});
