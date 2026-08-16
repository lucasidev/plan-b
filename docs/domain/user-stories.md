# User Stories (planb)

Catálogo de user stories. Cada US vive en su propio archivo dentro de [user-stories/](user-stories/).

> **Estado (2026-08-16)**: el producto cambió de tesis ([THESIS.md](../THESIS.md), [ADR-0063](../decisions/0063-the-product-is-a-pressure-instrument.md)). **El catálogo vigente es el de abajo, portado del mapa de producto**; el de la versión anterior queda al final como historia (US-097/098/099 canceladas con S12, US-057 muere por tesis, las hechas son historia y no se tocan). La numeración formal `US-NNN` se asigna cuando una story entra a sprint, como siempre; hasta entonces se referencian por su ID de mapa (`O1-1`, `T2-1`, `BO4-2`). Estructura del mapa (rutas, flujos, planos): [`product-map.md`](product-map.md). Personas: [`user-personas.md`](user-personas.md).

---

# El catálogo vigente (mapa de producto, 2026-08-16)

Ocho objetivos con 41 stories, cuatro grupos transversales con 14, y seis de backoffice con 20: 75 en total (revisado 2026-08-16: se fusionaron O4-3 en O4-6 y O7-4 en O7-7, O5-3 pasó a garantía, y entraron T2-4 y O8-6). Cada una trae su criterio de "listo cuando": sin criterio no se puede decir si una pantalla la resuelve. Prioridad solo donde el mapa la marca (P1/P2); el resto no está priorizado todavía.

## O1 · Decidir dónde estudiar (y poder desconfiar del número)

> O1-1, O1-7, O3-1 y O4-8 no salen de frases: salen de **trayectoria** (cuándo cursaste, cuándo entraste, si te fuiste cuándo, si te recibiste cuándo). Decisión 2026-08-16 (THESIS.md, decisión 4): esos hechos se preguntan de a uno, en el momento en que aparecen, nunca como inventario.

| ID | Story | Listo cuando |
|---|---|---|
| O1-1 | Como quien está eligiendo, quiero ver cuánto tarda de verdad, para no creerle a la duración del plan. | La ficha muestra nominal, real y de cuántos egresados sale. |
| O1-2 | Como quien está eligiendo, quiero comparar la misma carrera en varias instituciones, para elegir con algo más que la opinión de mi familia. | Las ofertas se ven lado a lado y ninguna gana en todo. |
| O1-3 | Como quien está eligiendo, quiero saber si lo que la hace difícil es la carrera o la facultad, porque una cosa la elijo y la otra la sufro. | La atribución está pegada al número, no en otra caja. |
| O1-4 | Como quien está eligiendo, quiero ver cómo calculan cada número, para poder descartarlo con fundamento o citarlo. | La fórmula, el encogimiento y el valor de cada frase están publicados. |
| O1-5 | Como quien está eligiendo, quiero ver sobre cuántas voces se calcula, porque un número con dos testimonios miente. | Cada número muestra su n al lado. |
| O1-6 | Como quien lee, quiero buscar por materia, carrera o docente, porque lo que me recomiendan es una persona, no una carrera. | Una sola búsqueda devuelve los cuatro tipos de objeto. |
| O1-7 | Como quien paga y no cursa, quiero saber si esto termina en un título, porque pongo la plata y no entiendo de planes ni de correlativas. | Duración real y cuántos se reciben se leen sin abrir nada ni saber vocabulario académico. |

## O2 · Entender el vacío (cuando lo que busco no está)

| ID | Story | Listo cuando |
|---|---|---|
| O2-1 | Como quien no está cubierto, quiero saber si el vacío es de ustedes o de mi facultad, para no sospechar del producto. | La ficha dice "no la cargamos todavía", no un número en cero. |
| O2-2 | Como quien no está cubierto, quiero pedir la carga sin registrarme, porque todavía no me sirve de nada tener cuenta acá. | El pedido se manda con el mail y nada más. |
| O2-3 | Como quien no está cubierto, quiero ver cuántos más la pidieron, para saber si tengo alguna chance. | La cola es pública y ordenada por cantidad de pedidos. |
| O2-4 | Como quien no está cubierto, quiero que me avisen cuando la carguen, para no tener que volver a probar cada tanto. | Llega un mail y el plan ya está listo para marcar. |

