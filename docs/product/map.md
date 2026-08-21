# Product map

El índice del producto: qué pantallas hay y qué flujos las recorren, con el link a donde vive cada cosa. Lo que el canvas `plan-b mapa` (2026-08-16) definía como pantallas, flujos, planos y reglas ya tiene casa en el repo: cada pantalla con su ficha y su boceto adentro de la capacidad que la hace existir, los flujos en mermaid dentro de esa misma capacidad, en [`docs/product/`](../product/README.md), y las reglas en los ADRs y en el [catálogo de frases](../product/phrases.md). Los requisitos viven en el README de su capacidad ([índice](README.md)) y las personas en [`user-personas.md`](../product/personas.md). La tesis que gobierna todo: [`THESIS.md`](../THESIS.md).

**Estado**: orientativo. Es la estructura que el mapa propone, útil para entender qué vistas necesita el producto; **no fija el diseño final ni la UX/UI**: eso lo fija la ficha de cada pantalla cuando se escribe, desde sus requisitos y sus personas. El canvas del que salió todo está en el [ático](../history/product-canvas/README.md) desde el 2026-08-19: las 34 pantallas tienen ficha y boceto, y ninguna imagen ni canvas es fuente (ADR-0070).

## Los tres planos

1. **El catálogo.** Instituciones, carreras, planes, correlativas. Lo cargamos nosotros, a mano y completo: la calidad del dato base no se crowdsourcea. Una carrera está cargada entera o no está. Sin cobertura no hay nada: si la institución no está cargada no hay ficha, ni plan, ni materias. No inventamos una ficha vacía.
2. **Lo que publicamos.** Las frases con sus voces por eje, la atribución (que es la lectura de los ejes), la serie, los testimonios. Todo derivado del corpus, nada declarado a mano. La ausencia no es un juicio: decimos "no la cargamos todavía", no "no hay datos", y muchísimo menos un cero.
3. **Lo que hacemos.** Publicar, atribuir y exigir respuesta. Es el único plano donde alguien sin cobertura tiene lugar: el pedido es un dato público. Cuánta gente reclama que se cargue algo dice dónde la comunidad quiere que se mire y no llegamos.

## Las pantallas (el sitemap)

Treinta y cuatro, más tres acciones inline que pasan adentro de una ficha (Reportar, Corregir, Votar: las dibuja el flujo de su capacidad). **Cada pantalla vive en la capacidad que la hace existir** ([ADR-0070](../decisions/0070-product-requirements-are-vertical-by-capability-and-design-is-text.md)): su ficha y su boceto están ahí, no acá. Esta tabla es el índice derivado: dice dónde está cada una, con qué slug y quién más le aporta. **Una pantalla se nombra por lo que dice arriba**, en español y sin backticks; la URL es código, en inglés, y se fija al entrar a sprint (los slugs de acá se verificaron contra `frontend/src/app/` el 2026-08-19).

### Elegir dónde estudiar · [`product/choose-where-to-study/`](../product/choose-where-to-study/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Inicio | [`home/`](../product/choose-where-to-study/screens/SC-004-home/README.md) | pública | `/` | La vitrina: qué es plan-b y la puerta a Explorar y Buscar. | identidad visual propia (ADR-0071) | mid-fi, revisada |
| Explorar | [`explore/`](../product/choose-where-to-study/screens/SC-003-explore/README.md) | pública | `/universities` (la lente de carreras no existe todavía) | El home real: dos lentes, carreras y universidades; el vacío en sus tres estados. | Pedir una carrera (el vacío explicado) | mid-fi, revisada |
| Buscar | [`search/`](../product/choose-where-to-study/screens/SC-006-search/README.md) | pública | sin slug (el topbar busca y no lleva a ninguna pantalla) | Los cuatro sujetos con ficha; un docente lleva a su cátedra; si no está, explica por qué. | Pedir una carrera | mid-fi, revisada |
| Dónde estudiarla | [`where-to-study/`](../product/choose-where-to-study/screens/SC-008-where-to-study/README.md) | pública | sin slug | Comparar las ofertas de la misma carrera canónica, lado a lado, sin ganador. | Llevarse el dato (el CSV para ordenar) | **hi-fi Boletín** |
| Ficha de carrera | [`career/`](../product/choose-where-to-study/screens/SC-001-career/README.md) | pública | sin slug (lo más cercano hoy: `/careers/[id]/plans`) | La carrera en una institución: cabecera con gate, listas por eje, trayectoria, co-cursada, el plan. | Mi carrera, Pedir una carrera, Reseñar | **hi-fi Boletín** |
| Ficha de materia | [`subject/`](../product/choose-where-to-study/screens/SC-007-subject/README.md) | pública | `/subjects/[id]` | La materia: frases, testimonios, correlativas, dónde se cae. | Cuidar lo publicado (votar, corregir), Deshacer (reportar), Reseñar | mid-fi, revisada |
| Ficha de cátedra | [`chair/`](../product/choose-where-to-study/screens/SC-002-chair/README.md) | pública | `/teachers/[id]` (propuesto `/chairs/[id]`: BO1-6) | La cátedra: cabecera, listas por eje, clases sin dar, serie, testimonios y réplica. | Reseñar, Cuidar lo publicado, Deshacer, Replicar | **hi-fi Boletín** |
| Ficha de institución | [`institution/`](../product/reply/screens/SC-005-institution/README.md) | pública | `/universities/[slug]/careers` (el chasis; se rehace) | El sujeto evaluado: lo que se dice de ella, sus carreras, su cobertura, la serie, la comparación. | Replicar, Reseñar (el evento institucional) | mid-fi, revisada |

