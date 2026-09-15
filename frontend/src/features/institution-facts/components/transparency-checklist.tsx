import {
  OFFICIAL_FACT_FIELDS,
  OFFICIAL_FACT_LABELS,
  type OfficialFact,
  officialFactCaption,
  officialFactCellContent,
} from '@/components/facts';
import { formatShortDate } from '@/lib/format-date';

/**
 * Los seis campos posibles del checklist, en orden fijo. Exportado: la tira de la ficha cuenta
 * contra la misma lista, así el denominador de "publicado de N" es cuántos de estos seis tienen
 * afirmación cargada (no siempre seis), los mismos que el checklist efectivamente muestra.
 */
export const CHECKLIST_ORDER = [
  OFFICIAL_FACT_FIELDS.minutesPublished,
  OFFICIAL_FACT_FIELDS.budgetPublished,
  OFFICIAL_FACT_FIELDS.staffRosterPublished,
  OFFICIAL_FACT_FIELDS.interimShare,
  OFFICIAL_FACT_FIELDS.institutionalEvaluation,
  OFFICIAL_FACT_FIELDS.agnAudit,
];

/**
 * El checklist de transparencia institucional (SC-005, ADR-0090, `V.university().aside` de la
 * maqueta aprobada): una fila por campo, con su nota o su fuente debajo. La pill es para el
 * estado (no publicado, no aplica), nunca para el valor publicado: un valor largo en una pill
 * (`white-space: nowrap`) desbordaba la columna (UTN-FRT). Que una privada no publique nómina ni
 * presupuesto es exactamente lo que esta sección tiene que decir, no un hueco.
 */
export function TransparencyChecklist({ facts }: { facts: OfficialFact[] }) {
  const byField = new Map(facts.map((fact) => [fact.field, fact]));
  const ordered = CHECKLIST_ORDER.map((field) => byField.get(field)).filter(
    (fact): fact is OfficialFact => fact !== undefined,
  );

  if (ordered.length === 0) {
    return (
      <div className="pb-section">
        <div className="pb-eyebrow">Transparencia · verificado a fuente pública</div>
        <p className="pb-muted" style={{ fontSize: 13 }}>
          Todavía no relevamos la transparencia de esta institución.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-section">
      <div className="pb-eyebrow">Transparencia · verificado a fuente pública</div>
      <div className="pb-kv">
        {ordered.map((fact) => (
          <ChecklistRow key={fact.id} fact={fact} />
        ))}
      </div>
      <ChecklistFooter relievedAt={mostRecent(ordered)} sources={dedupeSources(ordered)} />
    </div>
  );
}

/** Una fila: etiqueta, el valor o el estado, y la nota o (sin ella) la fuente con su período. */
function ChecklistRow({ fact }: { fact: OfficialFact }) {
  const label = OFFICIAL_FACT_LABELS[fact.field] ?? fact.field;

  return (
    <div>
      <div className="pb-k">{label}</div>
      <div className="pb-v pb-small">
        <ChecklistValue fact={fact} />
      </div>
      <div className="pb-src pb-meta">{officialFactCaption(fact)}</div>
    </div>
  );
}

/**
 * Publicado, texto normal (parte línea como un dato oficial publicado de la carrera). No
 * publicado y no aplica, la pill de siempre. Cualquier otro estado, la pill con el valor genérico.
 */
function ChecklistValue({ fact }: { fact: OfficialFact }) {
  switch (fact.status) {
    case 'Published':
      return <>{officialFactCellContent(fact).value}</>;
    case 'NotPublished':
      return <span className="pb-pill">La institución no lo publica</span>;
    case 'NotApplicable':
      return <span className="pb-pill">No aplica a esta institución</span>;
    default:
      return <span className="pb-pill">{officialFactCellContent(fact).value}</span>;
  }
}

/** La fecha del relevamiento más reciente entre las filas: lo que "al pie" promete leer. */
function mostRecent(facts: OfficialFact[]): string {
  return facts.reduce(
    (latest, fact) => (fact.relievedAt > latest ? fact.relievedAt : latest),
    facts[0].relievedAt,
  );
}

type Source = { name: string; url: string };

/** Una fuente por URL, sin repetir: dos filas del checklist suelen citar el mismo sitio institucional. */
function dedupeSources(facts: OfficialFact[]): Source[] {
  const byUrl = new Map<string, Source>();
  for (const fact of facts) {
    if (!byUrl.has(fact.sourceUrl)) {
      byUrl.set(fact.sourceUrl, { name: fact.sourceName, url: fact.sourceUrl });
    }
  }
  return [...byUrl.values()];
}

/**
 * "Ver fuentes" lista las URL relevadas (SC-005). `<details>` nativo: no hace falta un client
 * component para un expandir/contraer que no tiene estado propio más allá de abierto o cerrado.
 */
function ChecklistFooter({ relievedAt, sources }: { relievedAt: string; sources: Source[] }) {
  return (
    // div, no p: <details> es de bloque y un <p> no puede contenerlo (rompería la hidratación).
    <div className="pb-meta" style={{ marginTop: 8 }}>
      Relevado el {formatShortDate(relievedAt)} ·{' '}
      <details className="inline">
        <summary className="pb-link" style={{ display: 'inline', cursor: 'pointer' }}>
          Ver fuentes
        </summary>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
          {sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer" className="pb-link">
                {source.name}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