## O3 · Armar el cuatrimestre (lo que la lapicera no calcula sola)

| ID | Story | Listo cuando |
|---|---|---|
| O3-1 | Como quien está cursando, quiero saber qué materias se pueden llevar juntas, para no repetir la combinación que ya me tumbó. | La ficha del plan muestra, por par de materias, cuántos las llevaron juntas y cuántos dejaron una. |
| O3-2 | Como quien está cursando, quiero ver esas combinaciones contra lo que me falta, porque el promedio de todos no es mi caso. | Entrando con cuenta, la lista queda filtrada a las materias que todavía puedo cursar, con las correlativas resueltas. (Resolver correlativas contra el plan es lo que hoy hace `SubjectAvailabilityEvaluator` en el módulo `planning` que se poda: se rescata a `academic` antes de borrar, no se reescribe.) |
| O3-3 | Como quien está cursando, quiero armarlo en papel y volver a marcar lo que curso, porque el planificador propio era el error de la versión anterior. | El producto no arma horarios: entrega los números y el paso siguiente vuelve a marcar el plan. |

## O4 · Que quede registrado (sin que me cueste la cursada)

| ID | Story | Listo cuando |
|---|---|---|
| O4-1 | Como quien está cursando, quiero contarlo en menos de cinco minutos, porque si me lleva más no lo hago nunca. | Se publica tocando frases, sin escribir nada obligatorio. |
| O4-2 | Como quien está cursando, quiero contar de una materia sola, porque no llego con ganas de inventariar el período. | El flujo arranca eligiendo una, sin checklist. |
| O4-4 | Como quien está cursando, quiero que nadie sepa que fui yo, para poder decir lo que pasó sin que me cueste la cursada. | Lo publicado dice el rol y el período, nunca el nombre. |
| O4-5 | Como quien está cursando, quiero que me avisen cuando cierra el período, porque si nadie me lo recuerda no vuelvo. | El aviso llega con una materia concreta para contar. |
| O4-6 | Como quien está cursando, quiero decir cuántas clases no se dieron y que el número quede publicado, porque es el que la facultad no publica y el que más pesa cuando reclamo, y el reclamo interno no fue a ningún lado. | La pregunta llega solo a quien marcó que hubo clases sin dar, y el conteo aparece en la ficha de la cátedra. (Absorbe la que era O4-3.) |
| O4-7 | Como quien dejó la carrera, quiero contar por qué me fui aunque ya no curse, porque el que abandonó tiene la explicación completa y nadie se la pide. | Aportar no exige estar cursando, y una materia sola alcanza para dejar el testimonio. |
| O4-8 | Como quien dejó la carrera, quiero decir en qué año me fui, porque cuántos abandonan y cuándo es el dato que ninguna facultad publica. | La ficha muestra en qué punto del plan se cae la mayoría, no solo cuánto tarda el que llega. Una pregunta, opcional, sobre el plan; el egreso se pregunta igual ("¿te recibiste? ¿cuándo?") para que O1-1 y O1-7 tengan fuente. |
| O4-9 | Como quien dejó la carrera, quiero que no me traten como a un fracaso, porque me fui por cómo la llevaban, no por no poder. | El testimonio de quien abandonó pesa igual que el del que se recibió, y su atribución se cuenta. |

## O5 · Poder deshacer (garantía: se verifica en cada pantalla, no en un flujo)

> O5 y O6 son **garantías**, no trabajo a construir: cada pantalla nueva las tiene que cumplir, y se verifican como parte del Definition of Done del producto nuevo. Recuperar la contraseña (la que era O5-3) es una de ellas y no una story: la cuenta con todo adentro vuelve con un link al mail.

| ID | Story | Listo cuando |
|---|---|---|
| O5-1 | Como quien ya aportó, quiero editar o borrar lo que conté, porque me expuse más de lo que quería. | El aporte se puede modificar y borrar desde Mis aportes. |
| O5-2 | Como quien ya aportó, quiero borrar mi cuenta y lo mío, porque prometieron que era mío, y eso incluye poder sacarlo. | La baja borra la cuenta y decide qué pasa con lo aportado. |
| O5-4 | Como quien lee, quiero reportar algo sin registrarme, porque no me voy a hacer cuenta en el sitio que me difama. | El reporte se manda sin cuenta y se revisa a mano. |

