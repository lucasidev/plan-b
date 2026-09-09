import Link from 'next/link';
import { OFFICIAL_FACT_FIELDS, OFFICIAL_FACT_LABELS, OfficialFactRow } from '@/components/facts';
import { CatalogTopbar } from '@/features/browse-catalog';
import { cn } from '@/lib/utils';
import type { CareerComparison, CareerComparisonOffering } from '../types';

/**
 * Dónde estudiarla (SC-008, US-128, ADR-0090, R6 tarea 5): la misma carrera canónica, lado a lado
 * por institución, con los mismos datos oficiales y la misma forma en cada tarjeta.
 *
 * Sin compuesto y sin ganador (US-171): ningún puntaje, ningún orden por valor, ninguna tarjeta
 * remarcada. El orden es alfabético por institución (US-128 E2); el que quiere ordenar por su
 * propio criterio baja el CSV desde Método.
 */
export function CareerComparisonView({ comparison }: { comparison: CareerComparison }) {
  const { groupName, cityLabel, isProvinceFallback, offerings } = comparison;
  const title = groupName ?? offerings[0]?.careerName ?? 'Esta carrera';
  const canCompare = offerings.length > 1;
  const hasDerivedData = offerings.some((offering) =>
    offering.facts.some((fact) => fact.status === 'Derived'),
  );
  // Alfabético (US-128 E2), nunca por cuál institución tiene mejor duración o mejor egreso: se
  // ordena acá, no solo en el backend, para que "sin ordenar por valor" sea una garantía de la
  // pantalla y no un detalle de implementación de una sola capa.
  const sortedOfferings = [...offerings].sort((a, b) =>
    a.universityName.localeCompare(b.universityName),
  );

  return (
    <div className="min-h-screen w-full">
      <CatalogTopbar />
      <div className="mx-auto w-full max-w-[560px] px-4 py-8">
        <Header
          title={title}
          cityLabel={cityLabel}
          isProvinceFallback={isProvinceFallback}
          offeringsCount={offerings.length}
        />

        {canCompare ? (
          <>
            {sortedOfferings.map((offering) => (
              <OfferingCard key={offering.careerId} offering={offering} />
            ))}
            {hasDerivedData && <DerivedNote />}
          </>
        ) : (
          <NotEnoughToCompare offering={sortedOfferings[0]} />
        )}
      </div>
    </div>
  );
}

function Header({
  title,
  cityLabel,
  isProvinceFallback,
  offeringsCount,
}: {
  title: string;
  cityLabel: string;
  isProvinceFallback: boolean;
  offeringsCount: number;
}) {
  const where = isProvinceFallback ? `en la provincia de ${cityLabel}` : `en ${cityLabel}`;
  const who =
    offeringsCount === 1 ? 'La dicta una institución' : `La dictan ${offeringsCount} instituciones`;

  return (
    <div className="mb-[18px]">
      <h1 className="mb-0.5 font-serif text-[24px] font-semibold text-ink">{title}</h1>
      <p className="text-[13px] text-ink-2">
        {who} {where}
        {isProvinceFallback && ': no pudimos confirmar la ciudad exacta'}.
      </p>
    </div>
  );
}

/**
 * "Con una sola oferta cargada, la pantalla dice 'no hay con qué comparar todavía' en vez de
 * mostrar una tarjeta sola como si fuera una comparación" (SC-008, edge case de US-128).
 */
function NotEnoughToCompare({ offering }: { offering?: CareerComparisonOffering }) {
  return (
    <div className="rounded-xl border border-line bg-bg-card p-4">
      <p className="text-[14px] leading-relaxed text-ink">No hay con qué comparar todavía.</p>
      {offering && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
          Por ahora, esta carrera solo está cargada en {offering.universityName}.
        </p>
      )}
    </div>
  );
}

/**
 * Acreditación y validez nacional son excluyentes (F05, O03): una oferta releva una sola de las
 * dos. Se busca la que tenga, sea cual sea; ninguna de las dos es "la" que falta si no aparece.
 */