### Reseñar · [`product/write-a-review/`](../product/write-a-review/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Reseñar | [`write-review/`](../product/write-a-review/screens/SC-015-write-review/README.md) | con cuenta | `/reviews/write` (existe el editor texto-libre: otro modelo) | El acto: materia, período, cómo terminó, frases, cátedra, alrededor, comentario con chequeo. | Cuando el catálogo no alcanza y discrepar son ramas suyas | **hi-fi Boletín** |
| Mi situación | [`my-status/`](../product/write-a-review/screens/SC-014-my-status/README.md) | con cuenta | sin slug | La pregunta de trayectoria de a uno, sin plan marcado. | Avisos (el mail anual la trae) | mid-fi, revisada |
| Anonimato | [`anonymity/`](../product/write-a-review/screens/SC-013-anonymity/README.md) | pública | `/about` (habla de otra cosa; se rehace) | Cómo te cubrimos: qué se publica y qué no, el chequeo, la verdad del grupo chico, la política. | Moderar sin romper el producto (la política de moderación) | mid-fi, revisada |

### Pedir una carrera · [`product/request-a-career/`](../product/request-a-career/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Pedir | [`request/`](../product/request-a-career/screens/SC-010-request/README.md) | pública, sin cuenta | sin slug (hoy gateado al onboarding) | Pedir una carrera con el mail y nada más, confirmado por link. | nadie más | mid-fi, revisada |
| La cola | [`queue/`](../product/request-a-career/screens/SC-009-queue/README.md) | pública | sin slug | Qué falta cargar: pedidos confirmados, cuáles ya están, cuánto se tarda. | Sostener el catálogo (la carga y su demora) | mid-fi, revisada |

### Mi carrera · [`product/my-career/`](../product/my-career/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Mi carrera | [`my-career/`](../product/my-career/screens/SC-011-my-career/README.md) | con cuenta | `/my-career` (el contenido se rehace) | Tu plan con correlativas, lo reseñado como hecho, lo marcado como preferencia, la co-cursada filtrada. | Sostener el catálogo (la reforma del plan) | mid-fi, revisada |
| Empezar | [`onboarding/`](../product/my-career/screens/SC-012-onboarding/README.md) | con cuenta | `/onboarding/*` (se rehace: muere «cargá tu historial») | Onboarding: marcás por dónde vas. Saltable y retomable. | Que no me molesten (la garantía) | mid-fi, revisada |

### Deshacer · [`product/undo/`](../product/undo/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Mis aportes | [`my-contributions/`](../product/undo/screens/SC-018-my-contributions/README.md) | con cuenta | `/reviews` | Lo que diste y qué cambió: voces por frase, lo pendiente, lo retenido, lo a medias. | Reseñar (qué sumó), Replicar (el aviso de réplica) | mid-fi, revisada |
| Editar | [`edit/`](../product/undo/screens/SC-017-edit/README.md) | con cuenta | sin slug | Editar o borrar un aporte; el comentario editado vuelve al chequeo. | Reseñar (el chequeo previo) | mid-fi, revisada |
| Baja | [`delete-account/`](../product/undo/screens/SC-016-delete-account/README.md) | con cuenta | sin slug | Dar de baja: anonimiza la identidad y preserva lo aportado. | nadie más | mid-fi, revisada |
| Mi perfil | [`my-profile/`](../product/undo/screens/SC-019-my-profile/README.md) | con cuenta | `/my-profile` | Tu cuenta y por dónde vas; donde se apagan los avisos y se llega a la Baja. | Avisos (el apagado), Cuidar lo publicado (la señal) | mid-fi, revisada |

