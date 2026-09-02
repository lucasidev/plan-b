/**
 * El catálogo de frases como lo ve quien lo cura (US-198). Espeja `GetItemsResponse`.
 *
 * `answerCount` no es adorno: es lo que hace concreta la consecuencia de cortar la serie. Son las
 * respuestas que se quedan bajo el código viejo y dejan de compararse con las nuevas.
 */
export type CatalogItem = {
  id: string;
  code: string;
  text: string;
  help: string | null;
  layer: string;
  subject: string;
  origin: string;
  isActive: boolean;
  /** El código de la frase a la que esta reemplazó, cuando nació de un cambio de significado. */
  supersedesCode: string | null;
  /** El código que la reemplazó a ella, si se lo retiró abriendo uno nuevo. */
  supersededByCode: string | null;
  answerCount: number;
  updatedAt: string;
  retiredAt: string | null;
  /** Quién hizo el último cambio, ya resuelto a su mail. Null en lo que sembró el catálogo. */
  lastChangedBy: string | null;
  options: CatalogItemOption[];
};

export type CatalogItemOption = {
  value: number;
  order: number;
  label: string;
  valence: string;
};

/**
 * Qué está cambiando quien edita. Es una declaración y no una deducción: el sistema no puede saber
 * si cambió el significado de una pregunta, y adivinarlo mal corta una serie que no había que
 * cortar o mezcla dos que no se comparan.
 */
export type ChangeKind = 'wording' | 'meaning';

/** El estado de guardar un cambio, como lo lee la pantalla. */
export type CurateItemState =
  | { status: 'idle' }
  | { status: 'saved' }
  | { status: 'cut'; code: string; supersededCode: string; instrumentVersion: number }
  | { status: 'error'; message: string };

export const initialCurateItemState: CurateItemState = { status: 'idle' };
