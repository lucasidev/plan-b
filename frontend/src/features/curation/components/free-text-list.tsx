import type { FreeText } from '../types';

/**
 * Lo que la gente escribió al final de su reseña, para que el equipo lo lea (ADR-0084).
 *
 * Se muestra el texto con la cursada de la que salió y **nada de quien lo escribió**: ese dato no
 * viaja desde el backend, así que acá no hay nada que ocultar ni que se pueda filtrar por
 * descuido. Es lo que hace posible destilar frases nuevas y escribir notas editoriales, que son las
 * dos salidas que el campo libre tiene.
 */
export function FreeTextList({ texts }: { texts: readonly FreeText[] }) {
  if (texts.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-bg-card p-4 text-[13px] text-ink-3">
        Todavía nadie escribió nada. El campo es opcional al reseñar, así que la mayoría de las
        reseñas no trae texto.
      </p>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {texts.map((entry) => (
        <li key={entry.reviewId} className="rounded-lg border border-line bg-bg-card p-4">
          <p className="mb-2 text-[10.5px] text-ink-3">
            <span className="text-ink-2">{entry.subjectName}</span>
            {entry.chairName ? ` · Cátedra ${entry.chairName}` : ' · sin cátedra declarada'}
            <span className="font-mono"> · {entry.termLabel}</span>
            <span className="font-mono"> · {formatWrittenAt(entry.writtenAt)}</span>
          </p>
          <p className="text-[13.5px] leading-relaxed whitespace-pre-line text-ink">{entry.text}</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * La fecha en que se escribió, al día. La hora no aporta nada a leer un texto y acercarla al
 * momento exacto empieza a decir algo sobre quién lo escribió.
 */
function formatWrittenAt(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