### Replicar · [`product/reply/`](../product/reply/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Responder | [`respond/`](../product/reply/screens/SC-020-respond/README.md) | identidad verificada | sin slug | La réplica: mismo chequeo, no cita lo marcado, retenida el plazo desde el aviso. | Moderar sin romper el producto (la cola de retenidos) | mid-fi, revisada |

### Cuidar lo publicado · [`product/care-for-what-is-published/`](../product/care-for-what-is-published/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Verificar | [`verify/`](../product/care-for-what-is-published/screens/SC-022-verify/README.md) | con cuenta | `/verify-teacher` (hoy solo docente) | La constancia de alumno (señal) y la identidad docente (permiso), cada una a su cola. | Replicar (la identidad docente habilita responder) | mid-fi, revisada |

### Llevarse el dato · [`product/take-the-data/`](../product/take-the-data/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Método | [`method/`](../product/take-the-data/screens/SC-021-method/README.md) | pública | sin slug (hoy sección de la landing) | La fórmula, el catálogo de frases, los sesgos, qué no cubrimos, lo bajado, la descarga del crudo. | Elegir dónde estudiar (se llega desde toda ficha) | mid-fi, revisada |

### Avisos · [`product/notices/`](../product/notices/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Avisos | [`mail/`](../product/notices/screens/SC-034-mail/README.md) | mail | sin slug | Los cinco mails que cierran el circuito, y dónde se apaga cada uno. | Reseñar, Pedir una carrera, Replicar, Sostener el catálogo | mid-fi, revisada |

### Entrar · [`product/enter/`](../product/enter/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Ingresar | [`sign-in/`](../product/enter/screens/SC-025-sign-in/README.md) | umbral | `/sign-in` | Con el motivo a la vista y vuelta a donde ibas: el gate está en la acción. | Reseñar, Cuidar lo publicado (las acciones que lo disparan) | mid-fi, revisada |
| Registro | [`sign-up/`](../product/enter/screens/SC-026-sign-up/README.md) | umbral | `/sign-up` | Quién sos, institución y carrera: declarar dónde estás, no elegir. | Pedir una carrera (precarga), Que no me molesten | mid-fi, revisada |
| Recuperar | [`forgot-password/`](../product/enter/screens/SC-024-forgot-password/README.md) | umbral | `/forgot-password` | La cuenta con todo adentro vuelve con un link al mail (garantía). | Que no me molesten | mid-fi, revisada |
| Error | [`error/`](../product/enter/screens/SC-023-error/README.md) | pública | sin slug | Se rompió: qué pasó, qué hacer, y que lo tuyo no se perdió. | Reseñar (lo a medias se guarda) | mid-fi, revisada |

### Sostener el catálogo · [`product/sustain-the-catalog/`](../product/sustain-the-catalog/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Pedidos | [`requests/`](../product/sustain-the-catalog/screens/SC-030-requests/README.md) | backoffice | sin slug (el endpoint existe; la pantalla no) | La cola de carga por pedidos confirmados, con su demora declarada. | Pedir una carrera (de dónde vienen) | mid-fi, revisada |
| Catálogo | [`catalog/`](../product/sustain-the-catalog/screens/SC-027-catalog/README.md) | backoffice | `/admin/universities`, `/admin/teachers`, `/admin/commissions` | Cargar una oferta por huecos: plan, materias canónicas, cátedras, carrera canónica; la reforma. | Cuando el catálogo no alcanza (la materia pendiente) | mid-fi, revisada |
| Correcciones | [`corrections/`](../product/sustain-the-catalog/screens/SC-028-corrections/README.md) | backoffice | sin slug | Datos duros corregidos: valor viejo y nuevo, contrastados contra la fuente. | Cuidar lo publicado (de dónde llegan) | mid-fi, revisada |
| Frases | [`phrases/`](../product/sustain-the-catalog/screens/SC-029-phrases/README.md) | backoffice | sin slug | El catálogo de frases: redacción, sujeto, eje; la cola de curaduría de las destiladas. | Llevarse el dato (Método lo publica entero) | mid-fi, revisada |

