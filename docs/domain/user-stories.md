# User Stories (planb)

Catálogo de user stories. Cada US vive en su propio archivo dentro de [user-stories/](user-stories).

> **Estado (2026-08-16)**: el producto cambió de tesis ([THESIS.md](../THESIS.md), [ADR-0063](../decisions/0063-the-product-is-a-pressure-instrument.md)). **El catálogo vigente es el de abajo, portado del mapa de producto**; el de la versión anterior queda al final como historia (US-097/098/099 canceladas con S12, US-057 muere por tesis, las hechas son historia y no se tocan). La numeración formal `US-NNN` se asigna cuando una story entra a sprint, como siempre; hasta entonces se referencian por su ID de mapa (`O1-1`, `T2-1`, `BO4-2`). Estructura del mapa (pantallas, flujos, planos): [`product-map.md`](product-map.md). Los nombres en backticks (`donde`, `reseñar`, `metodo`) son nombres de pantalla del mapa, no rutas: la URL es código, en inglés, y se fija al entrar a sprint. Personas: [`user-personas.md`](user-personas.md).

---

# El catálogo vigente (mapa de producto, 2026-08-16)

Ocho objetivos con 49 stories, cuatro grupos transversales con 15, y seis de backoffice con 29: 93 en total (revisado 2026-08-16: se fusionaron O4-3 en O4-6 y O7-4 en O7-7, O5-3 pasó a garantía, y entraron T2-4 y O8-6; **revisado 2026-08-17 contra la tesis cerrada**, [ADR-0064](../decisions/0064-phrases-with-voices-not-scores.md) a [0068](../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md): se reescribieron 39 criterios que hablaban con el vocabulario viejo o prometían menos de lo decidido, y entraron 19 que las decisiones pedían y nadie construía: O1-8, O4-10 a O4-13, O7-8, O8-7, O8-8, T1-4, T3-7, BO1-5 a BO1-9, BO2-5, BO2-6, BO3-3 y BO4-6; después, T3-7 se fusionó en O1-8). Cada una trae su criterio de "listo cuando": sin criterio no se puede decir si una pantalla la resuelve. **Un criterio por línea y hasta tres por story**: cada uno tiene que poder marcarse verdadero o falso por separado; si hacen falta más de tres, la story es una épica y se parte al planificar (está marcada así en Notas). El detalle (criterios de aceptación completos, edge cases, out of scope, Given-When-Then, dependencias) entra en la ficha `US-NNN` cuando la story entra a sprint, como fija el [template](us-template.md): la fila es la tarjeta, no la especificación. Prioridad solo donde el mapa la marca (P1/P2); el resto no está priorizado todavía. **Notas** trae la prioridad, si es épica, de qué depende, con qué story es par (el mismo hecho visto por dos actores: se construyen juntas) y si espera una decisión.

**Los roles son una lista cerrada, y cada uno es una persona** ([user-personas.md](user-personas.md)): quien lee (cualquiera, sin cuenta), quien está eligiendo (Valentina), quien paga y no cursa (Silvia), quien no está cubierto (Ana), quien está cursando (Lucía), quien reseña (cualquiera en el acto de reseñar), quien ya aportó (Matías), quien vuelve (una cuenta que vuelve), quien dejó la carrera (Diego), quien ya no entra a la app (Diego y los egresados), quien investiga (Rocío), el docente (Claudia, Paredes), la institución, quien carga el catálogo (Sofía), quien cura las frases (equipo, editorial), quien modera (Nahuel), quien verifica (Nahuel hoy; otra persona si BO3-3 se acepta), quien administra (Admin). Una story con un rol que no está acá tiene el rol mal.

> **Pendientes de decisión (2026-08-17)**, señalados en su fila o acá: O2-2 (si el pedido de carrera confirma el mail por link como el reporte), O3-2 y `micarrera` (qué recaba "marcar el plan": el filtro por correlativas necesita hechos que la tesis no pide), O4-6 (cómo se publica el escalar "clases sin dar"), O7-6 (qué dice la ficha del docente que nunca fue notificado), T1-2 (si corregir un dato pide aporte previo o solo cuenta), T3-1 (si la materia pendiente de vincular cuenta en alguna ficha y en la cobertura), BO3-3 (D4, roles excluyentes), BO5-3 (qué señal agrupa reportes de mails distintos), el denominador del gate de cobertura cuando coexisten dos planes, y qué pasa con los hechos de trayectoria al dar de baja la cuenta.

## O1 · Decidir dónde estudiar (y poder desconfiar del número)

