# Sostener el catálogo

> Épica del grupo **BO1 · Sostener el catálogo (lo único que no se crowdsourcea)** del [catálogo](../../README.md). **Estado**: borrador escrito el 2026-08-19 (README y [flujo](flow.md)) y sus pantallas propias con ficha y boceto mid-fi (Pedidos, Catálogo, Correcciones, Frases); épica entera pasada al modelo de [ADR-0082](../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) a [ADR-0085](../../../decisions/0085-three-instruments-and-official-data.md) el 2026-08-26 (README, flujo, las cuatro pantallas y las quince stories: la mayoría del catálogo académico ya estaba alineada y solo US-196, US-204 y US-224 necesitaron correcciones); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

El plano del catálogo: instituciones, carreras, planes, correlativas, cátedras y el catálogo de frases (el archivo conserva su nombre histórico, [`phrases.md`](../../phrases.md), hasta la propagación completa). Es lo único que el equipo carga a mano y no se crowdsourcea: una carrera está cargada entera o no está, y una oferta a medias miente más que una que no existe ([`product-map.md`](../../map.md), "Los tres planos"). Cubre cinco trabajos que comparten la misma disciplina editorial: cargar una oferta completa por prioridad de pedidos, contrastar una corrección contra la fuente antes de aplicarla, vincular o fusionar contra la materia canónica lo que alguien nombró y el catálogo no tenía, curar el catálogo de frases (semilla y destiladas) del que se sirve toda reseña, y leer el campo libre para destilar frases nuevas y escribir notas editoriales ([ADR-0084](../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)).

Ningún otro plano puede adelantarse a este: sin materia canónica ni cátedra cargada no hay ficha que derivar, y sin una frase con su capa y sus opciones definidas no hay nada que ofrecer para responder al reseñar.

Es también la operación diaria que el mapa agrupaba aparte como temas, porque pasa en la misma cola y en la misma pantalla: Pedidos con doscientos pendientes dice cuánto se tarda y qué queda afuera del mes, sin fingir (US-200), y el primer día, sin pedidos, arranca con un criterio explícito (US-203); una fuente que no existe o se contradice no bloquea cargar, se marca de dónde salió el dato y la ficha lo muestra (US-202); algo cargado mal que cuarenta personas ya usan se corrige en la oferta publicada y las cuentas que declararon esa carrera se enteran de qué cambió (US-201); y cuando la facultad reforma el plan, los dos planes coexisten con su año y cada reseña queda pegada al período y a la materia canónica, no a la fila del plan, para que reformar no parta el corpus en dos (US-204).

## Para quién

**Sofía** (carga el catálogo: ver los huecos antes que los logros, empezando por los que bloquean lo publicado, priorizar por cuánta gente lo pidió, avisar cuando termina) y **quien cura las frases** (equipo, editorial: el catálogo de requisitos lo nombra como rol distinto del de Sofía, sin persona propia entre las cuatro del equipo).

## Stories

Las 15 de esta épica. Cada una en su archivo, con su criterio de aceptación; el estado y el sprint viven en [`docs/plan/`](../../../plan/README.md), que las cita por ID.

| ID | De qué trata |
|---|---|
| [US-191](stories/US-191-load-the-full-catalog-by-gaps/README.md) | Ver qué falta antes de lo cargado |
| [US-192](stories/US-192-order-the-queue-by-demand/README.md) | Ordenar la cola por demanda |
| [US-193](stories/US-193-notify-requesters-when-loaded/README.md) | Avisar a quienes esperaban al terminar |
| [US-194](stories/US-194-check-a-correction-against-the-source/README.md) | Contrastar la corrección contra la fuente |
| [US-195](stories/US-195-declare-offerings-as-the-same-career/README.md) | Declarar dos ofertas como la misma carrera |
| [US-196](stories/US-196-load-the-chair-as-teaching-staff/README.md) | Cargar la cátedra como entidad propia |
| [US-197](stories/US-197-link-declared-subjects-to-canonical/README.md) | Vincular materias declaradas a la canónica |
| [US-198](stories/US-198-curate-a-phrase-in-one-place/README.md) | Editar la frase en un solo lugar |
| [US-199](stories/US-199-review-distilled-phrases-before-marking/README.md) | Revisar frases destiladas antes de ofrecerlas |
| [US-200](stories/US-200-show-the-queue-throughput-and-overflow/README.md) | Mostrar el ritmo real de la cola |
| [US-201](stories/US-201-edit-a-published-offering-and-notify/README.md) | Corregir una oferta ya publicada |
| [US-202](stories/US-202-mark-a-field-as-unofficial-source/README.md) | Cargar con una fuente no oficial |
| [US-203](stories/US-203-seed-the-queue-on-day-one/README.md) | Decidir qué cargar el primer día |
| [US-204](stories/US-204-survive-a-curriculum-reform/README.md) | Que la reforma no parta el corpus |
| [US-224](stories/US-224-normalize-institutional-position/README.md) | Normalizar el cargo institucional |

