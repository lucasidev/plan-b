import {
  NumberCell,
  OFFICIAL_FACT_FIELDS,
  type OfficialFact,
  officialFactCellContent,
} from '@/components/facts';
import { CHECKLIST_ORDER } from './transparency-checklist';

/**
 * La tira de números de la ficha de institución (SC-005): estudiantes, egresados (ADR-0090,
 * campos `students`/`graduates`), cuántas carreras tienen reseñas y cuánto del checklist de
 * transparencia está publicado. El vistazo antes de bajar al detalle de cada bloque.
 *
 * "Carreras con reseñas" y "Transparencia publicada" no se dibujan con denominador 0 (institución
 * sin carreras cargadas, o sin ningún campo del checklist relevado): un "0 de 0" no informa nada.
 */
export function InstitutionNumbers({
  facts,
  totalCareers,
  careersWithReviews,
}: {
  facts: OfficialFact[];
  totalCareers: number;
  careersWithReviews: number;
}) {
  const byField = new Map(facts.map((fact) => [fact.field, fact]));
  const students = officialFactCellContent(byField.get(OFFICIAL_FACT_FIELDS.students));
  const graduates = officialFactCellContent(byField.get(OFFICIAL_FACT_FIELDS.graduates));

  const checklistFacts = CHECKLIST_ORDER.map((field) => byField.get(field)).filter(
    (fact): fact is OfficialFact => fact !== undefined,
  );
  const publishedCount = checklistFacts.filter((fact) => fact.status === 'Published').length;

  return (
    <section className="mb-5 grid grid-cols-2 gap-2.5">
      <NumberCell
        label="Estudiantes"
        value={students.value}
        note={students.note}
        isDerived={students.isDerived}
        derivationRuleId={students.derivationRuleId}
      />
      <NumberCell
        label="Egresados"
        value={graduates.value}
        note={graduates.note}
        isDerived={graduates.isDerived}
        derivationRuleId={graduates.derivationRuleId}
      />
      {totalCareers > 0 && (
        <NumberCell
          label="Carreras con reseñas"
          value={`${careersWithReviews} de ${totalCareers}`}
        />
      )}
      {checklistFacts.length > 0 && (
        <NumberCell
          label="Transparencia publicada"
          value={`${publishedCount} de ${checklistFacts.length}`}
        />
      )}
    </section>
  );
}
