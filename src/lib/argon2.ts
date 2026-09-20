/**
 * A real, from-scratch Argon2 (d / i / id) engine, built on the BLAKE2b
 * primitives in ./blake2b. It follows RFC 9106 directly (H0, the H'
 * variable-length hash, the block compression function G, the Argon2i /
 * Argon2d addressing rules, and the pass/slice/segment fill loop) and is
 * validated against the RFC's official known-answer test vectors — see
 * argon2.test.ts. It is not a hardened, side-channel-resistant
 * implementation; it exists to make every intermediate value inspectable
 * for the visualizer.
 */
import { blake2b, hPrime, le32, concatBytes } from './blake2b.ts';

const MASK64 = (1n << 64n) - 1n;
const M32 = 0xffffffffn;

export type Argon2Type = 0 | 1 | 2; // 0=Argon2d, 1=Argon2i, 2=Argon2id

function rotr64(x: bigint, n: bigint): bigint {
  return ((x >> n) | (x << (64n - n))) & MASK64;
}
function lo32(x: bigint): bigint {
  return x & M32;
}

/**
 * Argon2's block-mixing primitive GB: the same Add-Rotate-XOR "quarter
 * round" skeleton ChaCha20 popularized (and BLAKE2b reused), with one
 * extra 32x32->64 multiplication folded into each addition for stronger,
 * cheaper-to-verify diffusion.
 */
export function argonGB(
  a: bigint, b: bigint, c: bigint, d: bigint,
): [bigint, bigint, bigint, bigint] {
  a = (a + b + 2n * lo32(a) * lo32(b)) & MASK64;
  d = rotr64(d ^ a, 32n);
  c = (c + d + 2n * lo32(c) * lo32(d)) & MASK64;
  b = rotr64(b ^ c, 24n);
  a = (a + b + 2n * lo32(a) * lo32(b)) & MASK64;
  d = rotr64(d ^ a, 16n);
  c = (c + d + 2n * lo32(c) * lo32(d)) & MASK64;
  b = rotr64(b ^ c, 63n);
  return [a, b, c, d];
}

export interface GDemo {
  /** Which four of the block's 128 words this call mixed. */
  indices: [number, number, number, number];
  before: [bigint, bigint, bigint, bigint];
  after: [bigint, bigint, bigint, bigint];
}

function permuteP(v: bigint[], base: number, capture?: GDemo): void {
  const apply = (i0: number, i1: number, i2: number, i3: number, record: boolean) => {
    if (record && capture) capture.before = [v[i0], v[i1], v[i2], v[i3]];
    const [a, b, c, d] = argonGB(v[i0], v[i1], v[i2], v[i3]);
    v[i0] = a; v[i1] = b; v[i2] = c; v[i3] = d;
    if (record && capture) {
      capture.after = [a, b, c, d];
      capture.indices = [base + i0, base + i1, base + i2, base + i3];
    }
  };
  apply(0, 4, 8, 12, true);
  apply(1, 5, 9, 13, false);
  apply(2, 6, 10, 14, false);
  apply(3, 7, 11, 15, false);
  apply(0, 5, 10, 15, false);
  apply(1, 6, 11, 12, false);
  apply(2, 7, 8, 13, false);
  apply(3, 4, 9, 14, false);
}

/** The compression function G(X, Y): XOR, then permutation P over rows then columns of the 8x8 register matrix, then XOR with the pre-permutation value. */
function blockCompress(X: bigint[], Y: bigint[], wantDemo: boolean): { words: bigint[]; demo?: GDemo } {
  const R = new Array<bigint>(128);
  for (let i = 0; i < 128; i++) R[i] = X[i] ^ Y[i];

  const Z = R.slice();
  const demo: GDemo | undefined = wantDemo
    ? { indices: [0, 4, 8, 12], before: [0n, 0n, 0n, 0n], after: [0n, 0n, 0n, 0n] }
    : undefined;

  for (let row = 0; row < 8; row++) {
    const seg = Z.slice(row * 16, row * 16 + 16);
    permuteP(seg, row * 16, row === 0 ? demo : undefined);
    for (let k = 0; k < 16; k++) Z[row * 16 + k] = seg[k];
  }

  for (let col = 0; col < 8; col++) {
    const seg = new Array<bigint>(16);
    for (let row = 0; row < 8; row++) {
      seg[2 * row] = Z[row * 16 + 2 * col];
      seg[2 * row + 1] = Z[row * 16 + 2 * col + 1];
    }
    permuteP(seg, -1);
    for (let row = 0; row < 8; row++) {
      Z[row * 16 + 2 * col] = seg[2 * row];
      Z[row * 16 + 2 * col + 1] = seg[2 * row + 1];
    }
  }

  const out = new Array<bigint>(128);
  for (let i = 0; i < 128; i++) out[i] = Z[i] ^ R[i];
  return { words: out, demo };
}