Las stories con "tema del mapa" en sus notas vienen de los grupos transversales del mapa (BO4 · Cuando la carga no da abasto; BO5 · Cuando el corpus está bajo ataque): son temas, no actividades, y cada una vive en la única épica que la implementa. El índice del [catálogo](../../README.md) conserva el tema como lista.


**Escenarios ejecutables**: el "listo cuando" de cada story traducido a Dado/Cuando/Entonces con valores concretos, con sus casos negativos y sus casos borde, en [`scenarios.md`](scenarios.md). Es lo que se lee antes de escribir el test.

## Decisiones que aplica

Los tres planos del [mapa de producto](../../map.md) (el catálogo lo cargamos nosotros, a mano y completo; una carrera está cargada entera o no está), [ADR-0085](../../../decisions/0085-three-instruments-and-official-data.md) (la carrera canónica curada por nosotros, que es lo que hace comparable la misma carrera entre instituciones; la duración nominal del plan, contra la que se lee la duración real relevada de la fuente oficial), [ADR-0082](../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) (el catálogo de frases vive versionado, con código estable: editar el texto sin cambiar el significado mantiene la misma serie, cambiar el significado pide código nuevo y corte declarado), [ADR-0084](../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el campo libre alimenta la destilación de frases nuevas siempre, se publique o no, y las notas editoriales sin nombres a nivel carrera o institución), D08 ([registro del 17](../../../history/reviews/2026-08-17-catalog-propagation.md): la pendiente de vincular no cuenta ni entra a la cobertura hasta que el catálogo la vincula). El catálogo de frases con sus siete reglas: [`phrases.md`](../../phrases.md).

## Pantallas

Las cuatro que existen solo para esta épica viven acá, con su ficha y su boceto:

- [**Pedidos**](screens/SC-030-requests/README.md) (backoffice): la cola de carga ordenada por pedidos confirmados, con la institución de origen; [boceto mid-fi](screens/SC-030-requests/sketch.html).
- [**Catálogo**](screens/SC-027-catalog/README.md) (backoffice): cargar una oferta por huecos, las materias canónicas, las cátedras, la carrera canónica, la reforma del plan y la cola de materias declaradas; [boceto mid-fi](screens/SC-027-catalog/sketch.html) con sus varias vistas.
- [**Correcciones**](screens/SC-028-corrections/README.md) (backoffice): valor viejo y nuevo a la vista, contrastados contra la fuente antes de aplicar; [boceto mid-fi](screens/SC-028-corrections/sketch.html).
- [**Frases**](screens/SC-029-phrases/README.md) (backoffice): el catálogo de frases con su texto, sus opciones y su capa, la cola de curaduría de los destilados, y la lectura del campo libre para escribir notas editoriales ([ADR-0084](../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)); [boceto mid-fi](screens/SC-029-phrases/sketch.html).

Las que comparte con otras épicas: la [Ficha de cátedra](../../student/choose-where-to-study/screens/SC-002-chair/README.md) (de donde llega una corrección) y la [Ficha de materia](../../student/choose-where-to-study/screens/SC-007-subject/README.md) (a donde va lo cargado), [**Dónde estudiarla**](../../student/choose-where-to-study/screens/SC-008-where-to-study/README.md) (usa la carrera canónica que acá se declara), [**La cola**](../../student/request-a-career/screens/SC-009-queue/README.md) (la vista pública de Pedidos, en [Pedir una carrera](../../student/request-a-career/README.md)), [**Método**](../../student/take-the-data/screens/SC-021-method/README.md) (publica el catálogo de frases entero, en [Llevarse el dato](../../student/take-the-data/README.md)) y los mails de [Avisos](../../notices/README.md) (el aviso al terminar de cargar una oferta).

## Lo que esta épica todavía no resuelve

- **Qué pasa con las reseñas ya publicadas cuando se fusionan dos materias canónicas**: US-197 fusiona; si las voces de las dos se suman directo o hay un paso de revisión no está dicho.
- **Quién decide la carrera canónica cuando dos ofertas son parecidas pero no iguales**: US-195 pide que la decisión quede registrada con autor y fecha, no el criterio para tomarla.
- **Si la destilación corre cada cuánto y con qué modelo**: decisión técnica pendiente; US-199 solo fija que hay una cola de curaduría antes de ofrecer una frase.
- **Cómo se versiona el catálogo de frases** para que una cita de Rocío se reproduzca: US-187 pide la fecha de lectura, no dice cómo se guarda el corte.
- **Cómo se calcula "cuánto se tarda"** en Pedidos (sobre qué ventana se promedia) y **qué pasa con lo que queda afuera del mes**: si se le avisa al que pidió o alcanza con que La cola lo muestre (US-200).
- **Si el criterio de arranque del primer día es una lista escrita** (las carreras de las personas del equipo, las más pedidas en otro lado) o una decisión que se toma cada vez (US-203).
- **Si la cátedra sigue siendo la misma entidad cuando cambia el titular** (US-196: "persiste entre períodos") o eso la vuelve una cátedra nueva.
