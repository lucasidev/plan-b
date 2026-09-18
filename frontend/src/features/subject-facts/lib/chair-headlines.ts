/**
 * Las preguntas de conclusión de "Sus cátedras" (SC-007, US-129): una por opción de cada ítem de
 * conducta observable del catálogo. El backend manda `itemCode` + `optionValue` (la identidad
 * estable de la opción: es lo que se persiste, ADR-0082); acá se traduce a la oración de apertura
 * de la conclusión ("La cátedra {nombre} dictó casi todas sus clases"), a la que el caller le suma
 * ": lo dice el {percent} % de sus {respondents} reseñas."
 *
 * Cada plantilla lleva `{chair}` en el lugar del nombre porque tres opciones afirman más que la
 * cátedra sola ("nadie preguntaba", "faltaron algunas clases", "el programa nunca se vio" son
 * hechos de la cursada, no una acción puntual de la cátedra) y no encajan en el molde fijo "La
 * cátedra {chair} {pregunta}"; esas tres arrancan "En la cátedra {chair} ...". Las otras 21 siguen
 * ese molde, ahora como plantilla propia en vez de un fragmento que un wrapper fijo completaba.
 */

const CHAIR_HEADLINE_TEMPLATES: Record<string, Record<number, string>> = {
  CHAIR_CLASSES_HELD: {
    1: 'La cátedra {chair} dictó casi todas sus clases',
    2: 'En la cátedra {chair} faltaron algunas clases',
    3: 'La cátedra {chair} no dictó muchas de sus clases',
  },
  CHAIR_ANSWERS_IN_CLASS: {
    1: 'La cátedra {chair} contestaba siempre las preguntas en clase',
    2: 'La cátedra {chair} contestaba las preguntas en clase solo a veces',
    3: 'La cátedra {chair} casi nunca contestaba las preguntas en clase',
    4: 'En la cátedra {chair} nadie preguntaba en clase',
  },
  CHAIR_PRACTICE_MATCHES_THEORY: {
    1: 'La cátedra {chair} daba en el práctico lo mismo que en el teórico',
    2: 'La cátedra {chair} daba en el práctico algo distinto del teórico',
    3: 'La cátedra {chair} daba un práctico y un teórico que parecían dos materias distintas',
  },
  CHAIR_ANSWERS_OUTSIDE_CLASS: {
    1: 'La cátedra {chair} respondía consultas fuera de clase',
    2: 'La cátedra {chair} respondía consultas fuera de clase solo a veces',
    3: 'La cátedra {chair} no daba forma de consultar fuera de clase',
  },
  CHAIR_EXAM_DATE_NOTICE: {
    1: 'La cátedra {chair} avisó la fecha del parcial con más de dos semanas',
    2: 'La cátedra {chair} avisó la fecha del parcial con una o dos semanas',
    3: 'La cátedra {chair} avisó la fecha del parcial con menos de una semana',
    4: 'La cátedra {chair} no avisó la fecha del parcial, se supo de casualidad',
  },
  CHAIR_SYLLABUS_UPFRONT: {
    1: 'La cátedra {chair} entregó el programa al inicio',
    2: 'La cátedra {chair} entregó el programa tarde',
    3: 'En la cátedra {chair} el programa nunca se vio',
  },
  CHAIR_OFF_SYLLABUS_EXAMS: {
    1: 'La cátedra {chair} tomó solo temas del programa',
    2: 'La cátedra {chair} tomó algún tema que no estaba en el programa',
    3: 'La cátedra {chair} tomó varios temas que no estaban en el programa',
  },
};

/**
 * Espeja el catálogo real (`CatalogSeedData.Items`, backend, líneas 98-196): los 7 ítems de la
 * capa de conducta observable, con sus opciones en el orden en que se declaran ahí. Nada más lo
 * usa `chair-headlines.test.ts`, para que agregar una opción al catálogo sin agregar su pregunta acá
 * rompa el test en vez de mostrar una cátedra sin conclusión.
 */
export const CHAIR_CONDUCT_CATALOG: ReadonlyArray<{ itemCode: string; optionOrders: number[] }> = [
  { itemCode: 'CHAIR_ANSWERS_IN_CLASS', optionOrders: [1, 2, 3, 4] },
  { itemCode: 'CHAIR_CLASSES_HELD', optionOrders: [1, 2, 3] },
  { itemCode: 'CHAIR_PRACTICE_MATCHES_THEORY', optionOrders: [1, 2, 3] },
  { itemCode: 'CHAIR_ANSWERS_OUTSIDE_CLASS', optionOrders: [1, 2, 3] },
  { itemCode: 'CHAIR_EXAM_DATE_NOTICE', optionOrders: [1, 2, 3, 4] },
  { itemCode: 'CHAIR_SYLLABUS_UPFRONT', optionOrders: [1, 2, 3] },
  { itemCode: 'CHAIR_OFF_SYLLABUS_EXAMS', optionOrders: [1, 2, 3] },
];

/**
 * La oración de apertura de la conclusión para un `(itemCode, optionValue)`, con `chairName` ya
 * puesto en su lugar, o null si no hay una plantilla mapeada.
 *
 * `itemCode` se busca por su código base: un corte de serie (US-198) abre una pregunta nueva con
 * sufijo `_V<n>` (mismo layer, mismas opciones, nuevo código) para no comparar tramos que
 * preguntan cosas distintas, pero la conclusión de la ficha de materia no distingue tramos, así
 * que `CHAIR_SYLLABUS_UPFRONT_V2` busca la plantilla de `CHAIR_SYLLABUS_UPFRONT`.
 */
export function chairHeadlineSentence(
  itemCode: string,
  optionValue: number,
  chairName: string,
): string | null {
  const baseCode = itemCode.replace(/_V\d+$/, '');
  const template = CHAIR_HEADLINE_TEMPLATES[baseCode]?.[optionValue];
  return template ? template.replace('{chair}', chairName) : null;
}
