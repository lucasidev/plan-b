# Product map

La estructura del producto nuevo, portada del canvas `plan-b mapa` (2026-08-16). Este doc es la copia versionada de lo que el canvas define: pantallas, flujos, planos y reglas. Las user stories viven en [`user-stories.md`](../domain/user-stories.md) (catálogo vigente) y las personas en [`user-personas.md`](../domain/user-personas.md). La tesis que gobierna todo: [`THESIS.md`](../THESIS.md).

**Estado**: orientativo, y en camino a ser solo el índice: cada pantalla gana su ficha en [`screens/`](screens/README.md) y cada flujo su diagrama en `flows/`; cuando existan, las tablas de acá se reducen a la lista con links. Es la estructura que el mapa propone (pantallas, flujos, planos), útil para entender qué vistas podría necesitar el producto; **no fija el diseño final ni la UX/UI**. Lo vinculante son las stories de [`user-stories.md`](../domain/user-stories.md) y las personas. Nada de esto está construido; el cruce contra el código real está al final.

## Los tres planos

1. **El catálogo.** Instituciones, carreras, planes, correlativas. Lo cargamos nosotros, a mano y completo: la calidad del dato base no se crowdsourcea. Una carrera está cargada entera o no está. Sin cobertura no hay nada: si la institución no está cargada no hay ficha, ni plan, ni materias. No inventamos una ficha vacía.
2. **Lo que publicamos.** Las frases con sus voces por eje, la atribución (que es la lectura de los ejes), la serie, los testimonios. Todo derivado del corpus, nada declarado a mano. La ausencia no es un juicio: decimos "no la cargamos todavía", no "no hay datos", y muchísimo menos un cero.
3. **Lo que hacemos.** Publicar, atribuir y exigir respuesta. Es el único plano donde alguien sin cobertura tiene lugar: el pedido es un dato público. Cuánta gente reclama que se cargue algo dice dónde la comunidad quiere que se mire y no llegamos.

## Las pantallas

> **Los nombres en backticks son nombres de pantalla, no rutas.** `donde`, `reseñar`, `micarrera`, `metodo` son el vocabulario del mapa (UX, en español) para nombrar una pantalla en docs y stories, igual que "Mi carrera" o "Comparar" son la etiqueta visible. **La URL es código**: va en inglés, con slug, y se fija cuando la pantalla entra a sprint, siguiendo las que ya existen ([frontend/CLAUDE.md](../../frontend/CLAUDE.md): `/careers/[id]`, `/universities/[slug]`, `/my-career`, `/reviews/write`). Lo que el mapa trae de otro departamento se revisa antes de adoptarlo: el nombre de pantalla se queda como nombre; nada de eso es un identificador de código. La tabla del cruce con el código, al final, dice qué slug tiene hoy cada pantalla que ya tiene chasis y cuáles esperan el suyo.

### Públicas (12) · leer el escrutinio, sin login

| Pantalla | Qué es |
|---|---|
| `inicio` | La vitrina (landing). |
| `explorar` | El home real: dos lentes, carreras y universidades. |
| `donde` | Comparar: las ofertas de una carrera, lado a lado. |
| `carrera` | Ficha de carrera en una institución. Los dos ejes con sus frases y la atribución juntas, derivados de sus cursadas con la cobertura a la vista. |
| `institucion` | El sujeto evaluado: gestión, serie, respuesta oficial y cómo se compara. |
| `materia` | Ficha de materia. Correlativas: qué pide y qué abre. |
| `catedra` | Ficha de cátedra, por docente, comparada con las otras. |
| `metodo` | Cómo lo calculamos: fórmula, qué no hacemos, el corpus de frases y la descarga del crudo. |
| `pedir` | Pedir una carrera, sin cuenta: solo el mail para avisarte. |
| `cola` | Qué falta cargar: la cola de pedidos, pública, cuántos piden cada carrera y cuáles ya están. |
| `anonimato` | Cómo te cubrimos: la posición de anonimato explicada. |
| `error` | Se rompió. |

### El umbral (3)

| Pantalla | Qué es |
|---|---|
| `ingresar` | Con el motivo a la vista y vuelta a donde ibas. |
| `registro` | Rol, institución y carrera. Es declarar dónde estás, no elegir. |
| `recuperar` | Recuperar contraseña. |

### Con cuenta (6) · producir y lo tuyo

