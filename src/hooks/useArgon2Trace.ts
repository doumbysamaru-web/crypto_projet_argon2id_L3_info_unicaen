import { useEffect, useMemo, useState } from 'react';
import { buildArgon2Trace, computeLayout, type Argon2Layout, type TraceStep } from '../lib/argon2.ts';

export interface TraceResult {
  trace: TraceStep[];
  layout: Argon2Layout;
  /** Real, measured time this browser took to compute the whole trace (ms). */
  computeMs: number;
  /** True while waiting on the debounce before a recompute. */
  isPending: boolean;
}

interface Inputs {
  password: string;
  salt: string;
  m: number;
  t: number;
  p: number;
  tagLength: number;
}

const encoder = new TextEncoder();

export function useArgon2Trace(inputs: Inputs, debounceMs = 200): TraceResult {
  const [debounced, setDebounced] = useState(inputs);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setIsPending(true);
    const id = setTimeout(() => setDebounced(inputs), debounceMs);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs.password, inputs.salt, inputs.m, inputs.t, inputs.p, inputs.tagLength, debounceMs]);

  const result = useMemo(() => {
    const layout = computeLayout(debounced.m, debounced.p);
    const start = performance.now();
    const trace = buildArgon2Trace({
      password: encoder.encode(debounced.password),
      salt: encoder.encode(debounced.salt),
      m: debounced.m,
      t: debounced.t,
      p: debounced.p,
      type: 2,
      tagLength: debounced.tagLength,
    });
    const computeMs = performance.now() - start;
    return { trace, layout, computeMs };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced.password, debounced.salt, debounced.m, debounced.t, debounced.p, debounced.tagLength]);

  useEffect(() => {
    setIsPending(false);
  }, [result]);

  return { ...result, isPending };
}