## O6 · Que no me molesten (garantía: el contrapeso, nadie quiere más funciones)

> Garantías, como O5. O6-1 es la decisión 3 de la tesis dicha como checklist.

| ID | Story | Listo cuando |
|---|---|---|
| O6-1 | Como quien lee, quiero que no me pidan cuenta para nada, porque vine a mirar, no a participar. | Ninguna pantalla de lectura tiene login. |
| O6-2 | Como quien vuelve, quiero que no me lo vuelvan a preguntar, porque lo dije una vez y el resto se deduce de lo que cuento. | El contexto no se pregunta dos veces en ningún flujo. |
| O6-3 | Como quien vuelve, quiero poder saltearlo y usar la app igual, porque no vine a hacer trámites. | Todo funciona sin plan cargado, salvo lo que necesita saber qué cursás. |
| O6-4 | Como quien lee, quiero que no me vendan nada, porque desconfío de cualquier cosa que parezca promocionada. | No hay institución destacada, patrocinada ni ordenada por conveniencia. |

## O7 · Contestar lo que se publicó (con nombre, porque es público)

| ID | Story | Listo cuando |
|---|---|---|
| O7-1 | Como el docente, quiero responder por mi cátedra con mi nombre, para que mi versión quede al lado y no abajo. | La respuesta se publica junto al testimonio, sin bajarlo. |
| O7-2 | Como el docente, quiero que se vea que doy bien mi materia, porque es la primera vez que alguien lo mide. | La ficha de cátedra distingue exigencia de gestión. |
| O7-3 | Como la institución, quiero saber en qué estoy peor que la de al lado, porque el dato que me expone es el que me dice dónde arreglar. | La ficha compara gestión contra todas las cargadas. |
| O7-5 | Como el docente, quiero enterarme de que me nombraron, porque no puedo responder algo que no sé que existe. | Al docente verificado le llega el aviso cuando su cátedra recibe una valoración. |
| O7-6 | Como el docente, quiero que no me presuman el silencio, porque no contestar es una postura, no una admisión. | La ficha dice "todavía no respondió" y nunca interpreta por qué. |
| O7-7 | Como la institución, quiero ver si mejoré desde que lo publicaron, porque arreglé el trámite, el número es de cohortes viejas, y sin serie es una foto que no me sirve para gestionar. | La ficha muestra la gestión período a período con escala completa de 1 a 5. (Absorbe la que era O7-4.) |

## O8 · Llevarme el dato (para discutirlo afuera)

| ID | Story | Listo cuando |
|---|---|---|
| O8-1 | Como quien investiga, quiero descargar el crudo sin registrarme, porque ustedes muestran qué pasa y el por qué es trabajo mío. | El CSV sale agregado: una fila por (frase, sujeto, período) con su conteo, su eje y su atribución, y respeta el mismo piso que la ficha. Nunca una fila por persona: lo que se descarga es lo que se publica. |
| O8-6 | Como quien investiga, quiero saber cuánto se bajó del corpus y por qué, porque una muestra que no declara su curaduría no se puede citar. | El crudo excluye lo removido, y publica cuántos testimonios se bajaron y en qué categoría, sin su contenido. |
| O8-2 | Como quien investiga, quiero saber qué no cubren, porque una muestra sin su sesgo declarado no se puede citar. | La cobertura publica cuántas están cargadas, en cola y pedidas. |
| O8-3 | Como quien investiga, quiero citar un número que no me puedan desarmar, porque del otro lado van a discutir la metodología antes que el dato. | El método es público y el número muestra su n. |
| O8-4 | Como quien investiga, quiero que no interpreten por mí, porque si me dan la conclusión ya no puedo citarlo como fuente. | Las fichas muestran conteos y atribución, y en ningún lado se afirma una causa. |
| O8-5 | Como quien lee, quiero saber que no tienen acuerdos con las instituciones, porque un evaluador que depende del evaluado no me sirve de nada. | La postura está escrita en el método y no hay ninguna institución con trato preferencial. |

## T1 · Cuidar lo publicado (curación, no opinión)

