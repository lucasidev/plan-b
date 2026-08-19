# Pantallas

El inventario de pantallas del producto (el sitemap) y, para cada una que ya se diseñó, su ficha y su boceto. Una carpeta por pantalla ([ADR-0070](../../decisions/0070-product-docs-group-by-epic-one-story-per-epic-screens-owned-or-shared-and-design-as-text.md)): la ficha (`<screen>/README.md`) dice quién la usa (personas), qué stories resuelve (IDs del [catálogo](../../domain/user-stories.md)), qué épicas la componen, qué muestra con las decisiones aplicadas, los estados vacíos, las acciones, adónde lleva y el slug propuesto. El boceto (`<screen>/sketch.html`) arranca mid-fi, con los tokens del [design system](../design-system.md); las pantallas que definen el producto ganan el hi-fi en el mismo archivo. Toda ficha pasa una revisión adversarial (registro en [`docs/reviews/`](../../reviews/README.md)) antes del hi-fi. Cuando una story entra a sprint, su ficha `US-NNN` linkea la ficha de pantalla.

Una pantalla se nombra por lo que dice arriba, en español y sin backticks (Ficha de cátedra, Dónde estudiarla, Reseñar), igual en el [mapa](../product-map.md), en las épicas y acá; la carpeta lleva un nombre en inglés en kebab-case, como todo identificador del repo ([ADR-0070](../../decisions/0070-product-docs-group-by-epic-one-story-per-epic-screens-owned-or-shared-and-design-as-text.md), punto 7): el nombre visible es español, el path es código. El slug en código es otra cosa: la URL, en inglés, que se fija al entrar a sprint. Las pantallas son el inventario compartido: las **épicas** que las componen viven en [`docs/epics/`](../../epics/README.md), con sus flujos y los bocetos de sus pasos; la ficha de pantalla lista sus épicas y la épica lista sus pantallas.

## Inventario

Carpeta: dónde vive (o va a vivir) la ficha con su boceto: en la épica que es su dueña si solo esa épica la usa; acá, en `design/screens/`, si la componen varias. Solo existe la que tiene link. Slug hoy: verificado contra `frontend/src/app/` el 2026-08-17; "sin slug" se fija al entrar a sprint, en inglés. Estado: qué hay escrito.

### Públicas (12) · leer el escrutinio, sin cuenta

| Pantalla | Carpeta | Slug hoy | Qué es | Épicas que la componen | Estado |
|---|---|---|---|---|---|
| Inicio | `home/` | `/` | La vitrina (landing). | [Elegir dónde estudiar](../../epics/choose-where-to-study/README.md) (la entrada; se diseña con criterio propio) | por escribir |
| Explorar | `explore/` | `/careers`, `/universities` | El home real: dos lentes, carreras y universidades. Hoy el browse rico es member-only: se adapta. | Elegir dónde estudiar, [Pedir una carrera](../../epics/request-a-career/README.md) (el vacío explicado) | por escribir |
| Dónde estudiarla | `where-to-study/` | sin slug | Comparar: las ofertas de la misma carrera canónica, lado a lado, sin ganador. | Elegir dónde estudiar | por escribir |
| Ficha de carrera | `career/` | `/careers/[id]` | La carrera en una institución: las dos proporciones con su gate, las listas por eje con la cobertura a la vista, la trayectoria, la co-cursada pública. | Elegir dónde estudiar (también la ficha vacía y de qué voces está hecha), [Mi carrera](../../epics/my-career/README.md), Pedir una carrera | por escribir |
| Ficha de institución | `institution/` | `/universities/[slug]` | El sujeto evaluado: gestión, serie, réplica oficial y cómo se compara frase por frase. | Elegir dónde estudiar, [Replicar](../../epics/reply/README.md) | por escribir |
| Ficha de materia | `subject/` | `/subjects/[id]` | La materia: frases, testimonios, correlativas (qué pide y qué abre), dónde se cae. | Elegir dónde estudiar (también la ficha vacía y de cuándo son los testimonios), Mi carrera, [Cuidar lo publicado](../../epics/care-for-what-is-published/README.md) | por escribir |
| Ficha de cátedra | [`chair/`](chair/README.md) | `/teachers/[id]` (propuesto `/chairs/[id]`; la cátedra como entidad es BO1-6) | La cátedra, comparada con las otras de la materia: cabecera, listas por eje, clases sin dar, serie, testimonios y réplica. | Elegir dónde estudiar, [Reseñar](../../epics/write-a-review/README.md), Cuidar lo publicado, Replicar | ficha y [boceto mid-fi](chair/sketch.html) aprobados el 2026-08-18; revisión adversarial pendiente antes del hi-fi |
| Método | `method/` | sin slug (hoy sección de la landing) | Cómo lo calculamos: la fórmula, qué no hacemos, el catálogo de frases entero, los sesgos, la política de moderación y réplica, la descarga del crudo. | [Llevarse el dato](../../epics/take-the-data/README.md), Elegir dónde estudiar | por escribir |
| Pedir | `request/` | sin slug (hoy gateado al onboarding) | Pedir una carrera sin cuenta: solo el mail, confirmado por link para que cuente. | Pedir una carrera | por escribir |
| La cola | `queue/` | sin slug | Qué falta cargar: la cola pública de pedidos confirmados, cuáles ya están, cuánto se tarda. | Pedir una carrera, [Sostener el catálogo](../../epics/sustain-the-catalog/README.md) (cuánto se tarda) | por escribir |
| Anonimato | `anonymity/` | `/about` (habla de otra cosa; se rehace) | Cómo te cubrimos: la posición de anonimato y la política de moderación explicadas. | Reseñar (la posición sobre el anonimato), [Moderar sin romper el producto](../../epics/moderate-without-breaking-the-product/README.md) (la política) | por escribir |
| Error | `error/` | sin slug | Se rompió. | transversal | por escribir |

