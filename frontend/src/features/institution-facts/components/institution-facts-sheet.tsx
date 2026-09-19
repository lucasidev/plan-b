import {
  OFFICIAL_FACT_FIELDS,
  type OfficialFact,
  officialFactCaption,
  officialFactCellContent,
} from '@/components/facts';
import { PageFrame, type PageFrameStat } from '@/components/layout/page-frame';
import {
  type Career,
  type CareerCoverage,
  hasReviews,
  institutionTypeLabel,
} from '@/features/browse-catalog';
import type { InstitutionProfile } from '@/features/manage-universities/profile-types';
import {
  describeInstitutionCareers,
  describeMeasuredCareers,
} from '../lib/describe-institution-header';
import { CareersByFaculty } from './careers-by-faculty';
import { CareersStartHere } from './careers-start-here';
import { CHECKLIST_ORDER, TransparencyChecklist } from './transparency-checklist';

/**
 * La ficha de una institución (SC-005, ADR-0090), markup literal de la maqueta aprobada
 * (planb-catalogo-adentro.html, `V.university`, `frameApp`).
 *
 * Se listan TODAS las carreras de la institución, agrupadas por facultad: sin el truncamiento
 * de la maqueta ("Se muestran 17 de las 56"), que era una limitación de la demo, no del producto.
 */
type Props = {
  universityName: string;
  careers: Career[];
  officialFacts: OfficialFact[];
  /** `catalogCoverage` ya filtrado a esta universidad. */
  coverage: CareerCoverage[];
  profile?: InstitutionProfile | null;
};

export function InstitutionFactsSheet({
  universityName,
  careers,
  officialFacts,
  coverage,
  profile = null,
}: Props) {
  const byField = new Map(officialFacts.map((fact) => [fact.field, fact]));
  const careersWithReviews = coverage.filter(hasReviews);

  return (
    <PageFrame
      head={
        <Head
          universityName={universityName}
          careers={careers}
          identity={byField.get(OFFICIAL_FACT_FIELDS.institutionType)}
          careersWithReviews={careersWithReviews}
          profile={profile}
        />
      }
      stats={institutionStats(byField, careers.length, careersWithReviews.length)}
      main={<CareersByFaculty careers={careers} coverage={coverage} />}
      aside={
        <>
          <CareersStartHere coverage={coverage} />
          <IdentitySummary identity={byField.get(OFFICIAL_FACT_FIELDS.institutionType)} />
          <TransparencyChecklist facts={officialFacts} />
        </>
      }
    />
  );
}

function Head({
  universityName,
  careers,
  identity,
  careersWithReviews,
  profile,
}: {
  universityName: string;
  careers: Career[];
  identity: OfficialFact | undefined;
  careersWithReviews: CareerCoverage[];
  profile: InstitutionProfile | null;
}) {
  const kind = institutionTypeLabel(identity)?.toLowerCase() ?? null;
  const careersSentence = describeInstitutionCareers(careers);
  const measuredSentence = describeMeasuredCareers(
    careersWithReviews.map((career) => ({ careerName: career.careerName })),
  );

  return (
    <>
      <div className="pb-eyebrow">Universidad{kind ? ` · ${kind}` : ''}</div>
      <div className="flex items-start gap-4">
        {!!profile?.logoVersion && (
          // biome-ignore lint/performance/noImgElement: el logo público se sirve same-origin y su tamaño ya está acotado al cargarlo.
          <img
            src={`/api/academic/universities/${profile.universityId}/logo?v=${profile.logoVersion}`}
            alt=""
            width={72}
            height={72}
            className="h-[72px] w-[72px] shrink-0 object-contain"
          />
        )}
        <div>
          <h1 className="pb-serif">{universityName}</h1>
          {profile && !profile.logoVersion && <p className="pb-meta">Logo todavía no cargado</p>}
          {(profile?.address || profile?.localityName || profile?.province) && (
            <p className="pb-meta">
              {[profile.address, profile.localityName, profile.province]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          {profile?.websiteUrl && (
            <p className="pb-meta">
              <a href={profile.websiteUrl} rel="noreferrer" target="_blank">
                Sitio oficial
              </a>
            </p>
          )}
        </div>
      </div>
      {careersSentence && (
        <p className="pb-h-sub">
          {careersSentence}
          {measuredSentence ? ` ${measuredSentence}` : ''}
        </p>
      )}
    </>
  );
}

/** La tira `.pb-stats` (`V.university().stats` de la maqueta): estudiantes, egresados, carreras con reseñas y transparencia. */
function institutionStats(
  byField: Map<string, OfficialFact>,
  totalCareers: number,
  careersWithReviewsCount: number,
): PageFrameStat[] {
  const stats: PageFrameStat[] = [];

  // Estudiantes y egresados van aunque el estado no sea Published (UTN-FRT, San Pablo-T): la
  // celda dice "No publicado" en vez de desaparecer. La etiqueta lleva el período del dato, no la
  // nota (esa va en el detalle, no en la tira).
  const students = byField.get(OFFICIAL_FACT_FIELDS.students);
  if (students) {
    const value = officialFactCellContent(students).value;
    stats.push([value, `estudiantes${students.period ? ` en ${students.period}` : ''}`]);
  }

  const graduates = byField.get(OFFICIAL_FACT_FIELDS.graduates);
  if (graduates) {
    const value = officialFactCellContent(graduates).value;
    stats.push([value, `egresados${graduates.period ? ` en ${graduates.period}` : ''}`]);
  }

  if (totalCareers > 0) {
    stats.push([
      `${careersWithReviewsCount}`,
      careersWithReviewsCount === 1 ? 'carrera con reseñas' : 'carreras con reseñas',
    ]);
  }

  const checklistFacts = CHECKLIST_ORDER.map((field) => byField.get(field)).filter(
    (fact): fact is OfficialFact => fact !== undefined,
  );
  if (checklistFacts.length > 0) {
    const publishedCount = checklistFacts.filter((fact) => fact.status === 'Published').length;
    stats.push([
      `${publishedCount} de ${checklistFacts.length}`,
      'datos de transparencia que la institución publica',
    ]);
  }

  return stats;
}

/**
 * "Identidad institucional" (columna derecha): el valor completo de `institution_type`, con su
 * fuente. Sin afirmación cargada, la sección no se dibuja; con afirmación pero sin publicar (San
 * Pablo-T), se lee como una fila de datos oficiales de la carrera: la pill fija y la nota o la
 * fuente debajo.
 */
function IdentitySummary({ identity }: { identity: OfficialFact | undefined }) {
  if (!identity) return null;

  const isPublished = identity.status === 'Published' && identity.value;

  return (
    <div className="pb-section">
      <div className="pb-eyebrow">Identidad institucional</div>
      <p className="pb-serif" style={{ fontSize: 16, lineHeight: 1.35 }}>
        {isPublished ? (
          identity.value
        ) : (
          <span className="pb-pill">No publicado por falta de datos</span>
        )}
      </p>
      <p className="pb-meta" style={{ marginTop: 4 }}>
        {officialFactCaption(identity)}
      </p>
    </div>
  );
}