| ID | Story | Listo cuando |
|---|---|---|
| T1-1 | Como quien ya aportó, quiero votar lo que me sirvió, para que el que venga lo lea primero. | El voto ordena los testimonios de la ficha y pide cuenta. |
| T1-2 | Como quien ya aportó, quiero corregirlo sin cambiar de pantalla, para que la ficha no mienta sobre mi facultad. | La fila del dato se vuelve editable ahí mismo y queda registrado quién lo cambió. |
| T1-3 | Como quien ya aportó, quiero verificarme si quiero, para que lo mío pese más, sin que sea condición para hablar. | Se puede aportar sin verificar, y verificarse suma señal a lo ya contado. |

## T2 · Cuando el riesgo es real (tres escenarios que rompen la promesa)

| ID | Story | Listo cuando | Prioridad |
|---|---|---|---|
| T2-1 | Como quien va a contar, quiero que me avisen si lo que escribí me delata, porque "los tres que cursamos con Pérez en el turno noche" no tiene nombres y aun así soy yo. | Antes de publicar se marca lo que puede identificar por contexto, y decido yo si lo dejo. | P1 |
| T2-2 | Como quien ya aportó, quiero no quedar expuesto cuando el docente responde con nombre, porque si éramos cuatro en la comisión, su respuesta me señala sin nombrarme. | La respuesta no puede citar la parte del testimonio que identifica, y quien aportó se entera antes de que se publique. | P1 |
| T2-3 | Como quien entra primero, quiero entender qué hago acá si no hay nada cargado todavía, porque si la ficha está vacía y nadie escribió, no tengo razón para ser el primero. | Una ficha sin testimonios explica que arranca vacía y qué se desbloquea con el primer aporte. | P1 |
| T2-4 | Como quien aportó, quiero que ningún cruce de datos me identifique, porque un número sobre cinco personas de mi cohorte soy yo con otro nombre. | Ningún conteo público sale por debajo del piso de personas, y en los cruces (par de materias, cátedra, período) el piso vale en cada celda, no solo en el total. | P1 |

## T3 · Cuando el catálogo no alcanza (el dato existe pero no me sirve como está)

| ID | Story | Listo cuando | Prioridad |
|---|---|---|---|
| T3-1 | Como quien ya cursa, quiero contar una materia que no está en el plan cargado, porque es optativa, o es de un plan viejo, o se llama distinto. | Se puede aportar sobre una materia que no está y queda pendiente de vincular en el catálogo. | P1 |
| T3-2 | Como quien está eligiendo, quiero saber de cuándo son los testimonios, porque una cátedra que cambió de docente hace dos años ya no es la misma. | Cada ficha muestra el período de lo que la sostiene, y avisa cuando lo último es de hace más de dos años. | P1 |
| T3-3 | Como quien va a contar, quiero retomar lo que empecé a escribir, porque cerré la pestaña en el medio y no lo voy a hacer dos veces. | El aporte a medias queda guardado y aparece para retomar la próxima vez. | P2 |
| T3-4 | Como quien ya aportó, quiero ver qué cambió con lo que conté, porque es lo único que me trae de vuelta la próxima vez. | Mis aportes muestran cuánto se movió el número de esa cátedra y cuántos lo leyeron. | P2 |
| T3-5 | Como quien ya cursa, quiero contar la misma materia dos veces si la recursé con otro docente, porque son dos cátedras distintas y la segunda vez fue otra experiencia. | Un segundo aporte sobre la misma materia se acepta si la cátedra o el período cambian. | P2 |
| T3-6 | Como quien lee, quiero entender por qué la cátedra tiene 1.9 y la carrera 3.8, porque si los niveles se contradicen, no sé cuál creer. | La ficha de cátedra ubica su número contra el de su carrera y explica que uno no promedia al otro. | P2 |

## T4 · Y quien no está de acuerdo (discrepar no es lo mismo que denunciar)

| ID | Story | Listo cuando | Prioridad |
|---|---|---|---|
| T4-1 | Como quien ya cursa y no coincide, quiero decir que a mí no me pasó eso, porque hoy solo puedo reportar, y reportar es acusar de daño, no discrepar. | Se puede aportar lo contrario sobre la misma cátedra y los dos conteos quedan visibles, sin que uno anule al otro. | P2 |

## BO1 · Sostener el catálogo (lo único que no se crowdsourcea)