### El umbral (3)

| Pantalla | Carpeta | Slug hoy | Qué es | Épicas que la componen | Estado |
|---|---|---|---|---|---|
| Ingresar | `sign-in/` | `/sign-in` | Con el motivo a la vista y vuelta a donde ibas: el gate está en la acción, no en la puerta. | [Que no me molesten](../../epics/do-not-bother-me/README.md), Reseñar, Cuidar lo publicado (votar y corregir piden cuenta) | existe el chasis; por escribir |
| Registro | `sign-up/` | `/sign-up` | Rol, institución y carrera: declarar dónde estás, no elegir. Precargado si venís de un pedido. | Que no me molesten, Pedir una carrera, Reseñar | existe el chasis; por escribir |
| Recuperar | `forgot-password/` | `/forgot-password` | Recuperar la contraseña: la cuenta con todo adentro vuelve con un link al mail (garantía). | Que no me molesten | existe; por escribir |

### Con cuenta (6) · producir y lo tuyo

| Pantalla | Carpeta | Slug hoy | Qué es | Épicas que la componen | Estado |
|---|---|---|---|---|---|
| Empezar | `onboarding/` | `/onboarding/*` (se rehace: muere "cargá tu historial") | Onboarding: marcás por dónde vas. Shell de foco, sin nav. Saltable y retomable. | Mi carrera, Que no me molesten | existe el chasis; por escribir |
| Mi carrera | `my-career/` | `/my-career` (el contenido se rehace) | Tu plan: correlativas, lo que reseñaste con cómo terminó (hecho), lo que marcás que te falta o considerás (preferencia privada, [ADR-0069](../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md)), la co-cursada filtrada a tu caso. | Mi carrera | existe el chasis; por escribir |
| Reseñar | [`epics/write-a-review/screens/write-review/`](../../epics/write-a-review/screens/write-review/README.md) (dueña: la épica) | `/reviews/write` (existe el editor texto-libre; el acto de frases es otro modelo) | El acto de reseñar: elegir una materia, cuándo y cómo terminó, marcar frases, la cátedra, las clases sin dar, el comentario con el chequeo previo. Gateada por tener cuenta, nada más. | Reseñar (también discrepar, el chequeo previo, la materia que no está, la recursada, retomar) | ficha y [boceto mid-fi](../../epics/write-a-review/screens/write-review/sketch.html) de los seis pasos, 2026-08-19; revisión adversarial pendiente |
| Mis aportes | `my-contributions/` | `/reviews` | Lo que diste: qué sumó cada frase, lo pendiente de vincular, lo que se puede editar o borrar, lo a medias. | [Deshacer](../../epics/undo/README.md), Reseñar (qué sumó cada frase; lo pendiente de vincular) | existe el chasis; por escribir |
| Mi perfil | `my-profile/` | `/my-profile` | Tu cuenta y por dónde vas; donde se apagan los avisos. | [Avisos](../../epics/notices/README.md), Deshacer | existe el chasis; por escribir |
| Verificar | `verify/` | `/verify-teacher` (hoy solo docente; la constancia de alumno no tiene pantalla) | La constancia de alumno (señal, opcional y tardía) y la identidad docente (permiso para replicar), cada una a su cola. | Cuidar lo publicado, Replicar | por escribir |

### Diseñadas, sin construir (6)

| Pantalla | Carpeta | Slug hoy | Qué es | Épicas que la componen | Estado |
|---|---|---|---|---|---|
| Responder | `respond/` | sin slug | La réplica del docente o la institución: mismo chequeo previo, no cita lo marcado, retenida el plazo desde el aviso. | Replicar | por escribir |
| Buscar | `search/` | sin slug (el topbar tiene buscador y no lleva a ninguna pantalla) | Resultados de búsqueda: los cuatro sujetos con ficha; un docente lleva a su cátedra; si no está, explica por qué. | Elegir dónde estudiar, Pedir una carrera | por escribir |
| Editar | `edit/` | sin slug | Editar o borrar un aporte; el comentario editado vuelve al chequeo previo. | Deshacer | por escribir |
| Mi situación | [`epics/write-a-review/screens/my-status/`](../../epics/write-a-review/screens/my-status/README.md) (dueña: la épica) | sin slug | La pregunta de trayectoria de a uno (me fui, cuándo / me recibí, cuándo / sigo), sin plan marcado; también en Reseñar con período viejo y por mail una vez al año. | Reseñar, Avisos | ficha y [boceto mid-fi](../../epics/write-a-review/screens/my-status/sketch.html), 2026-08-19; revisión adversarial pendiente |
| Baja | `delete-account/` | sin slug | Dar de baja la cuenta: anonimiza la identidad y preserva lo aportado ([ADR-0044](../../decisions/0044-soft-delete-del-user-con-preservacion-de-corpus.md)); lo que quieras sacar lo borrás antes, de a uno. | Deshacer | por escribir |
| Avisos | `notices/` | sin slug | Los mails que cierran el circuito: cerró el período, cargamos lo pedido, el resumen al docente sin timestamps, el aviso antes de la réplica, el reenganche anual. Infraestructura del primer bloque. | Avisos (sostiene O2-4, O4-5, O4-12, O7-5, BO1-3, T2-2) | por escribir |

