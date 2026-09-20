import type { Argon2Layout, TraceStep } from '../lib/argon2.ts';
import { toHex } from '../lib/argon2.ts';
import { AvalancheAlert } from './AvalancheAlert.tsx';
import { Highlight } from './Highlight.tsx';

function Formula({ children }: { children: string }) {
  return (
    <p className="overflow-x-auto whitespace-pre font-mono text-base leading-relaxed text-ink">
      {children}
    </p>
  );
}

function Value({ value }: { value: string }) {
  return <p className="break-all font-mono text-base leading-relaxed text-signal">{value}</p>;
}

function Eyebrow({ children }: { children: string }) {
  return <p className="text-sm font-medium tracking-wide text-ink-muted">{children}</p>;
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
    <div className="flex h-full flex-col gap-6 overflow-y-auto rounded-2xl border border-edge bg-surface p-6">
      {!step ? null : (
        <StepContent
          step={step}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          layout={layout}
          password={password}
          salt={salt}
        />
      )}
      <div className="mt-auto">
        <AvalancheAlert flash={flash} />
      </div>
    </div>
  );
}

function StepContent({
  step, stepIndex, totalSteps, layout, password, salt,
}: Omit<PanelProps, 'flash'> & { step: TraceStep }) {
  const eyebrow = `Étape ${stepIndex + 1} / ${totalSteps}`;

  if (step.kind === 'h0') {
    return (
      <div className="space-y-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="text-3xl font-semibold tracking-tight">Initialisation</h2>
        <p className="text-lg leading-relaxed text-ink-muted">
          <Highlight tone="pass">{password || '(vide)'}</Highlight> et{' '}
          <Highlight tone="salt">{salt || '(vide)'}</Highlight> sont condensés en un hash de 64 octets, H0.
          Tout le reste — des mégaoctets de blocs — en dérive.
        </p>
        <Formula>{'H0 = BLAKE2b-512(paramètres ‖ P ‖ S)'}</Formula>
        <Value value={`${toHex(step.h0!, 22)}…`} />
      </div>
    );
  }

  if (step.kind === 'init') {
    return (
      <div className="space-y-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="text-3xl font-semibold tracking-tight">
          Bloc dérivé <span className="text-ink-muted">— lane {step.lane}, col. {step.col}</span>
        </h2>
        <p className="text-lg leading-relaxed text-ink-muted">
          Les deux premiers blocs de chaque lane viennent directement de H0.
        </p>
        <Formula>{`B[${step.lane}][${step.col}] = H'(H0, ${step.col}, ${step.lane})`}</Formula>
        <Value value={`${toHex(step.newBlock!, 22)}…`} />
      </div>
    );
  }

  if (step.kind === 'fill') {
    const modeIsI = step.addressing === 'i';
    return (
      <div className="space-y-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="text-3xl font-semibold tracking-tight">
          Passe {step.pass} <span className="text-ink-muted">— B[{step.lane}][{step.col}]</span>
        </h2>
        <Highlight tone={modeIsI ? 'ref' : 'warn'}>
          {modeIsI ? 'Argon2i — déterministe' : 'Argon2d — dépend des données'}
        </Highlight>
        <Formula>
          {`B[i][j] = G( B[i][j-1], B[l][z] )${step.pass! > 0 ? ' ⊕ ancien' : ''}`}
        </Formula>
        <p className="text-base text-ink-muted">
          G mélange ses deux blocs avec la même construction « quart de tour » (ARX) que ChaCha20.
        </p>
        <Value value={`${toHex(step.newBlock!, 22)}…`} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-3xl font-semibold tracking-tight">Tag final</h2>
      <p className="text-lg leading-relaxed text-ink-muted">
        La dernière colonne de chaque lane est XORée, puis condensée : c&apos;est le hash Argon2id.
      </p>
      <Formula>{`C = ⊕ B[·][${layout.laneLength - 1}]   →   Tag = H'(C)`}</Formula>
      <Value value={toHex(step.tag!)} />
    </div>
  );
}