| ID | Story | Listo cuando |
|---|---|---|
| BO1-1 | Como quien carga el catálogo, quiero ver qué le falta a cada ficha antes que lo que ya cargué, porque una oferta a medias miente más que una que no existe. | La pantalla abre por huecos y cada oferta muestra cuántos campos le faltan. |
| BO1-2 | Como quien carga el catálogo, quiero que la cola se ordene por cuántos lo pidieron, porque cargar por orden de llegada deja afuera a los que más lo necesitan. | Los pedidos se ordenan por cantidad y muestran de qué institución vienen. |
| BO1-3 | Como quien carga el catálogo, quiero avisarle a los que esperaban cuando termino, porque si no se enteran, el pedido fue trabajo tirado de los dos lados. | Al marcar una oferta como cargada sale el aviso a todos los que la pidieron. |
| BO1-4 | Como quien carga el catálogo, quiero contrastar una corrección contra la fuente antes de aplicarla, porque aceptar porque sí convierte el dato duro en otra opinión. | La corrección muestra valor viejo y nuevo, y aplicarla queda registrada con quién la aprobó. |

## BO2 · Moderar sin romper el producto (decir que no importa más que decir que sí)

| ID | Story | Listo cuando |
|---|---|---|
| BO2-1 | Como quien modera, quiero bajar solo lo que expone a una persona, porque si bajamos lo que incomoda a la institución, plan-b deja de tener sentido. | El reporte muestra motivo y criterio, y la queja dura contra la institución no es causal. |
| BO2-2 | Como quien modera, quiero que el que reportó sepa por qué quedó o se bajó, porque un formulario sin respuesta enseña a no volver a reportar. | Resolver un reporte manda el criterio aplicado, no un acuse genérico. |
| BO2-3 | Como quien modera, quiero ver lo mínimo de una constancia para decidir, porque cada nombre que veo es alguien que confió en que sería anónimo. | La verificación compara contra lo declarado y el documento se destruye al resolver. |
| BO2-4 | Como quien modera, quiero no poder ver qué escribió la persona que verifico, porque si puedo cruzarlo, el anonimato es una promesa y no un mecanismo. | Desde la cola de verificaciones no hay ningún camino a los aportes de esa cuenta. |

## BO3 · Cortar los accesos (que el anonimato sea mecanismo)

| ID | Story | Listo cuando |
|---|---|---|
| BO3-1 | Como quien administra, quiero que cada rol vea solo sus colas, porque catálogo no necesita ver una constancia con nombre, y si puede algún día la mira. | El rol de catálogo no llega a reportes ni verificaciones, ni por acceso directo. |
| BO3-2 | Como quien administra, quiero saber quién hizo cada cosa, porque el equipo toca datos que los usuarios nos confiaron. | Cada acción sobre una cola queda con autor y fecha. |

## BO4 · Cuando la carga no da abasto (operación diaria, no excepciones)

| ID | Story | Listo cuando | Prioridad |
|---|---|---|---|
| BO4-1 | Como quien carga el catálogo, quiero ver la cola cuando tiene doscientos pendientes, porque puedo cargar dos carreras por semana y la demanda no espera. | La cola muestra cuánto se tarda en promedio y qué queda afuera del mes, sin fingir que se resuelve todo. | P2 |
| BO4-2 | Como quien carga el catálogo, quiero corregir algo que cargué mal, porque cuarenta personas están usando una correlativa que puse equivocada. | Se puede editar una oferta publicada, y los que la tienen marcada se enteran de qué cambió. | P1 |
| BO4-3 | Como quien carga el catálogo, quiero poder cargar algo cuya fuente no existe o se contradice, porque hay facultades que no publican el plan, o publican dos versiones que no coinciden. | El campo admite marcar de dónde salió el dato, y la ficha lo muestra cuando no es fuente oficial. | P2 |
| BO4-4 | Como quien modera, quiero detectar una constancia adulterada, porque verificar a alguien que miente le da peso a lo que no lo tiene. | El rechazo pide motivo y el que la subió puede volver a intentar sin quedar marcado. | P2 |
| BO4-5 | Como quien carga el catálogo, quiero decidir qué cargar el primer día, porque al principio no hay pedidos: no hay usuarios que pidan. | La cola arranca con un criterio explícito de arranque, no vacía y esperando demanda. | P2 |

## BO5 · Cuando el corpus está bajo ataque (tres escenarios que rompen el producto)

