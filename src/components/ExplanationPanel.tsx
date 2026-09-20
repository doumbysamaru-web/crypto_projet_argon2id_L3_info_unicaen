import { Compass } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Argon2Layout, TraceStep } from '../lib/argon2.ts';
import { toHex, word64Hex } from '../lib/argon2.ts';
import { AvalancheAlert } from './AvalancheAlert.tsx';
import { Highlight } from './Highlight.tsx';

function Formula({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded border border-slate-800 bg-black/50 px-2 py-1.5 font-mono text-[11px] text-slate-300 whitespace-pre">
      {children}
    </div>
  );
}

function Hex({ value, tone = 'text-slate-200' }: { value: string; tone?: string }) {
  return <span className={`block break-all font-mono text-[11px] leading-relaxed ${tone}`}>{value}</span>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

interface PanelProps {
  step: TraceStep | null;
  stepIndex: number;
  totalSteps: number;
  layout: Argon2Layout;
  password: string;
  salt: string;
  flash: { changed: number; total: number } | null;
}

export function ExplanationPanel({
  step, stepIndex, totalSteps, layout, password, salt, flash,
}: PanelProps) {
  return (
    <div className="flex h-full flex-col gap-2.5 overflow-hidden">
      <div className="shrink-0 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-[11px] leading-snug text-slate-400">
        <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-300">
          <Compass size={13} className="text-slate-400" />
          Sélection du bloc de référence — Argon2id combine deux modes
        </div>
        <p>
          <Highlight tone="ref">Argon2i</Highlight> tranches 0-1 de la passe 0 : adresse{' '}
          <span className="text-slate-300">déterministe</span>, indépendante des données (résiste au cache-timing).
        </p>
        <p>
          <Highlight tone="warn">Argon2d</Highlight> tranches 2-3, et toutes les passes suivantes : adresse{' '}
          <span className="text-slate-300">dépendante des données</span> déjà écrites (résiste aux compromis temps-mémoire).
        </p>
      </div>

      <AvalancheAlert flash={flash} />

      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/30 p-3">
        {!step ? (
          <p className="text-xs text-slate-500">Aucune étape sélectionnée.</p>
        ) : (
          <StepContent
            step={step}
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            layout={layout}
            password={password}
            salt={salt}
          />
        )}
      </div>
    </div>
  );
}

function StepContent({
  step, stepIndex, totalSteps, layout, password, salt,
}: Omit<PanelProps, 'flash'> & { step: TraceStep }) {
  const badge = `Étape ${stepIndex + 1} / ${totalSteps}`;

  if (step.kind === 'h0') {
    return (
      <div className="space-y-3">
        <Header badge={badge} title="Initialisation — hachage préliminaire H0" />
        <p className="text-[12px] leading-relaxed text-slate-300">
          Argon2 condense tous les paramètres, le mot de passe et le sel en un hash initial de 64
          octets avec BLAKE2b-512. C&apos;est la seule étape qui touche directement le{' '}
          <Highlight tone="pass">mot de passe</Highlight> et le <Highlight tone="salt">sel</Highlight> en clair —
          tout le reste (des mégaoctets de blocs) en dérive.
        </p>
        <Formula>
          {'H0 = BLAKE2b-512( p ‖ T ‖ m ‖ t ‖ v ‖ y\n'}
          {'            ‖ len(P) ‖ '}<Highlight tone="pass">P</Highlight>{'\n'}
          {'            ‖ len(S) ‖ '}<Highlight tone="salt">S</Highlight>{'\n'}
          {'            ‖ len(K) ‖ K ‖ len(X) ‖ X )'}
        </Formula>
        <p className="text-[11px] text-slate-400">
          avec <Highlight tone="ref">P</Highlight> = <Highlight tone="pass">{password || '(vide)'}</Highlight>
          {'  et  '}
          <Highlight tone="ref">S</Highlight> = <Highlight tone="salt">{salt || '(vide)'}</Highlight>
        </p>
        <Section title="Mémoire effective m′ / grille">
          <p className="text-[11px] text-slate-400">
            m′ = {layout.mPrime} Ko → {layout.mPrime / layout.laneLength} lane(s) × {layout.laneLength} colonnes,
            découpées en 4 tranches (slices) de {layout.segmentLength} colonnes.
          </p>
        </Section>
        <Section title="H0 calculé (64 octets), tronqué">
          <Hex value={`${toHex(step.h0!, 24)}…`} tone="text-cyan-200" />
        </Section>
      </div>
    );
  }

  if (step.kind === 'init') {
    return (
      <div className="space-y-3">
        <Header badge={badge} title={`Bloc dérivé — lane ${step.lane}, colonne ${step.col}`} />
        <p className="text-[12px] leading-relaxed text-slate-300">
          Chaque lane démarre avec deux blocs de 1024 octets, dérivés de H0 par H&apos;, l&apos;extension
          de BLAKE2b à longueur variable (nécessaire car un bloc dépasse la sortie native de 64 octets
          de BLAKE2b).
        </p>
        <Formula>
          {'B[i][0] = H\'¹⁰²⁴( H0 ‖ LE32(0) ‖ LE32(i) )\n'}
          {'B[i][1] = H\'¹⁰²⁴( H0 ‖ LE32(1) ‖ LE32(i) )'}
        </Formula>
        <Section title={`Résultat — B[${step.lane}][${step.col}] (tronqué)`}>
          <Hex value={`${toHex(step.newBlock!, 24)}…`} tone="text-emerald-200" />
        </Section>
      </div>
    );
  }

  if (step.kind === 'fill') {
    const modeIsI = step.addressing === 'i';
    return (
      <div className="space-y-3">
        <Header
          badge={badge}
          title={`Passe ${step.pass} · Slice ${step.slice} · B[${step.lane}][${step.col}]`}
        />

        <Section title="1 — Sélection du bloc de référence">
          <p className="text-[12px] leading-relaxed text-slate-300">
            Mode{' '}
            <Highlight tone={modeIsI ? 'ref' : 'warn'}>{modeIsI ? 'Argon2i (déterministe)' : 'Argon2d (dépendant des données)'}</Highlight>
            {' '}
            {modeIsI
              ? "— l'adresse provient d'un bloc d'adresses pseudo-aléatoire, généré par G à partir d'un compteur (pass, lane, slice, compteur), sans dépendre du contenu déjà écrit."
              : "— l'adresse provient directement des 64 premiers bits du bloc précédent de cette lane : J1 (32 bits bas) et J2 (32 bits haut)."}
          </p>
          {step.addr && (
            <Formula>
              {`J1 = 0x${step.addr.j1.toString(16).padStart(8, '0')}   J2 = 0x${step.addr.j2.toString(16).padStart(8, '0')}\n`}
              {`lane référence l = ${step.ref!.sameLane ? 'i (même lane, imposé)' : `J2 mod p = ${step.ref!.lane}`}\n`}
              {`colonne référence z = index_alpha(...) = ${step.ref!.col}`}
            </Formula>
          )}
          <p className="text-[11px] text-slate-400">
            → bloc de référence choisi : <Highlight tone="ref">lane {step.ref!.lane}, colonne {step.ref!.col}</Highlight>
            {step.ref!.sameLane ? ' (même lane)' : ' (lane différente, tranche déjà complète)'}
          </p>
        </Section>

        <Section title="2 — Fonction de compression G">
          <p className="text-[12px] leading-relaxed text-slate-300">
            G XORe ses deux blocs d&apos;entrée (128 mots de 64 bits), applique la permutation P sur
            les 8 lignes puis sur les 8 colonnes de la matrice résultante, et XORe le tout avec le
            résultat du premier XOR. Chaque P enchaîne 8 appels à GB — le même squelette{' '}
            <span className="text-slate-200">Addition-Rotation-XOR (« quart de tour »)</span> popularisé
            par <span className="text-slate-200">ChaCha20</span> et repris par BLAKE2b — auquel Argon2
            ajoute une multiplication 32×32→64 bits pour accentuer la diffusion.
          </p>
          <Formula>
            {`B[i][j] = G( B[i][j-1], B[l][z] )${step.pass! > 0 ? ' ⊕ B[i][j]_ancien' : ''}`}
          </Formula>
          {step.gDemo && (
            <Formula>
              {`GB(a,b,c,d) sur les mots v[${step.gDemo.indices.join(', ')}] du bloc mélangé :\n`}
              {`  avant : a=${word64Hex(step.gDemo.before[0])} b=${word64Hex(step.gDemo.before[1])}\n`}
              {`          c=${word64Hex(step.gDemo.before[2])} d=${word64Hex(step.gDemo.before[3])}\n`}
              {`  après : a=${word64Hex(step.gDemo.after[0])} b=${word64Hex(step.gDemo.after[1])}\n`}
              {`          c=${word64Hex(step.gDemo.after[2])} d=${word64Hex(step.gDemo.after[3])}`}
            </Formula>
          )}
          {step.pass! > 0 && (
            <p className="text-[11px] text-slate-400">
              Passe {step.pass} &gt; 0 : le résultat est en plus XORé avec l&apos;ancienne valeur de cet
              emplacement (règle v1.3) — la case n&apos;est donc jamais un simple remplacement, mais un
              mélange cumulatif de tout son historique.
            </p>
          )}
        </Section>

        <Section title={`Résultat — B[${step.lane}][${step.col}] (tronqué)`}>
          <Hex value={`${toHex(step.newBlock!, 24)}…`} tone="text-emerald-200" />
        </Section>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Header badge={badge} title="Étape finale — calcul du tag" />
      <p className="text-[12px] leading-relaxed text-slate-300">
        La dernière colonne de chaque lane (colonne {layout.laneLength - 1}) est XORée pour former le
        bloc final C, puis condensée par H&apos; à la longueur de sortie voulue : c&apos;est le hash Argon2id.
      </p>
      <Formula>
        {`C = B[0][${layout.laneLength - 1}] ⊕ B[1][${layout.laneLength - 1}] ⊕ … ⊕ B[p-1][${layout.laneLength - 1}]\n`}
        {'Tag = H\'ᵀ( C )'}
      </Formula>
      <Section title="Tag final (32 octets)">
        <Hex value={toHex(step.tag!)} tone="text-emerald-300" />
      </Section>
    </div>
  );
}

function Header({ badge, title }: { badge: string; title: string }) {
  return (
    <div>
      <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600">{badge}</span>
      <h2 className="text-[13px] font-semibold text-slate-100">{title}</h2>
    </div>
  );
}
