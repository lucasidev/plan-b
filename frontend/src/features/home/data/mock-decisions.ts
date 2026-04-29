/**
 * Decisiones de la home, hardcoded del mockup `screens.jsx::HomeView`.
 *
 * Cada decisión correlaciona con un flow real del producto:
 *  - Recursar vs libre se decide cuando aterrice el simulador con métricas (US-016)
 *  - Carga del cuatrimestre también del simulador (US-016)
 *  - Comparar docentes aterriza con el detalle de docente (US-003)
 *  - Comparar comisiones aterriza con el detalle de materia (US-002)
 *
 * Mientras tanto los `actionHref` apuntan a las páginas que YA existen
 * (`/simulator`, `/professors`, `/subjects`) que hoy son stubs ComingSoon
 * pero el contrato de navegación queda bien armado: cuando las páginas
 * aterricen con contenido real, los CTAs siguen funcionando.
 */
export type DecisionTone = 'warm' | 'danger';

export type Decision = {
  readonly num: string;
  readonly title: string;
  readonly body: string;
  readonly action: string;
  readonly actionHref: string;
  readonly tone?: DecisionTone;
};

export const homeDecisions: readonly Decision[] = [
  {
    num: '01',
    title: '¿Recursás MAT201 o vas a libre?',
    body: 'Llevás 2 finales reprobados. Solo 18% de quienes recursaron por 3era vez aprueban; pero el 41% rinde libre y aprueba. Tu nivel de Análisis II era bueno.',
    action: 'Comparar trayectorias',
    actionHref: '/simulator',
    tone: 'warm',
  },
  {
    num: '02',
    title: '¿4 o 5 materias en 2026·1c?',
    body: 'Con MAT201 + ALG202 arrastradas y trabajo de 20h, alumnos en tu situación que tomaron 5 recursaron 1+ en el 62% de los casos.',
    action: 'Abrir simulador',
    actionHref: '/simulator',
    tone: 'danger',
  },
  {
    num: '03',
    title: '¿INT302 con Iturralde o esperar a Sosa en 2c?',
    body: 'Iturralde tiene 3.4★ en INT302 (16 reseñas). Sosa abre 2c con 4.1★. Esperar 1 cuatri delays tu recepción ~3 meses.',
    action: 'Ver reseñas',
    actionHref: '/professors',
  },
  {
    num: '04',
    title: '¿Qué comisión de ISW302?',
    body: 'Castro (B) tiene 4.6★ pero choca con tu trabajo. Brandt (A) entra de noche pero respondió 4 reseñas y ajustó la entrega.',
    action: 'Comparar comisiones',
    actionHref: '/subjects',
  },
] as const;
