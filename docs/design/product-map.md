# Product map

La estructura del producto nuevo, portada del canvas `plan-b mapa` (2026-08-16). Este doc es la copia versionada de lo que el canvas define: pantallas, flujos, planos y reglas. Las user stories viven en [`user-stories.md`](../domain/user-stories.md) (catálogo vigente) y las personas en [`user-personas.md`](../domain/user-personas.md). La tesis que gobierna todo: [`THESIS.md`](../THESIS.md).

**Estado**: orientativo, y en camino a ser solo el índice: cada pantalla gana su ficha en [`screens/`](screens/README.md) y cada flujo su diagrama en mermaid dentro de su épica en [`docs/epics/`](../epics/README.md); cuando existan, las tablas de acá se reducen a la lista con links. Es la estructura que el mapa propone (pantallas, flujos, planos), útil para entender qué vistas podría necesitar el producto; **no fija el diseño final ni la UX/UI**. Lo vinculante son las stories de [`user-stories.md`](../domain/user-stories.md) y las personas. Nada de esto está construido; el cruce contra el código real está al final.

## Los tres planos

1. **El catálogo.** Instituciones, carreras, planes, correlativas. Lo cargamos nosotros, a mano y completo: la calidad del dato base no se crowdsourcea. Una carrera está cargada entera o no está. Sin cobertura no hay nada: si la institución no está cargada no hay ficha, ni plan, ni materias. No inventamos una ficha vacía.
2. **Lo que publicamos.** Las frases con sus voces por eje, la atribución (que es la lectura de los ejes), la serie, los testimonios. Todo derivado del corpus, nada declarado a mano. La ausencia no es un juicio: decimos "no la cargamos todavía", no "no hay datos", y muchísimo menos un cero.
3. **Lo que hacemos.** Publicar, atribuir y exigir respuesta. Es el único plano donde alguien sin cobertura tiene lugar: el pedido es un dato público. Cuánta gente reclama que se cargue algo dice dónde la comunidad quiere que se mire y no llegamos.

## Las pantallas

> **Una pantalla se nombra por lo que dice arriba**, en español, con mayúscula inicial y sin backticks: Mi carrera, Dónde estudiarla, Método, Reseñar, Ficha de cátedra. Es el mismo nombre en el canvas y en los docs (el canvas del repo se renombró el 2026-08-18 para que coincidan; ver [`map/README.md`](map/README.md)). Los backticks son código: la URL va en inglés, con slug, y se fija cuando la pantalla entra a sprint, siguiendo las que ya existen ([frontend/CLAUDE.md](../../frontend/CLAUDE.md): `/careers/[id]`, `/universities/[slug]`, `/my-career`, `/reviews/write`). La tabla del cruce con el código, al final, dice qué slug tiene hoy cada pantalla que ya tiene chasis y cuáles esperan el suyo.

### Públicas (12) · leer el escrutinio, sin login

| Pantalla | Qué es |
|---|---|
| Inicio | La vitrina (landing). |
| Explorar | El home real: dos lentes, carreras y universidades. |
| Dónde estudiarla | Comparar: las ofertas de una carrera, lado a lado. |
| Ficha de carrera | Ficha de carrera en una institución. Los dos ejes con sus frases y la atribución juntas, derivados de sus cursadas con la cobertura a la vista. |
| Ficha de institución | El sujeto evaluado: gestión, serie, respuesta oficial y cómo se compara. |
| Ficha de materia | Ficha de materia. Correlativas: qué pide y qué abre. |
| Ficha de cátedra | Ficha de cátedra, por docente, comparada con las otras. |
| Método | Cómo lo calculamos: fórmula, qué no hacemos, el corpus de frases y la descarga del crudo. |
| Pedir | Pedir una carrera, sin cuenta: solo el mail para avisarte, confirmado por link para que el pedido cuente. |
| La cola | Qué falta cargar: la cola de pedidos, pública, cuántos mails confirmados piden cada carrera y cuáles ya están. |
| Anonimato | Cómo te cubrimos: la posición de anonimato explicada. |
| Error | Se rompió. |

### El umbral (3)

| Pantalla | Qué es |
|---|---|
| Ingresar | Con el motivo a la vista y vuelta a donde ibas. |
| Registro | Rol, institución y carrera. Es declarar dónde estás, no elegir. |
| Recuperar | Recuperar contraseña. |

