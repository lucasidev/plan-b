import type { PublishedItem } from '@/components/facts';

/**
 * La ficha de una cátedra tal como baja del backend (US-147, ADR-0083).
 *
 * Espeja `GetChairFactsResponse`. Lo que este tipo no tiene es lo importante: no hay reseñas
 * individuales, ni autores, ni el desenlace de nadie. Solo conteos y las etiquetas literales que
 * la gente eligió.
 */

export interface ChairFacts {
  chairId: string;
  chairName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  leadTeacherName: string | null;
  isPublished: boolean;
  reviewCount: number;
  reviewsMissingToPublish: number;
  span: Span | null;
  fame: Fame | null;
  chairConduct: PublishedItem[];
  studentExperience: PublishedItem[];
  completion: Completion | null;
  contrasts: Contrast[];
}

/** De cuándo son las voces: entre qué años se cursó y cuándo entró la última reseña. */
export interface Span {
  fromYear: number;
  toYear: number;
  lastReviewedAt: string | null;
}

/** Varios ítems distintos apuntando al mismo lado. Es lo primero que la ficha dice. */
export interface Fame {
  itemsAgreeing: number;
  items: FameItem[];
}

export interface FameItem {
  code: string;
  text: string;
  negativeLabel: string;
  percent: number;
}

/** De cada diez que la cursan, cuántas llegan. Solo agregada, nunca por persona. */
export interface Completion {
  outOfTen: number;
  reaching: number;
  total: number;
}

/** Un contraste contra las hermanas que sobrevivió la regla de los intervalos separados. */
export interface Contrast {
  itemCode: string;
  itemText: string;
  negativeLabel: string;
  herePercent: number;
  hereTotal: number;
  siblingsPercent: number;
  siblingsTotal: number;
}
