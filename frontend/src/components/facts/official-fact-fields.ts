/**
 * El vocabulario curado de campos de un dato oficial (ADR-0090), espejo en el frontend de
 * `OfficialFactField.cs` del backend: mismo código, mismo campo. El nombre en español de cada uno
 * está fijado una sola vez en `docs/product/language.md`; este archivo es su copia en código.
 */
export const OFFICIAL_FACT_FIELDS = {
  paperDuration: 'paper_duration',
  realDuration: 'real_duration',
  cohortGraduation: 'cohort_graduation',
  currentPlan: 'current_plan',
  accreditation: 'accreditation',
  nationalValidity: 'national_validity',
  admissionRegime: 'admission_regime',
  minutesPublished: 'minutes_published',
  budgetPublished: 'budget_published',
  staffRosterPublished: 'staff_roster_published',
  interimShare: 'interim_share',
  institutionalEvaluation: 'institutional_evaluation',
  institutionType: 'institution_type',
  academicUnit: 'academic_unit',
  agnAudit: 'agn_audit',
} as const;

/**
 * El orden fijo de los seis datos oficiales de una oferta (ADR-0090, F02, F05): dura en el papel,
 * dura en la realidad, egreso por cohorte, plan vigente, acreditación (o validez nacional, según
 * el nivel) y régimen de ingreso. Acreditación y validez nacional comparten posición porque una
 * oferta releva una sola de las dos: nunca conviven en la misma ficha (F05, O03).
 *
 * Lo comparten la ficha de carrera y Dónde estudiarla: la misma oferta se lee en el mismo orden
 * sola o al lado de otras.
 */
export const CAREER_OFFICIAL_FACT_ORDER: readonly string[] = [
  OFFICIAL_FACT_FIELDS.paperDuration,
  OFFICIAL_FACT_FIELDS.realDuration,
  OFFICIAL_FACT_FIELDS.cohortGraduation,
  OFFICIAL_FACT_FIELDS.currentPlan,
  OFFICIAL_FACT_FIELDS.accreditation,
  OFFICIAL_FACT_FIELDS.nationalValidity,
  OFFICIAL_FACT_FIELDS.admissionRegime,
];

/** Nombre en español de cada campo, para la etiqueta que va arriba de su valor en la ficha. */
export const OFFICIAL_FACT_LABELS: Record<string, string> = {
  [OFFICIAL_FACT_FIELDS.paperDuration]: 'Dura en el papel',
  [OFFICIAL_FACT_FIELDS.realDuration]: 'Dura en la realidad',
  [OFFICIAL_FACT_FIELDS.cohortGraduation]: 'Egreso por cohorte',
  [OFFICIAL_FACT_FIELDS.currentPlan]: 'Plan vigente',
  [OFFICIAL_FACT_FIELDS.accreditation]: 'Acreditación',
  [OFFICIAL_FACT_FIELDS.nationalValidity]: 'Validez nacional',
  [OFFICIAL_FACT_FIELDS.admissionRegime]: 'Régimen de ingreso',
  [OFFICIAL_FACT_FIELDS.minutesPublished]: 'Actas del órgano de gobierno publicadas',
  [OFFICIAL_FACT_FIELDS.budgetPublished]: 'Presupuesto ejecutado publicado',
  [OFFICIAL_FACT_FIELDS.staffRosterPublished]: 'Nómina docente con condición de cargo',
  [OFFICIAL_FACT_FIELDS.interimShare]: 'Proporción de cargos interinos',
  [OFFICIAL_FACT_FIELDS.institutionalEvaluation]: 'Acreditaciones al día',
  [OFFICIAL_FACT_FIELDS.institutionType]: 'Identidad institucional',
  [OFFICIAL_FACT_FIELDS.academicUnit]: 'Unidad académica',
  [OFFICIAL_FACT_FIELDS.agnAudit]: 'Auditada por la AGN',
};