### Moderar sin romper el producto · [`product/moderate-without-breaking-the-product/`](../product/moderate-without-breaking-the-product/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Reportes | [`reports/`](../product/moderate-without-breaking-the-product/screens/SC-031-reports/README.md) | backoffice | `/admin/moderacion/reportes` (castellano, contra la convención: se renombra) | Dos colas: lo reportado, que sigue publicado, y lo retenido por el chequeo previo. | Deshacer (reportar), Reseñar y Replicar (lo retenido), Llevarse el dato (lo contable) | mid-fi, revisada |
| Verificaciones | [`verifications/`](../product/moderate-without-breaking-the-product/screens/SC-032-verifications/README.md) | backoffice | sin slug | Dos colas separadas: constancias de alumno e identidad docente. | Cuidar lo publicado, Replicar | mid-fi, revisada |

### Cortar los accesos · [`product/cut-the-access/`](../product/cut-the-access/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Equipo | [`team/`](../product/cut-the-access/screens/SC-033-team/README.md) | backoffice | sin slug | Altas, roles excluyentes, bajas; el registro de quién hizo qué y qué se publica de él. | Moderar y Sostener el catálogo (las colas que cada rol ve) | mid-fi, revisada |

## Los flujos

Cada flujo del mapa vive, como diagrama en mermaid con sus ramas, salidas y errores, en la capacidad que lo contiene. La fila de acá es el índice: el número que el mapa le daba, el nombre, y dónde está.

### Del producto (15)

| # | Flujo del mapa | Vive en |
|---|---|---|
| 01 | Valentina tiene que elegir en dos meses | [Elegir dónde estudiar](../product/choose-where-to-study/flow.md) |
| 02 | Ana busca la suya y no está | [Pedir una carrera](../product/request-a-career/flow.md) |
| 03 | Matías vuelve, y esta vez completa | [Reseñar](../product/write-a-review/flow.md) (la entrada: Ingresar / Registro → Empezar → Reseñar; la primera reseña pregunta el año de ingreso) |
| 04 | Lucía no quiere repetir el error | [Mi carrera](../product/my-career/flow.md) |
| 05 | Lucía reseña, y le lleva cinco minutos | [Reseñar](../product/write-a-review/flow.md) |
| 06 | Claudia contesta, con nombre porque es público | [Replicar](../product/reply/flow.md) |
| 07 | Rocío se lleva el dato | [Llevarse el dato](../product/take-the-data/flow.md) |
| 08 | Los avisos, lo que cierra el circuito | [Avisos](../product/notices/flow.md) |
| 09 | Deshacer, lo que hace que se animen | [Deshacer](../product/undo/flow.md) |
| 10 | Los evaluados, responder y abandonar | [Replicar](../product/reply/flow.md) (responder) y [Reseñar](../product/write-a-review/flow.md) (Mi situación: me fui, cuándo) |
| 11 | Buscar, cuando te recomiendan una persona | [Elegir dónde estudiar](../product/choose-where-to-study/flow.md) |
| 12 | El texto que te delata sin nombrar a nadie | [Reseñar](../product/write-a-review/flow.md) (el chequeo previo y el aviso de la sospecha) |
| 13 | La ficha vacía y el primero que aporta | [Elegir dónde estudiar](../product/choose-where-to-study/flow.md) (la ficha vacía) y [Reseñar](../product/write-a-review/flow.md) (el primero que aporta) |
| 14 | Cuando el dato no me alcanza | [Reseñar](../product/write-a-review/flow.md) (la materia que no está, la recursada, lo que quedó a medias, qué cambió) y [Sostener el catálogo](../product/sustain-the-catalog/flow.md) (vincular la pendiente) |
| 15 | Cuando la frase no se sostiene sola | [Elegir dónde estudiar](../product/choose-where-to-study/flow.md) (de cuándo son los testimonios; de qué voces está hecha cada ficha) |

Sin fila en el mapa y con flujo propio: [Cuidar lo publicado](../product/care-for-what-is-published/flow.md) (votar, corregir, verificarse: las acciones inline). Discrepar (marcar lo contrario no es reportar) es una rama de [Reseñar](../product/write-a-review/flow.md). [Que no me molesten](../product/do-not-bother-me/README.md) es garantía y no tiene flujo. Los grupos T2, T3 y T4 del mapa son temas, no actividades: sus requisitos viven en la capacidad que los implementa (el [índice](README.md) los lista por tema).

### Del backoffice (9)

