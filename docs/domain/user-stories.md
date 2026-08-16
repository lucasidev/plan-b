# User Stories (planb)

Catálogo de user stories. Cada US vive en su propio archivo dentro de [user-stories/](user-stories/).

> **Estado (2026-08-16)**: el producto cambió de tesis ([THESIS.md](../THESIS.md), [ADR-0063](../decisions/0063-the-product-is-a-pressure-instrument.md)). **El catálogo vigente es el de abajo, portado del mapa de producto**; el de la versión anterior queda al final como historia (US-097/098/099 canceladas con S12, US-057 muere por tesis, las hechas son historia y no se tocan). La numeración formal `US-NNN` se asigna cuando una story entra a sprint, como siempre; hasta entonces se referencian por su ID de mapa (`O1-1`, `T2-1`, `BO4-2`). Estructura del mapa (rutas, flujos, planos): [`product-map.md`](product-map.md). Personas: [`user-personas.md`](user-personas.md).

---

# El catálogo vigente (mapa de producto, 2026-08-16)

Ocho objetivos con 43 stories, cuatro grupos transversales con 13, y seis de backoffice con 20: 76 en total. Cada una trae su criterio de "listo cuando": sin criterio no se puede decir si una pantalla la resuelve. Prioridad solo donde el mapa la marca (P1/P2); el resto no está priorizado todavía.

## O1 · Decidir dónde estudiar (y poder desconfiar del número)

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
| O3-2 | Como quien está cursando, quiero ver esas combinaciones contra lo que me falta, porque el promedio de todos no es mi caso. | Entrando con cuenta, la lista queda filtrada a las materias que todavía puedo cursar, con las correlativas resueltas. |
| O3-3 | Como quien está cursando, quiero armarlo en papel y volver a marcar lo que curso, porque el planificador propio era el error de la versión anterior. | El producto no arma horarios: entrega los números y el paso siguiente vuelve a marcar el plan. |

## O4 · Que quede registrado (sin que me cueste la cursada)

| ID | Story | Listo cuando |
|---|---|---|
| O4-1 | Como quien está cursando, quiero contarlo en menos de cinco minutos, porque si me lleva más no lo hago nunca. | Se publica tocando frases, sin escribir nada obligatorio. |
| O4-2 | Como quien está cursando, quiero contar de una materia sola, porque no llego con ganas de inventariar el período. | El flujo arranca eligiendo una, sin checklist. |
| O4-3 | Como quien está cursando, quiero que el número quede publicado, porque el reclamo interno no fue a ningún lado. | La cátedra muestra cuántas clases no se dieron. |
| O4-4 | Como quien está cursando, quiero que nadie sepa que fui yo, para poder decir lo que pasó sin que me cueste la cursada. | Lo publicado dice el rol y el período, nunca el nombre. |
| O4-5 | Como quien está cursando, quiero que me avisen cuando cierra el período, porque si nadie me lo recuerda no vuelvo. | El aviso llega con una materia concreta para contar. |
| O4-6 | Como quien está cursando, quiero decir cuántas clases no se dieron, porque es el número que la facultad no publica y el que más pesa cuando reclamo. | La pregunta llega solo a quien marcó que hubo clases sin dar, y el conteo aparece en la ficha de la cátedra. |
| O4-7 | Como quien dejó la carrera, quiero contar por qué me fui aunque ya no curse, porque el que abandonó tiene la explicación completa y nadie se la pide. | Aportar no exige estar cursando, y una materia sola alcanza para dejar el testimonio. |
| O4-8 | Como quien dejó la carrera, quiero decir en qué año me fui, porque cuántos abandonan y cuándo es el dato que ninguna facultad publica. | La ficha muestra en qué punto del plan se cae la mayoría, no solo cuánto tarda el que llega. |
| O4-9 | Como quien dejó la carrera, quiero que no me traten como a un fracaso, porque me fui por cómo la llevaban, no por no poder. | El testimonio de quien abandonó pesa igual que el del que se recibió, y su atribución se cuenta. |

## O5 · Poder deshacer (garantía: se verifica en cada pantalla, no en un flujo)