| ID | Story | Listo cuando | Prioridad |
|---|---|---|---|
| BO5-1 | Como quien carga el catálogo, quiero saber qué pasa con lo valorado cuando la facultad reforma el plan, porque la gente cursó el plan viejo y sus valoraciones no dejan de ser ciertas. | Los dos planes coexisten con su año, y una valoración queda pegada al plan en que se cursó. | P1 |
| BO5-2 | Como quien modera, quiero que me avise cuando una cátedra recibe veinte valoraciones en dos días, porque puede ser un centro organizando o el docente pidiéndoselo a sus alumnos, y eso destruye el corpus. | La cola marca picos por cátedra y período, y se pueden congelar los conteos sin borrar nada. | P1 |
| BO5-3 | Como quien modera, quiero ver los reportes agrupados por quién los manda, porque doce reportes de la misma facultad sobre lo que la critica es una estrategia, no doce quejas. | Los reportes de un mismo origen se agrupan y se resuelven con un criterio, no de a uno. | P1 |

## BO6 · Y quién nos mira a nosotros (lo que le pedimos a las instituciones, aplicado adentro)

| ID | Story | Listo cuando | Prioridad |
|---|---|---|---|
| BO6-1 | Como quien administra, quiero que alguien revise lo que hizo el equipo, porque todo el producto se sostiene en que el escrutinio necesita a alguien de afuera mirando, y adentro no lo aplicamos. | El registro de acciones se puede leer, se revisa cada tanto, y las bajas de testimonios quedan contables. Primera capa, construible: el registro de moderación es público en agregado (cuántos se bajaron, por qué categoría, sin contenido: es lo que O8-6 publica). Segunda capa, decisión de gobierno y no story: una persona externa con acceso de lectura al registro completo. | P1 |
| BO6-2 | Como quien administra, quiero dar de baja a alguien del equipo, porque el acceso a nombres reales no puede sobrevivir a la persona que se fue. | Quitar a alguien le corta el acceso en el momento y su registro de acciones queda. | P2 |

---

# Catálogo de la versión anterior (historia)

Las **126 fichas** de la versión anterior (foundations `US-F*`, tooling `US-T*`, y las `US-001..099` con sus subdivisiones `-b/-f/-i`) viven en [`user-stories/`](user-stories/), cada una con su `Status` en el header (75 Done, el resto Backlog, Cancelada, Parcial o Superada). Son la evidencia del trabajo hecho y **no se tocan**: ni se actualizan ni se reescriben contra la tesis nueva.

El índice por estado y por epic que vivía acá se eliminó el 2026-08-16: había quedado desincronizado con las fichas (31 archivos que no listaba, parents subdivididos que la propia convención dice que no deberían coexistir) y ya no cumplía función. Para el estado histórico, la fuente es el header de cada ficha y las secciones de sprint de [STATUS.md](../STATUS.md).

Convención de IDs que esas fichas usan, y que el catálogo vigente hereda cuando una story del mapa entra a sprint: `US-NNN[-x]` con `-b` backend, `-f` frontend, `-i` infra, `-t` tooling. Effort: Small ≈ 1-3 días, Medium ≈ 3-7 días, Large ≈ 1-2 semanas.

---

## Template y criterios

- **Template de US**: [us-template.md](us-template.md): incluye estructura completa, sources de las prácticas (INVEST / Connextra / BDD / DoR), y guía de cuándo aplicar cada sección.
- **Definition of Ready (DoR)**: dentro de `us-template.md`: pre-sprint, qué tiene que tener una US para entrar al sprint planning.
- **Definition of Done (DoD)**: [definition-of-done.md](definition-of-done.md): post-implementación, qué tiene que cumplir una US para considerarse Done.

US que entran a sprint backfillean (si faltan): Out of scope, Edge cases, Test scenarios (Given-When-Then), Dependencies. US en Backlog pueden estar más livianas: el backfill es parte del sprint planning.

---

## Cómo se trackean

- Catálogo canónico: este doc (las stories del mapa, referenciadas por su ID de mapa hasta entrar a sprint) + una ficha por US numerada en [user-stories/](user-stories/) cuando entra a sprint.
- Tracking operacional: Notion (DB `plan-b: User Stories`), con cross-link a este file vía property `Doc link`.
- En código: PRs referencian `US-NNN` o `UC-NNN` desde la descripción y los commits.
