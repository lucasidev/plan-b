# Product map

El índice del producto: qué pantallas hay y qué flujos las recorren, con el link a donde vive cada cosa. Lo que el canvas `plan-b mapa` (2026-08-16) definía como pantallas, flujos, planos y reglas ya tiene casa en el repo: cada pantalla con su ficha y su boceto adentro de la capacidad que la hace existir, los flujos en mermaid dentro de esa misma capacidad, en [`docs/product/`](../product/README.md), y las reglas en los ADRs y en el [catálogo de ítems](../product/phrases.md). Los requisitos viven en el README de su capacidad ([índice](README.md)) y las personas en [`user-personas.md`](../product/personas.md). La tesis que gobierna todo: [`THESIS.md`](../THESIS.md).

**Estado**: orientativo. Es la estructura que el mapa propone, útil para entender qué vistas necesita el producto; **no fija el diseño final ni la UX/UI**: eso lo fija la ficha de cada pantalla cuando se escribe, desde sus requisitos y sus personas. El canvas del que salió todo está en el [ático](../history/product-canvas/README.md) desde el 2026-08-19: las 33 pantallas tienen ficha y boceto, y ninguna imagen ni canvas es fuente (ADR-0070).

## Los tres planos

1. **El catálogo.** Instituciones, carreras, planes, correlativas. Lo cargamos nosotros, a mano y completo: la calidad del dato base no se crowdsourcea. Una carrera está cargada entera o no está. Sin cobertura no hay nada: si la institución no está cargada no hay ficha, ni plan, ni materias. No inventamos una ficha vacía.
2. **Lo que publicamos.** Los conteos por ítem con sus voces (moda y distribución), la fama por convergencia, la comparación entre cátedras hermanas, la tasa de finalización agregada, la serie temporal. Todo derivado del corpus, nada declarado a mano. La ausencia no es un juicio: decimos "no la cargamos todavía", no "no hay datos", y muchísimo menos un cero.
3. **Lo que hacemos.** Publicar, atribuir y exigir respuesta. Es el único plano donde alguien sin cobertura tiene lugar: el pedido es un dato público. Cuánta gente reclama que se cargue algo dice dónde la comunidad quiere que se mire y no llegamos.

## Las pantallas (el sitemap)

Treinta y dos, más dos acciones inline que pasan adentro de una ficha (Reportar, Corregir: las dibuja el flujo de su capacidad). **Cada pantalla vive en la capacidad que la hace existir** ([ADR-0070](../decisions/0070-product-requirements-are-vertical-by-capability-and-design-is-text.md)): su ficha y su boceto están ahí, no acá. Esta tabla es el índice derivado: dice dónde está cada una, con qué slug y quién más le aporta. **Una pantalla se nombra por lo que dice arriba**, en español y sin backticks; la URL es código, en inglés, y se fija al entrar a sprint (los slugs de acá se verificaron contra `frontend/src/app/` el 2026-08-19).

### Elegir dónde estudiar · [`product/choose-where-to-study/`](student/choose-where-to-study/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| La entrada | [`entrance/`](student/choose-where-to-study/screens/SC-004-entrance/README.md) | pública | `/` | La vitrina: qué es plan-b y la puerta a Explorar y Buscar. No se llama Inicio: Inicio es `/home`, el aterrizaje de la aplicación con cuenta. | identidad visual propia (ADR-0071) | mid-fi, revisada |
| Explorar | [`explore/`](student/choose-where-to-study/screens/SC-003-explore/README.md) | pública | `/universities` (la lente de carreras no existe todavía) | El home real: dos lentes, carreras y universidades; el vacío en sus tres estados. | Pedir una carrera (el vacío explicado) | mid-fi, revisada |
| Buscar | [`search/`](student/choose-where-to-study/screens/SC-006-search/README.md) | pública | sin slug (el topbar busca y no lleva a ninguna pantalla) | Los cuatro sujetos con ficha; un docente lleva a su cátedra; si no está, explica por qué. | Pedir una carrera | mid-fi, revisada |
| Dónde estudiarla | [`where-to-study/`](student/choose-where-to-study/screens/SC-008-where-to-study/README.md) | pública | sin slug | Comparar las ofertas de la misma carrera canónica, lado a lado, sin ganador. | Llevarse el dato (el CSV para ordenar) | **hi-fi Boletín** |
| Ficha de carrera | [`career/`](student/choose-where-to-study/screens/SC-001-career/README.md) | pública | sin slug (lo más cercano hoy: `/careers/[id]/plans`) | La carrera en una institución: cabecera con gate, estructura por correlativas, cobertura, trayectoria, co-cursada, el plan. | Pedir una carrera, Reseñar | **hi-fi Boletín** |
| Ficha de materia | [`subject/`](student/choose-where-to-study/screens/SC-007-subject/README.md) | pública | `/subjects/[id]` | La materia: dispersión entre cátedras, correlativas, dónde se cae. | Cuidar lo publicado (corregir), Deshacer (reportar), Reseñar | mid-fi, revisada |
| Ficha de cátedra | [`chair/`](student/choose-where-to-study/screens/SC-002-chair/README.md) | pública | `/teachers/[id]` (propuesto `/chairs/[id]`: BO1-6) | La cátedra: cabecera con gate, fama por convergencia, los dos bloques (qué hizo, qué te pasó) con moda y distribución, comparación entre hermanas, tasa de finalización, serie, respuesta del reseñado. | Reseñar, Cuidar lo publicado, Deshacer, Responder | **hi-fi Boletín** |
| Ficha de institución | [`institution/`](reviewed/reply/screens/SC-005-institution/README.md) | pública | `/universities/[slug]/careers` (el chasis; se rehace) | El sujeto evaluado: lo que se dice de ella, sus carreras, su cobertura, la serie, las notas de curaduría. | Responder, Reseñar (el evento institucional) | mid-fi, revisada |