| ID | Story | Listo cuando |
|---|---|---|
| O5-1 | Como quien ya aportó, quiero editar o borrar lo que conté, porque me expuse más de lo que quería. | El aporte se puede modificar y borrar desde Mis aportes. |
| O5-2 | Como quien ya aportó, quiero borrar mi cuenta y lo mío, porque prometieron que era mío, y eso incluye poder sacarlo. | La baja borra la cuenta y decide qué pasa con lo aportado. |
| O5-3 | Como quien ya aportó, quiero volver a entrar, porque perder la clave no puede costarme lo que ya conté. | Un link al mail devuelve la cuenta con todo adentro. |
| O5-4 | Como quien lee, quiero reportar algo sin registrarme, porque no me voy a hacer cuenta en el sitio que me difama. | El reporte se manda sin cuenta y se revisa a mano. |

## O6 · Que no me molesten (garantía: el contrapeso, nadie quiere más funciones)

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
| O7-4 | Como la institución, quiero que se vea si mejoré, porque arreglé el trámite y el número es de cohortes viejas. | La serie muestra período a período con la escala completa. |
| O7-5 | Como el docente, quiero enterarme de que me nombraron, porque no puedo responder algo que no sé que existe. | Al docente verificado le llega el aviso cuando su cátedra recibe una valoración. |
| O7-6 | Como el docente, quiero que no me presuman el silencio, porque no contestar es una postura, no una admisión. | La ficha dice "todavía no respondió" y nunca interpreta por qué. |
| O7-7 | Como la institución, quiero ver si mejoré desde que lo publicaron, porque sin serie el número es una foto y no me sirve para gestionar. | La ficha muestra la gestión período a período con escala completa de 1 a 5. |

## O8 · Llevarme el dato (para discutirlo afuera)

| ID | Story | Listo cuando |
|---|---|---|
| O8-1 | Como quien investiga, quiero descargar el crudo sin registrarme, porque ustedes muestran qué pasa y el por qué es trabajo mío. | El CSV sale con una fila por frase, su eje y su atribución. |
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
| BO6-1 | Como quien administra, quiero que alguien revise lo que hizo el equipo, porque todo el producto se sostiene en que el escrutinio necesita a alguien de afuera mirando, y adentro no lo aplicamos. | El registro de acciones se puede leer, se revisa cada tanto, y las bajas de testimonios quedan contables. | P1 |
| BO6-2 | Como quien administra, quiero dar de baja a alguien del equipo, porque el acceso a nombres reales no puede sobrevivir a la persona que se fue. | Quitar a alguien le corta el acceso en el momento y su registro de acciones queda. | P2 |

---

# Catálogo de la versión anterior (historia)

Convención de IDs: `US-NNN[-x]` con `-b` backend, `-f` frontend, `-i` infra, `-t` tooling. Foundations (`US-FNN`) son trabajo del Sprint 0 (pre-sprint). Tooling cross-cutting post-S0 usa prefijo `US-TNN` (e.g. testing infra, observability infra, release tooling).

Granularidad: cada US backlog mapea 1:1 con un UC del catálogo ([actors-and-use-cases.md](actors-and-use-cases.md)). Los UCs identificados durante el DDD discovery se integraron al rango canónico (US-021 a US-028 cubren los flujos nuevos de Identity onboarding y Planning premium).

Effort: Small ≈ 1-3 días, Medium ≈ 3-7 días, Large ≈ 1-2 semanas.

---

## Por estado

### Done (28)

Foundations (S0) + Fase 2 completa (S1: auth slice + cleanup + AppShell + home + StudentProfile) + institucionalización de testing/changelog/versioning + git workflow rules (S1, T-series).

#### S0: pre-sprint

| ID | Título | Epic |
|---|---|---|
| [US-F01-b](user-stories/US-F01-b.md) | Scaffolding modular monolith backend | EPIC-00 |
| [US-F01-f](user-stories/US-F01-f.md) | Scaffolding frontend Next.js | EPIC-00 |
| [US-F02-t](user-stories/US-F02-t.md) | Tooling: Justfile + Lefthook + Conventional Commits | EPIC-00 |
| [US-F03-i](user-stories/US-F03-i.md) | Infra local: Docker Postgres pgvector + Mailpit | EPIC-00 |
| [US-F04-i](user-stories/US-F04-i.md) | CI baseline GitHub Actions | EPIC-00 |
| [US-F05](user-stories/US-F05.md) | ADRs base 0001-0033 | EPIC-00 |
| [US-F06](user-stories/US-F06.md) | DDD formalization (strategic + tactical + epics + US) | EPIC-00 |
| [US-010-b](user-stories/US-010-b.md) | Register backend | EPIC-02 |