> O1-1, O1-7, O3-1 y O4-8 no salen de frases: salen de **trayectoria** (cuándo cursaste y cómo terminó, cuándo entraste, si te fuiste cuándo, si te recibiste cuándo). Esos hechos se preguntan de a uno, en el momento en que aparecen, nunca como inventario, y el silencio no se infiere; qué se publica con ellos y cómo se calcula: [ADR-0067](../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md).

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| O1-1 | Como quien está eligiendo, quiero ver cuánto tarda de verdad, para no creerle a la duración del plan. | 1. La ficha muestra la duración nominal del plan y la real: la mediana de años entre entré y me recibí, de los egresados que declararon los dos.<br>2. Muestra la brecha en años y de cuántos egresados sale.<br>3. Cada número dice "de los que se recibieron y reseñaron acá". | depende de O4-11, O4-12 |
| O1-2 | Como quien está eligiendo, quiero comparar la misma carrera en varias instituciones, para elegir con algo más que la opinión de mi familia. | 1. Las ofertas de la misma carrera canónica se ven lado a lado, dato por dato: nominal, real, brecha, egreso de cohortes cerradas, las dos cabeceras con su gate, la cobertura y las listas por eje.<br>2. Sin compuesto, sin ganador y sin ordenar por valor: alfabético o por voces.<br>3. El que quiere ordenar baja el CSV. | épica: se parte al planificar; depende de BO1-5 |
| O1-3 | Como quien está eligiendo, quiero saber si lo que la hace difícil es la carrera o la facultad, porque una cosa la elijo y la otra la sufro. | 1. La atribución va en la cabecera de la ficha, no en otra caja: dos proporciones con el mismo denominador, "dicen que es dura" y "marcaron alguien fallando".<br>2. El denominador son personas en la ficha de una cursada y voces en las derivadas.<br>3. La decide el eje de cada frase ([ADR-0065](../decisions/0065-attribution-is-the-axis-not-a-split.md)). |  |
| O1-4 | Como quien está eligiendo, quiero ver cómo calculan cada número, para poder descartarlo con fundamento o citarlo. | 1. `metodo` publica la fórmula del encogimiento (el límite inferior de Wilson, tal cual) y cómo se suman las voces y se derivan las fichas.<br>2. Publica el catálogo de frases entero, con el sujeto y el eje de cada una.<br>3. Publica los sesgos declarados: de quienes reseñaron; la duración real, de los que se recibieron; la co-cursada, de quien reseñó las dos. |  |
| O1-5 | Como quien está eligiendo, quiero ver sobre cuántas voces se calcula, porque una proporción sostenida por dos voces miente. | Cada proporción publicada muestra sus voces, su período y su encogimiento al lado, desde la primera voz. |  |
| O1-6 | Como quien lee, quiero buscar por materia, carrera o docente, porque lo que me recomiendan es una persona, no una carrera. | Una sola búsqueda devuelve los cuatro sujetos con ficha (materia, cátedra, carrera en una institución, institución), y buscar el nombre de un docente lleva a su cátedra. | depende de BO1-6 |
| O1-7 | Como quien paga y no cursa, quiero saber si esto termina en un título, porque pongo la plata y no entiendo de planes ni de correlativas. | Duración real, brecha y las tres proporciones de la cohorte cerrada (se recibió, se fue, no dijo o sigue) se leen sin abrir nada ni saber vocabulario académico, y cada una dice que sale de quienes reseñaron. | depende de O4-11, O4-12 |
| O1-8 | Como quien está eligiendo, quiero saber si lo que dice la ficha de la carrera vale para toda la carrera o para tres materias, porque un problema en dos materias no es una carrera rota. | 1. Todo dato derivado muestra su cobertura ("22 de 40 materias con voces") y cada frase derivada dice en cuántas materias aparece.<br>2. La cabecera de carrera e institución aparece solo cuando más de la mitad de las materias del plan tiene voces.<br>3. Debajo de eso la ficha muestra la cobertura, dice que todavía no derivamos y deja leer materia por materia; nunca un cero ni una cabecera armada con tres materias. | P1 |

## O2 · Entender el vacío (cuando lo que busco no está)

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| O2-1 | Como quien no está cubierto, quiero saber si el vacío es de ustedes o de mi facultad, para no sospechar del producto. | La ficha distingue tres estados y ninguno es un cero: "no la cargamos todavía", "cargada y todavía sin voces", y "cargada, con voces, todavía no derivamos la cabecera" con su cobertura a la vista. |  |
| O2-2 | Como quien no está cubierto, quiero pedir la carga sin registrarme, porque todavía no me sirve de nada tener cuenta acá. | El pedido se manda con el mail y nada más. | decisión pendiente: si el pedido confirma el mail por link |
| O2-3 | Como quien no está cubierto, quiero ver cuántos más la pidieron, para saber si tengo alguna chance. | La cola es pública y ordenada por cantidad de pedidos. |  |
| O2-4 | Como quien no está cubierto, quiero que me avisen cuando la carguen, para no tener que volver a probar cada tanto. | Llega un mail con el link a la ficha ya cargada, que se lee sin cuenta; si decide registrarse, el pedido precarga institución y carrera y no se las vuelve a preguntar. | depende de BO1-3, avisos por mail; par de BO1-3 |

## O3 · Armar el cuatrimestre (lo que la lapicera no calcula sola)

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| O3-1 | Como quien está cursando, quiero saber qué materias se pueden llevar juntas, para no repetir la combinación que ya me tumbó. | La ficha del plan muestra, por par de materias y período, cuántas personas las reseñaron juntas y cuántas dejaron una; solo desde reseñas, nunca desde el plan marcado. | depende de O4-10 |
| O3-2 | Como quien está cursando, quiero ver esas combinaciones contra lo que me falta, porque el promedio de todos no es mi caso. | 1. Entrando con cuenta, la lista de co-cursada se filtra a las materias que todavía puedo cursar, con las correlativas resueltas.<br>2. Resolver correlativas contra el plan es lo que hoy hace `SubjectAvailabilityEvaluator` en `planning`: se rescata a `academic` antes de podar, no se reescribe. | decisión pendiente: qué recaba marcar el plan |
| O3-3 | Como quien está cursando, quiero armarlo en papel y volver a marcar lo que curso, porque el planificador propio era el error de la versión anterior. | El producto no arma horarios: entrega los números y el paso siguiente vuelve a marcar el plan. |  |

