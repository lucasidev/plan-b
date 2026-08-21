/**
 * Detecta si un texto corto está en español o en inglés contando palabras
 * función. Existe porque planb separa idiomas por artefacto (identificadores en
 * inglés, prosa en español rioplatense: `docs/engineering/git-workflow.md`
 * filas 17-20), y esa regla vivía escrita en cinco lugares y chequeada en
 * ninguno: la defensa era acordarse, y el 2026-08-21 se rompió seis veces en
 * una sesión (cuatro subjects de commit y dos títulos de ADR).
 *
 * Por qué palabras función y no un detector de verdad: son el grueso de
 * cualquier oración, no viajan como préstamo y no aparecen en identificadores.
 * `feat(reviews): EnrollmentRecord stores facts, not derived state` tokeniza a
 * `enrollmentrecord`, `stores`, `facts`, `derived`, `state`, y solo `not` vota.
 * Los nombres propios, los términos del dominio y el código no votan, que es
 * justo lo que queremos: un título mixto se juzga por su gramática, no por su
 * jerga, y `Redis as a cache and ephemeral state layer` da inglés sin dudar.
 *
 * Medido contra el repo entero antes de cablearlo: marca 44 de los 48 títulos
 * de ADR que estaban en español y los 5 subjects en español posteriores a la
 * decisión del 2026-07-30, con **cero falsos positivos** sobre 148 campos de
 * ADR y 69 subjects. Lo que no alcanza a decidir devuelve `unknown` y no
 * bloquea nunca: un chequeo que se calla donde no sabe se puede dejar
 * bloqueando; uno que adivina, no.
 */

export type Language = 'es' | 'en' | 'unknown';

/**
 * Fuera de las dos listas a propósito: valen en los dos idiomas y ensucian el
 * voto. `no` costó el único falso positivo de la medición ("Persistence
 * ignorance (pluggable infrastructure, **no** cross-schema FKs)"), y `a`, al
 * votar inglés, silenciaba títulos españoles que la usaban de preposición
 * ("transiciones **a** published"). `todo` colisiona con el TODO del código.
 */
const AMBIGUOUS = ['no', 'a', 'todo', 'solo'];

// Deliberadamente cortas: nada de sustantivos ni verbos, que son los que viajan
// como préstamo en la jerga técnica ("el commit", "la review", "el outbox").
const SPANISH = new Set(
  [
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'lo', 'al', 'del',
    'de', 'en', 'con', 'por', 'para', 'sin', 'sobre', 'entre', 'desde', 'hasta',
    'que', 'se', 'su', 'sus', 'y', 'o', 'ni', 'es', 'son', 'está', 'están',
    'como', 'pero', 'si', 'ya', 'cada', 'cuando', 'donde', 'porque',
    'este', 'esta', 'esto', 'ese', 'esa', 'eso', 'nunca', 'siempre',
    'más', 'menos', 'muy', 'toda', 'todos', 'todas', 'vez', 'hay',
  ].filter((w) => !AMBIGUOUS.includes(w)),
);

const ENGLISH = new Set(
  [
    'the', 'an', 'of', 'in', 'on', 'with', 'without', 'for', 'from', 'to',
    'by', 'at', 'into', 'over', 'under', 'between', 'across', 'until',
    'and', 'or', 'not', 'nor', 'but', 'is', 'are', 'was', 'were', 'be',
    'as', 'that', 'this', 'these', 'those', 'it', 'its', 'their', 'his', 'her',
    'when', 'where', 'because', 'which', 'who', 'what', 'never', 'always',
    'only', 'every', 'each', 'more', 'less', 'all', 'both', 'does', 'do',
  ].filter((w) => !AMBIGUOUS.includes(w)),
);

/**
 * Un solo voto de diferencia alcanza para decidir: medido, no sube ni un falso
 * positivo respecto de exigir dos, y sube el alcance de 35 a 44 sobre 48.
 */
export function detectLanguage(text: string): Language {
  const words = text.toLowerCase().split(/[^a-záéíóúüñ]+/);
  let es = 0;
  let en = 0;
  for (const w of words) {
    if (SPANISH.has(w)) es++;
    if (ENGLISH.has(w)) en++;
  }
  if (es > en) return 'es';
  if (en > es) return 'en';
  return 'unknown';
}
