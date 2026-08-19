# Sostener el catálogo

> Épica del grupo **BO1 · Sostener el catálogo (lo único que no se crowdsourcea)** del [catálogo](../../domain/user-stories.md). **Estado**: borrador escrito el 2026-08-19 (README y [flujo](flow.md)) y sus pantallas propias con ficha y boceto mid-fi (Pedidos, Catálogo, Correcciones, Frases); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

El plano del catálogo: instituciones, carreras, planes, correlativas, cátedras y el catálogo de frases. Es lo único que el equipo carga a mano y no se crowdsourcea: una carrera está cargada entera o no está, y una oferta a medias miente más que una que no existe ([`product-map.md`](../../design/product-map.md), "Los tres planos"). Cubre cuatro trabajos que comparten la misma disciplina editorial: cargar una oferta completa por prioridad de pedidos, contrastar una corrección contra la fuente antes de aplicarla, vincular o fusionar contra la materia canónica lo que alguien nombró y el catálogo no tenía, y curar el catálogo de frases, semilla y destiladas, del que se sirve toda reseña.

Ningún otro plano puede adelantarse a este: sin materia canónica ni cátedra cargada no hay ficha que derivar, y sin una frase con su sujeto y su eje asignados no hay nada que ofrecer para marcar al reseñar.

Es también la operación diaria que el mapa agrupaba aparte como temas, porque pasa en la misma cola y en la misma pantalla: Pedidos con doscientos pendientes dice cuánto se tarda y qué queda afuera del mes, sin fingir (BO4-1), y el primer día, sin pedidos, arranca con un criterio explícito (BO4-5); una fuente que no existe o se contradice no bloquea cargar, se marca de dónde salió el dato y la ficha lo muestra (BO4-3); algo cargado mal que cuarenta personas ya usan se corrige en la oferta publicada y los que la tienen marcada se enteran de qué cambió (BO4-2); y cuando la facultad reforma el plan, los dos planes coexisten con su año y cada reseña queda pegada al período y a la materia canónica, no a la fila del plan, para que reformar no parta el corpus en dos (BO5-1).

## Para quién

**Sofía** (carga el catálogo: ver los huecos antes que los logros, empezando por los que bloquean lo publicado, priorizar por cuánta gente lo pidió, avisar cuando termina) y **quien cura las frases** (equipo, editorial: el catálogo de stories lo nombra como rol distinto del de Sofía, sin persona propia entre las cuatro del equipo).

## Stories

