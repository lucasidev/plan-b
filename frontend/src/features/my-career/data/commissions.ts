/**
 * Mock commissions for the current term (US-045-d).
 *
 * When the backend lands: `GET /api/subjects/{code}/commissions?termId=...` (US-065).
 *
 * Each commission links a subject with a teacher in a specific schedule. Mock with 2-3
 * commissions per subject of the 2026·1c term (the ones the mock student is taking or
 * could take).
 */

export type Commission = {
  id: string;
  subjectCode: string;
  teacherId: string;
  /** Local commission identifier (A, B, C, ...). */
  label: string;
  /** Days + schedule block for display. */
  schedule: string;
  modalityDelivery: 'presencial' | 'híbrida' | 'virtual';
  /** Total capacity / currently enrolled (display). */
  capacity: number;
  enrolled: number;
};

export const commissions: Commission[] = [
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
  // ISW301 (approved subject, historic commission)
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
  // MOV302 (pending, offering for the next term)
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
  // BD201 (approved, historic)
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
  // BD301 (approved, historic)
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
  // COM301 (approved)
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
  // MAT201 + MAT202 (approved)
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

/** Returns commissions for a specific subject. */
export function commissionsForSubject(subjectCode: string): Commission[] {
  return commissions.filter((c) => c.subjectCode === subjectCode);
}
