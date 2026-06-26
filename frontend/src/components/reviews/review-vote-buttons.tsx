'use client';

import Link from 'next/link';
import { useState } from 'react';
import { clientApiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type VoteState = { helpful: number; notHelpful: number; my: boolean | null };

/**
 * Botones de utilidad de una reseña ("útil" / "no útil") con sus conteos. Optimista: el click
 * actualiza el estado local al toque y después reconcilia con la respuesta autoritativa del backend
 * (que devuelve los conteos + el voto resultante); si falla, revierte. Toggle: tocar el botón activo
 * saca el voto.
 *
 * Para un visitante anónimo (`canVote` false, página pública) los botones son links a /sign-in:
 * votar requiere sesión. Compartido entre la página de materia (US-002) y la de docente (US-003):
 * el voto es por reseña, igual en ambos contextos.
 */
export function ReviewVoteButtons({
  reviewId,
  helpfulCount,
  notHelpfulCount,
  myVoteIsHelpful,
  canVote,
}: {
  reviewId: string;
  helpfulCount: number;
  notHelpfulCount: number;
  myVoteIsHelpful: boolean | null;
  canVote: boolean;
}) {
  const [state, setState] = useState<VoteState>({
    helpful: helpfulCount,
    notHelpful: notHelpfulCount,
    my: myVoteIsHelpful,
  });
  const [pending, setPending] = useState(false);

  if (!canVote) {
    return (
      <div className="flex items-center gap-1.5">
        <Link href="/sign-in" className={pillClass(false)}>
          útil {state.helpful}
        </Link>
        <Link href="/sign-in" className={pillClass(false)}>
          no útil {state.notHelpful}
        </Link>
      </div>
    );
  }

  async function vote(helpful: boolean) {
    if (pending) return;
    const prev = state;
    setState(applyVote(prev, helpful));
    setPending(true);
    try {
      const res = await clientApiFetch(`/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful }),
      });
      if (!res.ok) throw new Error(`vote failed: ${res.status}`);
      const body = (await res.json()) as {
        helpfulCount: number;
        notHelpfulCount: number;
        myVoteIsHelpful: boolean | null;
      };
      setState({
        helpful: body.helpfulCount,
        notHelpful: body.notHelpfulCount,
        my: body.myVoteIsHelpful,
      });
    } catch {
      setState(prev); // revert optimistic
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => vote(true)}
        disabled={pending}
        aria-pressed={state.my === true}
        className={pillClass(state.my === true)}
      >
        útil {state.helpful}
      </button>
      <button
        type="button"
        onClick={() => vote(false)}
        disabled={pending}
        aria-pressed={state.my === false}
        className={pillClass(state.my === false)}
      >
        no útil {state.notHelpful}
      </button>
    </div>
  );
}

function pillClass(active: boolean): string {
  return cn(
    'rounded-pill border px-2 py-[2px] text-[11px] tabular-nums transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-60',
    active
      ? 'border-accent bg-accent-soft text-accent-ink'
      : 'border-line bg-bg-card text-ink-3 hover:text-ink-2 hover:border-ink-4',
  );
}

function applyVote(s: VoteState, helpful: boolean): VoteState {
  // Tocar el botón ya activo: saca el voto.
  if (s.my === helpful) {
    return helpful
      ? { ...s, helpful: s.helpful - 1, my: null }
      : { ...s, notHelpful: s.notHelpful - 1, my: null };
  }
  // Sin voto previo: agrega.
  if (s.my === null) {
    return helpful
      ? { ...s, helpful: s.helpful + 1, my: true }
      : { ...s, notHelpful: s.notHelpful + 1, my: false };
  }
  // Cambia de sentido: mueve uno de un lado al otro.
  return helpful
    ? { helpful: s.helpful + 1, notHelpful: s.notHelpful - 1, my: true }
    : { helpful: s.helpful - 1, notHelpful: s.notHelpful + 1, my: false };
}
