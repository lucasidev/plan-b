import type { TeacherDetail, TeacherInsights } from '../types';

/**
 * Teacher detail header (US-003): avatar (photo or initials) + "Docente" eyebrow + name + title +
 * bio, with the stats row (rating, reseñas, dificultad, recomiendan). Mirrors the top of the mockup
 * `ProfessorDetail`. Names arrive already title-cased from the API (the storage is lowercase).
 *
 * No "respuestas públicas" stat yet: that is the teacher response feature (US-040), still ahead.
 */
export function TeacherHeader({
  teacher,
  insights,
}: {
  teacher: TeacherDetail;
  insights: TeacherInsights;
}) {
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

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
        <Stat
          label="Rating"
          value={
            insights.averageOverallRating !== null
              ? insights.averageOverallRating.toFixed(1)
              : 's/d'
          }
          suffix={insights.averageOverallRating !== null ? '/5' : undefined}
          sub="promedio"
        />
        <Stat
          label="Reseñas"
          value={String(insights.totalCount)}
          sub={insights.totalCount === 1 ? 'publicada' : 'publicadas'}
        />
        <Stat
          label="Dificultad"
          value={
            insights.averageDifficulty !== null ? insights.averageDifficulty.toFixed(1) : 's/d'
          }
          suffix={insights.averageDifficulty !== null ? '/5' : undefined}
          sub="promedio"
        />
        <Stat
          label="Recomiendan"
          value={
            insights.recommendPercentage !== null ? insights.recommendPercentage.toFixed(0) : 's/d'
          }
          suffix={insights.recommendPercentage !== null ? '%' : undefined}
          sub="de la cursada"
        />
      </div>
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

function Stat({
  label,
  value,
  suffix,
  sub,
}: {
  label: string;
  value: string;
  suffix?: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1 bg-bg-card px-4 py-3.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-4">{label}</span>
      <span className="text-[22px] font-semibold leading-none text-ink tabular-nums">
        {value}
        {suffix && <span className="ml-0.5 text-[13px] font-normal text-ink-3">{suffix}</span>}
      </span>
      {sub && <span className="text-[11px] text-ink-3">{sub}</span>}
    </div>
  );
}
