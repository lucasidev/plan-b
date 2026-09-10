/**
 * DTOs de las auditorías AGN por institución (issue #506, backoffice admin). Espejan
 * GET /api/academic/agn-audits y POST /api/academic/agn-audits/import.
 */

/** El estado de la afirmación vigente. Solo estos dos: el import nunca produce Derived, Requested ni NotApplicable para este campo. */
export type AgnAuditStatus = 'Published' | 'NotPublished';

/**
 * Una fila por institución del catálogo, consultada o no. `checked` en false significa que nunca se
 * importó nada para esta institución: los demás campos vienen null, distinto de un `status`
 * `NotPublished` (sí se consultó, no tiene informes).
 */
export type AgnAuditRow = {
  universityId: string;
  universityName: string;
  checked: boolean;
  status: AgnAuditStatus | null;
  value: string | null;
  period: string | null;
  sourceUrl: string | null;
  lastCheckedAt: string | null;
};

/**
 * Estado del server action que dispara la importación (ADR-0046). Vive en types (actions.ts solo
 * exporta funciones async).
 */
export type ImportAgnAuditsResult =
  | { status: 'idle' }
  | { status: 'success'; auditsLoaded: number }
  | { status: 'error'; message: string };

export const initialImportAgnAuditsState: ImportAgnAuditsResult = { status: 'idle' };