## O4 · Que quede registrado (sin que me cueste la cursada)

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| O4-1 | Como quien está cursando, quiero reseñarla en menos de cinco minutos, porque si me lleva más no lo hago nunca. | Se publica marcando frases, sin escribir nada obligatorio; el comentario es el último paso y es opcional. |  |
| O4-2 | Como quien está cursando, quiero reseñar una materia sola, porque no llego con ganas de inventariar el período. | El flujo arranca eligiendo una, sin checklist. |  |
| O4-4 | Como quien está cursando, quiero que nadie sepa que fui yo, para poder decir lo que pasó sin que me cueste la cursada. | De una reseña se publica su período, su cátedra si la dio, las frases que marcó y el comentario si escribió uno: nunca el nombre, la cuenta, el rol ni cómo terminó. |  |
| O4-5 | Como quien está cursando, quiero que me avisen cuando cierra el período, porque si nadie me lo recuerda no vuelvo. | El aviso sale por mail al cerrar el período y nombra una materia concreta para reseñar. | depende de avisos por mail |
| O4-6 | Como quien está cursando, quiero decir cuántas clases no se dieron y que el número quede publicado, porque es el que la facultad no publica y el que más pesa cuando reclamo, y el reclamo interno no fue a ningún lado. | La pregunta llega solo a quien marcó que hubo clases sin dar, y el conteo aparece en la ficha de la cátedra. (Absorbe la que era O4-3.) | decisión pendiente: cómo se publica el escalar |
| O4-7 | Como quien dejó la carrera, quiero reseñar por qué me fui aunque ya no curse, porque el que abandonó tiene la explicación completa y nadie se la pide. | Aportar no exige estar cursando, y una materia sola alcanza para dejar el testimonio. |  |
| O4-8 | Como quien dejó la carrera, quiero decir en qué año me fui, porque cuántos abandonan y cuándo es el dato que ninguna facultad publica. | 1. La ficha muestra en qué año del plan se fue la mayoría de los que se fueron.<br>2. Por materia muestra dónde se cae: abandono de cursada y aprobación, desde cómo terminó.<br>3. "Me fui / me recibí" se pregunta una sola vez, por cuatro caminos (`reseñar` con período viejo, `abandono`, la app cuando pasó entré + nominal, el mail anual); quien no contesta queda como "no dijo", nunca se infiere. | épica: se parte al planificar; depende de O4-10, O4-11 |
| O4-9 | Como quien dejó la carrera, quiero que no me traten como a un fracaso, porque me fui por cómo la llevaban, no por no poder. | La reseña de quien dejó suma voces igual que cualquier otra y sus frases van al mismo conteo; lo publicado no dice cómo terminó ni quién la escribió. |  |
| O4-10 | Como quien está cursando, quiero decir cómo terminó la cursada en un toque, porque es un dato que ya sé y no me cuesta nada. | La reseña pide cómo terminó (la aprobé, me quedó regular, la desaprobé, la dejé, sigo) como un toque más; de ahí salen la aprobación (aprobé sobre aprobé más desaprobé) y el abandono de cursada por materia y período. |  |
| O4-11 | Como quien reseña, quiero que la primera vez me pregunten cuándo entré, y una sola vez, porque es el dato que ata todo lo demás y no lo voy a repetir. | La primera vez que la cuenta reseña una carrera se le pregunta el año de ingreso, una sola vez y nunca más; si no contesta queda como "no dijo". |  |
| O4-12 | Como quien ya no entra a la app, quiero que me pregunten por mail si me recibí, porque no voy a volver solo para contarlo. | A las cuentas inactivas les llega, una vez al año, un mail con una sola pregunta ("¿te recibiste? ¿cuándo?") respondible desde el mail sin entrar a la app. | depende de avisos por mail |
| O4-13 | Como quien está cursando, quiero reseñar lo que pasó fuera de una cursada, porque el título que tardó ocho meses no es de ninguna materia. | Se reseña de a un evento, sin materia: frases, comentario opcional y votos igual que una cursada, y sus frases van a la ficha de la institución como lo que se dice de ella como sujeto. | épica: se parte al planificar |

## O5 · Poder deshacer (se construye: las pantallas `editar` y `baja`, y el reporte sin cuenta)

> O6 es una **garantía**: cada pantalla nueva la tiene que cumplir y se verifica como parte del Definition of Done del producto nuevo. O5 no: deshacer se construye (las pantallas `editar` y `baja`, y el reporte sin cuenta con mail confirmado por link). Recuperar la contraseña (la que era O5-3) sí es garantía y no una story: la cuenta con todo adentro vuelve con un link al mail.

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| O5-1 | Como quien ya aportó, quiero editar o borrar lo que conté, porque me expuse más de lo que quería. | El aporte se puede modificar y borrar desde Mis aportes, y el comentario editado vuelve a pasar el chequeo previo antes de publicarse ([ADR-0068](../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md)). | depende de T2-1 |
| O5-2 | Como quien ya aportó, quiero poder sacar lo mío y después irme, porque prometieron que era mío, y eso incluye poder sacarlo. | Los aportes se borran de a uno antes (O5-1); la baja de cuenta anonimiza la identidad y preserva lo que quedó aportado ([ADR-0044](../decisions/0044-soft-delete-del-user-con-preservacion-de-corpus.md)), y la pantalla lo dice con esas palabras antes de confirmar. |  |
| O5-4 | Como quien lee, quiero reportar algo sin registrarme, porque no me voy a hacer cuenta en el sitio que me difama. | El reporte se manda sin cuenta, confirma el mail por link antes de entrar a la cola, y lo resuelve una persona: nada baja solo por cantidad de reportes. | par de BO2-2 |

## O6 · Que no me molesten (garantía: el contrapeso, nadie quiere más funciones)