### Con cuenta (6) · producir y lo tuyo

| Pantalla | Qué es |
|---|---|
| Empezar | Onboarding: marcás por dónde vas. Shell de foco, sin nav. Saltable y retomable. |
| Mi carrera | Tu plan: las materias con sus correlativas, lo que reseñaste con cómo terminó (hecho), lo que marcás como que te falta o considerás (preferencia privada, no dato: [ADR-0069](../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md)), y la pestaña de co-cursada filtrada a tu caso. |
| Reseñar | El acto de reseñar: elegir una materia y marcar frases. Gateada por tener cuenta, nada más (marcar el plan es opcional y es preferencia privada: O4-7, O6-3, y Diego no va a marcar ninguno). |
| Mis aportes | Lo que diste. |
| Mi perfil | Tu cuenta y por dónde vas. |
| Verificar | Constancia. Opcional y tardío: es señal, no permiso. |

### Diseñadas, sin construir (6)

El mapa las dibuja en flujos pero no tienen pantalla propia todavía:

| Pantalla | Por qué importa |
|---|---|
| Responder | La respuesta del docente/institución. La dibujan los flujos 06, 08 y 10, y Método la promete; hoy las respuestas de ejemplo están cargadas a mano. |
| Buscar | Resultados de búsqueda. El topbar tiene buscador y todavía no lleva a ninguna pantalla; el flujo 11 la dibuja. |
| Editar | Editar o borrar un aporte. Sin esto, reseñar algo incómodo es irreversible. Un comentario editado vuelve al chequeo previo antes de publicarse. |
| Mi situación | La pregunta de trayectoria de a uno (me fui, cuándo / me recibí, cuándo / sigo), sin plan marcado; también aparece en Reseñar cuando el período declarado es viejo, y por mail una vez al año. Sin esto no sabemos dónde se cae la mayoría, y el silencio no se infiere. |
| Baja | Dar de baja la cuenta: anonimiza la identidad y preserva lo aportado (ADR-0044); lo que quieras sacar lo borrás antes, de a uno, en Editar. Prometemos que es tuyo; poder sacarlo es parte de eso. |
| Avisos | Notificaciones. Sin ellas, el que pidió una carrera no se entera de que la cargamos. Es la pantalla que más stories sostiene (O2-4, O4-5, O7-5, BO1-3 y T2-2), y T2-2 es P1 de la promesa central: "quien aportó se entera antes de que se publique la réplica" no se puede cumplir sin un canal de aviso. **Decisión 2026-08-16**: deja de ser diferida y es infraestructura del primer bloque, aunque arranque solo por mail (SMTP ya está en el stack; el BC de ADR-0040 se revisa a favor). El panel en la app puede esperar. |

### Acciones inline (3)

No son pantallas: pasan adentro de la ficha, sin cambiar de pantalla.

- Reportar: denunciar algo publicado. Modal sobre la ficha. **Sin cuenta**: el difamado no tiene por qué registrarse en el sitio que lo difama; confirma el mail por link antes de entrar a la cola, y nada baja solo por cantidad de reportes.
- Corregir: un dato duro está mal. La fila se vuelve editable ahí mismo. Pide cuenta.
- Votar: "a mí también me pasó", sobre la reseña o el evento entero. Suma una voz a sus frases y ordena qué testimonio se lee primero. Pide cuenta.

### Backoffice (7) · el equipo

| Pantalla | Qué es |
|---|---|
| Pedidos | La cola de carga, ordenada por cuántos lo pidieron, no por orden de llegada. |
| Catálogo | Cargar una oferta: el plan con su duración nominal, sus materias canónicas, sus cátedras (el equipo docente a cargo, entidad propia) y su carrera canónica. Abre por huecos: no se publica hasta terminar. |
| Correcciones | Datos duros que alguien corrigió. Se contrastan contra la fuente antes de aplicar. |
| Reportes | Moderación, dos colas: lo reportado (que sigue publicado hasta que alguien resuelve; salvo riesgo inmediato con criterio escrito) y lo retenido por el chequeo previo (comentarios y réplicas que hablan de una persona fuera de su acto, sin publicar hasta que alguien mire). Se baja el texto que expone a una persona, nunca la voz; la queja dura no es causal. |
| Verificaciones | Dos colas distintas: constancias de alumno (señal; el único lugar con nombres reales, y sin camino a los aportes) e identidad docente (permiso para la réplica; se prueba contra la cátedra del catálogo). |
| Equipo | Accesos. Cada rol ve solo sus colas: el anonimato es mecanismo, no declaración. Verificación y moderación son roles excluyentes (BO3-3): el Admin no puede juntarlos en una persona ni asignárselos a sí mismo. |
| Frases | El catálogo de frases ([`docs/domain/phrases.md`](../domain/phrases.md)): la redacción, el sujeto y el eje de cada una, las semilla y las destiladas en cola de curaduría. Es lo que Método publica entero, y el eje es la atribución: corregirlo reprocesa las fichas. |

