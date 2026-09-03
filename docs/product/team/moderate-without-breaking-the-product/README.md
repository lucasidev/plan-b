# Moderar sin romper el producto

> Épica del grupo **BO2 · Moderar sin romper el producto (decir que no importa más que decir que sí)** del [catálogo](../../README.md). **Estado**: reescrita el 2026-08-26 al modelo de [ADR-0084](../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el texto libre no se publica nunca: no queda contenido público que reportar ni testimonio que retener antes de publicarse); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

Moderar acá no es sacar lo que incomoda: es proteger al equipo y al corpus sin fingir que nada se puede objetar. Con el texto libre sin publicar nunca ([ADR-0084](../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)), no queda contenido público que reportar ni testimonio que retener antes de publicarse: esa maquinaria entera se retiró. Quedan **tres guardias**, las tres las trabaja Nahuel en la cola de **Reportes**:

1. **El filtro grueso del campo libre**: antes de que la curaduría lea un comentario para destilarlo en una frase nueva o citarlo en una nota editorial, un filtro automático (ADR-0055, repropuesto: ya no protege al lector público de un feed, protege al equipo de curaduría de leer crudo lo peor que alguien escribió) separa lo que es agresión dirigida o dato personal de un tercero.
2. **El canal de reclamos**: cuando una institución objeta una nota editorial o un dato relevado como publicado (por ejemplo, dice que un número de transparencia está mal fechado), pide una revisión; ese dato no baja solo, lo resuelve una persona con un criterio escrito, igual que antes ningún umbral de reportes bajaba nada solo.
3. **La alarma de cuentas correlacionadas** (US-213): no encaja prolijamente en las dos guardias anteriores, pero el corpus la sigue necesitando porque protege la integridad de los conteos publicados contra un grupo de cuentas fabricado para inflar o hundir una frase.

Aparte, en la misma épica pero sin que la toque [ADR-0084](../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md), sigue la cola de **verificaciones** que trabaja Camila: constancias de alumno, identidad docente y cargo institucional, con su revalidación anual. Las dos colas no pueden convivir en la misma persona: [Cortar los accesos](../cut-the-access/README.md) es lo que hace que Nahuel y Camila no puedan ser la misma persona.

## Para quién

**Nahuel** (modera: el criterio escrito de qué se filtra y qué se reclama, que quede registrado qué se resolvió y por qué, que la cola no lo convierta en un cuello de botella) y **Camila** (verifica: ver lo mínimo para decidir, que quede registrado que lo vio, que nadie más pueda, atar la identidad, docente o institucional, a lo que el catálogo ya tiene cargado).

## Stories

Cada una en su archivo, con su criterio de aceptación; el estado y el sprint viven en [`docs/plan/`](../../../plan/README.md), que las cita por ID.

| ID | De qué trata |
|---|---|
| [US-207](stories/US-207-see-the-minimum-of-a-credential/README.md) | Ver lo mínimo para verificar una constancia |
| [US-208](stories/US-208-separate-verification-from-contributions/README.md) | No cruzar verificación con lo aportado |
| [US-210](stories/US-210-separate-the-teacher-identity-queue/README.md) | Separar la cola de identidad docente |
| [US-211](stories/US-211-reject-a-tampered-credential-without-marking/README.md) | Detectar una constancia adulterada |
| [US-212](stories/US-212-show-the-moderation-queue-under-backlog/README.md) | Mostrar la cola desbordada de Reportes |
| [US-213](stories/US-213-flag-correlated-accounts-by-provenance/README.md) | Alertar cuentas correlacionadas por procedencia |
| [US-214](stories/US-214-group-reports-by-target-and-window/README.md) | Agrupar reclamos por objetivo y ventana |
| [US-225](stories/US-225-verify-an-institutional-position/README.md) | Verificar un cargo institucional |
| [US-226](stories/US-226-revalidate-verified-identity-yearly/README.md) | Revalidar la identidad verificada al año |