| Pantalla | Qué es |
|---|---|
| `empezar` | Onboarding: marcás por dónde vas. Shell de foco, sin nav. Saltable y retomable. |
| `micarrera` | Tu plan: las materias con sus correlativas, lo que reseñaste con cómo terminó (hecho), lo que marcás como que te falta o considerás (preferencia privada, no dato: [ADR-0069](../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md)), y la pestaña de co-cursada filtrada a tu caso. |
| `reseñar` | El acto de reseñar: elegir una materia y marcar frases. Gateada por tener cuenta, nada más (marcar el plan es opcional y es preferencia privada: O4-7, O6-3, y Diego no va a marcar ninguno). |
| `aportes` | Lo que diste. |
| `perfil` | Tu cuenta y por dónde vas. |
| `verificar` | Constancia. Opcional y tardío: es señal, no permiso. |

### Diseñadas, sin construir (6)

El mapa las dibuja en flujos pero no tienen pantalla propia todavía:

| Pantalla | Por qué importa |
|---|---|
| `responder` | La respuesta del docente/institución. La dibujan los flujos 06, 08 y 10, y `metodo` la promete; hoy las respuestas de ejemplo están cargadas a mano. |
| `buscar` | Resultados de búsqueda. El topbar tiene buscador y todavía no lleva a ninguna pantalla; el flujo 11 la dibuja. |
| `editar` | Editar o borrar un aporte. Sin esto, reseñar algo incómodo es irreversible. Un comentario editado vuelve al chequeo previo antes de publicarse. |
| `abandono` | La pregunta de trayectoria de a uno (me fui, cuándo / me recibí, cuándo / sigo), sin plan marcado; también aparece en `reseñar` cuando el período declarado es viejo, y por mail una vez al año. Sin esto no sabemos dónde se cae la mayoría, y el silencio no se infiere. |
| `baja` | Dar de baja la cuenta: anonimiza la identidad y preserva lo aportado (ADR-0044); lo que quieras sacar lo borrás antes, de a uno, en `editar`. Prometemos que es tuyo; poder sacarlo es parte de eso. |
| `avisos` | Notificaciones. Sin ellas, el que pidió una carrera no se entera de que la cargamos. Es la pantalla que más stories sostiene (O2-4, O4-5, O7-5, BO1-3 y T2-2), y T2-2 es P1 de la promesa central: "quien aportó se entera antes de que se publique la réplica" no se puede cumplir sin un canal de aviso. **Decisión 2026-08-16**: deja de ser diferida y es infraestructura del primer bloque, aunque arranque solo por mail (SMTP ya está en el stack; el BC de ADR-0040 se revisa a favor). El panel en la app puede esperar. |

### Acciones inline (3)

No son pantallas: pasan adentro de la ficha, sin cambiar de pantalla.

- `reportar`: denunciar algo publicado. Modal sobre la ficha. **Sin cuenta**: el difamado no tiene por qué registrarse en el sitio que lo difama; confirma el mail por link antes de entrar a la cola, y nada baja solo por cantidad de reportes.
- `corregir`: un dato duro está mal. La fila se vuelve editable ahí mismo. Pide cuenta.
- `votar`: "a mí también me pasó", sobre la reseña o el evento entero. Suma una voz a sus frases y ordena qué testimonio se lee primero. Pide cuenta.

### Backoffice (7) · el equipo

| Pantalla | Qué es |
|---|---|
| `bo/pedidos` | La cola de carga, ordenada por cuántos lo pidieron, no por orden de llegada. |
| `bo/catalogo` | Cargar una oferta: el plan con su duración nominal, sus materias canónicas, sus cátedras (el equipo docente a cargo, entidad propia) y su carrera canónica. Abre por huecos: no se publica hasta terminar. |
| `bo/correcciones` | Datos duros que alguien corrigió. Se contrastan contra la fuente antes de aplicar. |
| `bo/reportes` | Moderación, dos colas: lo reportado (que sigue publicado hasta que alguien resuelve; salvo riesgo inmediato con criterio escrito) y lo retenido por el chequeo previo (comentarios y réplicas que hablan de una persona fuera de su acto, sin publicar hasta que alguien mire). Se baja el texto que expone a una persona, nunca la voz; la queja dura no es causal. |
| `bo/verificaciones` | Dos colas distintas: constancias de alumno (señal; el único lugar con nombres reales, y sin camino a los aportes) e identidad docente (permiso para la réplica; se prueba contra la cátedra del catálogo). |
| `bo/equipo` | Accesos. Cada rol ve solo sus colas: el anonimato es mecanismo, no declaración. (Pendiente D4: verificación y moderación como roles excluyentes.) |
| `bo/frases` | El catálogo de frases: la redacción, el sujeto y el eje de cada una, las semilla y las destiladas en cola de curaduría. Es lo que `metodo` publica entero, y el eje es la atribución: corregirlo reprocesa las fichas. |

