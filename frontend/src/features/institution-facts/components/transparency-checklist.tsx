import { OFFICIAL_FACT_FIELDS, type OfficialFact, OfficialFactRow } from '@/components/facts';
import { formatShortDate } from '@/lib/format-date';

const CHECKLIST_ORDER = [
  OFFICIAL_FACT_FIELDS.minutesPublished,
  OFFICIAL_FACT_FIELDS.budgetPublished,
  OFFICIAL_FACT_FIELDS.staffRosterPublished,
  OFFICIAL_FACT_FIELDS.interimShare,
  OFFICIAL_FACT_FIELDS.institutionalEvaluation,
  OFFICIAL_FACT_FIELDS.agnAudit,
];

/**
 * El checklist de transparencia institucional (SC-005, ADR-0090): una fila por campo con su
 * estado y su fecha. Que una privada no publique nómina ni presupuesto es exactamente lo que esta
 * sección tiene que decir, no un hueco: cada fila usa el mismo render que el resto de los datos
 * oficiales, así que "no publicado" nunca es una celda vacía y se distingue a simple vista de una
 * fila con dato.
 */
export function TransparencyChecklist({ facts }: { facts: OfficialFact[] }) {
  const byField = new Map(facts.map((fact) => [fact.field, fact]));
  const ordered = CHECKLIST_ORDER.map((field) => byField.get(field)).filter(
    (fact): fact is OfficialFact => fact !== undefined,
  );

  if (ordered.length === 0) {
    return (
      <section className="mb-5">
        <p className="mb-2 text-[12px] text-ink-3">Transparencia institucional</p>
        <p className="text-[13px] leading-relaxed text-ink-3">
          Todavía no relevamos la transparencia de esta institución.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-5">
      <p className="mb-2 text-[12px] text-ink-3">
        Transparencia institucional · verificado a fuente pública
      </p>
      <div className="rounded-xl border border-line bg-bg-card px-4 py-[5px]">
        {ordered.map((fact, index) => (
          <OfficialFactRow key={fact.id} fact={fact} last={index === ordered.length - 1} />
        ))}
      </div>
      <ChecklistFooter relievedAt={mostRecent(ordered)} sources={dedupeSources(ordered)} />
    </section>
  );
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
    <div className="mt-2 text-[11px] text-ink-3">
      <span>Relevado el {formatShortDate(relievedAt)} · </span>
      <details className="inline">
        <summary className="inline cursor-pointer underline underline-offset-2">
          Ver fuentes
        </summary>
        <ul className="m-0 mt-1.5 list-none space-y-1 p-0">
          {sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="text-accent-ink underline-offset-2 hover:underline"
              >
                {source.name}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