> Garantías, como O5. O6-1 es la decisión 3 de la tesis dicha como checklist.

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| O6-1 | Como quien lee, quiero que no me pidan cuenta para nada, porque vine a mirar, no a participar. | Ninguna pantalla de lectura tiene login. |  |
| O6-2 | Como quien vuelve, quiero que no me vuelvan a preguntar lo que ya dije, porque lo dije una vez y lo demás viene con lo que reseño. | 1. Ningún hecho ya declarado se vuelve a preguntar en ningún flujo: entré se pregunta una sola vez; cursé y cómo terminó vienen con la reseña.<br>2. Lo único que puede volver a ofrecerse es el hecho que nunca respondí (el reenganche por mail, una vez al año), y responderlo lo apaga para siempre. |  |
| O6-3 | Como quien vuelve, quiero poder saltearlo y usar la app igual, porque no vine a hacer trámites. | Todo funciona sin plan cargado, salvo lo que necesita saber qué cursás. |  |
| O6-4 | Como quien lee, quiero que no me vendan nada, porque desconfío de cualquier cosa que parezca promocionada. | No hay institución destacada, patrocinada ni ordenada por conveniencia. |  |

## O7 · Contestar lo que se publicó (con nombre, porque es público)

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| O7-1 | Como el docente, quiero responder por mi cátedra con mi nombre, para que mi versión quede al lado y no abajo. | La réplica se publica al lado del testimonio, con nombre y rol, y solo desde identidad verificada; no baja el testimonio ni mueve conteos ([ADR-0068](../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md)). | épica: se parte al planificar; depende de O7-8, T2-2 |
| O7-2 | Como el docente, quiero que se vea que doy bien mi materia, porque es la primera vez que alguien lo mide. | 1. La ficha de cátedra publica los dos ejes sin mezclarlos: la cabecera con las dos proporciones y, por eje, la lista de frases con sus voces.<br>2. Exigencia alta se lee como información, no como falla; en ningún lado hay un puntaje. |  |
| O7-3 | Como la institución, quiero saber en qué estoy peor que la de al lado, porque el dato que me expone es el que me dice dónde arreglar. | 1. La ficha compara lo que se dice de ella como sujeto contra las demás cargadas, frase por frase y lado a lado, cada una con sus voces y su encogimiento.<br>2. Sin puesto, sin compuesto y sin ordenar por valor: alfabético o por voces. |  |
| O7-5 | Como el docente, quiero enterarme de que me nombraron, porque no puedo responder algo que no sé que existe. | Al docente verificado le llega un resumen periódico de lo que se publicó sobre su cátedra, sin fecha ni hora por reseña: ningún aviso permite inferir cuándo aportó alguien. | depende de avisos por mail |
| O7-6 | Como el docente, quiero que no me presuman el silencio, porque no contestar es una postura, no una admisión. | La ficha dice "todavía no respondió" y nunca interpreta por qué. | decisión pendiente: qué dice la ficha del docente nunca notificado |
| O7-7 | Como la institución, quiero ver si mejoré desde que lo publicaron, porque arreglé el trámite, el número es de cohortes viejas, y sin serie es una foto que no me sirve para gestionar. | La ficha muestra cada proporción por el período en que pasó, con sus voces y su encogimiento, sin suavizar, con la publicación y la réplica marcadas. (Absorbe la que era O7-4.) |  |
| O7-8 | Como el docente, quiero probar que soy yo antes de responder, porque si cualquiera firma con mi nombre, mi réplica no vale nada. | La réplica no se publica sin identidad docente o institucional verificada contra el catálogo; esa verificación vive en una cola separada de la de constancias de alumno, y para el docente verificar es permiso, no señal. | depende de BO2-6; par de BO2-6 |

## O8 · Llevarme el dato (para discutirlo afuera)

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| O8-1 | Como quien investiga, quiero descargar el crudo sin registrarme, porque ustedes muestran qué pasa y el por qué es trabajo mío. | 1. El CSV sale agregado: una fila por (frase, sujeto, período) con sus voces y su eje.<br>2. Una segunda tabla trae los agregados de trayectoria: por carrera-institución y cohorte; por materia y período; por par y período.<br>3. Lo que se descarga es lo que se publica, ni más fino ni más grueso: nunca nombre, cuenta ni perfil, y los testimonios no se exportan en bloque. | épica: se parte al planificar |
| O8-6 | Como quien investiga, quiero saber cuánto se bajó del corpus y por qué, porque una muestra que no declara su curaduría no se puede citar. | Se publica cuántos textos se bajaron y en qué categoría, sin su contenido; las voces de esas reseñas siguen contando, porque se baja el texto y nunca la voz, y el CSV no lleva testimonios. | par de O8-7 |
| O8-2 | Como quien investiga, quiero saber qué no cubren, porque una muestra sin su sesgo declarado no se puede citar. | 1. Se publica qué carreras están cargadas, en cola y pedidas, y la cobertura de cada plan (materias con voces sobre el total).<br>2. Se publican los sesgos que el método declara: de quienes reseñaron; la duración real, de los que se recibieron; la co-cursada, de quien reseñó las dos.<br>3. Se publica cuántas cuentas quedaron afuera por inconsistencia. |  |
| O8-3 | Como quien investiga, quiero citar un número que no me puedan desarmar, porque del otro lado van a discutir la metodología antes que el dato. | 1. El método es público e incluye la fórmula del encogimiento tal cual y el catálogo entero de frases con sujeto y eje.<br>2. Cada dato publicado muestra sus voces y el período de lo que lo sostiene. |  |
| O8-4 | Como quien investiga, quiero que no interpreten por mí, porque si me dan la conclusión ya no puedo citarlo como fuente. | Las fichas muestran frases con su proporción de voces y las dos proporciones de la cabecera, que son la lectura de los ejes y no un juicio aparte; en ningún lado se afirma una causa. |  |
| O8-5 | Como quien lee, quiero saber que no tienen acuerdos con las instituciones, porque un evaluador que depende del evaluado no me sirve de nada. | La postura está escrita en el método y no hay ninguna institución con trato preferencial. |  |
| O8-7 | Como quien lee, quiero ver que ahí hubo un texto retirado y por qué, porque un hueco sin explicación es indistinguible de censura. | Donde había un testimonio retirado la ficha muestra que se retiró y en qué categoría, sin su contenido, y sus frases siguen contando: se baja el texto, nunca la voz. | depende de BO2-1; par de O8-6 |
| O8-8 | Como quien investiga, quiero saber que la lista se reprocesa y cuál frase es destilada, porque una cita que mañana no se reproduce no me sirve, y una síntesis no es una cita textual. | La ficha declara que la lista se reprocesa a medida que entran reseñas y con qué fecha se está leyendo, y cada frase destilada se ve marcada como destilada (síntesis, no cita de nadie); el CSV lleva la misma marca. | depende de BO1-9 |

