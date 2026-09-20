/**
 * BLAKE2b (RFC 7693), unkeyed, variable digest length (1..64 bytes).
 * Used by Argon2 both directly (H0) and through the H' variable-length
 * construction (initial blocks, address blocks, final tag).
 */

const MASK64 = (1n << 64n) - 1n;

const IV: readonly bigint[] = [
  0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn,
  0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
  0x510e527fade682d1n, 0x9b05688c2b3e6c1fn,
  0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n,
];

// Message word permutation schedule for the 12 rounds (rounds 10-11 repeat rounds 0-1).
const SIGMA: readonly number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
  [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
  [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
  [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
  [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
  [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
  [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
  [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
  [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
];

function rotr64(x: bigint, n: bigint): bigint {
  return ((x >> n) | (x << (64n - n))) & MASK64;
}

function readU64LE(buf: Uint8Array, offset: number): bigint {
  let v = 0n;
  for (let i = 7; i >= 0; i--) {
    v = (v << 8n) | BigInt(buf[offset + i]);
  }
  return v;
}

/**
 * The BLAKE2b mixing function G: four adds, four xors, four rotates per call
 * (the same Add-Rotate-XOR "quarter round" skeleton ChaCha20 popularized).
 * Exported so the UI can show a live, real execution trace of one call.
 */
export function mixG(
  a: bigint, b: bigint, c: bigint, d: bigint, x: bigint, y: bigint,
): [bigint, bigint, bigint, bigint] {
  a = (a + b + x) & MASK64;
  d = rotr64(d ^ a, 32n);
  c = (c + d) & MASK64;
  b = rotr64(b ^ c, 24n);
  a = (a + b + y) & MASK64;
  d = rotr64(d ^ a, 16n);
  c = (c + d) & MASK64;
  b = rotr64(b ^ c, 63n);
  return [a, b, c, d];
}

function compress(h: bigint[], block: Uint8Array, t: bigint, isFinal: boolean): void {
  const m = new Array<bigint>(16);
  for (let i = 0; i < 16; i++) m[i] = readU64LE(block, i * 8);

  const v = new Array<bigint>(16);
  for (let i = 0; i < 8; i++) v[i] = h[i];
  for (let i = 0; i < 8; i++) v[8 + i] = IV[i];

  v[12] ^= t & MASK64;
  // v[13] would carry the high 64 bits of the byte counter; Argon2 never
  // hashes more than 2^64 bytes in one call, so it is always left at 0.
  if (isFinal) v[14] = ~v[14] & MASK64;

  for (let round = 0; round < 12; round++) {
    const s = SIGMA[round];
    [v[0], v[4], v[8], v[12]] = mixG(v[0], v[4], v[8], v[12], m[s[0]], m[s[1]]);
    [v[1], v[5], v[9], v[13]] = mixG(v[1], v[5], v[9], v[13], m[s[2]], m[s[3]]);
    [v[2], v[6], v[10], v[14]] = mixG(v[2], v[6], v[10], v[14], m[s[4]], m[s[5]]);
    [v[3], v[7], v[11], v[15]] = mixG(v[3], v[7], v[11], v[15], m[s[6]], m[s[7]]);
    [v[0], v[5], v[10], v[15]] = mixG(v[0], v[5], v[10], v[15], m[s[8]], m[s[9]]);
    [v[1], v[6], v[11], v[12]] = mixG(v[1], v[6], v[11], v[12], m[s[10]], m[s[11]]);
    [v[2], v[7], v[8], v[13]] = mixG(v[2], v[7], v[8], v[13], m[s[12]], m[s[13]]);
    [v[3], v[4], v[9], v[14]] = mixG(v[3], v[4], v[9], v[14], m[s[14]], m[s[15]]);
  }

  for (let i = 0; i < 8; i++) {
    h[i] = (h[i] ^ v[i] ^ v[8 + i]) & MASK64;
  }
}

/** Plain BLAKE2b, unkeyed, digest length 1..64 bytes. */
export function blake2b(input: Uint8Array, outLen: number): Uint8Array {
  if (outLen < 1 || outLen > 64) throw new Error('blake2b: outLen must be in [1,64]');

  const h = IV.slice() as bigint[];
  h[0] = (h[0] ^ 0x01010000n ^ BigInt(outLen)) & MASK64;

  const blockSize = 128;
  let t = 0n;
  let offset = 0;
  const len = input.length;

  if (len === 0) {
    compress(h, new Uint8Array(blockSize), 0n, true);
  } else {
    while (offset < len) {
      const remaining = len - offset;
      const isLast = remaining <= blockSize;
      const chunkLen = isLast ? remaining : blockSize;
      const block = new Uint8Array(blockSize);
      block.set(input.subarray(offset, offset + chunkLen));
      t += BigInt(chunkLen);
      compress(h, block, t, isLast);
      offset += chunkLen;
    }
  }

  const out = new Uint8Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const word = h[i >> 3];
    const shift = BigInt((i & 7) * 8);
    out[i] = Number((word >> shift) & 0xffn);
  }
  return out;
}

function concatBytes(...chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

export function le32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  b[2] = (n >>> 16) & 0xff;
  b[3] = (n >>> 24) & 0xff;
  return b;
}

/**
 * Argon2's variable-length hash H'^T(A): chains BLAKE2b-512 calls in 32-byte
 * steps so it can produce outputs far longer than BLAKE2b's native 64-byte
 * limit (needed for 1024-byte memory blocks).
 */
export function hPrime(input: Uint8Array, outLen: number): Uint8Array {
  if (outLen <= 64) {
    return blake2b(concatBytes(le32(outLen), input), outLen);
  }

  const out = new Uint8Array(outLen);
  let v = blake2b(concatBytes(le32(outLen), input), 64);
  out.set(v.subarray(0, 32), 0);
  let filled = 32;

  while (outLen - filled > 64) {
    v = blake2b(v, 64);
    out.set(v.subarray(0, 32), filled);
    filled += 32;
  }

  const last = blake2b(v, outLen - filled);
  out.set(last, filled);
  return out;
}

export { concatBytes };