## Los flujos

### Del producto (15)

Los flujos escritos en mermaid viven en su épica; la fila de acá queda como índice. Escritos: 05, 12 y 14 → [Reseñar](../epics/resenar/flujo.md).

| # | Flujo | Recorrido |
|---|---|---|
| 01 | Valentina tiene que elegir en dos meses | Inicio/Buscar → Explorar → Ficha de carrera (con cabecera si la cobertura pasó la mitad de las materias de la carrera; si no, cobertura y frases con "en N materias") → Ficha de materia/Ficha de cátedra → Método (opcional) → Dónde estudiarla (lado a lado, sin ganador) |
| 02 | Ana busca la suya y no está | Explorar → el vacío explicado (no la cargamos / cargada sin voces / cargada, todavía no derivamos) → Pedir (confirma el mail por link) → La cola → mail con el link a la ficha, que se lee sin cuenta |
| 03 | Matías vuelve, y esta vez completa | Ficha de cátedra → lee → (tres semanas después) → Ficha de carrera → Ingresar/Registro → Empezar → Reseñar (la primera reseña pregunta el año de ingreso, una sola vez) |
| 04 | Lucía no quiere repetir el error | Ficha de carrera (co-cursada: por par y período, solo desde reseñas, con sus voces) → cuántos dejaron una → Mi carrera (la co-cursada filtrada a lo que reseñó y a lo que marcó como que le falta: preferencia privada, no dato) → papel → Empezar |
| 05 | Lucía reseña, y le lleva cinco minutos | Avisos → Reseñar (elige materia) → cuándo cursó (si es viejo: ¿seguís cursando? / me recibí / me fui) → cómo terminó → frases → cátedra (opcional) → clases sin dar (opcional) → comentario (opcional, con tope; el chequeo marca lo que identifica y decide ella; lo que habla de una persona fuera de su acto queda retenido) → el aviso de sospecha en grupo chico → publica, con o sin comentario |
| 06 | Claudia contesta, con nombre porque es público | le llega el resumen (sin timestamps) → verifica identidad (permiso, cola propia) → Responder (mismo chequeo previo; no cita lo marcado) → retenida el plazo desde el aviso al autor → queda al lado, con nombre; no baja ni mueve conteos → actúa o no → se ve en la serie, por período en que pasó, con la réplica marcada |
| 07 | Rocío se lleva el dato | Explorar/Ficha de carrera → Método (fórmula, catálogo de frases con sujeto y eje, sesgos declarados) → qué no cubrimos → descarga el crudo (dos tablas: frases con voces y eje; agregados de trayectoria; sin testimonios) → lo discute afuera → corrige un dato al volver |
| 08 | Los avisos, lo que cierra el circuito | mail (cerró el período, o cargamos lo pedido, o el resumen al docente sin timestamps, o el reenganche anual: ¿te recibiste?) → Reseñar/Empezar/Responder, o responder desde el mail → Mi perfil (se apagan) |
| 09 | Deshacer, lo que hace que se animen | Mis aportes → Editar (edita o borra; el comentario editado vuelve al chequeo previo) → Baja (se va: la identidad se anonimiza y lo aportado queda; lo que quiso sacar lo borró antes) |
| 10 | Los evaluados, responder y abandonar | te llega el resumen → verificás identidad → Responder (retenida el plazo desde el aviso) · del otro lado: Mi situación (me fui, cuándo; también en Reseñar si el período es viejo, o por mail una vez al año) → Reseñar (contás por qué, opcional) |
| 11 | Buscar, cuando te recomiendan una persona | busca un nombre → Buscar → la cátedra de la que forma parte (un docente no es una ficha: la cátedra sí) → si no está, Buscar explica por qué → Pedir (opcional) |
| 12 | El texto que te delata sin nombrar a nadie | escribe en Reseñar → el chequeo marca lo que identifica por contexto → decide el autor (la réplica no podrá citar esa parte) · si habla de una persona fuera de su acto: queda retenido hasta que alguien lo mire, y se le dice → el aviso de sospecha en grupo chico → publica, con o sin comentario |
| 13 | La ficha vacía y el primero que aporta | ficha vacía en Ficha de carrera → dice por qué está vacía y que la primera voz ya se publica → reseña en Reseñar → lo ve reflejado en la materia y en las listas; la cabecera de la carrera dice "todavía no derivamos" hasta que la cobertura pase la mitad de las materias de la carrera |
| 14 | Cuando el dato no me alcanza | la materia no está / la recursó en otro período → se acepta igual → queda pendiente de vincular a la materia canónica (no cuenta en ninguna ficha ni en la cobertura hasta entonces) → ve qué cambió en Mis aportes |
| 15 | Cuando la frase no se sostiene sola | voces viejas declaradas en la ficha → una frase pesa mucho en la cátedra y poco en la carrera → la ficha explica que la carrera suma cursadas y no promedia, y muestra en cuántas materias aparece → marca la frase del otro sentido al reseñar esa cursada |