#### S1: sprint actual (cierra Fase 2)

| ID | Título | Epic |
|---|---|---|
| [US-010-f](user-stories/US-010-f.md) | Register frontend (sign-up tab del AuthView) | EPIC-02 |
| [US-011-b](user-stories/US-011-b.md) | Verify email backend | EPIC-02 |
| [US-011-f](user-stories/US-011-f.md) | Verify email frontend | EPIC-02 |
| [US-028-b](user-stories/US-028-b.md) | Login backend | EPIC-02 |
| [US-028-f](user-stories/US-028-f.md) | Login frontend | EPIC-02 |
| [US-029-i](user-stories/US-029-i.md) | Sign-out integrated | EPIC-02 |
| [US-033-i](user-stories/US-033-i.md) | Recuperación de contraseña (integrated) | EPIC-02 |
| [US-021-b](user-stories/US-021-b.md) | Reenviar verification email (backend) | EPIC-02 |
| [US-021-f](user-stories/US-021-f.md) | Reenviar verification email (frontend) | EPIC-02 |
| [US-022-b](user-stories/US-022-b.md) | Expirar registros no verificados (backend) | EPIC-02 |
| [US-022-i](user-stories/US-022-i.md) | Expirar registros no verificados (infra: migrations + scheduling) | EPIC-02 |
| [US-012-b](user-stories/US-012-b.md) | Crear StudentProfile (backend) | EPIC-02 |
| [US-042-f](user-stories/US-042-f.md) | AppShell del área autenticada | EPIC-04 |
| [US-043-f](user-stories/US-043-f.md) | Home del dashboard (placeholder visual) | EPIC-04 |
| [US-T01-f](user-stories/US-T01-f.md) | Frontend unit/component testing infra (vitest + Testing Library) | EPIC-00 |
| [US-T02-f](user-stories/US-T02-f.md) | Frontend E2E infra (Playwright permanente + helpers + CI on-demand) | EPIC-00 |
| [US-T03-b](user-stories/US-T03-b.md) | Backend unit test layer split (Domain/Handler unit) | EPIC-00 |
| [US-T04-b](user-stories/US-T04-b.md) | Backend architecture tests con NetArchTest | EPIC-00 |
| [US-T05-i](user-stories/US-T05-i.md) | Changelog auto-append + PR title validator | EPIC-00 |
| [US-T06-i](user-stories/US-T06-i.md) | Tier 1 CI workflows (Dependabot + all-commits CC + docs-links) | EPIC-00 |

### Sprint actual

S1 cerrado el 2026-05-02. Roadmap confirmado de S2 a S5 abajo.

### Roadmap S2: S5 (confirmado)

Plan acordado el 2026-05-03 después del rediseño UX (ADR-0041). El alcance por sprint está cerrado; el orden interno de cada sprint se afina al planificar.

| Sprint | Foco | US |
|---|---|---|
| **S2** | Auth + Onboarding + Inicio + Mi carrera (shell, stub data) | [US-036](user-stories/US-036.md), [US-037](user-stories/US-037.md), [US-044](user-stories/US-044.md), [US-045](user-stories/US-045.md) |
| **S3** | Planificar (shell + tabs) + Mi perfil + self-disable | [US-046](user-stories/US-046.md), [US-047](user-stories/US-047.md), [US-075](user-stories/US-075.md) |
| **S4** | Reseñas (shell + editor) + Rankings | [US-017](user-stories/US-017.md), [US-018](user-stories/US-018.md), [US-019](user-stories/US-019.md), [US-020](user-stories/US-020.md), [US-048](user-stories/US-048.md), [US-049](user-stories/US-049.md), [US-057](user-stories/US-057.md) |
| **S5** | Búsqueda global + Ajustes + Soporte (Ayuda + Sobre plan-b) | [US-056](user-stories/US-056.md), [US-072](user-stories/US-072.md), [US-073](user-stories/US-073.md), [US-074](user-stories/US-074.md) |

**Notas del roadmap:**