## T1 · Cuidar lo publicado (curación, no opinión)

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| T1-1 | Como quien ya aportó, quiero decir "a mí también me pasó" sobre lo que otro contó, para sumar mi voz sin escribir y que lo que más gente confirmó se lea primero. | El voto va sobre la reseña o el evento institucional entero, nunca sobre una frase suelta; suma una voz a las frases de esa reseña, ordena los testimonios de la ficha, y pide cuenta. |  |
| T1-2 | Como quien ya aportó, quiero corregirlo sin cambiar de pantalla, para que la ficha no mienta sobre mi facultad. | La fila del dato se vuelve editable ahí mismo y queda registrado quién lo cambió. | decisión pendiente: si corregir pide aporte previo o solo cuenta |
| T1-3 | Como quien ya aportó, quiero verificarme si quiero, para que lo mío pese más, sin que sea condición para hablar. | Se puede aportar sin verificar; verificarse suma una señal que viaja con lo ya contado y se ve en la ficha, y no cambia ninguna proporción: las voces se cuentan igual, verificadas o no. |  |
| T1-4 | Como quien lee, quiero leer lo que la gente escribió debajo de las frases, porque los conteos me dicen qué pasa y el testimonio me dice cómo se vive. | 1. El comentario se publica como testimonio debajo de las frases con voces, nunca como cuerpo: con su período, su cátedra si la dio y las frases que marcó.<br>2. Sin cuenta, sin nombre y sin cómo terminó; con tope de un párrafo; no suma a ningún conteo.<br>3. Ordenados por votos, sin destacados nuestros. | épica: se parte al planificar; depende de T2-1 |

## T2 · Cuando el riesgo es real (tres escenarios que rompen la promesa)

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| T2-1 | Como quien reseña, quiero que me avisen si lo que escribí me delata, porque "los tres que cursamos con Pérez en el turno noche" no tiene nombres y aun así soy yo. | 1. Antes de publicar, el chequeo marca lo que puede identificarme por contexto y decido yo si lo dejo, sabiendo que la réplica no va a poder citarlo.<br>2. Lo que habla de una persona fuera de su acto queda retenido hasta que alguien lo mire, y me lo dicen ([ADR-0068](../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md)). | P1; épica: se parte al planificar |
| T2-2 | Como quien ya aportó, quiero no quedar expuesto cuando el docente responde con nombre, porque si éramos cuatro en la comisión, su respuesta me señala sin nombrarme. | 1. La réplica no puede citar la parte del testimonio que identifica y pasa el mismo chequeo que el aporte.<br>2. Queda retenida un plazo desde el aviso: en ese plazo quien aportó edita, borra o pide revisión; si borra, la réplica no sale. | P1; depende de O7-8 |
| T2-3 | Como quien lee, quiero entender qué hago acá si llego primero y no hay nada cargado todavía, porque si la ficha está vacía y nadie escribió, no tengo razón para ser el primero. | Una ficha sin voces explica que arranca vacía y que la primera voz ya se publica, con sus voces y su encogimiento a la vista: no hay escalones ni nada que desbloquear. | P1 |
| T2-4 | Como quien ya aportó, quiero que ningún cruce de datos me identifique, porque un número sobre cinco personas de mi cohorte soy yo con otro nombre. | 1. Nada publicado trae nombre, cuenta ni perfil, en ningún cruce; no hay piso de personas ([ADR-0066](../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)).<br>2. Antes de publicar se le dice al que reseña que en un grupo chico pueden sospechar: no prometemos anonimato estadístico, prometemos no publicar quién. | P1 |

## T3 · Cuando el catálogo no alcanza (el dato existe pero no me sirve como está)

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| T3-1 | Como quien está cursando, quiero reseñar una materia que no está en el plan cargado, porque es optativa, o es de un plan viejo, o se llama distinto. | Se puede aportar sobre una materia que no está y queda pendiente de vincular en el catálogo. | P1; decisión pendiente: si la pendiente cuenta antes de vincularse |
| T3-2 | Como quien está eligiendo, quiero saber de cuándo son los testimonios, porque una cátedra que cambió de docente hace dos años ya no es la misma. | Cada ficha muestra el período de lo que la sostiene, y avisa cuando lo último es de hace más de dos años. | P1 |
| T3-3 | Como quien reseña, quiero retomar lo que empecé a escribir, porque cerré la pestaña en el medio y no lo voy a hacer dos veces. | El aporte a medias queda guardado y aparece para retomar la próxima vez. | P2 |
| T3-4 | Como quien ya aportó, quiero ver qué cambió con lo que conté, porque es lo único que me trae de vuelta la próxima vez. | Mis aportes muestran las voces que sumó cada frase que marqué en esa cátedra y cuántos la leyeron. | P2 |
| T3-5 | Como quien está cursando, quiero reseñar la misma materia dos veces si la recursé, porque fue otro período y otra experiencia. | Un segundo aporte sobre la misma materia se acepta cuando el período es otro: la reseña es cuenta × materia × período, y la cátedra, que es opcional, no entra en la clave. | P2 |
| T3-6 | Como quien lee, quiero entender por qué una frase pesa mucho en la cátedra y poco en la carrera, porque si los niveles se contradicen no sé cuál creer. | Cada ficha dice de qué voces está hecha (la carrera suma las cursadas de las materias de su plan, no promedia materias) y cada frase derivada muestra en cuántas materias aparece. | P2; depende de O1-8 |

