# Catálogo (la pantalla)

> Ficha de pantalla, dueña: la épica [Sostener el catálogo](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de varias vistas (huecos, cargar el plan, cátedras, atar la canónica, publicar, editar, reforma, materias declaradas); revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-epics-and-screens.md)); hi-fi pendiente. Backoffice, rol catálogo (hoy Sofía). Slug hoy `/admin/universities`, `/admin/teachers`, `/admin/chairs` (existe el ABM; el contenido se rehace).

## Quién la usa

**Sofía** ("puedo cargar dos carreras por semana. Este mes me pidieron once"): carga planes, correlativas, la duración nominal, las cátedras y las materias canónicas a mano, porque la calidad del dato base es lo único que no se crowdsourcea, y decide qué ofertas de distintas instituciones son la misma carrera canónica. El flujo entero: [`flow.md`](../../flow.md), secciones BO-1 y BO-5.

## Qué stories resuelve

US-191 (dueña: la pantalla abre por huecos, y entre ellos los dos que bloquean publicar), US-196 (la cátedra como entidad propia, con su titular) (el equipo docente de la cátedra, con el nombre de cada integrante, contra el que se verifica a quien pide responder), US-224 (el cargo institucional atado a la lista corta de cargos genéricos, nunca al nombre textual), US-195 (atar la oferta a su carrera canónica, con autor y fecha), US-202 (la fuente que no existe o se contradice, marcada, sin bloquear la carga), US-201 (editar una oferta publicada y avisar a quienes declararon esa carrera), US-204 (los dos planes conviviendo cuando la facultad reforma), US-197 (la cola de materias declaradas, para vincular o fusionar contra la canónica) y [US-234](../../stories/US-234-maintain-a-complete-institution/README.md) (identidad, ubicación, unidades y afirmaciones oficiales de la institución). La letra de cada una: [README de la épica](../../README.md#stories).

## Qué muestra

Para una institución, Catálogo permite mantener su identidad, ubicación, dominios institucionales, unidades académicas y afirmaciones oficiales. Los conteos de unidades, carreras y planes se derivan del catálogo y cada oferta solo puede vincularse a una unidad de su propia institución (US-234).

**Interacción acordada el 2026-09-18, implementada parcialmente (detalle de lo construido abajo):**

- La cabecera conserva universidad, unidad académica cuando esté relevada, carrera, plan y materia, con enlaces a sus pantallas. Un acceso directo resuelve el mismo contexto que el recorrido desde la universidad.
- Los listados generales de docentes y cátedras son atajos: cada resultado identifica su contexto. Las altas dependientes heredan el padre elegido o piden seleccionarlo antes de mostrar el formulario.
- El detalle de cátedra muestra equipo actual e histórico y permite agregar integrantes y cerrar sus tramos. Los selectores ofrecen docentes y períodos del contexto; el error conserva los valores escritos. Si falta el docente, se puede cargar y regresar al mismo equipo.
- Guardar o cancelar vuelve al lugar de origen con sus filtros y selección. Salir con cambios sin guardar ofrece continuar editando o descartarlos. Una sesión vencida no convierte el retorno en una segunda ejecución del guardado.
- Archivar muestra el impacto antes de confirmar y registra el cierre efectivo separado de la fecha administrativa. La cátedra conserva su ficha pública y admite reseñas de cursadas anteriores al cierre, según US-196. El límite temporal y las reglas de reactivación siguen pendientes de precisión.

Para una oferta que se está cargando por primera vez:

1. **Huecos primero** (describe el destino: es US-191, en el Backlog; hoy el backoffice lista sin priorizar): la pantalla abre listando las ofertas por cuántos campos les faltan, no por las que ya están casi listas; entre los huecos, dos bloquean publicar y se marcan aparte, la duración nominal del plan y la carrera canónica (US-191).
2. **Cargar el plan**: duración nominal (sin ella no hay brecha ni cohorte cerrada, ADR-0085) y materias canónicas del plan, con su año; el contador de huecos baja a medida que se completa.
3. **Cátedras**: se cargan como entidad propia, el equipo docente a cargo de una materia con su titular, no como comisión; persisten entre períodos (US-196).
4. **Atar la carrera canónica**: buscar una carrera canónica existente o declarar una nueva; la decisión queda con quién la tomó y cuándo (US-195). Es lo que permite que Dónde estudiarla compare esta oferta con las de otras instituciones.
5. **Publicar**: bloqueado mientras falte un hueco bloqueante, aunque el resto esté cargado (US-191); resueltos los dos, el botón se habilita.

**Hoy, en el código**: el ABM existe, sin el recorrido por huecos que describe arriba.

- **Universidades** (`/admin/universities/[id]/edit`): mantiene nombre, slug y dominios; agrega sitio oficial, dirección, localidad resuelta por Georef y logo PNG según [ADR-0098](../../../../../decisions/0098-small-institution-logos-are-stored-with-the-catalog.md). Permite agregar y editar unidades académicas, vincular carreras de la misma universidad y registrar nuevas afirmaciones oficiales con fuente y fecha. Los conteos se derivan del catálogo. La ficha pública muestra la identidad relevada.

- **Cátedras** (`/admin/chairs`): se entra desde una materia o buscándola. La cabecera resuelve universidad, carrera, plan y materia. Crear abre el detalle `/admin/chairs/[id]?subjectId=...`, que verifica la pertenencia a la materia y muestra el equipo vigente e histórico. Permite agregar docentes activos de esa universidad y cerrar sus tramos con períodos del mismo contexto; el último período queda incluido. El backend rechaza un cierre cuyo fin sea anterior al inicio. Si falta un docente, el alta vuelve al detalle conservando rol y período en esta pestaña. Las archivadas se identifican y su equipo se puede consultar. La unidad académica en esta cadena, la confirmación general de cambios sin guardar y el archivo con cierre efectivo siguen pendientes.

- **Docentes** (`/admin/teachers`): la lista trae nombre, universidad, cargo (o "sin cargo") y estado, con "Editar" y "Desactivar" (pide confirmación) o "Reactivar" por fila. "+ Nuevo docente" abre el alta: universidad (fija en la edición, no se cambia), nombre, apellido, cargo opcional, bio opcional y una foto por URL con vista previa. Es el insumo de la cátedra (US-196): un docente existe acá antes de poder sumarlo a un equipo, con retorno al filtro de universidad después de guardar o cancelar.

**La fuente sin oficializar** (US-202): un campo admite marcarse "fuente: no oficial" cuando la facultad no publica el plan o publica versiones que no coinciden; no bloquea cargar, y la ficha pública lo muestra.

**Editar una oferta publicada** (US-201): cualquier campo se puede corregir después de publicada; guardar dispara el aviso a las cuentas que declararon esa carrera, con qué cambió.

**Cuando la facultad reforma el plan** (US-204): el plan nuevo no reemplaza al viejo, coexisten con su año; cada reseña ya hecha queda pegada al período y a la materia canónica, no a la fila del plan, así que reformar no parte el corpus en dos (D04).

**La cola de materias declaradas** (US-197): lo que alguien nombró al reseñar y el catálogo no tenía, con cuántas personas lo nombraron; se vincula a una materia canónica existente o se fusiona o crea una nueva, y queda registrado quién lo hizo.

## Estados

- **Carga o guardado en curso**: la pantalla identifica la operación y evita enviar la misma mutación dos veces.
- **Error de validación o red**: conserva el formulario; señala el campo cuando corresponde y permite corregir o reintentar.
- **Sin plan, materia o equipo relevado**: declara qué dato falta y ofrece su carga dentro del contexto conocido. No afirma que esa oferta o equipo no exista en la universidad.
- **Sin coincidencias**: conserva los filtros y permite cambiarlos; no confunde una búsqueda vacía con un catálogo vacío.
- **Archivada**: el equipo puede consultar el registro y su historia; las acciones disponibles y su impacto siguen el contrato de archivo/reactivación de cada entidad.

Los estados específicos de contraste de fuentes y guardado parcial de afirmaciones oficiales siguen pendientes en US-234.

## Lo que no muestra nunca

Una oferta publicada a medias: mientras falte un hueco bloqueante la oferta no sale, aunque el resto esté cargado (US-191); una carrera canónica decidida por parecido de nombre, es una decisión editorial registrada con autor y fecha, nunca automática (US-195); quién nombró una materia pendiente de vincular, solo cuántas personas lo hicieron.

## Adónde va

Llega desde [Pedidos](../SC-030-requests/README.md) (cada fila abre la oferta que le corresponde) y directo, para reformar un plan o corregir algo que ya está publicado. Lo que se publica acá alimenta la Ficha de carrera, la Ficha de materia, la [Ficha de cátedra](../../../../student/choose-where-to-study/screens/SC-002-chair/README.md) y [Dónde estudiarla](../../../../student/choose-where-to-study/screens/SC-008-where-to-study/README.md); marcar una oferta como cargada dispara el aviso desde Pedidos.

## Decisiones que aplica

[ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md) (la carrera canónica curada por nosotros, que es lo que hace comparable la misma carrera entre instituciones; la duración nominal del plan, contra la que se lee la duración real relevada de la fuente oficial), los tres planos del [mapa de producto](../../../../map.md) (el catálogo lo cargamos nosotros, a mano y completo), D04 ([registro del 17](../../../../../history/reviews/2026-08-17-catalog-propagation.md): con dos planes, la cobertura se mide sobre las materias canónicas de la carrera, la unión de los dos).

## Lo que esta ficha deja abierto

- **Qué pasa con las reseñas ya publicadas cuando se fusionan dos materias canónicas**: si las voces de las dos se suman directo o hay un paso de revisión (US-197, abierto también en el README de la épica).
- **Quién decide la carrera canónica cuando dos ofertas son parecidas pero no iguales**: US-195 pide que la decisión quede registrada con autor y fecha, no el criterio para tomarla.
- **Si la cátedra sigue siendo la misma entidad cuando cambia el titular**, o eso la vuelve una cátedra nueva (US-196).
- **Cómo se prioriza entre varios huecos bloqueantes a la vez**, cuando una oferta tiene más de uno (el flujo no lo dibuja).