- El backend de Mi carrera (catálogo + plan + correlativas) queda como deuda diferida en S2 con stub data (decisión Lucas 2026-05-03). Se decide en planning si entra en S2 o S3 cuando llegue el momento, según cómo venga el sprint.
- US-016 (simular inscripción backend) puede entrar en S3 si Planificar lo necesita, sino queda backlog hasta S4.
- US-013/14/15 (cargar / importar / editar historial) son tabs internos de Mi carrera (S2). El backend de cargar manual puede aterrizar en S2 o quedar deuda diferida igual que el resto de Academic CRUD.
- US-058 (admin/mod deshabilita member) sigue backlog open: es flow de moderación, no MVP.

### Backlog (70)

> El rediseño UX del 2026-05-02 ([ADR-0041](../decisions/0041-rediseño-ux-post-claude-design.md)) introdujo las US-045 a US-049 + US-057 a US-075 (Mi carrera shell, Planificar shell, Mi perfil, Reseñas shell + editor, Rankings, Búsqueda global, Ajustes, Ayuda, Sobre plan-b, self-disable). Las del rango canónico previo (US-001 a US-033) que cambien scope referencian el ADR cuando aterricen a sprint.

Agrupado por epic.

#### EPIC-00: Foundations & DevEx (transversales de producto)

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-039-f](user-stories/US-039-f.md) | Estado offline (banner global + acciones en pausa) | Medium | S |
| [US-009-f](user-stories/US-009-f.md) | Páginas de error globales (404 + 5xx) | Medium | S |
| [US-T07-b](user-stories/US-T07-b.md) | Architecture tests para los 5 módulos (Done, S6) | Medium | S |
| [US-T08](user-stories/US-T08.md) | Backfill de cobertura de lógica de valor y dominio (En curso, S9) | High | L |

#### EPIC-01: Catálogo público y exploración

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-001](user-stories/US-001.md) | Explorar catálogo de universidades y carreras | High | M |
| [US-002](user-stories/US-002.md) | Ver materia con sus reseñas | High | M |
| [US-003](user-stories/US-003.md) | Ver docente con sus reseñas | High | M |
| [US-004](user-stories/US-004.md) | Buscar materia o docente | Medium | S |
| [US-056](user-stories/US-056.md) | Búsqueda global (topbar dropdown con Meilisearch) | High | L |
| [US-090-f](user-stories/US-090-f.md) | El copy no promete verificación de alumno que no hacemos (ADR-0048) | High | S |
| [US-034](user-stories/US-034.md) | Stats públicas agregadas en hero | Low | S |
| [US-054-f](user-stories/US-054-f.md) | Landing pública en / (Done, S9) | Medium | M |

#### EPIC-02: Identidad y autenticación

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-036](user-stories/US-036.md) | Auth rebuild: 4 rutas separadas (Signup / Login / Forgot / ForgotSent) | Medium | M |
| [US-037](user-stories/US-037.md) | Onboarding 4 pasos (Bienvenida / Carrera / Historial / Listo) | High | M |
| [US-038-bis](user-stories/US-038-bis.md) | Soft delete con anonimización de cuenta (Done, S4, ADR-0044) | High | M |
| [US-047](user-stories/US-047.md) | Mi perfil (view + edit datos académicos + foto) | High | M |
| [US-058](user-stories/US-058.md) | Deshabilitar cuenta member (admin/mod) | Medium | S |
| [US-072](user-stories/US-072.md) | Ajustes (notificaciones / privacidad / idioma / tema) | Medium | M |
| [US-073](user-stories/US-073.md) | Ayuda (FAQ + contacto soporte) | Low | S |
| [US-074](user-stories/US-074.md) | Sobre plan-b (página informacional + créditos) | Low | S |
| [US-075](user-stories/US-075.md) | Member deshabilita su propia cuenta (self-disable) (Cancelada, ADR-0044) | Medium | S |
| [US-079-i](user-stories/US-079-i.md) | Cambiar contraseña con sesión activa (integrated) | Medium | S |
| [US-091](user-stories/US-091.md) | Oficialización de condición por evidencia (parent -b/-f/-i, ADR-0048) | Medium | L |
| [US-035](user-stories/US-035.md) | Sign-in con Google (OAuth) | Low | M |
| [US-059-f](user-stories/US-059-f.md) | Auth + Onboarding al AuthShell/OnbShell v2 (Done, S9) | High | M |

