import { Flame, Sparkles } from 'lucide-react';

export function AvalancheAlert({ flash }: { flash: { changed: number; total: number } | null }) {
  return (
    <div className="animate-border-glow shrink-0 rounded-lg border border-rose-400/60 bg-rose-500/10 px-3 py-2">
      <div className="flex items-start gap-2">
        <Flame size={16} className="mt-0.5 shrink-0 text-rose-300" />
        <p className="text-[11px] leading-snug text-rose-100">
          <span className="font-semibold">Effet avalanche —</span>{' '}
          changez ne serait-ce qu&apos;<span className="underline decoration-rose-300/60">une seule lettre</span>{' '}
          du mot de passe (ou du sel) ci-dessus : tous les blocs dérivés changeront intégralement et instantanément.
        </p>
      </div>
      {flash && (
        <div className="mt-1.5 flex items-center gap-1.5 border-t border-rose-400/30 pt-1.5 text-[11px] font-medium text-emerald-300">
          <Sparkles size={13} />
          Détecté : {flash.changed}/{flash.total} blocs initiaux ont entièrement changé après votre modification.
        </div>
      )}
    </div>
  );
}