function bytesToWords(bytes: Uint8Array): bigint[] {
  const words = new Array<bigint>(128);
  for (let i = 0; i < 128; i++) {
    let v = 0n;
    for (let k = 7; k >= 0; k--) v = (v << 8n) | BigInt(bytes[i * 8 + k]);
    words[i] = v;
  }
  return words;
}

function wordsToBytes(words: bigint[]): Uint8Array {
  const out = new Uint8Array(1024);
  for (let i = 0; i < 128; i++) {
    let v = words[i];
    for (let k = 0; k < 8; k++) {
      out[i * 8 + k] = Number(v & 0xffn);
      v >>= 8n;
    }
  }
  return out;
}

/** uint32-wrapping subtract/compute, mirroring the reference C implementation's index_alpha. */
function indexAlpha(
  pass: number, slice: number, index: number,
  laneLength: number, segmentLength: number,
  pseudoRandLow32: bigint, sameLane: boolean,
): number {
  let referenceAreaSize: bigint;
  if (pass === 0) {
    if (slice === 0) {
      referenceAreaSize = (BigInt(index) - 1n) & M32;
    } else if (sameLane) {
      referenceAreaSize = (BigInt(slice * segmentLength + index) - 1n) & M32;
    } else {
      referenceAreaSize = index === 0
        ? (BigInt(slice * segmentLength) - 1n) & M32
        : BigInt(slice * segmentLength) & M32;
    }
  } else if (sameLane) {
    referenceAreaSize = (BigInt(laneLength - segmentLength + index) - 1n) & M32;
  } else {
    referenceAreaSize = index === 0
      ? (BigInt(laneLength - segmentLength) - 1n) & M32
      : BigInt(laneLength - segmentLength) & M32;
  }

  const x = (pseudoRandLow32 * pseudoRandLow32) >> 32n;
  const relativePosition = (referenceAreaSize - 1n - ((referenceAreaSize * x) >> 32n)) & M32;

  const startPosition = pass === 0 ? 0 : (slice === 3 ? 0 : (slice + 1) * segmentLength);
  return Number((BigInt(startPosition) + relativePosition) % BigInt(laneLength));
}

function makeAddressGenerator(
  pass: number, lane: number, slice: number, totalBlocks: number, totalPasses: number, type: Argon2Type,
) {
  let counter = 0n;
  let addressBlock: bigint[] = [];
  let pos = 128;

  function regenerate() {
    counter += 1n;
    const zero = new Array<bigint>(128).fill(0n);
    const inputBlock = new Array<bigint>(128).fill(0n);
    inputBlock[0] = BigInt(pass);
    inputBlock[1] = BigInt(lane);
    inputBlock[2] = BigInt(slice);
    inputBlock[3] = BigInt(totalBlocks);
    inputBlock[4] = BigInt(totalPasses);
    inputBlock[5] = BigInt(type);
    inputBlock[6] = counter;
    const first = blockCompress(zero, inputBlock, false).words;
    addressBlock = blockCompress(zero, first, false).words;
    pos = 0;
  }

  return {
    next(): bigint {
      if (pos >= 128) regenerate();
      return addressBlock[pos++];
    },
  };
}

export interface Argon2Params {
  password: Uint8Array;
  salt: Uint8Array;
  secret?: Uint8Array;
  ad?: Uint8Array;
  /** Memory cost in KiB; rounded down to a multiple of 4*lanes. */
  m: number;
  /** Iterations (passes over memory). */
  t: number;
  /** Parallelism (lanes). */
  p: number;
  tagLength?: number;
  type?: Argon2Type;
}

export interface TraceStep {
  kind: 'h0' | 'init' | 'fill' | 'final';
  pass?: number;
  lane?: number;
  col?: number;
  slice?: number;
  index?: number;
  addressing?: 'i' | 'd';
  ref?: { lane: number; col: number; sameLane: boolean };
  addr?: { pseudoRand: bigint; j1: bigint; j2: bigint };
  /** Value at (lane, col) just before this step; null means the cell was untouched memory. */
  prevBlock?: Uint8Array | null;
  newBlock?: Uint8Array;
  gDemo?: GDemo;
  h0?: Uint8Array;
  tag?: Uint8Array;
}

