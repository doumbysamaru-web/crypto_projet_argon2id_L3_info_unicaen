import { ShieldCheck, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  CLASSIC_HASH_MEMORY_KIB, CLASSIC_HASH_MS, estimateArgon2Ms, formatKiB, formatMs, formatRatio,
} from '../lib/costModel.ts';

export function ComparisonPanel({ mPrime, t, p }: { mPrime: number; t: number; p: number }) {
  const argon2Ms = estimateArgon2Ms(mPrime, t, p);
  const sha256Ms = CLASSIC_HASH_MS['SHA-256'];
  const sha3Ms = CLASSIC_HASH_MS['SHA-3-256'];

  return (
    <div className="flex shrink-0 items-stretch gap-3 border-b border-slate-800/80 bg-black/20 px-4 py-1.5">
      <Tile
        icon={<ShieldCheck size={15} className="text-emerald-400" />}
        name="Argon2id"
        time={formatMs(argon2Ms)}
        memory={formatKiB(mPrime)}
        note="recommandé pour les mots de passe"
        tone="border-emerald-500/30 bg-emerald-400/5"
        nameTone="text-emerald-300"
      />
      <Tile
        icon={<TriangleAlert size={15} className="text-slate-400" />}
        name="SHA-256"
        time={formatMs(sha256Ms)}
        memory={formatKiB(CLASSIC_HASH_MEMORY_KIB)}
        note="non memory-hard — à éviter seul"
        tone="border-slate-700 bg-slate-900/40"
        nameTone="text-slate-300"
      />
      <Tile
        icon={<TriangleAlert size={15} className="text-slate-400" />}
        name="SHA-3-256"
        time={formatMs(sha3Ms)}
        memory={formatKiB(CLASSIC_HASH_MEMORY_KIB)}
        note="non memory-hard — à éviter seul"
        tone="border-slate-700 bg-slate-900/40"
        nameTone="text-slate-300"
      />
      <div className="flex flex-1 items-center justify-end gap-4 pr-1 text-right">
        <div>
          <p className="text-[9px] uppercase tracking-wide text-slate-500">coût relatif (illustratif)</p>
          <p className="font-mono text-sm font-semibold text-rose-300">
            {formatRatio(argon2Ms, sha256Ms)} plus cher qu&apos;un SHA-256
          </p>
        </div>
      </div>
    </div>
  );
}

function Tile({
  icon, name, time, memory, note, tone, nameTone,
}: {
  icon: ReactNode; name: string; time: string; memory: string; note: string; tone: string; nameTone: string;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-md border px-2.5 py-1 ${tone}`}>
      {icon}
      <div className="leading-tight">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-[11px] font-semibold ${nameTone}`}>{name}</span>
          <span className="font-mono text-[11px] text-slate-200">{time}</span>
          <span className="font-mono text-[10px] text-slate-500">· {memory}</span>
        </div>
        <p className="text-[9px] text-slate-500">{note}</p>
      </div>
    </div>
  );
}
