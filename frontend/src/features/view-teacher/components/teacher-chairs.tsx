import Link from 'next/link';

/**
 * Las cátedras que un docente integra, con link a la ficha de cada una (US-132).
 *
 * Existe porque lo que el producto publica es de la **cátedra**, no del docente (ADR-0083): la
 * ficha de una persona tiene que poder llevar a donde están los conteos, o el que busca un apellido
 * queda en una pantalla que no le contesta lo que vino a preguntar.
 *
 * Las que ya no integra se listan aparte y marcadas. Borrarlas de la vista sería contar mal su
 * historia, y mezclarlas con las vigentes le atribuiría lo que se dicta hoy sin él.
 */
export interface TeacherChair {
  chairId: string;
  chairName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  role: string;
  isCurrent: boolean;
}

/**
 * Los roles como los lee un alumno. Espeja `ChairMemberRole` del backend.
 *
 * El mapeo se duplica del de comisiones a propósito, y no se extrae a `lib/`: son dos enums
 * distintos que hoy coinciden, y el dominio ya decidió no compartir el tipo porque la comisión
 * muere con su período y la cátedra persiste, así que sus listas de roles pueden separarse sin que
 * una arrastre a la otra.
 */
const ROLE_LABEL: Record<string, string> = {
  Lead: 'Titular',
  Associate: 'Adjunto',
  PracticalLead: 'JTP',
  Assistant: 'Ayudante',
  Guest: 'Invitado',
};

export function TeacherChairs({ chairs }: { chairs: TeacherChair[] }) {
  if (chairs.length === 0) {
    return null;
  }

  const current = chairs.filter((chair) => chair.isCurrent);
  const past = chairs.filter((chair) => !chair.isCurrent);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-mono text-[11px] uppercase tracking-wide text-ink-3">Sus cátedras</h2>

      <div className="rounded-lg border border-line bg-bg-card">
        {current.map((chair, index) => (
          <ChairRow key={chair.chairId} chair={chair} last={index === current.length - 1} />
        ))}
      </div>

      {past.length > 0 && (
        <>
          <p className="mt-1 text-[12px] text-ink-3">Cátedras que integró antes</p>
          <div className="rounded-lg border border-line bg-bg-card">
            {past.map((chair, index) => (
              <ChairRow key={chair.chairId} chair={chair} last={index === past.length - 1} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ChairRow({ chair, last }: { chair: TeacherChair; last: boolean }) {
  return (
    <Link
      href={`/chairs/${chair.chairId}`}
      className={`flex items-baseline justify-between gap-3 px-4 py-3 ${
        last ? '' : 'border-b border-line'
      }`}
    >
      <span className="min-w-0">
        <span className="text-[14px] text-ink underline underline-offset-2">
          Cátedra {chair.chairName}
        </span>
        <span className="block truncate text-[12.5px] text-ink-3">
          {chair.subjectCode} · {chair.subjectName}
        </span>
      </span>
      <span className="shrink-0 font-mono text-[11px] text-ink-3">
        {ROLE_LABEL[chair.role] ?? chair.role}
      </span>
    </Link>
  );
}