## Los flujos

### Del producto (15)

| # | Flujo | Recorrido |
|---|---|---|
| 01 | Valentina tiene que elegir en dos meses | `inicio`/`buscar` → `explorar` → `carrera` (con cabecera si la cobertura pasó la mitad del plan; si no, cobertura y frases con "en N materias") → `materia`/`catedra` → `metodo` (opcional) → `donde` (lado a lado, sin ganador) |
| 02 | Ana busca la suya y no está | `explorar` → el vacío explicado (no la cargamos / cargada sin voces / cargada, todavía no derivamos) → `pedir` → `cola` → mail con el link a la ficha, que se lee sin cuenta |
| 03 | Matías vuelve, y esta vez completa | `catedra` → lee → (tres semanas después) → `carrera` → `ingresar`/`registro` → `empezar` → `reseñar` (la primera reseña pregunta el año de ingreso, una sola vez) |
| 04 | Lucía no quiere repetir el error | `carrera` (co-cursada: por par y período, solo desde reseñas, con sus voces) → cuántos dejaron una → `micarrera` (la co-cursada filtrada a lo que reseñó y a lo que marcó como que le falta: preferencia privada, no dato) → papel → `empezar` |
| 05 | Lucía reseña, y le lleva cinco minutos | `avisos` → `reseñar` (elige materia) → cuándo cursó (si es viejo: ¿seguís cursando? / me recibí / me fui) → cómo terminó → frases → cátedra (opcional) → clases sin dar (opcional) → comentario (opcional, con tope; el chequeo marca lo que identifica y decide ella; lo que habla de una persona fuera de su acto queda retenido) → el aviso de sospecha en grupo chico → publica, con o sin comentario |
| 06 | Claudia contesta, con nombre porque es público | le llega el resumen (sin timestamps) → verifica identidad (permiso, cola propia) → `responder` (mismo chequeo previo; no cita lo marcado) → retenida el plazo desde el aviso al autor → queda al lado, con nombre; no baja ni mueve conteos → actúa o no → se ve en la serie, por período en que pasó, con la réplica marcada |
| 07 | Rocío se lleva el dato | `explorar`/`carrera` → `metodo` (fórmula, catálogo de frases con sujeto y eje, sesgos declarados) → qué no cubrimos → descarga el crudo (dos tablas: frases con voces y eje; agregados de trayectoria; sin testimonios) → lo discute afuera → corrige un dato al volver |
| 08 | Los avisos, lo que cierra el circuito | mail (cerró el período, o cargamos lo pedido, o el resumen al docente sin timestamps, o el reenganche anual: ¿te recibiste?) → `reseñar`/`empezar`/`responder`, o responder desde el mail → `perfil` (se apagan) |
| 09 | Deshacer, lo que hace que se animen | `aportes` → `editar` (edita o borra; el comentario editado vuelve al chequeo previo) → `baja` (se va: la identidad se anonimiza y lo aportado queda; lo que quiso sacar lo borró antes) |
| 10 | Los evaluados, responder y abandonar | te llega el resumen → verificás identidad → `responder` (retenida el plazo desde el aviso) · del otro lado: `abandono` (me fui, cuándo; también en `reseñar` si el período es viejo, o por mail una vez al año) → `reseñar` (contás por qué, opcional) |
| 11 | Buscar, cuando te recomiendan una persona | busca un nombre → `buscar` → la cátedra de la que forma parte (un docente no es una ficha: la cátedra sí) → si no está, `buscar` explica por qué → `pedir` (opcional) |
| 12 | El texto que te delata sin nombrar a nadie | escribe en `reseñar` → el chequeo marca lo que identifica por contexto → decide el autor (la réplica no podrá citar esa parte) · si habla de una persona fuera de su acto: queda retenido hasta que alguien lo mire, y se le dice → el aviso de sospecha en grupo chico → publica, con o sin comentario |
| 13 | La ficha vacía y el primero que aporta | ficha vacía en `carrera` → dice por qué está vacía y que la primera voz ya se publica → reseña en `reseñar` → lo ve reflejado en la materia y en las listas; la cabecera de la carrera dice "todavía no derivamos" hasta que la cobertura pase la mitad del plan |
| 14 | Cuando el dato no me alcanza | la materia no está / la recursó en otro período → se acepta igual → queda pendiente de vincular a la materia canónica → ve qué cambió en `aportes` |
| 15 | Cuando la frase no se sostiene sola | voces viejas declaradas en la ficha → una frase pesa mucho en la cátedra y poco en la carrera → la ficha explica que la carrera suma cursadas y no promedia, y muestra en cuántas materias aparece → marca la frase del otro sentido al reseñar esa cursada |