## T4 · Y quien no está de acuerdo (discrepar no es lo mismo que denunciar)

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| T4-1 | Como quien está cursando, quiero marcar que a mí me pasó lo contrario de lo que dice la ficha, porque hoy solo puedo reportar, y reportar es acusar de daño, no discrepar. | El catálogo ofrece frases en los dos sentidos para el mismo aspecto; reseñando esa cursada marco la que describe mi caso, cada frase publica su propia proporción de voces, y ninguna resta de la otra. | P2 |

## BO1 · Sostener el catálogo (lo único que no se crowdsourcea)

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| BO1-1 | Como quien carga el catálogo, quiero ver qué le falta a cada ficha antes que lo que ya cargué, porque una oferta a medias miente más que una que no existe. | 1. La pantalla abre por huecos y cada oferta muestra cuántos campos le faltan.<br>2. Entre los huecos están los dos que bloquean lo publicado: la duración nominal del plan (sin ella no hay brecha ni cohorte cerrada) y la carrera canónica (sin ella `donde` no sabe qué compara). |  |
| BO1-2 | Como quien carga el catálogo, quiero que la cola se ordene por cuántos lo pidieron, porque cargar por orden de llegada deja afuera a los que más lo necesitan. | Los pedidos se ordenan por cantidad y muestran de qué institución vienen. |  |
| BO1-3 | Como quien carga el catálogo, quiero avisarle a los que esperaban cuando termino, porque si no se enteran, el pedido fue trabajo tirado de los dos lados. | Al marcar una oferta como cargada sale el aviso a todos los que la pidieron. | par de O2-4 |
| BO1-4 | Como quien carga el catálogo, quiero contrastar una corrección contra la fuente antes de aplicarla, porque aceptar porque sí convierte el dato duro en otra opinión. | La corrección muestra valor viejo y nuevo, y aplicarla queda registrada con quién la aprobó. |  |
| BO1-5 | Como quien carga el catálogo, quiero declarar que dos ofertas de instituciones distintas son la misma carrera, porque comparar por parecido de nombre es comparar cualquier cosa. | Cada oferta queda atada a una carrera canónica nuestra, la decisión queda registrada con autor y fecha, y `donde` solo pone lado a lado ofertas de la misma canónica. |  |
| BO1-6 | Como quien carga el catálogo, quiero cargar la cátedra como el equipo docente a cargo de una materia, porque es lo que el alumno recuerda al reseñar y hoy en el catálogo no existe. | La cátedra es una entidad propia (materia más equipo docente, con su titular), persiste entre períodos, y es la lista que `reseñar` ofrece cuando el alumno la recuerda. | épica: se parte al planificar |
| BO1-7 | Como quien carga el catálogo, quiero vincular a la materia canónica las materias que alguien nombró y no están, porque si cada plan tiene su propia materia, las voces del plan viejo no se suman a las del nuevo. | La cola de materias declaradas muestra cuántas personas nombraron cada una, se vinculan o se fusionan contra la materia canónica de la carrera, y queda registrado quién lo hizo. |  |
| BO1-8 | Como quien cura las frases, quiero editar en un solo lugar la redacción, el sujeto y el eje de cada frase, porque el eje es la atribución y un eje mal puesto es un error en todas las fichas que usan esa frase. | El catálogo de frases se edita en un lugar, cada cambio queda con autor y fecha, corregir un eje reprocesa las fichas afectadas, y lo que `metodo` publica es exactamente ese catálogo, entero. | épica: se parte al planificar |
| BO1-9 | Como quien cura las frases, quiero revisar lo que la destilación propone antes de que se pueda marcar, porque una frase que nadie dijo, ofrecida para marcar, se vuelve un hecho que inventamos nosotros. | 1. Las frases destiladas llegan a una cola con los comentarios de los que salieron.<br>2. Se aprueban o se descartan con su sujeto y su eje asignados; solo se ofrecen para marcar después de aprobadas.<br>3. La ficha las muestra como destiladas: síntesis, no cita. | épica: se parte al planificar |