### Del backoffice (9)

| # | Flujo | Qué resuelve |
|---|---|---|
| BO-1 | Cargar lo que piden, por prioridad | la cola ordenada por pedidos; la oferta se ata a su carrera canónica y lleva su duración nominal antes de publicarse; no se publica hasta terminar; se avisa a los que esperaban |
| BO-2 | Contrastar una corrección contra la fuente | valor viejo y nuevo a la vista; aplicar queda registrado; la ficha cambia para todos sin votación |
| BO-3 | Moderar sin bajar la queja incómoda | reporte con mail confirmado → sigue publicado mientras espera (salvo riesgo inmediato, con criterio escrito) → ¿expone a una persona fuera de su acto? sí: se baja el texto con su categoría, nunca la voz / no: queda → quien reportó recibe el criterio por mail, no un acuse |
| BO-4 | Ver un nombre una sola vez | la constancia de alumno se compara con lo declarado; el documento se destruye al resolver; nunca hay camino de esa cola a los aportes. La identidad docente es otra cola y otro flujo: ahí sí se ata a la cátedra, porque es el permiso de la réplica |
| BO-5 | Cuando la facultad reforma el plan | los dos planes coexisten con su año; la reseña queda pegada al período y a la materia canónica, no a la fila del plan |
| BO-6 | Cuando alguien intenta inflar el corpus | la alarma mira la procedencia de las cuentas, no el volumen; los reportes se agrupan por objetivo y ventana, y el mail confirmado deduplica; las cuentas marcadas no suman voces ni trayectoria; congelar conteos sin borrar nada; la ficha declara "período bajo revisión" |
| BO-7 | Cuando la cola nos gana, y quién nos mira | dos colas que nos ganan (catálogo y moderación), y la de moderación bloquea publicación: se dice cuánto se tarda sin fingir que se resuelve todo; registro de qué se bajó y qué quedó retenido, por categoría; quien se va pierde acceso |
| BO-8 | Lo que el chequeo previo retuvo | comentario o réplica que habla de una persona fuera de su acto → cola de retenidos, con la parte marcada → una persona lo mira → sale, se baja con su categoría, o vuelve al autor; nada se publica por vencimiento de tiempo |
| BO-9 | Destilar y clasificar frases nuevas | los comentarios de muchos → la máquina propone una frase → cola de curaduría: se aprueba con sujeto y eje o se descarta → recién entonces se ofrece para marcar, marcada como destilada → corregir un eje reprocesa las fichas |

## Reglas del corpus

**Desbloqueos por volumen**: el mapa encendía la ficha por escalones ("con uno aparece la primera frase; con cinco, los dos números; con quince, la atribución"). **Cerrado el 2026-08-16** ([ADR-0066](../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)): no hay escalera ni piso. Todo se publica desde la primera voz, como "X de N voces" con su encogimiento; lo único que espera es la cabecera derivada de carrera e institución, por cobertura (más de la mitad de las materias canónicas de la carrera con voces), y mientras tanto la ficha lo dice.

