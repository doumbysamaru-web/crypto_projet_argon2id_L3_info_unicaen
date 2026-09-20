import {
  CLASSIC_HASH_MEMORY_KIB, CLASSIC_HASH_MS, estimateArgon2Ms, formatKiB, formatMs, formatRatio,
} from '../lib/costModel.ts';

export function ComparisonPanel({ mPrime, t, p }: { mPrime: number; t: number; p: number }) {
  const argon2Ms = estimateArgon2Ms(mPrime, t, p);
  const sha256Ms = CLASSIC_HASH_MS['SHA-256'];
  const sha3Ms = CLASSIC_HASH_MS['SHA-3-256'];

  return (
    <div className="flex shrink-0 items-center gap-8 border-b border-edge px-6 py-4">
      <Stat name="Argon2id" time={formatMs(argon2Ms)} memory={formatKiB(mPrime)} tone="text-signal" />
      <div className="h-8 w-px bg-edge" />
      <Stat name="SHA-256" time={formatMs(sha256Ms)} memory={formatKiB(CLASSIC_HASH_MEMORY_KIB)} tone="text-ink-muted" />
      <Stat name="SHA-3-256" time={formatMs(sha3Ms)} memory={formatKiB(CLASSIC_HASH_MEMORY_KIB)} tone="text-ink-muted" />
      <p className="ml-auto text-lg text-ink-muted">
        <span className="font-mono font-semibold text-danger">{formatRatio(argon2Ms, sha256Ms)}</span> plus coûteux qu&apos;un simple SHA-256
      </p>
    </div>
  );
}

function Stat({
  name, time, memory, tone,
}: { name: string; time: string; memory: string; tone: string }) {
  return (
    <div>
      <p className={`text-sm font-medium ${tone}`}>{name}</p>
      <p className="font-mono text-lg text-ink">{time} <span className="text-ink-muted">· {memory}</span></p>
    </div>
  );
}