**Escenarios ejecutables**: el "listo cuando" de cada story traducido a Dado/Cuando/Entonces con valores concretos, con sus casos negativos y sus casos borde, en [`scenarios.md`](scenarios.md). Es lo que se lee antes de escribir el test.

## Decisiones que aplica

[ADR-0084](../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el texto libre no se publica nunca: no hay contenido público que reportar ni testimonio que retener; el campo libre sigue alimentando la curaduría, filtrado antes de leerse), [ADR-0055](../../../decisions/0055-content-filter-is-a-coarse-first-pass-not-a-verdict.md) (el filtro es un primer paso grueso que deriva a revisión humana, nunca un juez que rechaza; acá protege al equipo de curaduría, no al feed público), D09 ([registro del 17](../../../history/reviews/2026-08-17-catalog-propagation.md): verificación y moderación son roles excluyentes, equipo mínimo de cuatro), [ADR-0048](../../../decisions/0048-standing-is-opt-in-and-decoupled-from-email.md) (para el alumno, verificarse es señal, no permiso), [ADR-0073](../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md) (puntos 1, 2, 4, 8 y 9: la identidad docente y el cargo institucional se verifican contra el catálogo que carga el equipo, nunca contra la entidad ni por auto-servicio; si el dato no está cargado, el pedido pasa a catálogo, no se rechaza; la verificación se revalida al año sin retirar lo publicado; ante la duda, no se verifica), las Restricciones del catálogo ([índice de requisitos](../../README.md): la política de moderación y de reclamos es pública antes de que exista el primer caso).

## Pantallas

Las dos que existen solo para esta épica viven acá, con su ficha y su boceto:

- [**Reportes**](screens/SC-031-reports/README.md) (backoffice, rol moderación): el filtro grueso del campo libre, el canal de reclamos institucionales y la alarma de cuentas correlacionadas; [boceto mid-fi](screens/SC-031-reports/sketch.html) (todavía dibuja el modelo anterior, ver la ficha de la pantalla).
- [**Verificaciones**](screens/SC-032-verifications/README.md) (backoffice, rol verificación): las colas separadas, constancias de alumno (lo mínimo, el documento se destruye, sin camino a los aportes), identidad docente (el permiso, contra el equipo docente cargado) y cargo institucional (el permiso, contra los cargos cargados de esa institución), más la revalidación anual que devuelve una identidad vencida a su cola; [boceto mid-fi](screens/SC-032-verifications/sketch.html).

Las que comparte con otras épicas: [**Método**](../../student/take-the-data/README.md) (donde se publica la política de reclamos), y las fichas de [cátedra](../../student/choose-where-to-study/screens/SC-002-chair/README.md) y de [institución](../../reviewed/reply/screens/SC-005-institution/README.md) (donde vive lo que un reclamo puede objetar).

## Lo que esta épica todavía no resuelve

- **Si la alarma de cuentas correlacionadas (US-213) es una tercera guardia de esta épica o debería vivir en otro lado**: no encaja en el filtro grueso del campo libre ni en el canal de reclamos, los dos frentes que quedaron mínimos con este viraje; se mantiene acá porque nadie pidió borrarla y porque el corpus la sigue necesitando, pero su encaje es una decisión de producto, no algo que esta reescritura resuelva.
- **El texto del criterio escrito del filtro grueso y del canal de reclamos**: falta redactarlo.
- **Cómo se calcula "cuánto se tarda"** en Reportes y si usa el mismo cálculo que Pedidos (US-212, US-200 de [Sostener el catálogo](../sustain-the-catalog/README.md)).
- **Qué ve el público cuando los conteos de una cátedra están congelados** (US-213): "en revisión", los conteos de antes de congelar, u otra cosa.
- **Quién desmarca una cuenta marcada por error y cómo se entera esa persona**: hoy nada se le dice.
- **Si la alarma de US-213 corre sola o la dispara Nahuel** al notar un patrón sobre una cátedra.
- **Qué pasa con una respuesta ya publicada cuando la revalidación vence y la persona no renueva**: [ADR-0073](../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md) no lo decide (US-226).