#### EPIC-03: Historial académico

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-013](user-stories/US-013.md) | Cargar historial manual | High | M |
| [US-014](user-stories/US-014.md) | Importar historial desde PDF/texto | Low | L |
| [US-015](user-stories/US-015.md) | Editar entrada del historial | Medium | S |
| [US-097](user-stories/US-097.md) | Cerrar la cursada al terminar el cuatrimestre | High | M |
| [US-045](user-stories/US-045.md) | Mi carrera shell + 5 tabs (consolidación de vistas académicas) | High | L |

#### EPIC-04: Planificación de cuatrimestre

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-016](user-stories/US-016.md) | Simular inscripción (rediseño: Planificar 2 tabs En curso / Borrador, ADR-0041) | High | L |
| [US-023](user-stories/US-023.md) | Guardar simulación como draft privado | Medium | M |
| [US-024](user-stories/US-024.md) | Compartir simulación al corpus público | Medium | S |
| [US-025](user-stories/US-025.md) | Editar simulación (fusionada en US-023) | Medium | S |
| [US-026](user-stories/US-026.md) | Borrar simulación (fusionada en US-023) | Low | S |
| [US-027](user-stories/US-027.md) | Ver simulaciones públicas de otros alumnos | Medium | S |
| [US-096](user-stories/US-096.md) | Elegir comisión y ver choques en el planificador | High | M |
| [US-098](user-stories/US-098.md) | Ver cómo le fue a la gente en cada comisión, al elegirla | High | L |
| [US-044](user-stories/US-044.md) | Inicio v2 con pregunta dominante | High | M |
| [US-046](user-stories/US-046.md) | Planificar shell + 2 tabs (en curso / borrador) + nudge de promoción | High | L |

> "Recibir simulación recomendada" se movió a [post-mvp.md](post-mvp.md) hasta que se elija algoritmo (CF / heurística / embeddings).

#### EPIC-05: Sistema de reseñas

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-017](user-stories/US-017.md) | Publicar reseña | High | L |
| [US-018](user-stories/US-018.md) | Editar reseña propia | Medium | S |
| [US-019](user-stories/US-019.md) | Reportar reseña | Medium | M |
| [US-020](user-stories/US-020.md) | Ver mis reports | Low | S |
| [US-048](user-stories/US-048.md) | Reseñas shell + 3 tabs (explorar / pendientes / mías) | High | M |
| [US-049](user-stories/US-049.md) | Editor de reseña 6 campos numerados con preview vivo | High | L |
| [US-057](user-stories/US-057.md) | Rankings (top 10 paginado: docentes / materias / comisiones) | Medium | M |
| [US-077-b](user-stories/US-077-b.md) | Backend de Notificaciones (parent, splitada b-1/b-2/b-3) | Medium | L |
| [US-077-f](user-stories/US-077-f.md) | Panel de notificaciones (dropdown del bell del topbar) | Medium | M |
| [US-089](user-stories/US-089.md) | Persistir modelo completo de reseña (rating, horas, tags), en S6 | High | M |
| [US-099](user-stories/US-099.md) | Valorar materias viejas al cargar el historial, en una pregunta | High | M |
| [US-055](user-stories/US-055.md) | Borrar reseña propia (action + modal destructivo) | Medium | S |

#### EPIC-06: Claim e identidad docente

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-030](user-stories/US-030.md) | Iniciar claim de docente | Medium | S |
| [US-031](user-stories/US-031.md) | Verificar docente por email institucional | Medium | M |
| [US-032](user-stories/US-032.md) | Solicitar verificación manual | Low | M |
| [US-040](user-stories/US-040.md) | Responder reseña | Medium | S |
| [US-041](user-stories/US-041.md) | Editar respuesta docente | Low | S |
| [US-069](user-stories/US-069.md) | Verificar TeacherProfile manual (admin) | Low | M |
| [US-092](user-stories/US-092.md) | Migrar verificación de docente a oficialización por evidencia (parent, ADR-0048) | Medium | M |

#### EPIC-07: Moderación

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-050](user-stories/US-050.md) | Ver cola de reseñas under_review | High | S |
| [US-051](user-stories/US-051.md) | Resolver report | High | M |
| [US-052](user-stories/US-052.md) | Restaurar reseña removida | Medium | S |
| [US-053](user-stories/US-053.md) | Ver audit log | Medium | S |
| [US-085](user-stories/US-085.md) | Strike system + pedir edición al autor + ocultar/banear | Medium | L-XL |
| [US-086](user-stories/US-086.md) | Audit log per-user (tab del detalle de usuario en backoffice) | Medium | M |
| [US-095](user-stories/US-095.md) | Lista de usuarios del backoffice | Medium | M |