### Del backoffice (9)

| # | Flujo | Qué resuelve |
|---|---|---|
| BO-1 | Cargar lo que piden, por prioridad | la cola ordenada por pedidos; la oferta se ata a su carrera canónica y lleva su duración nominal antes de publicarse; no se publica hasta terminar; se avisa a los que esperaban |
| BO-2 | Contrastar una corrección contra la fuente | valor viejo y nuevo a la vista; aplicar queda registrado; la ficha cambia para todos sin votación |
| BO-3 | Moderar sin bajar la queja incómoda | reporte con mail confirmado → sigue publicado mientras espera (salvo riesgo inmediato, con criterio escrito) → ¿expone a una persona fuera de su acto? sí: se baja el texto con su categoría, nunca la voz / no: queda → quien reportó recibe el criterio por mail, no un acuse |
| BO-4 | Ver un nombre una sola vez | la constancia de alumno se compara con lo declarado; el documento se destruye al resolver; nunca hay camino de esa cola a los aportes. La identidad docente es otra cola y otro flujo: ahí sí se ata a la cátedra, porque es el permiso de la réplica |
| BO-5 | Cuando la facultad reforma el plan | los dos planes coexisten con su año; la reseña queda pegada al período y a la materia canónica, no a la fila del plan |
| BO-6 | Cuando alguien intenta inflar el corpus | la alarma mira la procedencia de las cuentas, no el volumen; los reportes se agrupan por mail confirmado; las cuentas marcadas no suman voces ni trayectoria; congelar conteos sin borrar nada; la ficha declara "período bajo revisión" |
| BO-7 | Cuando la cola nos gana, y quién nos mira | dos colas que nos ganan (catálogo y moderación), y la de moderación bloquea publicación: se dice cuánto se tarda sin fingir que se resuelve todo; registro de qué se bajó y qué quedó retenido, por categoría; quien se va pierde acceso |
| BO-8 | Lo que el chequeo previo retuvo | comentario o réplica que habla de una persona fuera de su acto → cola de retenidos, con la parte marcada → una persona lo mira → sale, se baja con su categoría, o vuelve al autor; nada se publica por vencimiento de tiempo |
| BO-9 | Destilar y clasificar frases nuevas | los comentarios de muchos → la máquina propone una frase → cola de curaduría: se aprueba con sujeto y eje o se descarta → recién entonces se ofrece para marcar, marcada como destilada → corregir un eje reprocesa las fichas |

## Reglas del corpus

**Desbloqueos por volumen**: el mapa encendía la ficha por escalones ("con uno aparece la primera frase; con cinco, los dos números; con quince, la atribución"). **Cerrado el 2026-08-16** ([ADR-0066](../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)): no hay escalera ni piso. Todo se publica desde la primera voz, como "X de N voces" con su encogimiento; lo único que espera es la cabecera derivada de carrera e institución, por cobertura (más de la mitad de las materias del plan con voces), y mientras tanto la ficha lo dice.

**Las frases**: `metodo` promete el corpus completo publicado ("las 32 frases"). El mapa no las lista en un solo lugar; muestra ejemplos por familia en las pantallas de `reseñar`, `catedra` e `institucion`:

- De materia: "Es dura de verdad", "Se aprueba yendo a clase", "El final es otro nivel", "El contenido está al día", "Contenido de hace diez años", "Es muchísimo contenido".
- De cátedra: "Explican bien", "Están para las consultas", "Te la estudiás solo", "Hay clases que no se dan", "El cronograma se cumple".
- De institución: "Cada trámite es una pelea", "El título tardó meses".