export interface Argon2Layout {
  mPrime: number;
  laneLength: number; // columns per lane (q)
  segmentLength: number; // q / 4
}

export function computeLayout(m: number, p: number): Argon2Layout {
  const mPrime = Math.max(4 * p, Math.floor(m / (4 * p)) * 4 * p);
  const laneLength = mPrime / p;
  return { mPrime, laneLength, segmentLength: laneLength / 4 };
}

export function buildArgon2Trace(params: Argon2Params): TraceStep[] {
  const { password, salt } = params;
  const secret = params.secret ?? new Uint8Array(0);
  const ad = params.ad ?? new Uint8Array(0);
  const p = params.p;
  const tPasses = params.t;
  const type: Argon2Type = params.type ?? 2;
  const tagLength = params.tagLength ?? 32;
  const { mPrime, laneLength: q, segmentLength } = computeLayout(params.m, p);

  const h0Bytes = blake2b(
    concatBytes(
      le32(p), le32(tagLength), le32(mPrime), le32(tPasses), le32(0x13), le32(type),
      le32(password.length), password,
      le32(salt.length), salt,
      le32(secret.length), secret,
      le32(ad.length), ad,
    ),
    64,
  );

  const steps: TraceStep[] = [{ kind: 'h0', h0: h0Bytes }];

  const blocks: bigint[][][] = Array.from({ length: p }, () =>
    Array.from({ length: q }, () => new Array<bigint>(128).fill(0n)));

  for (let lane = 0; lane < p; lane++) {
    for (let col = 0; col < 2; col++) {
      const bytes = hPrime(concatBytes(h0Bytes, le32(col), le32(lane)), 1024);
      blocks[lane][col] = bytesToWords(bytes);
      steps.push({ kind: 'init', lane, col, prevBlock: null, newBlock: bytes });
    }
  }

  for (let pass = 0; pass < tPasses; pass++) {
    for (let slice = 0; slice < 4; slice++) {
      const dataIndependent = type === 1 || (type === 2 && pass === 0 && slice < 2);
      const generators = dataIndependent
        ? Array.from({ length: p }, (_, lane) => makeAddressGenerator(pass, lane, slice, mPrime, tPasses, type))
        : null;

      for (let index = 0; index < segmentLength; index++) {
        for (let lane = 0; lane < p; lane++) {
          const col = slice * segmentLength + index;
          if (pass === 0 && col < 2) continue;

          const prevCol = col === 0 ? q - 1 : col - 1;
          const prevWords = blocks[lane][prevCol];

          const pseudoRand = dataIndependent ? generators![lane].next() : prevWords[0];
          const j1 = pseudoRand & M32;
          const j2 = (pseudoRand >> 32n) & M32;

          const refLane = pass === 0 && slice === 0 ? lane : Number(j2 % BigInt(p));
          const sameLane = refLane === lane;
          const refCol = indexAlpha(pass, slice, index, q, segmentLength, j1, sameLane);

          const refWords = blocks[refLane][refCol];
          const oldWords = blocks[lane][col];
          const prevBlockSnapshot = pass === 0 ? null : wordsToBytes(oldWords);

          const { words: mixed, demo } = blockCompress(prevWords, refWords, true);

          const finalWords = pass === 0
            ? mixed
            : mixed.map((w, i) => w ^ oldWords[i]);

          blocks[lane][col] = finalWords;

          steps.push({
            kind: 'fill',
            pass, lane, col, slice, index,
            addressing: dataIndependent ? 'i' : 'd',
            ref: { lane: refLane, col: refCol, sameLane },
            addr: { pseudoRand, j1, j2 },
            prevBlock: prevBlockSnapshot,
            newBlock: wordsToBytes(finalWords),
            gDemo: demo,
          });
        }
      }
    }
  }

  const finalWords = new Array<bigint>(128).fill(0n);
  for (let lane = 0; lane < p; lane++) {
    const w = blocks[lane][q - 1];
    for (let i = 0; i < 128; i++) finalWords[i] ^= w[i];
  }
  const tag = hPrime(wordsToBytes(finalWords), tagLength);
  steps.push({ kind: 'final', tag });

  return steps;
}

export function toHex(bytes: Uint8Array, maxBytes?: number): string {
  const slice = maxBytes ? bytes.subarray(0, maxBytes) : bytes;
  return Array.from(slice).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function word64Hex(w: bigint): string {
  return w.toString(16).padStart(16, '0');
}