#### EPIC-08: Backoffice de catálogo

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-060](user-stories/US-060.md) | Gestionar University | High | M |
| [US-061](user-stories/US-061.md) | Gestionar Career + CareerPlan | High | M |
| [US-062](user-stories/US-062.md) | Gestionar Subject + Prerequisite | High | M |
| [US-063](user-stories/US-063.md) | Gestionar Teacher | Medium | S |
| [US-064](user-stories/US-064.md) | Gestionar AcademicTerm | Medium | S |
| [US-065](user-stories/US-065.md) | Gestionar Commission + CommissionTeacher | Medium | M |
| [US-007](user-stories/US-007.md) | Importador de plan con preview/diff (CSV a catálogo) | Medium | L |
| [US-006](user-stories/US-006.md) | Merge de Subjects duplicados (admin) | Medium | L |
| [US-084](user-stories/US-084.md) | Migración asistida de plan de estudios (mapping de materias) | Medium | XL |
| [US-088](user-stories/US-088.md) | Importar plan de estudios desde PDF en onboarding (Done, S3) | Medium | L |
| [US-093](user-stories/US-093.md) | Gestionar Comisión (CRUD de oferta por término, con horarios; absorbe pendiente de US-065) | High | L |
| [US-094](user-stories/US-094.md) | Wizard de alta de universidad (onboarding admin) | Medium | L |

#### EPIC-09: Backoffice de cuentas staff

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-067](user-stories/US-067.md) | Crear cuentas staff | Medium | S |
| [US-081](user-stories/US-081.md) | Dashboard ops del admin (KPIs + cola) (En curso) | High | M |
| [US-005](user-stories/US-005.md) | Feed global de actividad reciente (dashboard ops admin) | Medium | M |

#### EPIC-10: Dashboard institucional

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-008](user-stories/US-008.md) | Ver dashboard institucional | Low | L |

#### Tooling post-S0 (T-series)

Toda la T-series del MVP cerró en S1 (Done arriba). Trabajo de tooling futuro va a entrar como T07+ cuando se identifique necesidad concreta.

---

## Por epic

- [EPIC-00: Foundations & DevEx](epics/EPIC-00.md)
- [EPIC-01: Catálogo público y exploración](epics/EPIC-01.md)
- [EPIC-02: Identidad y autenticación](epics/EPIC-02.md)
- [EPIC-03: Historial académico](epics/EPIC-03.md)
- [EPIC-04: Planificación de cuatrimestre](epics/EPIC-04.md)
- [EPIC-05: Sistema de reseñas](epics/EPIC-05.md)
- [EPIC-06: Claim e identidad docente](epics/EPIC-06.md)
- [EPIC-07: Moderación](epics/EPIC-07.md)
- [EPIC-08: Backoffice de catálogo](epics/EPIC-08.md)
- [EPIC-09: Backoffice de cuentas staff](epics/EPIC-09.md)
- [EPIC-10: Dashboard institucional](epics/EPIC-10.md)

---

## Template y criterios

- **Template de US**: [us-template.md](us-template.md): incluye estructura completa, sources de las prácticas (INVEST / Connextra / BDD / DoR), y guía de cuándo aplicar cada sección.
- **Definition of Ready (DoR)**: dentro de `us-template.md`: pre-sprint, qué tiene que tener una US para entrar al sprint planning.
- **Definition of Done (DoD)**: [definition-of-done.md](definition-of-done.md): post-implementación, qué tiene que cumplir una US para considerarse Done.

US que entran a sprint backfillean (si faltan): Out of scope, Edge cases, Test scenarios (Given-When-Then), Dependencies. US en Backlog pueden estar más livianas: el backfill es parte del sprint planning.

---

## Cómo se trackean

- Catálogo canónico: este doc + archivos individuales en [user-stories/](user-stories/).
- Tracking operacional: Notion (DB `plan-b: User Stories`), con cross-link a este file vía property `Doc link`.
- En código: PRs referencian `US-NNN` o `UC-NNN` desde la descripción y los commits.
