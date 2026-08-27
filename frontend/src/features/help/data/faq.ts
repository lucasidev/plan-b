/**
 * FAQ del centro de ayuda (US-073). Hardcodeado en el frontend hasta que aparezca un caso de uso
 * de CMS (no antes de varias decenas de preguntas o de necesitar editarlas sin deploy). Cada
 * entrada tiene un id estable para poder linkearla con `#`.
 *
 * Reescrito el 2026-08-26 al producto vigente (ADR-0082 a ADR-0084). Las entradas anteriores
 * explicaban cómo armar un borrador en "Planificar" y decían que la dificultad salía del promedio
 * de las reseñas: las dos cosas describían la versión anterior del producto, y la segunda además
 * contradecía la tesis, que no publica puntajes. Este copy le habla al estudiante en su idioma: las
 * reglas y las fórmulas viven en el Método, no acá.
 */

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
};

export const FAQ: readonly FaqEntry[] = [
  {
    id: 'review',
    question: 'Qué se reseña, y cuánto tarda',
    answer:
      'Se reseña una cursada: una materia que hiciste, en un período, con la cátedra que la dio. Son preguntas de opción, de corrido, y tarda alrededor de un minuto y medio. Podés saltear las que no quieras contestar: lo que salteás no cuenta para ningún número.',
  },
  {
    id: 'no-score',
    question: 'Por qué no hay puntaje',
    answer:
      'Porque un promedio esconde de qué se está hablando: la materia que es dura de verdad y la que está mal dada terminan con la misma nota. Cada dato se publica solo, con cuántas personas lo sostienen. Vas a ver lo más elegido en cada pregunta y cómo se repartieron las respuestas, nunca una estrella ni un número del uno al diez.',
  },
  {
    id: 'anonymity',
    question: 'Por qué lo que contás es anónimo',
    answer:
      'Para que digas lo que viviste sin miedo a que te lo cobren. Tu nombre no aparece en ningún lado, nunca se muestra una reseña sola, y nadie de la facultad puede ver quién respondió qué. Una cátedra tampoco publica nada hasta juntar diez reseñas: con dos o tres, adivinar quién habló es fácil.',
  },
  {
    id: 'free-text',
    question: 'Qué pasa con lo que escribís al final',
    answer:
      'No se publica. Lo lee el equipo para descubrir qué deberíamos estar preguntando y no preguntamos: de ahí salen las preguntas nuevas. Si algo se repite mucho, puede aparecer resumido en la ficha de una carrera o de una facultad, sin nombres y sin citar a nadie.',
  },
  {
    id: 'shortcuts',
    question: 'Atajos del teclado',
    answer:
      '⌘1 va a Inicio y ⌘2 a Mi carrera. ⌘K abre la búsqueda global (cuando aterrice). Esc cierra cualquier cosa que esté abierta.',
  },
] as const;