La lista canónica completa, con el sujeto y el eje de cada frase (la atribución sale del eje: [ADR-0065](../decisions/0065-attribution-is-the-axis-not-a-split.md)), es un entregable del diseño del sistema de frases (ver auditoría abajo): hoy no existe ni en el mapa ni en el repo, y se publica entera en `metodo`.

## Estado contra el código (cruce 2026-08-16)

Lo que el repo ya tiene, mapeado contra las pantallas. "Existe" significa que el chasis existe; donde el contenido cambia (fichas con escrutinio en vez de reseñas texto-libre), el chasis se conserva y el contenido se rehace.

| Carril | Existe (chasis) | Adaptar | Nuevo de cero |
|---|---|---|---|
| Públicas | `inicio`, `donde`, `institucion`, `carrera`, `materia`, `catedra` (fichas públicas del catálogo actual) | `explorar` (hoy el browse rico es member-only), `metodo` (hoy sección de la landing), `anonimato` (about existe, habla de otra cosa), `pedir` (existe gateado al onboarding) | `cola`, `error` |
| Umbral | `ingresar`, `registro`, `recuperar` (auth completo) | | |
| Con cuenta | `empezar`, `micarrera`, `aportes`, `perfil` (chasis del onboarding, mi carrera y mis reseñas) | `reseñar` (existe el editor texto-libre; el acto de frases es otro modelo), `verificar` (existe solo para docentes) | |
| Backoffice | `bo/catalogo` (ABM completo), `bo/reportes` (cola de moderación) | `bo/pedidos` (el endpoint de cola existe; la pantalla no) | `bo/correcciones`, `bo/verificaciones`, `bo/equipo` |

**Pantalla del mapa → slug en código** (verificado contra `frontend/src/app/` el 2026-08-17). Las que no tienen slug lo reciben, en inglés, cuando entran a sprint.

| Pantalla | Slug hoy | Nota |
|---|---|---|
| `inicio` | `/` | la landing |
| `carrera` | `/careers/[id]` | la ficha pasa a ser carrera-en-institución |
| `institucion` | `/universities/[slug]` | |
| `materia` | `/subjects/[id]` | |
| `catedra` | `/teachers/[id]` | chasis del docente; la cátedra como entidad es BO1-6 y pide su propio slug |
| `explorar` | `/careers`, `/universities` | los listados públicos |
| `anonimato` | `/about` | habla de otra cosa; se rehace |
| `ingresar` / `registro` / `recuperar` | `/sign-in`, `/sign-up`, `/forgot-password` | |
| `empezar` | `/onboarding/*` | el onboarding se rehace: muere "cargá tu historial" |
| `micarrera` | `/my-career` | el contenido se rehace |
| `aportes` | `/reviews` | |
| `perfil` | `/my-profile` | |
| `reseñar` | `/reviews/write` | existe el editor texto-libre; el acto de frases es otro modelo |
| `verificar` | `/verify-teacher` | hoy solo docente; la constancia de alumno no tiene pantalla |
| `bo/catalogo` | `/admin/universities`, `/admin/teachers`, `/admin/commissions` | |
| `bo/reportes` | `/admin/moderacion/reportes` | **slug en castellano, contra la convención**: se renombra en inglés cuando se toque |
| `donde`, `metodo`, `pedir`, `cola`, `buscar`, `avisos`, `abandono`, `baja`, `editar`, `responder`, `error`, `bo/pedidos`, `bo/correcciones`, `bo/verificaciones`, `bo/equipo`, `bo/frases` | sin slug | se definen al entrar a sprint, en inglés |

Lo que no existe en ningún módulo del backend y es el corazón del build: el sistema de frases (modelo, conteos, sujeto y eje), las proporciones de voces con encogimiento, la cola pública de pedidos, la verificación de alumno por constancia, y las seis pantallas diseñadas sin construir (`responder`, `buscar`, `editar`, `abandono`, `baja`, `avisos`).

## Auditoría del mapa (2026-08-16)

Los siete hallazgos de revisar el mapa contra sí mismo, contra la tesis y contra el repo viven con su estado en [`docs/reviews/2026-08-16-product-map.md`](../reviews/2026-08-16-product-map.md).
