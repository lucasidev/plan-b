# Product map

El índice del producto: qué pantallas hay y qué flujos las recorren, con el link a donde vive cada cosa. Lo que el canvas `plan-b mapa` (2026-08-16) definía como pantallas, flujos, planos y reglas ya tiene casa en el repo: las pantallas en [`screens/`](screens/README.md) (el inventario con su carpeta, su slug y las épicas que las componen), los flujos en mermaid dentro de su épica en [`docs/epics/`](../epics/README.md), las reglas en los ADRs y en el [catálogo de frases](../domain/phrases.md). Las user stories viven en [`user-stories.md`](../domain/user-stories.md) y las personas en [`user-personas.md`](../domain/user-personas.md). La tesis que gobierna todo: [`THESIS.md`](../THESIS.md).

**Estado**: orientativo. Es la estructura que el mapa propone, útil para entender qué vistas necesita el producto; **no fija el diseño final ni la UX/UI**: eso lo fija la ficha de cada pantalla cuando se escribe, desde sus stories y sus personas. El canvas del que salió todo está en el [ático](../history/product-canvas/README.md) desde el 2026-08-19: las 34 pantallas tienen ficha y boceto, y ninguna imagen ni canvas es fuente (ADR-0070).

## Los tres planos

1. **El catálogo.** Instituciones, carreras, planes, correlativas. Lo cargamos nosotros, a mano y completo: la calidad del dato base no se crowdsourcea. Una carrera está cargada entera o no está. Sin cobertura no hay nada: si la institución no está cargada no hay ficha, ni plan, ni materias. No inventamos una ficha vacía.
2. **Lo que publicamos.** Las frases con sus voces por eje, la atribución (que es la lectura de los ejes), la serie, los testimonios. Todo derivado del corpus, nada declarado a mano. La ausencia no es un juicio: decimos "no la cargamos todavía", no "no hay datos", y muchísimo menos un cero.
3. **Lo que hacemos.** Publicar, atribuir y exigir respuesta. Es el único plano donde alguien sin cobertura tiene lugar: el pedido es un dato público. Cuánta gente reclama que se cargue algo dice dónde la comunidad quiere que se mire y no llegamos.

## Las pantallas

Treinta y cuatro: doce públicas, tres del umbral, seis con cuenta, seis diseñadas sin construir, siete del backoffice, más tres acciones inline que pasan adentro de la ficha. El inventario completo, con la carpeta de cada una, el slug en código verificado contra `frontend/src/app/`, qué es y qué épicas la componen: [`screens/README.md`](screens/README.md). **Una pantalla se nombra por lo que dice arriba**, en español, sin backticks (Mi carrera, Dónde estudiarla, Método, Reseñar, Ficha de cátedra); la URL es código, en inglés, y se fija al entrar a sprint.

## Los flujos

Cada flujo del mapa vive, como diagrama en mermaid con sus ramas, salidas y errores, en la épica que lo contiene. La fila de acá es el índice: el número que el mapa le daba, el nombre, y dónde está.

### Del producto (15)

| # | Flujo del mapa | Vive en |
|---|---|---|
| 01 | Valentina tiene que elegir en dos meses | [Elegir dónde estudiar](../epics/choose-where-to-study/flow.md) |
| 02 | Ana busca la suya y no está | [Pedir una carrera](../epics/request-a-career/flow.md) |
| 03 | Matías vuelve, y esta vez completa | [Reseñar](../epics/write-a-review/flow.md) (la entrada: Ingresar / Registro → Empezar → Reseñar; la primera reseña pregunta el año de ingreso) |
| 04 | Lucía no quiere repetir el error | [Mi carrera](../epics/my-career/flow.md) |
| 05 | Lucía reseña, y le lleva cinco minutos | [Reseñar](../epics/write-a-review/flow.md) |
| 06 | Claudia contesta, con nombre porque es público | [Replicar](../epics/reply/flow.md) |
| 07 | Rocío se lleva el dato | [Llevarse el dato](../epics/take-the-data/flow.md) |
| 08 | Los avisos, lo que cierra el circuito | [Avisos](../epics/notices/flow.md) |
| 09 | Deshacer, lo que hace que se animen | [Deshacer](../epics/undo/flow.md) |
| 10 | Los evaluados, responder y abandonar | [Replicar](../epics/reply/flow.md) (responder) y [Reseñar](../epics/write-a-review/flow.md) (Mi situación: me fui, cuándo) |
| 11 | Buscar, cuando te recomiendan una persona | [Elegir dónde estudiar](../epics/choose-where-to-study/flow.md) |
| 12 | El texto que te delata sin nombrar a nadie | [Reseñar](../epics/write-a-review/flow.md) (el chequeo previo y el aviso de la sospecha) |
| 13 | La ficha vacía y el primero que aporta | [Elegir dónde estudiar](../epics/choose-where-to-study/flow.md) (la ficha vacía) y [Reseñar](../epics/write-a-review/flow.md) (el primero que aporta) |
| 14 | Cuando el dato no me alcanza | [Reseñar](../epics/write-a-review/flow.md) (la materia que no está, la recursada, lo que quedó a medias, qué cambió) y [Sostener el catálogo](../epics/sustain-the-catalog/flow.md) (vincular la pendiente) |
| 15 | Cuando la frase no se sostiene sola | [Elegir dónde estudiar](../epics/choose-where-to-study/flow.md) (de cuándo son los testimonios; de qué voces está hecha cada ficha) |