function levelFact(offering: CareerComparisonOffering) {
  return (
    offering.facts.find((fact) => fact.field === OFFICIAL_FACT_FIELDS.accreditation) ??
    offering.facts.find((fact) => fact.field === OFFICIAL_FACT_FIELDS.nationalValidity)
  );
}

const SIMPLE_FIELDS = [
  OFFICIAL_FACT_FIELDS.paperDuration,
  OFFICIAL_FACT_FIELDS.realDuration,
  OFFICIAL_FACT_FIELDS.cohortGraduation,
  OFFICIAL_FACT_FIELDS.currentPlan,
  OFFICIAL_FACT_FIELDS.admissionRegime,
];

function OfferingCard({ offering }: { offering: CareerComparisonOffering }) {
  const rows = [
    ...SIMPLE_FIELDS.map((field) => ({
      field,
      fact: offering.facts.find((fact) => fact.field === field),
    })),
    { field: 'level', fact: levelFact(offering) },
  ];
  // La aglomeración agrupa, pero cada tarjeta sigue diciendo su localidad real (no puede leer
  // "San Miguel de Tucumán" arriba y esconder que esta oferta puntual queda en Yerba Buena).
  const subtitle = [offering.academicUnitName, offering.localityName].filter(Boolean).join(' · ');

  return (
    <div className="mb-3 rounded-xl border border-line bg-bg-card p-4">
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/careers/${offering.careerId}`}
            className="text-[15px] font-medium text-ink hover:underline"
          >
            {offering.universityName}
          </Link>
          {subtitle && <p className="truncate text-[12px] text-ink-3">{subtitle}</p>}
        </div>
        {offering.institutionKind && (
          <span className="shrink-0 font-mono text-[11px] text-ink-3">
            {offering.institutionKind.toLowerCase()}
          </span>
        )}
      </div>

      {offering.facts.length === 0 ? (
        <p className="py-2 text-[13px] leading-relaxed text-ink-3">
          Todavía no tenemos datos oficiales de esta oferta.
        </p>
      ) : (
        rows.map(({ field, fact }, index) => {
          const last = index === rows.length - 1;
          return fact ? (
            <OfficialFactRow key={fact.id} fact={fact} last={last} />
          ) : (
            <MissingFactRow
              key={field}
              label={
                field === 'level' ? 'Acreditación o validez nacional' : OFFICIAL_FACT_LABELS[field]
              }
              last={last}
            />
          );
        })
      )}
    </div>
  );
}

/**
 * Un dato que ninguna afirmación cubre todavía para esta oferta puntual (a diferencia de
 * `OfficialFactRow`, que siempre parte de una afirmación real): "los mismos campos, con la misma
 * forma, en todas las tarjetas... no se achica la tarjeta ni se corre la grilla" (contrato de la
 * tarea). Misma forma visual que el estado "no publicado" de `OfficialFactRow`, sin fecha porque
 * acá no hubo ni siquiera un relevamiento que decir "no publicado".
 */
function MissingFactRow({ label, last }: { label: string; last: boolean }) {
  return (
    <div className={cn('py-2.5', !last && 'border-b border-line-2')}>
      <p className="mb-1 text-[11px] text-ink-3">{label}</p>
      <p className="text-[13px] leading-relaxed text-ink-3">
        Todavía no se relevó para esta oferta.
      </p>
    </div>
  );
}

/**
 * "Los sesgos de un derivado se dicen una vez, arriba, no por tarjeta" (contrato de la tarea): el
 * link a Método ya va en cada `OfficialFactRow` con estado Derivado; esta nota explica una sola
 * vez qué significa esa etiqueta, en vez de repetir la explicación en cada tarjeta que la lleva.
 */
function DerivedNote() {
  return (
    <p className="mt-2 text-[11px] leading-relaxed text-ink-3">
      Un dato marcado "Derivado" es un cálculo con una regla propia, no lo que la fuente publica
      directamente.{' '}
      <Link href="/method" className="text-accent-ink underline-offset-2 hover:underline">
        Mirá Método
      </Link>{' '}
      para la fórmula y sus sesgos.
    </p>
  );
}
