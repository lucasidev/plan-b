import { describe, expect, it } from 'vitest';
import { CHAIR_CONDUCT_CATALOG, chairHeadlineSentence } from './chair-headlines';

/**
 * SC-007 ("Sus cátedras"): cada opción de cada ítem de conducta observable tiene su pregunta de
 * conclusión. Este test compara `chairHeadlineSentence` contra `CHAIR_CONDUCT_CATALOG`, la copia
 * literal que espeja `CatalogSeedData.cs` (backend): si alguien agrega una plantilla acá sin
 * agregarla también en `CHAIR_CONDUCT_CATALOG`, o al revés, este test lo agarra. Lo que NO agarra
 * es que el catálogo real cambie sin que alguien actualice la copia: ahí sigue en verde
 * comparándose contra una copia desactualizada.
 */
describe('chairHeadlineSentence', () => {
  it('cubre todas las opciones de todos los ítems de conducta del catálogo', () => {
    for (const item of CHAIR_CONDUCT_CATALOG) {
      for (const optionValue of item.optionOrders) {
        const sentence = chairHeadlineSentence(item.itemCode, optionValue, 'Pérez');
        expect(
          sentence,
          `${item.itemCode} opción ${optionValue} no tiene plantilla`,
        ).not.toBeNull();
        expect(sentence).not.toBe('');
      }
    }
  });

  it('un ítem fuera del catálogo no tiene plantilla', () => {
    expect(chairHeadlineSentence('CHAIR_DOES_NOT_EXIST', 1, 'Pérez')).toBeNull();
  });

  it('una opción fuera de rango de un ítem real no tiene plantilla', () => {
    expect(chairHeadlineSentence('CHAIR_CLASSES_HELD', 99, 'Pérez')).toBeNull();
  });

  it('arma la oración con el nombre de la cátedra en su lugar, para el molde "La cátedra {chair} ..."', () => {
    expect(chairHeadlineSentence('CHAIR_ANSWERS_IN_CLASS', 3, 'Ruiz')).toBe(
      'La cátedra Ruiz casi nunca contestaba las preguntas en clase',
    );
  });

  /**
   * Tres opciones afirman más que la cátedra sola y no entran en el molde "La cátedra {chair}
   * ...": arrancan "En la cátedra {chair} ...".
   */
  it.each([
    ['CHAIR_CLASSES_HELD', 2, 'En la cátedra Aráoz faltaron algunas clases'],
    ['CHAIR_ANSWERS_IN_CLASS', 4, 'En la cátedra Aráoz nadie preguntaba en clase'],
    ['CHAIR_SYLLABUS_UPFRONT', 3, 'En la cátedra Aráoz el programa nunca se vio'],
  ] as const)('%s opción %i usa el molde "En la cátedra {chair} ..."', (itemCode, optionValue, expected) => {
    expect(chairHeadlineSentence(itemCode, optionValue, 'Aráoz')).toBe(expected);
  });

  /**
   * Un corte de serie (US-198) abre una pregunta nueva con sufijo `_V<n>`, mismo layer y mismas
   * opciones: la conclusión de la ficha de materia busca por el código base, para no dejar sin
   * conclusión a una cátedra que solo respondió el tramo nuevo.
   */
  it('un ítem con sufijo de corte de serie (_V2) resuelve a la misma plantilla que su código base', () => {
    expect(chairHeadlineSentence('CHAIR_SYLLABUS_UPFRONT_V2', 1, 'Aráoz')).toBe(
      chairHeadlineSentence('CHAIR_SYLLABUS_UPFRONT', 1, 'Aráoz'),
    );
  });
});