| # | Flujo del mapa | Vive en |
|---|---|---|
| BO-1 | Cargar lo que piden, por prioridad | [Sostener el catálogo](../product/sustain-the-catalog/flow.md) |
| BO-2 | Contrastar una corrección contra la fuente | [Sostener el catálogo](../product/sustain-the-catalog/flow.md) |
| BO-3 | Moderar sin bajar la queja incómoda | [Moderar sin romper el producto](../product/moderate-without-breaking-the-product/flow.md) |
| BO-4 | Ver un nombre una sola vez | [Moderar sin romper el producto](../product/moderate-without-breaking-the-product/flow.md) |
| BO-5 | Cuando la facultad reforma el plan | [Sostener el catálogo](../product/sustain-the-catalog/flow.md) |
| BO-6 | Cuando alguien intenta inflar el corpus | [Moderar sin romper el producto](../product/moderate-without-breaking-the-product/flow.md) |
| BO-7 | Cuando la cola nos gana, y quién nos mira | [Sostener el catálogo](../product/sustain-the-catalog/flow.md) (la cola del catálogo), [Moderar sin romper el producto](../product/moderate-without-breaking-the-product/flow.md) (la cola de moderación) y [Cortar los accesos](../product/cut-the-access/flow.md) (el registro y quién lo mira) |
| BO-8 | Lo que el chequeo previo retuvo | [Moderar sin romper el producto](../product/moderate-without-breaking-the-product/flow.md) |
| BO-9 | Destilar y clasificar frases nuevas | [Sostener el catálogo](../product/sustain-the-catalog/flow.md) |

Los grupos BO4, BO5 y BO6 del mapa son temas, no actividades: sus requisitos viven en Sostener el catálogo, Moderar sin romper el producto y Cortar los accesos.

## Reglas del corpus

Las dos reglas que el canvas traía están cerradas en su lugar: **no hay desbloqueos por volumen** (ni escalera ni piso: todo se publica desde la primera voz con sus voces y su encogimiento; lo único que espera es la cabecera derivada, hasta que más de la mitad de las materias canónicas de la carrera tenga voces: [ADR-0066](../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)); y **las frases** son el catálogo de [`phrases.md`](../product/phrases.md), con el sujeto y el eje de cada una, que Método publica entero y la atribución sale del eje ([ADR-0065](../decisions/0065-attribution-is-the-axis-not-a-split.md)).

## Estado contra el código (cruce 2026-08-16)

Lo que el repo ya tiene, mapeado contra las pantallas. "Existe" significa que el chasis existe; donde el contenido cambia (fichas con escrutinio en vez de reseñas texto-libre), el chasis se conserva y el contenido se rehace. El slug de cada una está en el [inventario](../README.md).

| Carril | Existe (chasis) | Adaptar | Nuevo de cero |
|---|---|---|---|
| Públicas | Inicio, Dónde estudiarla, Ficha de institución, Ficha de carrera, Ficha de materia, Ficha de cátedra (fichas públicas del catálogo actual) | Explorar (hoy el browse rico es member-only), Método (hoy sección de la landing), Anonimato (about existe, habla de otra cosa), Pedir (existe gateado al onboarding) | La cola, Error |
| Umbral | Ingresar, Registro, Recuperar (auth completo) | | |
| Con cuenta | Empezar, Mi carrera, Mis aportes, Mi perfil (chasis del onboarding, mi carrera y mis reseñas) | Reseñar (existe el editor texto-libre; el acto de frases es otro modelo), Verificar (existe solo para docentes) | |
| Backoffice | Catálogo (backoffice) (ABM completo), Reportes (backoffice) (cola de moderación) | Pedidos (backoffice) (el endpoint de cola existe; la pantalla no) | Correcciones (backoffice), Verificaciones (backoffice), Equipo (backoffice), Frases (backoffice) |

Lo que no existe en ningún módulo del backend y es el corazón del build: el sistema de frases (modelo, conteos, sujeto y eje), las proporciones de voces con encogimiento, la cola pública de pedidos, la verificación de alumno por constancia, y las seis pantallas diseñadas sin construir (Responder, Buscar, Editar, Mi situación, Baja, Avisos).

## Auditoría del mapa (2026-08-16)

Los siete hallazgos de revisar el mapa contra sí mismo, contra la tesis y contra el repo viven con su estado en [`docs/history/reviews/2026-08-16-product-map.md`](../history/reviews/2026-08-16-product-map.md).