### Reseñar · [`product/write-a-review/`](student/write-a-review/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Reseñar | [`write-review/`](student/write-a-review/screens/SC-015-write-review/README.md) | con cuenta | `/reviews/write` (existe el editor texto-libre: otro modelo) | El acto: la cursada (materia, cátedra, período), cómo terminó, los ítems de conducta observable y de vivencia, el campo libre que no se publica. | Cuando el catálogo no alcanza es una rama suya | **hi-fi Boletín** |
| Mi situación | [`my-status/`](student/write-a-review/screens/SC-014-my-status/README.md) | con cuenta | sin slug | La pregunta de trayectoria de a uno, nunca como inventario. | Avisos (el mail anual la trae) | mid-fi, revisada |
| Anonimato | [`anonymity/`](student/write-a-review/screens/SC-013-anonymity/README.md) | pública | `/about` (habla de otra cosa; se rehace) | Cómo te cubrimos: qué se publica y qué no, por qué ya no hay chequeo previo (el campo libre nunca se publica), la verdad del grupo chico, la política. | Moderar sin romper el producto (la política de moderación) | mid-fi, revisada |

### Pedir una carrera · [`product/request-a-career/`](student/request-a-career/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Pedir | [`request/`](student/request-a-career/screens/SC-010-request/README.md) | pública, sin cuenta | sin slug (no hay implementación en el código todavía) | Pedir una carrera con el mail y nada más, confirmado por link. | nadie más | mid-fi, revisada |
| La cola | [`queue/`](student/request-a-career/screens/SC-009-queue/README.md) | pública | sin slug | Qué falta cargar: pedidos confirmados, cuáles ya están, cuánto se tarda. | Sostener el catálogo (la carga y su demora) | mid-fi, revisada |

### Deshacer · [`product/undo/`](student/undo/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Mis aportes | [`my-contributions/`](student/undo/screens/SC-018-my-contributions/README.md) | con cuenta | `/reviews` | Lo que diste y qué cambió: tus reseñas, lo pendiente, lo a medias. | Reseñar (qué sumó), Responder (el aviso de la respuesta del reseñado) | mid-fi, revisada |
| Editar | [`edit/`](student/undo/screens/SC-017-edit/README.md) | con cuenta | sin slug | Editar o borrar un aporte: la reseña entera, o una respuesta de a una; el campo libre se edita directo, sin chequeo. | Reseñar (qué sumó cada ítem) | mid-fi, revisada |
| Baja | [`delete-account/`](student/undo/screens/SC-016-delete-account/README.md) | con cuenta | sin slug | Dar de baja: anonimiza la identidad y preserva lo aportado. | nadie más | mid-fi, revisada |
| Mi perfil | [`my-profile/`](student/undo/screens/SC-019-my-profile/README.md) | con cuenta | `/my-profile` | Tu cuenta y por dónde vas; donde se apagan los avisos y se llega a la Baja. | Avisos (el apagado), Cuidar lo publicado (la señal) | mid-fi, revisada |

### Responder · [`product/reply/`](reviewed/reply/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Responder | [`respond/`](reviewed/reply/screens/SC-020-respond/README.md) | identidad verificada | sin slug | La respuesta del reseñado: firmada con nombre y cargo, a los números agregados de la ficha; hasta que llega, la ficha dice "Sin respuesta · avisada el [fecha]". | Moderar sin romper el producto (la cola de verificación de identidad) | mid-fi, revisada |