Sin fila en el mapa y con flujo propio: [Cuidar lo publicado](../epics/care-for-what-is-published/flow.md) (votar, corregir, verificarse: las acciones inline). Discrepar (marcar lo contrario no es reportar) es una rama de [Reseñar](../epics/write-a-review/flow.md). [Que no me molesten](../epics/do-not-bother-me/README.md) es garantía y no tiene flujo. Los grupos T2, T3 y T4 del mapa son temas, no actividades: sus stories viven en la épica que las implementa (el [catálogo](../domain/user-stories.md) las lista por tema).

### Del backoffice (9)

| # | Flujo del mapa | Vive en |
|---|---|---|
| BO-1 | Cargar lo que piden, por prioridad | [Sostener el catálogo](../epics/sustain-the-catalog/flow.md) |
| BO-2 | Contrastar una corrección contra la fuente | [Sostener el catálogo](../epics/sustain-the-catalog/flow.md) |
| BO-3 | Moderar sin bajar la queja incómoda | [Moderar sin romper el producto](../epics/moderate-without-breaking-the-product/flow.md) |
| BO-4 | Ver un nombre una sola vez | [Moderar sin romper el producto](../epics/moderate-without-breaking-the-product/flow.md) |
| BO-5 | Cuando la facultad reforma el plan | [Sostener el catálogo](../epics/sustain-the-catalog/flow.md) |
| BO-6 | Cuando alguien intenta inflar el corpus | [Moderar sin romper el producto](../epics/moderate-without-breaking-the-product/flow.md) |
| BO-7 | Cuando la cola nos gana, y quién nos mira | [Sostener el catálogo](../epics/sustain-the-catalog/flow.md) (la cola del catálogo), [Moderar sin romper el producto](../epics/moderate-without-breaking-the-product/flow.md) (la cola de moderación) y [Cortar los accesos](../epics/cut-the-access/flow.md) (el registro y quién lo mira) |
| BO-8 | Lo que el chequeo previo retuvo | [Moderar sin romper el producto](../epics/moderate-without-breaking-the-product/flow.md) |
| BO-9 | Destilar y clasificar frases nuevas | [Sostener el catálogo](../epics/sustain-the-catalog/flow.md) |

Los grupos BO4, BO5 y BO6 del mapa son temas, no actividades: sus stories viven en Sostener el catálogo, Moderar sin romper el producto y Cortar los accesos.

## Reglas del corpus

Las dos reglas que el canvas traía están cerradas en su lugar: **no hay desbloqueos por volumen** (ni escalera ni piso: todo se publica desde la primera voz con sus voces y su encogimiento; lo único que espera es la cabecera derivada, hasta que más de la mitad de las materias canónicas de la carrera tenga voces: [ADR-0066](../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)); y **las frases** son el catálogo de [`phrases.md`](../domain/phrases.md), con el sujeto y el eje de cada una, que Método publica entero y la atribución sale del eje ([ADR-0065](../decisions/0065-attribution-is-the-axis-not-a-split.md)).

## Estado contra el código (cruce 2026-08-16)

Lo que el repo ya tiene, mapeado contra las pantallas. "Existe" significa que el chasis existe; donde el contenido cambia (fichas con escrutinio en vez de reseñas texto-libre), el chasis se conserva y el contenido se rehace. El slug de cada una está en el [inventario](screens/README.md).

| Carril | Existe (chasis) | Adaptar | Nuevo de cero |
|---|---|---|---|
| Públicas | Inicio, Dónde estudiarla, Ficha de institución, Ficha de carrera, Ficha de materia, Ficha de cátedra (fichas públicas del catálogo actual) | Explorar (hoy el browse rico es member-only), Método (hoy sección de la landing), Anonimato (about existe, habla de otra cosa), Pedir (existe gateado al onboarding) | La cola, Error |
| Umbral | Ingresar, Registro, Recuperar (auth completo) | | |
| Con cuenta | Empezar, Mi carrera, Mis aportes, Mi perfil (chasis del onboarding, mi carrera y mis reseñas) | Reseñar (existe el editor texto-libre; el acto de frases es otro modelo), Verificar (existe solo para docentes) | |
| Backoffice | Catálogo (backoffice) (ABM completo), Reportes (backoffice) (cola de moderación) | Pedidos (backoffice) (el endpoint de cola existe; la pantalla no) | Correcciones (backoffice), Verificaciones (backoffice), Equipo (backoffice), Frases (backoffice) |

Lo que no existe en ningún módulo del backend y es el corazón del build: el sistema de frases (modelo, conteos, sujeto y eje), las proporciones de voces con encogimiento, la cola pública de pedidos, la verificación de alumno por constancia, y las seis pantallas diseñadas sin construir (Responder, Buscar, Editar, Mi situación, Baja, Avisos).

## Auditoría del mapa (2026-08-16)

Los siete hallazgos de revisar el mapa contra sí mismo, contra la tesis y contra el repo viven con su estado en [`docs/reviews/2026-08-16-product-map.md`](../reviews/2026-08-16-product-map.md).
