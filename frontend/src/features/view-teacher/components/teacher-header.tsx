import type { TeacherDetail } from '../types';

/**
 * Encabezado de la ficha de un docente (US-003): avatar (foto o iniciales) + "Docente" + nombre +
 * título + bio. Los nombres llegan ya capitalizados de la API (en la base están en minúscula).
 *
 * Sin fila de estadísticas: lo que el producto publica es de la cátedra (ADR-0083), y las cátedras
 * que esta persona integra están abajo, cada una con link a sus conteos.
 */
export function TeacherHeader({ teacher }: { teacher: TeacherDetail }) {
  const fullName = `${teacher.firstName} ${teacher.lastName}`;
  const initials = `${teacher.firstName.charAt(0)}${teacher.lastName.charAt(0)}`.toUpperCase();

  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <Avatar photoUrl={teacher.photoUrl} name={fullName} initials={initials} />
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">Docente</p>
          <h1 className="mt-1 font-display text-[26px] font-semibold leading-tight text-ink">
            {fullName}
          </h1>
          {teacher.title && <p className="mt-0.5 text-[13px] text-ink-3">{teacher.title}</p>}
        </div>
      </div>

      {teacher.bio && (
        <p className="max-w-2xl text-[14px] leading-relaxed text-ink-2">{teacher.bio}</p>
      )}
    </header>
  );
}

function Avatar({
  photoUrl,
  name,
  initials,
}: {
  photoUrl: string | null;
  name: string;
  initials: string;
}) {
  if (photoUrl) {
    return (
      // biome-ignore lint/performance/noImgElement: external teacher photo URL, no next/image domain config
      <img
        src={photoUrl}
        alt={name}
        className="h-14 w-14 flex-shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-bg-elev font-display text-lg font-semibold text-ink-2"
    >
      {initials}
    </div>
  );
}