### Cuidar lo publicado · [`product/care-for-what-is-published/`](student/care-for-what-is-published/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Verificar | [`verify/`](student/care-for-what-is-published/screens/SC-022-verify/README.md) | con cuenta | `/verify-teacher` (hoy solo docente) | La constancia de alumno (señal) y la identidad docente (permiso), cada una a su cola. | Responder (la identidad docente habilita esa respuesta) | mid-fi, revisada |

### Llevarse el dato · [`product/take-the-data/`](student/take-the-data/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Método | [`method/`](student/take-the-data/screens/SC-021-method/README.md) | pública | sin slug (hoy sección de la landing) | El catálogo de ítems, la regla de comparación entre hermanas, el piso, los sesgos, qué no cubrimos, las fuentes oficiales, la descarga del CSV agregado. | Elegir dónde estudiar (se llega desde toda ficha) | mid-fi, revisada |

### Avisos · [`product/notices/`](../product/notices/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Avisos | [`mail/`](notices/screens/SC-034-mail/README.md) | mail | sin slug | Los cinco mails que cierran el circuito, y dónde se apaga cada uno. | Reseñar, Pedir una carrera, Responder, Sostener el catálogo | mid-fi, revisada |

### Entrar · [`product/enter/`](student/enter/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Ingresar | [`sign-in/`](student/enter/screens/SC-025-sign-in/README.md) | umbral | `/sign-in` | Con el motivo a la vista y vuelta a donde ibas: el gate está en la acción. | Reseñar, Cuidar lo publicado (las acciones que lo disparan) | mid-fi, revisada |
| Registro | [`sign-up/`](student/enter/screens/SC-026-sign-up/README.md) | umbral | `/sign-up` | Quién sos, institución y carrera: declarar dónde estás, no elegir. | Pedir una carrera (precarga), Que no me molesten | mid-fi, revisada |
| Recuperar | [`forgot-password/`](student/enter/screens/SC-024-forgot-password/README.md) | umbral | `/forgot-password` | La cuenta con todo adentro vuelve con un link al mail (garantía). | Que no me molesten | mid-fi, revisada |
| Error | [`error/`](student/enter/screens/SC-023-error/README.md) | pública | sin slug | Se rompió: qué pasó, qué hacer, y que lo tuyo no se perdió. | Reseñar (lo a medias se guarda) | mid-fi, revisada |

### Sostener el catálogo · [`product/sustain-the-catalog/`](team/sustain-the-catalog/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Pedidos | [`requests/`](team/sustain-the-catalog/screens/SC-030-requests/README.md) | backoffice | sin slug (el endpoint existe; la pantalla no) | La cola de carga por pedidos confirmados, con su demora declarada. | Pedir una carrera (de dónde vienen) | mid-fi, revisada |
| Catálogo | [`catalog/`](team/sustain-the-catalog/screens/SC-027-catalog/README.md) | backoffice | `/admin/universities`, `/admin/teachers`, `/admin/commissions` | Cargar una oferta por huecos: plan, materias canónicas, cátedras, carrera canónica; la reforma. | Cuando el catálogo no alcanza (la materia pendiente) | mid-fi, revisada |
| Correcciones | [`corrections/`](team/sustain-the-catalog/screens/SC-028-corrections/README.md) | backoffice | sin slug | Datos duros corregidos: valor viejo y nuevo, contrastados contra la fuente. | Cuidar lo publicado (de dónde llegan) | mid-fi, revisada |
| Frases | [`phrases/`](team/sustain-the-catalog/screens/SC-029-phrases/README.md) | backoffice | sin slug | El catálogo de ítems: código, capa, opciones; la cola de curaduría de los destilados. | Llevarse el dato (Método lo publica entero) | mid-fi, revisada |

### Moderar sin romper el producto · [`product/moderate-without-breaking-the-product/`](team/moderate-without-breaking-the-product/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Reportes | [`reports/`](team/moderate-without-breaking-the-product/screens/SC-031-reports/README.md) | backoffice | `/admin/moderacion/reportes` (castellano, contra la convención: se renombra) | Las tres guardias que le quedan a Nahuel: el filtro grueso del campo libre, el canal de reclamos institucionales, la alarma de cuentas correlacionadas. | Deshacer (reportar), Reseñar (el campo libre que se filtra), Llevarse el dato (lo contable) | mid-fi, revisada |
| Verificaciones | [`verifications/`](team/moderate-without-breaking-the-product/screens/SC-032-verifications/README.md) | backoffice | sin slug | Dos colas separadas: constancias de alumno e identidad docente. | Cuidar lo publicado, Responder | mid-fi, revisada |

