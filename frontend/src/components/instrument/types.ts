/**
 * El cuestionario tal como lo dibuja la UI, compartido por las dos pantallas que lo usan: reseñar
 * una cursada por primera vez y corregir lo que se reseñó.
 *
 * Vive acá y no en un feature porque los dos lo necesitan idéntico, y a esta altura el tipo no
 * sabe nada de publicar ni de corregir: es solo qué se pregunta y qué se puede contestar.
 */

/** Una opción de respuesta. No trae valencia: la recolección va sin alarma (ADR-0071). */
export type InstrumentOption = {
  value: number;
  label: string;
};

/** Las tres capas de la reseña. Ordenan los pasos de la pantalla. */
export type ItemLayer = 'Context' | 'ChairConduct' | 'StudentExperience';

export type InstrumentItem = {
  code: string;
  text: string;
  help: string | null;
  layer: ItemLayer;
  options: readonly InstrumentOption[];
};

export type CurrentInstrument = {
  code: string;
  version: number;
  items: readonly InstrumentItem[];
};