## BO2 · Moderar sin romper el producto (decir que no importa más que decir que sí)

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| BO2-1 | Como quien modera, quiero bajar solo lo que expone a una persona, porque si bajamos lo que incomoda a la institución, plan-b deja de tener sentido. | 1. El reporte muestra motivo y criterio; la exposición protegida es la de quien aportó y la de terceros, no la del docente evaluado ni la de la institución, y la queja dura contra ellos no es causal.<br>2. Lo reportado sigue publicado hasta que se resuelve, salvo el único caso de riesgo inmediato, con criterio escrito.<br>3. Bajar exige elegir la categoría (la que la ficha muestra como texto retirado y la que O8-6 agrega); se baja el texto, nunca la voz. | épica: se parte al planificar |
| BO2-2 | Como quien modera, quiero que el que reportó sepa por qué quedó o se bajó, porque un formulario sin respuesta enseña a no volver a reportar. | Resolver un reporte manda el criterio aplicado al mail confirmado desde el que se reportó, que es el único canal porque reportar no pide cuenta, no un acuse genérico. | par de O5-4 |
| BO2-3 | Como quien modera, quiero ver lo mínimo de una constancia para decidir, porque cada nombre que veo es alguien que confió en que sería anónimo. | La verificación compara contra lo declarado y el documento se destruye al resolver. |  |
| BO2-4 | Como quien modera, quiero no poder ver qué reseñó la persona cuya constancia verifico, porque si puedo cruzarlo, el anonimato es una promesa y no un mecanismo. | 1. Desde la cola de constancias no hay ningún camino a los aportes de esa cuenta, ni por acceso directo.<br>2. La cola de identidad docente es otra y no cae bajo esta regla: verificar al docente es atarlo a la cátedra sobre la que se publica. |  |
| BO2-5 | Como quien modera, quiero una cola con lo que el chequeo previo retuvo, porque un comentario o una réplica que habla de una persona fuera de su acto no se publica hasta que alguien lo mire. | 1. La cola trae comentarios y réplicas retenidos con la parte que los retuvo marcada.<br>2. Cada uno se libera o se baja con su categoría, y quien lo escribió ve que está retenido y por qué.<br>3. Nada retenido se publica solo por vencimiento de tiempo. | épica: se parte al planificar; depende de T2-1 |
| BO2-6 | Como quien verifica, quiero una cola de identidad docente separada de la de constancias, porque para el alumno verificarse es una señal y para el docente es el permiso de publicar una réplica con su nombre. | 1. La identidad docente se prueba contra el catálogo (la cátedra que dice tener) en su propia cola; sin eso no se publica ninguna réplica.<br>2. Aprobar o rechazar queda con autor y fecha; rechazar no habilita la réplica y no marca a nadie. | épica: se parte al planificar; par de O7-8 |

## BO3 · Cortar los accesos (que el anonimato sea mecanismo)

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| BO3-1 | Como quien administra, quiero que cada rol vea solo sus colas, porque catálogo no necesita ver una constancia con nombre, y si puede algún día la mira. | El rol de catálogo no llega a reportes ni verificaciones, ni por acceso directo. |  |
| BO3-2 | Como quien administra, quiero saber quién hizo cada cosa, porque el equipo toca datos que los usuarios nos confiaron. | Cada acción sobre una cola queda con autor y fecha. |  |
| BO3-3 | Como quien administra, quiero que verificación y moderación no puedan vivir en la misma persona, porque quien ve un nombre real a las 14:32 y la cola de reportes filtrada por esa carrera a las 14:40 no necesita ningún camino en la pantalla para cruzarlos. | 1. Asignar el rol de verificación a quien tiene el de moderación (o al revés) es imposible, no auditado.<br>2. El registro guarda referencias que un solo rol no puede unir, y el Admin no se puede auto-asignar roles operativos. | decisión pendiente: D4: implica cuatro personas de equipo mínimo |

## BO4 · Cuando la carga no da abasto (operación diaria, no excepciones)

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| BO4-1 | Como quien carga el catálogo, quiero ver la cola cuando tiene doscientos pendientes, porque puedo cargar dos carreras por semana y la demanda no espera. | La cola muestra cuánto se tarda en promedio y qué queda afuera del mes, sin fingir que se resuelve todo. | P2 |
| BO4-2 | Como quien carga el catálogo, quiero corregir algo que cargué mal, porque cuarenta personas están usando una correlativa que puse equivocada. | Se puede editar una oferta publicada, y los que la tienen marcada se enteran de qué cambió. | P1 |
| BO4-3 | Como quien carga el catálogo, quiero poder cargar algo cuya fuente no existe o se contradice, porque hay facultades que no publican el plan, o publican dos versiones que no coinciden. | El campo admite marcar de dónde salió el dato, y la ficha lo muestra cuando no es fuente oficial. | P2 |
| BO4-4 | Como quien modera, quiero detectar una constancia adulterada, porque verificar a alguien que miente le da peso a lo que no lo tiene. | El rechazo pide motivo y el que la subió puede volver a intentar sin quedar marcado. | P2 |
| BO4-5 | Como quien carga el catálogo, quiero decidir qué cargar el primer día, porque al principio no hay pedidos: no hay usuarios que pidan. | La cola arranca con un criterio explícito de arranque, no vacía y esperando demanda. | P2 |
| BO4-6 | Como quien modera, quiero ver la cola cuando tiene cuarenta reportes y treinta retenidos, porque a cinco minutos cada uno son seis horas de una persona y lo retenido no se publica hasta que alguien lo mire. | La cola dice cuánto se tarda y qué queda para después, separa lo retenido (que todavía nadie leyó) de lo reportado (que sigue publicado), y prioriza lo que está sin publicar, no el orden de llegada. | P1 |

