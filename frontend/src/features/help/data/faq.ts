/**
 * FAQ estática del centro de ayuda (US-073). Hardcoded en frontend hasta que aparezca un
 * caso de uso para CMS (no antes de tener varias decenas de preguntas o necesitar edición
 * sin deploy). Cada entry tiene un id estable para deep-linkear con `#`.
 *
 * Selección inicial (5 entries): las del mockup `soporte-v2-ayuda.png` que cubren las
 * preguntas más frecuentes del flow MVP. Cuando aterricen reseñas reales y historial real,
 * actualizar el copy para reflejar el estado actual del producto.
 */

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
};

export const FAQ: readonly FaqEntry[] = [
  {
    id: 'periodo',
    question: 'Cómo funciona el período',
    answer:
      'El período es el cuatrimestre académico actual de tu universidad: lo que estás cursando ahora. plan-b lo arma con las materias que marcaste en "Planificar" (tab En curso). Si todavía no cargaste ninguna, lo armás desde ahí.',
  },
  {
    id: 'borrador',
    question: 'Cómo armar un borrador',
    answer:
      'En "Planificar" → tab "Borradores" → "+ Nuevo borrador". Elegís año y cuatrimestre, sumás materias del catálogo de tu carrera, comparás comisiones y publicás cuando estés listo. El borrador NO te inscribe a nada: es una simulación para ver choques, carga semanal y dificultad esperada antes de inscribirte en serio.',
  },
  {
    id: 'dificultad',
    question: 'Cómo se calcula la dificultad',
    answer:
      'La dificultad sale del promedio de reseñas verificadas de alumnos que cursaron esa materia con esa cátedra. Si una materia todavía no tiene reseñas, mostramos "Sin datos" y no la promediamos. No es un cálculo automático ni IA: son personas reales puntuando.',
  },
  {
    id: 'anonimo',
    question: 'Por qué tus reseñas son anónimas',
    answer:
      'Para que digas lo que pensás sin miedo a represalias del docente o tu universidad. plan-b verifica que cursaste la materia (vía importación de historial) pero NO publica tu nombre junto a la reseña: solo el contenido. La verificación es nuestra, no del docente.',
  },
  {
    id: 'shortcuts',
    question: 'Atajos del teclado',
    answer:
      '⌘1 va a Inicio, ⌘2 a Mi carrera, ⌘3 a Planificar. ⌘K abre la búsqueda global (cuando aterrice). Esc cierra cualquier modal abierto.',
  },
] as const;