### Acciones inline (3)

No son pantallas: pasan adentro de la ficha, sin cambiar de pantalla, y no tienen carpeta; las dibuja el flujo de su épica. **Reportar** (sin cuenta, mail confirmado por link; nada baja solo: [Deshacer](../../epics/undo/flow.md)), **Corregir** (un dato duro, con cuenta, queda registrado quién: [Cuidar lo publicado](../../epics/care-for-what-is-published/flow.md)), **Votar** ("a mí también me pasó", con cuenta: la misma épica).

### Backoffice (7) · el equipo

| Pantalla | Carpeta | Slug hoy | Qué es | Épicas que la componen | Estado |
|---|---|---|---|---|---|
| Pedidos | `backoffice-requests/` | sin slug (el endpoint de cola existe; la pantalla no) | La cola de carga, ordenada por cuántos lo pidieron; cuánto se tarda; el criterio de arranque del primer día. | [Sostener el catálogo](../../epics/sustain-the-catalog/README.md) | por escribir |
| Catálogo | `backoffice-catalog/` | `/admin/universities`, `/admin/teachers`, `/admin/commissions` | Cargar una oferta por huecos: el plan con su duración nominal, las materias canónicas, las cátedras, la carrera canónica; la cola de materias declaradas; los dos planes cuando hay reforma. | Sostener el catálogo (también la reforma del plan, la fuente no oficial, la oferta que se corrige) | existe el ABM; el contenido se rehace |
| Correcciones | `backoffice-corrections/` | sin slug | Datos duros que alguien corrigió: valor viejo y nuevo, se contrastan contra la fuente antes de aplicar. | Sostener el catálogo, Cuidar lo publicado | por escribir |
| Reportes | `backoffice-reports/` | `/admin/moderacion/reportes` (slug en castellano, contra la convención: se renombra en inglés al tocarlo) | Moderación, dos colas: lo reportado (sigue publicado hasta resolver) y lo retenido por el chequeo previo (sin publicar hasta que alguien mire); la alarma de cuentas correlacionadas; los reportes agrupados. | Moderar sin romper el producto (también la cola cuando desborda, la alarma de procedencia, los reportes agrupados) | existe la cola; el contenido se rehace |
| Verificaciones | `backoffice-verifications/` | sin slug | Dos colas: constancias de alumno (señal; sin camino a los aportes) e identidad docente (permiso para la réplica, contra la cátedra). | Moderar sin romper el producto, Replicar, Cuidar lo publicado | por escribir |
| Equipo | `backoffice-team/` | sin slug | Accesos: altas, roles excluyentes (verificación y moderación no conviven), bajas; el registro de quién hizo qué. | [Cortar los accesos](../../epics/cut-the-access/README.md) (también el registro y quién lo mira) | por escribir |
| Frases | `backoffice-phrases/` | sin slug | El catálogo de frases ([`phrases.md`](../../domain/phrases.md)): redacción, sujeto y eje; la cola de curaduría de las destiladas; corregir un eje reprocesa las fichas. | Sostener el catálogo | por escribir |

## Fichas escritas

| Pantalla | Ficha | Boceto | Estado |
|---|---|---|---|
| Ficha de cátedra | [`chair/README.md`](chair/README.md) | [`chair/sketch.html`](chair/sketch.html) | borrador aprobado el 2026-08-18 (mid-fi); revisión adversarial pendiente antes de hi-fi |
| Reseñar | [`epics/write-a-review/screens/write-review/README.md`](../../epics/write-a-review/screens/write-review/README.md) | [`sketch.html`](../../epics/write-a-review/screens/write-review/sketch.html) | borrador del 2026-08-19 (mid-fi, seis pasos y estados); revisión adversarial pendiente |
| Mi situación | [`epics/write-a-review/screens/my-status/README.md`](../../epics/write-a-review/screens/my-status/README.md) | [`sketch.html`](../../epics/write-a-review/screens/my-status/sketch.html) | borrador del 2026-08-19 (mid-fi); revisión adversarial pendiente |

Lo que el repo ya tiene, chasis por chasis, y lo que no existe en ningún módulo: [`product-map.md`](../product-map.md), "Estado contra el código".
