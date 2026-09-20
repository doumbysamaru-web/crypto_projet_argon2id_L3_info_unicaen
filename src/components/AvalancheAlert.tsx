import { Flame } from 'lucide-react';

export function AvalancheAlert({ flash }: { flash: { changed: number; total: number } | null }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3">
      <Flame size={20} className="shrink-0 text-danger" />
      <p className="text-base leading-snug text-ink">
        {flash ? (
          <>
            <span className="font-semibold text-danger">{flash.changed}/{flash.total} blocs</span> ont
            entièrement changé — effet avalanche.
          </>
        ) : (
          <>Changez une lettre du mot de passe : tous les blocs dérivés changeront instantanément.</>
        )}
      </p>
    </div>
  );
}