### Cortar los accesos · [`product/cut-the-access/`](team/cut-the-access/README.md)

| Pantalla | Ficha | Acceso | Slug hoy | Qué es | Quién más le aporta | Estado |
|---|---|---|---|---|---|---|
| Equipo | [`team/`](team/cut-the-access/screens/SC-033-team/README.md) | backoffice | sin slug | Altas, roles excluyentes, bajas; el registro de quién hizo qué y qué se publica de él. | Moderar y Sostener el catálogo (las colas que cada rol ve) | mid-fi, revisada |

## Los flujos

Cada flujo del mapa vive, como diagrama en mermaid con sus ramas, salidas y errores, en la capacidad que lo contiene. La fila de acá es el índice: el número que el mapa le daba, el nombre, y dónde está.

### Del producto (15)

| # | Flujo del mapa | Vive en |
|---|---|---|
| 01 | Valentina tiene que elegir en dos meses | [Elegir dónde estudiar](student/choose-where-to-study/flow.md) |
| 02 | Ana busca la suya y no está | [Pedir una carrera](student/request-a-career/flow.md) |
| 03 | Matías vuelve, y esta vez completa | [Reseñar](student/write-a-review/flow.md) (la entrada: Ingresar / Registro → Reseñar, sin paso intermedio; la primera reseña pregunta el año de ingreso) |
| 04 | Lucía no quiere repetir el error | la co-cursada en la [Ficha de carrera](student/choose-where-to-study/screens/SC-001-career/README.md) y en la [Ficha de materia](student/choose-where-to-study/screens/SC-007-subject/README.md); el recorrido propio se cerró con [ADR-0086](../decisions/0086-the-product-informs-it-does-not-track-your-degree.md) |
| 05 | Lucía reseña, y le lleva cinco minutos | [Reseñar](student/write-a-review/flow.md) |
| 06 | Claudia contesta, con nombre porque es público | [Responder](reviewed/reply/flow.md) |
| 07 | Rocío se lleva el dato | [Llevarse el dato](student/take-the-data/flow.md) |
| 08 | Los avisos, lo que cierra el circuito | [Avisos](../product/notices/flow.md) |
| 09 | Deshacer, lo que hace que se animen | [Deshacer](student/undo/flow.md) |
| 10 | Los evaluados, responder y abandonar | [Responder](reviewed/reply/flow.md) y [Reseñar](student/write-a-review/flow.md) (Mi situación: me fui, cuándo) |
| 11 | Buscar, cuando te recomiendan una persona | [Elegir dónde estudiar](student/choose-where-to-study/flow.md) |
| 12 | El texto que te delata sin nombrar a nadie | [Reseñar](student/write-a-review/flow.md) (ya no aplica como estaba: el campo libre nunca se publica, lo explica Anonimato) |
| 13 | La ficha vacía y el primero que aporta | [Elegir dónde estudiar](student/choose-where-to-study/flow.md) (la ficha vacía) y [Reseñar](student/write-a-review/flow.md) (el primero que aporta) |
| 14 | Cuando el dato no me alcanza | [Reseñar](student/write-a-review/flow.md) (la materia que no está, la recursada, lo que quedó a medias, qué cambió) y [Sostener el catálogo](team/sustain-the-catalog/flow.md) (vincular la pendiente) |
| 15 | Cuando un ítem solo no alcanza | [Elegir dónde estudiar](student/choose-where-to-study/flow.md) (la convergencia entre ítems; la dispersión temporal; de qué voces está hecha cada ficha) |

Sin fila en el mapa y con flujo propio: [Cuidar lo publicado](student/care-for-what-is-published/flow.md) (corregir, verificarse: las acciones inline). [Que no me molesten](guarantees/README.md) es garantía y no tiene flujo. Los grupos T2, T3 y T4 del mapa son temas, no actividades: sus requisitos viven en la capacidad que los implementa (el [índice](README.md) los lista por tema).

### Del backoffice (9)

