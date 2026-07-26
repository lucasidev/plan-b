'use client';

import { useQuery } from '@tanstack/react-query';
import { NO_DATA_YET } from '@/lib/copy';
import { simulationEvaluationQueries } from '../api';
import { formatBlockedReason } from '../lib/available-subjects';
import type { BlockedSubjectEvaluation, CommissionSelection, SimulationEvaluation } from '../types';

/**
 * Un tile de la grilla de métricas: valor grande + label chico debajo. `warn` lo pinta con el
 * color de acento (lo usaba el mock para choques; hoy ningún caller lo enciende, pero se
 * mantiene por si vuelve una métrica que amerite ese tratamiento).
 */
export type StatGridItem = {
  value: string;
  label: string;
  warn?: boolean;
};

/**
 * Grilla de tiles de métricas (US-046). Puramente presentacional: no sabe de dónde salen los
 * `items`, cada caller arma los suyos. Hoy tiene dos consumidores con datos de madurez distinta:
 * `DraftList` (US-046, mock: los borradores todavía no tienen materias con id real para evaluar)
 * y `SimulatorEvaluationPanel` acá abajo (US-016, real: POST /api/me/simulator/evaluate).
 */
export function StatsGrid({ items }: { items: StatGridItem[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gap: 10,
      }}
    >
      {items.map((it) => (
        <div
          key={it.label}
          className="bg-bg-card border border-line rounded-lg"
          style={{ padding: '13px 15px' }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              color: it.warn ? 'var(--accent-ink)' : 'var(--ink-1)',
            }}
          >
            {it.value}
          </div>
          <div className="text-ink-3" style={{ fontSize: 11, marginTop: 4 }}>
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Panel de métricas del planificador (US-016 + US-096), cableado a POST
 * /api/me/simulator/evaluate. Reacciona al conjunto de materias + comisiones elegidas
 * (`selections`): sin ninguna materia, no llama al endpoint (no hay combinación que evaluar). Ver
 * `simulationEvaluationQueries` en `../api` para por qué es un `useQuery` con la combinación en el
 * queryKey y no un `useMutation`.
 */
export function SimulatorEvaluationPanel({
  selections,
}: {
  selections: readonly CommissionSelection[];
}) {
  const { data, isPending, isError } = useQuery(
    simulationEvaluationQueries.forSelections(selections),
  );

  if (selections.length === 0) {
    return <Notice text="Sumá materias para ver las métricas de la combinación." />;
  }

  if (isPending) {
    return <Notice text="Calculando métricas..." />;
  }

  if (isError || !data) {
    return <Notice text="No pudimos calcular las métricas de esta combinación." />;
  }

  if (!data.isValid) {
    return <BlockedCombinationNotice subjects={data.blockedSubjects} />;
  }

  return <StatsGrid items={buildEvaluationItems(data)} />;
}

/**
 * Los nulls posibles no son un caso borde, son el punto: `clashes` (US-096) null significa
 * "ninguna materia de la combinación tiene comisión elegida todavía" (nunca "cero choques"; ese
 * dato solo existe una vez que el alumno eligió al menos una comisión). `weightedDifficulty` null
 * significa "ninguna de estas materias tiene reseñas todavía" (nunca se muestra como 0, que leería
 * como "fácil"). `combinationStats.passRate` null significa que la muestra está debajo del piso
 * anti-reidentificación (ADR-0047, N < 5): ahí se muestra el tamaño de muestra igual (es el dato
 * honesto), nunca el porcentaje (sería ruido sobre 1 o 2 alumnos, y de paso identificable).
 *
 * El texto de "no hay dato" es siempre `NO_DATA_YET` ("sin datos"), nunca la abreviatura "s/d":
 * la app nunca define qué significa, y el glosario lo prohíbe explícito (desambiguación de
 * "sin datos" en docs/domain/ubiquitous-language.md).
 */
function buildEvaluationItems(data: SimulationEvaluation): StatGridItem[] {
  const { combinationStats } = data;

  return [
    { value: `${data.totalWeeklyHours}h`, label: 'semanales' },
    data.clashes === null
      ? { value: NO_DATA_YET, label: 'sin comisión elegida' }
      : {
          value: `${data.clashes}`,
          label: data.clashes === 1 ? 'choque' : 'choques',
          warn: data.clashes > 0,
        },
    data.weightedDifficulty === null
      ? { value: NO_DATA_YET, label: 'sin reseñas todavía' }
      : { value: data.weightedDifficulty.toFixed(1), label: 'dificultad' },
    combinationStats.passRate === null
      ? {
          value: `${combinationStats.sampleSize}`,
          label: combinationStats.sampleSize === 1 ? 'alumno, pocos datos' : 'alumnos, pocos datos',
        }
      : { value: `${Math.round(combinationStats.passRate)}%`, label: 'aprob. esperada' },
  ];
}

function BlockedCombinationNotice({ subjects }: { subjects: readonly BlockedSubjectEvaluation[] }) {
  return (
    <div className="bg-bg-card border border-line rounded-lg" style={{ padding: 16 }}>
      <h2 className="text-base font-semibold text-ink-1" style={{ margin: '0 0 10px' }}>
        Esta combinación no se puede cursar
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {subjects.map((subject) => (
          <div key={subject.id}>
            <div className="text-ink-1" style={{ fontSize: 13, fontWeight: 500 }}>
              {subject.code} · {subject.name}
            </div>
            <p className="text-ink-3" style={{ fontSize: 12, margin: '2px 0 0', lineHeight: 1.4 }}>
              {formatBlockedReason(subject.blockedBy)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <div
      className="bg-bg-card border border-line rounded-lg text-ink-3"
      style={{ padding: 16, fontSize: 13, textAlign: 'center' }}
    >
      {text}
    </div>
  );
}
