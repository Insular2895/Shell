/**
 * Tests pour le validateur serveur de run.schema.json.
 *
 * Ces tests sont CRITIQUES pour la sécurité : si le validateur laisse passer
 * du payload non-conforme, l'engine reçoit n'importe quoi et peut crasher
 * ou exécuter des actions non voulues.
 */

import { describe, it, expect } from 'vitest';
import { validateRunInput } from '@/lib/runSchemaValidator';

describe('validateRunInput', () => {
  it('refuse non-objects', () => {
    expect(validateRunInput(null).ok).toBe(false);
    expect(validateRunInput([]).ok).toBe(false);
    expect(validateRunInput('string').ok).toBe(false);
    expect(validateRunInput(42).ok).toBe(false);
    expect(validateRunInput(undefined).ok).toBe(false);
  });

  it('refuse les payloads trop larges (anti-DOS)', () => {
    const huge = { f: 'x'.repeat(300_000) };
    const result = validateRunInput(huge);
    expect(result.ok).toBe(false);
  });

  it('refuse les arrays trop longues', () => {
    const tooManyItems = { foo: new Array(200).fill('x') };
    const result = validateRunInput(tooManyItems);
    expect(result.ok).toBe(false);
  });

  it('refuse les nesting trop profonds', () => {
    let deep: Record<string, unknown> = { value: 'leaf' };
    for (let i = 0; i < 15; i++) {
      deep = { nested: deep };
    }
    const result = validateRunInput(deep);
    expect(result.ok).toBe(false);
  });

  it('refuse les keys non déclarées dans run.schema.json (additionalProperties)', () => {
    // Selon la default config (PlaylistBrief), les keys valides sont
    // playlist_url, summary_depth, language, include_timestamps.
    // Une key 'malicious_field' doit être refusée.
    const result = validateRunInput({
      playlist_url: 'https://youtube.com/playlist?list=PL123',
      malicious_field: 'attempt_to_inject',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('malicious_field'))).toBe(true);
    }
  });

  it('accepte un payload valide', () => {
    // Note : ce test dépend de la config/run.schema.json livrée avec le
    // template (PlaylistBrief). Si tu modifies run.schema.json pour un autre
    // produit, adapte ce test.
    const result = validateRunInput({
      playlist_url: 'https://youtube.com/playlist?list=PL123',
      summary_depth: 'rapide',
      language: 'fr',
      include_timestamps: true,
    });
    expect(result.ok).toBe(true);
  });

  it("refuse un required field manquant", () => {
    const result = validateRunInput({
      summary_depth: 'rapide',
      // playlist_url manquant
    });
    expect(result.ok).toBe(false);
  });

  it('refuse un select avec valeur hors enum', () => {
    const result = validateRunInput({
      playlist_url: 'https://youtube.com/playlist?list=PL123',
      summary_depth: 'super_long_invalid_depth',
    });
    expect(result.ok).toBe(false);
  });

  it("ne leak pas la valeur dans les messages d'erreur", () => {
    const secretLooking = 'sk_live_50_letters_long_secret_xxxxxxxxxxxxxxxxxxxx';
    const result = validateRunInput({
      playlist_url: 'not_a_url',
      malicious_field: secretLooking,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Les messages d'erreur ne doivent jamais contenir la valeur
      const allErrors = result.errors.join(' ');
      expect(allErrors).not.toContain(secretLooking);
      expect(allErrors).not.toContain('sk_live');
    }
  });
});
