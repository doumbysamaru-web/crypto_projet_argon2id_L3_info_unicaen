/**
 * Validates the engine against the official Argon2id v1.3 known-answer test
 * from the reference implementation (github.com/P-H-C/phc-winner-argon2,
 * kats/argon2id), reproduced in RFC 9106. Run with `npm test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildArgon2Trace, toHex } from './argon2.ts';

function filledBytes(byte: number, length: number): Uint8Array {
  return new Uint8Array(length).fill(byte);
}

test('Argon2id matches the RFC 9106 known-answer test vector', () => {
  const password = filledBytes(0x01, 32);
  const salt = filledBytes(0x02, 16);
  const secret = filledBytes(0x03, 8);
  const ad = filledBytes(0x04, 12);

  const trace = buildArgon2Trace({
    password, salt, secret, ad, m: 32, t: 3, p: 4, tagLength: 32, type: 2,
  });

  const h0Step = trace.find((s) => s.kind === 'h0');
  assert.equal(
    toHex(h0Step!.h0!),
    '2889de487eb42ae500c0007ed9252f1069eadec40d5765b485de6dc2437a67'
    + 'b8546a2f0acc1a0882db8fcf74714b472e94df421a5da1112ffa11434370a1e997',
  );

  const finalStep = trace.at(-1)!;
  assert.equal(finalStep.kind, 'final');
  assert.equal(
    toHex(finalStep.tag!),
    '0d640df58d78766c08c037a34a8b53c9d01ef0452d75b65eb52520e96b01e659',
  );
});