Las de esta épica, con su letra completa: es la única copia de cada una (el [catálogo](../../domain/user-stories.md) es el índice por ID). Al entrar a sprint, la ficha `US-NNN` amplía la fila, no la reemplaza.

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| BO1-1 | Como quien carga el catálogo, quiero ver qué le falta a cada ficha antes que lo que ya cargué, porque una oferta a medias miente más que una que no existe. | 1. La pantalla abre por huecos y cada oferta muestra cuántos campos le faltan.<br>2. Entre los huecos están los dos que bloquean lo publicado: la duración nominal del plan (sin ella no hay brecha ni cohorte cerrada) y la carrera canónica (sin ella Dónde estudiarla no sabe qué compara). |  |
| BO1-2 | Como quien carga el catálogo, quiero que la cola se ordene por cuántos lo pidieron, porque cargar por orden de llegada deja afuera a los que más lo necesitan. | Los pedidos se ordenan por cantidad y muestran de qué institución vienen. |  |
| BO1-3 | Como quien carga el catálogo, quiero avisarle a los que esperaban cuando termino, porque si no se enteran, el pedido fue trabajo tirado de los dos lados. | Al marcar una oferta como cargada sale el aviso a todos los que la pidieron. | par de O2-4 |
| BO1-4 | Como quien carga el catálogo, quiero contrastar una corrección contra la fuente antes de aplicarla, porque aceptar porque sí convierte el dato duro en otra opinión. | La corrección muestra valor viejo y nuevo, y aplicarla queda registrada con quién la aprobó. |  |
| BO1-5 | Como quien carga el catálogo, quiero declarar que dos ofertas de instituciones distintas son la misma carrera, porque comparar por parecido de nombre es comparar cualquier cosa. | Cada oferta queda atada a una carrera canónica nuestra, la decisión queda registrada con autor y fecha, y Dónde estudiarla solo pone lado a lado ofertas de la misma canónica. |  |
| BO1-6 | Como quien carga el catálogo, quiero cargar la cátedra como el equipo docente a cargo de una materia, porque es lo que el alumno recuerda al reseñar y hoy en el catálogo no existe. | La cátedra es una entidad propia (materia más equipo docente, con su titular), persiste entre períodos, y es la lista que Reseñar ofrece cuando el alumno la recuerda. | épica: se parte al planificar |
| BO1-7 | Como quien carga el catálogo, quiero vincular a la materia canónica las materias que alguien nombró y no están, porque si cada plan tiene su propia materia, las voces del plan viejo no se suman a las del nuevo. | La cola de materias declaradas muestra cuántas personas nombraron cada una, se vinculan o se fusionan contra la materia canónica de la carrera, y queda registrado quién lo hizo. |  |
| BO1-8 | Como quien cura las frases, quiero editar en un solo lugar la redacción, el sujeto y el eje de cada frase, porque el eje es la atribución y un eje mal puesto es un error en todas las fichas que usan esa frase. | El catálogo de frases se edita en un lugar, cada cambio queda con autor y fecha, corregir un eje reprocesa las fichas afectadas, y lo que Método publica es exactamente ese catálogo, entero. | épica: se parte al planificar |
| BO1-9 | Como quien cura las frases, quiero revisar lo que la destilación propone antes de que se pueda marcar, porque una frase que nadie dijo, ofrecida para marcar, se vuelve un hecho que inventamos nosotros. | 1. Las frases destiladas llegan a una cola con los comentarios de los que salieron.<br>2. Se aprueban o se descartan con su sujeto y su eje asignados; solo se ofrecen para marcar después de aprobadas.<br>3. La ficha las muestra como destiladas: síntesis, no cita. | épica: se parte al planificar |
| BO4-1 | Como quien carga el catálogo, quiero ver la cola cuando tiene doscientos pendientes, porque puedo cargar dos carreras por semana y la demanda no espera. | La cola muestra cuánto se tarda en promedio y qué queda afuera del mes, sin fingir que se resuelve todo. | P2; tema del mapa: BO4 · Cuando la carga no da abasto |
| BO4-2 | Como quien carga el catálogo, quiero corregir algo que cargué mal, porque cuarenta personas están usando una correlativa que puse equivocada. | Se puede editar una oferta publicada, y los que la tienen marcada se enteran de qué cambió. | P1; tema del mapa: BO4 · Cuando la carga no da abasto |
| BO4-3 | Como quien carga el catálogo, quiero poder cargar algo cuya fuente no existe o se contradice, porque hay facultades que no publican el plan, o publican dos versiones que no coinciden. | El campo admite marcar de dónde salió el dato, y la ficha lo muestra cuando no es fuente oficial. | P2; tema del mapa: BO4 · Cuando la carga no da abasto |
| BO4-5 | Como quien carga el catálogo, quiero decidir qué cargar el primer día, porque al principio no hay pedidos: no hay usuarios que pidan. | La cola arranca con un criterio explícito de arranque, no vacía y esperando demanda. | P2; tema del mapa: BO4 · Cuando la carga no da abasto |
| BO5-1 | Como quien carga el catálogo, quiero saber qué pasa con lo reseñado cuando la facultad reforma el plan, porque la gente cursó el plan viejo y lo que marcó no deja de ser cierto. | Los dos planes coexisten con su año, y cada reseña queda pegada al período y a la materia canónica, no a la fila del plan, para que reformar no parta el corpus en dos. | P1; depende de BO1-7; tema del mapa: BO5 · Cuando el corpus está bajo ataque |

Las filas con "tema del mapa" vienen de los grupos transversales del mapa (BO4 · Cuando la carga no da abasto; BO5 · Cuando el corpus está bajo ataque): son temas, no actividades, y cada una de sus stories vive en la única épica que la implementa. El índice del [catálogo](../../domain/user-stories.md) conserva el tema como lista.

