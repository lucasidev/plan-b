/**
 * Mock de comisiones del cuatri vigente (US-045-d).
 *
 * Cuando aterrice backend: `GET /api/subjects/{code}/commissions?termId=...`
 * (US-065).
 *
 * Cada comisión vincula un subject con un teacher en un horario específico.
 * Mock con 2-3 comisiones por materia del cuatri 2026·1c (las que el
 * alumno mock está cursando o podría cursar).
 */

export type Comision = {
  id: string;
  subjectCode: string;
  teacherId: string;
  /** Identificador local de la comisión (A, B, C, ...). */
  label: string;
  /** Días + bloque horario para display. */
  schedule: string;
  modalityDelivery: 'presencial' | 'híbrida' | 'virtual';
  /** Capacidad total / inscriptos actuales (display). */
  capacity: number;
  enrolled: number;
};

export const comisiones: Comision[] = [
  // ISW302
  {
    id: 'isw302-a',
    subjectCode: 'ISW302',
    teacherId: 'brandt',
    label: 'A',
    schedule: 'Lun-Mié 18-21',
    modalityDelivery: 'presencial',
    capacity: 35,
    enrolled: 32,
  },
  {
    id: 'isw302-b',
    subjectCode: 'ISW302',
    teacherId: 'brandt',
    label: 'B',
    schedule: 'Mar-Jue 14-17',
    modalityDelivery: 'híbrida',
    capacity: 35,
    enrolled: 28,
  },
  // INT302
  {
    id: 'int302-a',
    subjectCode: 'INT302',
    teacherId: 'iturralde',
    label: 'A',
    schedule: 'Lun-Mié 14-17',
    modalityDelivery: 'presencial',
    capacity: 30,
    enrolled: 24,
  },
  // SEG302
  {
    id: 'seg302-a',
    subjectCode: 'SEG302',
    teacherId: 'sosa',
    label: 'A',
    schedule: 'Mar-Jue 18-21',
    modalityDelivery: 'presencial',
    capacity: 30,
    enrolled: 22,
  },
  // MAT401
  {
    id: 'mat401-a',
    subjectCode: 'MAT401',
    teacherId: 'reynoso',
    label: 'A',
    schedule: 'Vie 14-20',
    modalityDelivery: 'presencial',
    capacity: 30,
    enrolled: 18,
  },
  // ISW301 (materia aprobada, comisión histórica)
  {
    id: 'isw301-a',
    subjectCode: 'ISW301',
    teacherId: 'brandt',
    label: 'A',
    schedule: 'Lun-Mié 18-21',
    modalityDelivery: 'presencial',
    capacity: 35,
    enrolled: 33,
  },
  // MOV302 (pendiente, oferta del cuatri siguiente)
  {
    id: 'mov302-a',
    subjectCode: 'MOV302',
    teacherId: 'castro',
    label: 'A',
    schedule: 'Mar-Jue 18-21',
    modalityDelivery: 'híbrida',
    capacity: 30,
    enrolled: 0,
  },
  // BD201 (aprobada, histórica)
  {
    id: 'bd201-a',
    subjectCode: 'BD201',
    teacherId: 'castellanos',
    label: 'A',
    schedule: 'Lun-Mié 14-17',
    modalityDelivery: 'presencial',
    capacity: 35,
    enrolled: 30,
  },
  // BD301 (aprobada, histórica)
  {
    id: 'bd301-a',
    subjectCode: 'BD301',
    teacherId: 'castro',
    label: 'A',
    schedule: 'Mar-Jue 14-17',
    modalityDelivery: 'presencial',
    capacity: 30,
    enrolled: 26,
  },
  // COM301 (aprobada)
  {
    id: 'com301-a',
    subjectCode: 'COM301',
    teacherId: 'sosa',
    label: 'A',
    schedule: 'Vie 18-22',
    modalityDelivery: 'virtual',
    capacity: 40,
    enrolled: 35,
  },
  // MAT201 + MAT202 (aprobadas)
  {
    id: 'mat201-a',
    subjectCode: 'MAT201',
    teacherId: 'reynoso',
    label: 'A',
    schedule: 'Vie 9-13',
    modalityDelivery: 'presencial',
    capacity: 40,
    enrolled: 38,
  },
  {
    id: 'mat202-a',
    subjectCode: 'MAT202',
    teacherId: 'iturralde',
    label: 'A',
    schedule: 'Mar-Jue 9-12',
    modalityDelivery: 'presencial',
    capacity: 40,
    enrolled: 36,
  },
];

/** Devuelve comisiones para un subject específico. */
export function comisionesForSubject(subjectCode: string): Comision[] {
  return comisiones.filter((c) => c.subjectCode === subjectCode);
}