| # | Flujo del mapa | Vive en |
|---|---|---|
| BO-1 | Cargar lo que piden, por prioridad | [Sostener el catálogo](team/sustain-the-catalog/flow.md) |
| BO-2 | Contrastar una corrección contra la fuente | [Sostener el catálogo](team/sustain-the-catalog/flow.md) |
| BO-3 | Moderar sin bajar la queja incómoda | [Moderar sin romper el producto](team/moderate-without-breaking-the-product/flow.md) |
| BO-4 | Ver un nombre una sola vez | [Moderar sin romper el producto](team/moderate-without-breaking-the-product/flow.md) |
| BO-5 | Cuando la facultad reforma el plan | [Sostener el catálogo](team/sustain-the-catalog/flow.md) |
| BO-6 | Cuando alguien intenta inflar el corpus | [Moderar sin romper el producto](team/moderate-without-breaking-the-product/flow.md) |
| BO-7 | Cuando la cola nos gana, y quién nos mira | [Sostener el catálogo](team/sustain-the-catalog/flow.md) (la cola del catálogo), [Moderar sin romper el producto](team/moderate-without-breaking-the-product/flow.md) (la cola de moderación) y [Cortar los accesos](team/cut-the-access/flow.md) (el registro y quién lo mira) |
| BO-8 | El filtro grueso del campo libre (reemplaza a "lo que el chequeo previo retuvo": ya no hay contenido público que retener) | [Moderar sin romper el producto](team/moderate-without-breaking-the-product/flow.md) |
| BO-9 | Destilar y clasificar ítems nuevos | [Sostener el catálogo](team/sustain-the-catalog/flow.md) |

Los grupos BO4, BO5 y BO6 del mapa son temas, no actividades: sus requisitos viven en Sostener el catálogo, Moderar sin romper el producto y Cortar los accesos.

## Reglas del corpus

La regla que el canvas traía sobre desbloqueos por volumen se cerró distinto de como entró: **hay un piso, no una escalera** (una cátedra publica desde las 10 reseñas, por la privacidad de quien reseña, no por vergüenza estadística; el estado se muestra, "junta 3 reseñas: con 7 más se publica"; lo único que además espera es la cabecera derivada, hasta que más de la mitad de las materias canónicas de la carrera tenga voces, umbral que hoy sostiene D04 del [registro del 17](../history/reviews/2026-08-17-catalog-propagation.md) y que ningún ADR vigente fija; el piso y el condicionamiento por cobertura son [ADR-0082](../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) y [ADR-0083](../decisions/0083-the-ficha-publishes-counts-not-scores.md)); y **los ítems** son el catálogo de [`phrases.md`](../product/phrases.md), agrupados por capa (conducta observable, vivencia), cada uno con su código estable y sus opciones, que Método publica entero y cuyos conteos arman la ficha ([ADR-0083](../decisions/0083-the-ficha-publishes-counts-not-scores.md)).

## Estado contra el código (cruce 2026-08-16)

Lo que el repo ya tiene, mapeado contra las pantallas. "Existe" significa que el chasis existe; donde el contenido cambia (fichas con escrutinio en vez de reseñas texto-libre), el chasis se conserva y el contenido se rehace. El slug de cada una está en el [inventario](../README.md).

| Carril | Existe (chasis) | Adaptar | Nuevo de cero |
|---|---|---|---|
| Públicas | Inicio, Dónde estudiarla, Ficha de institución, Ficha de carrera, Ficha de materia, Ficha de cátedra (fichas públicas del catálogo actual) | Explorar (hoy el browse rico es member-only), Método (hoy sección de la landing), Anonimato (about existe, habla de otra cosa), Pedir (no hay implementación en el código todavía) | La cola, Error |
| Umbral | Ingresar, Registro, Recuperar (auth completo) | | |
| Con cuenta | Mis aportes, Mi perfil (Empezar y Mi carrera se retiran: [ADR-0086](../decisions/0086-the-product-informs-it-does-not-track-your-degree.md)) | Reseñar (existe el editor texto-libre; el acto de tres capas es otro modelo), Verificar (existe solo para docentes) | |
| Backoffice | Catálogo (backoffice) (ABM completo), Reportes (backoffice) (cola de moderación) | Pedidos (backoffice) (el endpoint de cola existe; la pantalla no) | Correcciones (backoffice), Verificaciones (backoffice), Equipo (backoffice), Frases (backoffice) |

Lo que no existe en ningún módulo del backend y es el corazón del build: el sistema de ítems (catálogo versionado, conteos, moda, distribución, convergencia), el piso de publicación por cátedra, la cola pública de pedidos, la verificación de alumno por constancia, y las seis pantallas diseñadas sin construir (Responder, Buscar, Editar, Mi situación, Baja, Avisos).

## Auditoría del mapa (2026-08-16)

Los siete hallazgos de revisar el mapa contra sí mismo, contra la tesis y contra el repo viven con su estado en [`docs/history/reviews/2026-08-16-product-map.md`](../history/reviews/2026-08-16-product-map.md).