## BO5 · Cuando el corpus está bajo ataque (tres escenarios que rompen el producto)

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| BO5-1 | Como quien carga el catálogo, quiero saber qué pasa con lo reseñado cuando la facultad reforma el plan, porque la gente cursó el plan viejo y lo que marcó no deja de ser cierto. | Los dos planes coexisten con su año, y cada reseña queda pegada al período y a la materia canónica, no a la fila del plan, para que reformar no parta el corpus en dos. | P1; depende de BO1-7 |
| BO5-2 | Como quien modera, quiero que me avise cuando un grupo de cuentas correlacionadas reseña la misma cátedra, porque puede ser un centro organizando o el docente pidiéndoselo a sus alumnos, y eso destruye el corpus. | 1. La alarma mira la procedencia (fecha de alta, patrón idéntico, ausencia de trayectoria) y no el volumen: cuarenta personas con historia distinta no la disparan.<br>2. Las cuentas marcadas no suman voces ni entran a ningún agregado de trayectoria.<br>3. Los conteos se pueden congelar sin borrar nada. | P1 |
| BO5-3 | Como quien modera, quiero ver los reportes agrupados por quién los manda, porque doce reportes sobre lo que critica a la misma facultad son una estrategia, no doce quejas. | Los reportes se agrupan por el mail confirmado que los mandó (dos del mismo mail cuentan uno) y el grupo se resuelve con un criterio, no de a uno. | P1; decisión pendiente: qué señal agrupa mails distintos |

## BO6 · Y quién nos mira a nosotros (lo que le pedimos a las instituciones, aplicado adentro)

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| BO6-1 | Como quien administra, quiero que alguien revise lo que hizo el equipo, porque todo el producto se sostiene en que lo publicado necesita a alguien de afuera mirando, y adentro no lo aplicamos. | 1. El registro de acciones se puede leer y se revisa cada tanto; quedan contables por categoría las bajas de testimonios y lo que el chequeo previo retuvo y no se publicó.<br>2. Primera capa, construible: el registro de moderación es público en agregado (cuántos se bajaron, cuántos quedaron retenidos, por qué categoría, sin contenido).<br>3. Segunda capa, decisión de gobierno y no story: una persona externa con acceso de lectura al registro completo. | P1 |
| BO6-2 | Como quien administra, quiero dar de baja a alguien del equipo, porque el acceso a nombres reales no puede sobrevivir a la persona que se fue. | Quitar a alguien le corta el acceso en el momento y su registro de acciones queda. | P2 |

---

# Catálogo de la versión anterior (historia)

Las **126 fichas** de la versión anterior (foundations `US-F*`, tooling `US-T*`, y las `US-001..099` con sus subdivisiones `-b/-f/-i`) viven en [`user-stories/`](user-stories), cada una con su `Status` en el header (75 Done, el resto Backlog, Cancelada, Parcial o Superada). Son la evidencia del trabajo hecho y **no se tocan**: ni se actualizan ni se reescriben contra la tesis nueva.

El índice por estado y por epic que vivía acá se eliminó el 2026-08-16: había quedado desincronizado con las fichas (31 archivos que no listaba, parents subdivididos que la propia convención dice que no deberían coexistir) y ya no cumplía función. Para el estado histórico, la fuente es el header de cada ficha y las secciones de sprint de [STATUS.md](../STATUS.md).

Convención de IDs que esas fichas usan, y que el catálogo vigente hereda cuando una story del mapa entra a sprint: `US-NNN[-x]` con `-b` backend, `-f` frontend, `-i` infra, `-t` tooling. Effort: Small ≈ 1-3 días, Medium ≈ 3-7 días, Large ≈ 1-2 semanas.

---

## Restricciones (no son stories: se verifican en el DoD)

Lo que ninguna persona pide en primera persona y aun así tiene que cumplirse en toda pantalla. Van al [Definition of Done](definition-of-done.md), no al backlog, porque no se terminan: se sostienen.

- **Accesibilidad y celular.** La lectura es pública y la mayoría llega desde el teléfono: las fichas, `metodo`, `donde` y el CSV se leen y se usan en un celular chico, y cumplen WCAG 2.2 AA (contraste, teclado, lectores de pantalla, texto que escala). Una ficha que solo se lee en escritorio no está terminada.
- **Datos personales (Ley 25.326).** Consentimiento informado al registrarse, aviso de privacidad público, y los derechos de acceso, rectificación y supresión resueltos por O5-1 y O5-2 (borrar de a uno; la baja anonimiza y preserva lo aportado, ADR-0044). Las constancias se destruyen al resolver (BO2-3). Nada publicado trae nombre, cuenta ni perfil (T2-4).
- **La política de moderación y réplica es pública.** El criterio escrito de BO2-1 (qué es exposición, qué no lo es, el único caso de riesgo inmediato), el chequeo previo (T2-1) y las reglas de la réplica (T2-2, O7-8) se publican donde se publica el método, antes de que exista el primer reporte. Nahuel aplica lo que cualquiera puede leer.
- **Rendimiento y disponibilidad de lo público.** Lo que se lee sin cuenta es lo que la mesa cita: las fichas cargan rápido y se cachean; una caída de lo público es una caída del producto, y el CSV siempre está.

## Template y criterios

- **Template de US**: [us-template.md](us-template.md): incluye estructura completa, sources de las prácticas (INVEST / Connextra / BDD / DoR), y guía de cuándo aplicar cada sección.
- **Definition of Ready (DoR)**: dentro de `us-template.md`: pre-sprint, qué tiene que tener una US para entrar al sprint planning.
- **Definition of Done (DoD)**: [definition-of-done.md](definition-of-done.md): post-implementación, qué tiene que cumplir una US para considerarse Done.

US que entran a sprint backfillean (si faltan): Out of scope, Edge cases, Test scenarios (Given-When-Then), Dependencies. US en Backlog pueden estar más livianas: el backfill es parte del sprint planning.

---

## Cómo se trackean

- Catálogo canónico: este doc (las stories del mapa, referenciadas por su ID de mapa hasta entrar a sprint) + una ficha por US numerada en [user-stories/](user-stories) cuando entra a sprint.
- Tracking operacional: Notion (DB `plan-b: User Stories`), con cross-link a este file vía property `Doc link`.
- En código: PRs referencian `US-NNN` o `UC-NNN` desde la descripción y los commits.