## Decisiones que aplica

Los tres planos del [mapa de producto](../../design/product-map.md) (el catálogo lo cargamos nosotros, a mano y completo; una carrera está cargada entera o no está), [ADR-0067](../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (la carrera canónica curada por nosotros; la duración nominal del plan), [ADR-0065](../../decisions/0065-attribution-is-the-axis-not-a-split.md) (el eje de cada frase es la atribución: corregirlo reprocesa las fichas), [ADR-0064](../../decisions/0064-phrases-with-voices-not-scores.md) (las frases semilla y las destiladas; la destilación es dato derivado), [ADR-0068](../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (punto 7: el comentario alimenta la destilación siempre, se publique o no), D08 ([registro del 17](../../reviews/2026-08-17-catalog-propagation.md): la pendiente de vincular no cuenta ni entra a la cobertura hasta que el catálogo la vincula). El catálogo de frases con sus seis reglas: [`phrases.md`](../../domain/phrases.md).

## Pantallas

Las cuatro que existen solo para esta épica viven acá, con su ficha y su boceto:

- [**Pedidos**](screens/requests/README.md) (backoffice): la cola de carga ordenada por pedidos confirmados, con la institución de origen; [boceto mid-fi](screens/requests/sketch.html).
- [**Catálogo**](screens/catalog/README.md) (backoffice): cargar una oferta por huecos, las materias canónicas, las cátedras, la carrera canónica, la reforma del plan y la cola de materias declaradas; [boceto mid-fi](screens/catalog/sketch.html) con sus varias vistas.
- [**Correcciones**](screens/corrections/README.md) (backoffice): valor viejo y nuevo a la vista, contrastados contra la fuente antes de aplicar; [boceto mid-fi](screens/corrections/sketch.html).
- [**Frases**](screens/phrases/README.md) (backoffice): el catálogo de frases con su redacción, sujeto y eje, y la cola de curaduría de las destiladas; [boceto mid-fi](screens/phrases/sketch.html).

Las que comparte con otras épicas viven en [`docs/design/screens/`](../../design/screens/README.md): la [Ficha de cátedra](../../design/screens/chair/README.md) (de donde llega una corrección) y la Ficha de materia (a donde va lo cargado), **Dónde estudiarla** (usa la carrera canónica que acá se declara), **La cola** (la vista pública de Pedidos, en [Pedir una carrera](../request-a-career/README.md)), **Método** (publica el catálogo de frases entero, en [Llevarse el dato](../take-the-data/README.md)) y los mails de [Avisos](../notices/README.md) (el aviso al terminar de cargar una oferta).

## Lo que esta épica todavía no resuelve

- **Qué pasa con las reseñas ya publicadas cuando se fusionan dos materias canónicas**: BO1-7 fusiona; si las voces de las dos se suman directo o hay un paso de revisión no está dicho.
- **Quién decide la carrera canónica cuando dos ofertas son parecidas pero no iguales**: BO1-5 pide que la decisión quede registrada con autor y fecha, no el criterio para tomarla.
- **Si la destilación corre cada cuánto y con qué modelo**: decisión técnica pendiente; BO1-9 solo fija que hay una cola de curaduría antes de ofrecer una frase.
- **Cómo se versiona el catálogo de frases** para que una cita de Rocío se reproduzca: O8-8 pide la fecha de lectura, no dice cómo se guarda el corte.
- **Cómo se calcula "cuánto se tarda"** en Pedidos (sobre qué ventana se promedia) y **qué pasa con lo que queda afuera del mes**: si se le avisa al que pidió o alcanza con que La cola lo muestre (BO4-1).
- **Si el criterio de arranque del primer día es una lista escrita** (las carreras de las personas del equipo, las más pedidas en otro lado) o una decisión que se toma cada vez (BO4-5).
- **Si la cátedra sigue siendo la misma entidad cuando cambia el titular** (BO1-6: "persiste entre períodos") o eso la vuelve una cátedra nueva.