**Las frases**: Método promete el corpus completo publicado. El canvas traía 17, en las pantallas de Reseñar, Ficha de cátedra y Ficha de institución ("Es dura de verdad", "Hay clases que no se dan", "Cada trámite es una pelea"...); la lista canónica, con el sujeto y el eje de cada frase (la atribución sale del eje: [ADR-0065](../decisions/0065-attribution-is-the-axis-not-a-split.md)), vive en [`docs/domain/phrases.md`](../domain/phrases.md) y es lo que Método publica entero y Frases (backoffice) edita.

## Estado contra el código (cruce 2026-08-16)

Lo que el repo ya tiene, mapeado contra las pantallas. "Existe" significa que el chasis existe; donde el contenido cambia (fichas con escrutinio en vez de reseñas texto-libre), el chasis se conserva y el contenido se rehace.

| Carril | Existe (chasis) | Adaptar | Nuevo de cero |
|---|---|---|---|
| Públicas | Inicio, Dónde estudiarla, Ficha de institución, Ficha de carrera, Ficha de materia, Ficha de cátedra (fichas públicas del catálogo actual) | Explorar (hoy el browse rico es member-only), Método (hoy sección de la landing), Anonimato (about existe, habla de otra cosa), Pedir (existe gateado al onboarding) | La cola, Error |
| Umbral | Ingresar, Registro, Recuperar (auth completo) | | |
| Con cuenta | Empezar, Mi carrera, Mis aportes, Mi perfil (chasis del onboarding, mi carrera y mis reseñas) | Reseñar (existe el editor texto-libre; el acto de frases es otro modelo), Verificar (existe solo para docentes) | |
| Backoffice | Catálogo (backoffice) (ABM completo), Reportes (backoffice) (cola de moderación) | Pedidos (backoffice) (el endpoint de cola existe; la pantalla no) | Correcciones (backoffice), Verificaciones (backoffice), Equipo (backoffice) |

**Pantalla → slug en código** (verificado contra `frontend/src/app/` el 2026-08-17). Las que no tienen slug lo reciben, en inglés, cuando entran a sprint.

| Pantalla | Slug hoy | Nota |
|---|---|---|
| Inicio | `/` | la landing |
| Ficha de carrera | `/careers/[id]` | la ficha pasa a ser carrera-en-institución |
| Ficha de institución | `/universities/[slug]` | |
| Ficha de materia | `/subjects/[id]` | |
| Ficha de cátedra | `/teachers/[id]` | chasis del docente; la cátedra como entidad es BO1-6 y pide su propio slug |
| Explorar | `/careers`, `/universities` | los listados públicos |
| Anonimato | `/about` | habla de otra cosa; se rehace |
| Ingresar / Registro / Recuperar | `/sign-in`, `/sign-up`, `/forgot-password` | |
| Empezar | `/onboarding/*` | el onboarding se rehace: muere "cargá tu historial" |
| Mi carrera | `/my-career` | el contenido se rehace |
| Mis aportes | `/reviews` | |
| Mi perfil | `/my-profile` | |
| Reseñar | `/reviews/write` | existe el editor texto-libre; el acto de frases es otro modelo |
| Verificar | `/verify-teacher` | hoy solo docente; la constancia de alumno no tiene pantalla |
| Catálogo | `/admin/universities`, `/admin/teachers`, `/admin/commissions` | |
| Reportes | `/admin/moderacion/reportes` | **slug en castellano, contra la convención**: se renombra en inglés cuando se toque |
| Dónde estudiarla, Método, Pedir, La cola, Buscar, Avisos, Mi situación, Baja, Editar, Responder, Error, Pedidos (backoffice), Correcciones (backoffice), Verificaciones (backoffice), Equipo (backoffice), Frases (backoffice) | sin slug | se definen al entrar a sprint, en inglés |

Lo que no existe en ningún módulo del backend y es el corazón del build: el sistema de frases (modelo, conteos, sujeto y eje), las proporciones de voces con encogimiento, la cola pública de pedidos, la verificación de alumno por constancia, y las seis pantallas diseñadas sin construir (Responder, Buscar, Editar, Mi situación, Baja, Avisos).

## Auditoría del mapa (2026-08-16)

Los siete hallazgos de revisar el mapa contra sí mismo, contra la tesis y contra el repo viven con su estado en [`docs/reviews/2026-08-16-product-map.md`](../reviews/2026-08-16-product-map.md).
