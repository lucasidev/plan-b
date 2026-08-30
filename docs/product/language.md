# Ubiquitous Language (planb)

Glosario de términos del dominio. Es la referencia autoritativa para el uso de cada término en código, UI, documentación y conversación con stakeholders. Si un término aparece acá con un significado específico, no se usa con otro significado en otro lado.

> **Estado (2026-08-25)**: este glosario es el vocabulario del producto vigente ([THESIS.md](../THESIS.md), [ADR-0063](../decisions/0063-the-product-is-a-pressure-instrument.md) y las decisiones del instrumento, [ADR-0082](../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) a [ADR-0085](../decisions/0085-three-instruments-and-official-data.md)) más los términos del catálogo y de las cuentas que sobreviven al viraje. Lo que nombraba la versión anterior (historial, planificador, reseña de texto libre, embeddings, sus actores) está en [`docs/history/domain-v1/ubiquitous-language-v1.md`](../history/domain-v1/ubiquitous-language-v1.md) mientras exista el código que describe.

Basado en los principios de DDD (Eric Evans). Cuando aparecen nuevos términos en conversación o código, se agregan acá antes de propagarse.

## Convenciones generales

- **Identificadores en código** (clases, tablas, propiedades): inglés. C# → `PascalCase`, SQL → `snake_case`, TypeScript → `camelCase`.
- **Strings de UI**: español rioplatense.
- **Mensajes de error internos** (logs, excepciones, códigos de error): inglés.
- **Documentación y ADRs**: narrativa en español, nombres de entidades en inglés cuando referencia al modelo (ej. "el `EnrollmentRecord` tiene estado `aprobada`").

## El producto: reseñar y publicar

Vocabulario de la tesis vigente ([THESIS.md](../THESIS.md), "Qué recabamos" y "Qué publicamos"), rehecho el 2026-08-25 con el modelo de tres capas. Es lo que la persona hace, lo que el sistema recibe y lo que publica.

| Término | Significado |
|---|---|
| **Reseñar** | El acto principal: elegir una materia que cursaste y contar esa cursada. Pide cuenta. Un minuto y medio, y saltear siempre vale. **No se dice "contar"** (era jerga del canvas del mapa) ni "cargar un reporte". |
| **Reseña** | Lo que produce reseñar: una cuenta × una materia × el período, con sus tres capas respondidas. Es la unidad de contribución. Ninguna reseña individual se muestra jamás. |
| **Cursada** | Lo que se reseña: la experiencia de haber cursado una materia con una cátedra en un período. Solo se reseña la cursada: todo lo demás se deriva ([ADR-0082](../decisions/0082-the-review-captures-the-cursada-in-three-layers.md)). |
| **Capa** | Las tres partes de la reseña: el **contexto** (no se publica), **qué hizo la cátedra** (conducta observable) y **qué te pasó a vos** (vivencia). Las dos últimas se publican como conteos y nunca se suman entre sí. |
| **Contexto** | La capa que no se publica y controla el sesgo de lectura: período, cátedra, modalidad, cómo terminó, cuántas veces la cursaste. |
| **Ítem** | La unidad del catálogo: una pregunta con opciones cerradas, en frecuencias gruesas que la memoria puede responder ("¿Contestaba las preguntas en clase?"). Tiene **código estable**: el texto puede afinarse; si cambia el significado, es un ítem nuevo y la serie se corta ([ADR-0082](../decisions/0082-the-review-captures-the-cursada-in-three-layers.md)). |
| **Opción** | Cada respuesta posible de un ítem ("Siempre / A veces / Casi nunca / Nadie preguntaba"). Cada una tiene su valencia; la negativa es la única que carga el rojo en la ficha. |
| **Responder** | Elegir una opción de un ítem. Saltear es explícito, legítimo, y no cuenta en el denominador de ese ítem. |
| **Instrumento** | Una versión del cuestionario: qué ítems ofrece, en qué orden, con qué condiciones. Se versiona con vigencias y cada reseña queda atada a la versión con la que respondió. |
| **Campo libre** | El único texto de la reseña, al final: "¿algo que no te preguntamos y deberíamos?". **No se publica nunca**: alimenta a la curaduría ([ADR-0084](../decisions/0084-free-text-feeds-curation-and-is-never-published.md)). |
| **Curaduría** | El trabajo del equipo sobre el campo libre: leer, **destilar** ítems nuevos para la versión siguiente del instrumento, y escribir **notas editoriales**. También cura el catálogo académico y el relevamiento oficial. |
| **Nota editorial** | La síntesis que la curaduría publica en una ficha de carrera o institución (nunca de cátedra): sin nombres, fechada, con su procedencia dicha ("leída de comentarios que no se publican"). |
| **Ítem semilla / destilado** | El semilla lo escribimos nosotros para arrancar; el destilado sale del campo libre de muchos y entra al instrumento como versión nueva. |
| **Voces** | Cuántas personas respondieron algo: el denominador de cada dato. **No se dice "n"**. En los derivados, la voz es una persona hablando de una cursada: quien reseñó tres cursadas de una carrera son tres voces en ella. |
| **Cómo terminó** | El desenlace de la cursada (la aprobé, me quedó regular, la recursé, la dejé). Es contexto: jamás se publica individual; alimenta la tasa de finalización agregada. |
| **Tasa de finalización** | De cada 10 cursadas de una cátedra, cuántas terminaron aprobada o regular. Se publica solo agregada ("llegan 4 de 10") y comparada con sus hermanas. Es un resultado de la cátedra y de la institución, no del estudiante. |
| **Moda** | La opción literal más votada de un ítem. Es la síntesis publicada, como badge que repite esa opción con su porcentaje ("Casi nunca · 59 %"): nunca un promedio ni una etiqueta inventada. |
| **Distribución** | El conteo completo de un ítem, opción por opción, como barra segmentada. Es la única visualización de un ítem: no hay promedios. |
| **Convergencia** | La fama del sujeto: cuando varios ítems distintos apuntan al mismo lado ("no salían entendiendo" + "no podían preguntar" + "no contestaba"), la ficha lo dice arriba, predicado del sujeto. Tres ítems convergentes valen más que quinientas marcas en uno. |
| **Comparación entre hermanas** | El único contraste publicado: una cátedra contra las otras de su misma materia, donde el sesgo de quién reseña pega parejo. Se publica solo si los intervalos no se tocan (Wilson como maquinaria interna, nunca como número publicado); sin señal o sin base, silencio. |
| **Piso** | Una cátedra publica desde las **10 reseñas**. La razón es la privacidad del que reseña (con menos, el titular deduce quién dijo qué), no la estadística. El estado se muestra: "junta 3 reseñas: con 7 más se publica". |
| **Dispersión temporal** | Cuándo se cargaron las reseñas de una ficha, siempre visible ("412 reseñas, 380 cargadas en marzo de 2026"). No se filtra ni suaviza: el lector interpreta. Es el contrapeso de mostrar la ficha antes de reseñar. |
| **Cobertura** | Cuánto del plan está medido ("23 de 51 materias"). Condiciona todo derivado: la carrera sin reseñas no es impecable, es desconocida, y la ficha lo dice. |
| **Derivar** | Armar la ficha de lo que no se reseña: la materia muestra la **dispersión entre sus cátedras** ("depende de cuál te toque"); la carrera, estructura (qué frena, dónde se corta) y cobertura; la institución, su plantel, su transparencia y su cobertura. Nunca un promedio hacia arriba ([ADR-0085](../decisions/0085-three-instruments-and-official-data.md)). |
| **Instrumento administrativo** | Las preguntas cortas de trámites, infraestructura y becas, con disparador propio (el perfil, re-preguntado con el tiempo). Solo cuenta lo respondido por cuentas con al menos una cursada reseñada. |
| **Relevamiento oficial** | La transparencia verificada por el equipo contra fuente pública (SPU, CONEAU, AGN, sitio institucional): actas, presupuesto, nómina, acreditaciones. Cada fila con fuente y fecha, y "Ver fuentes" en la ficha. |
| **Datos oficiales** | Los números que no se le preguntan a nadie porque son públicos: dura en el papel / dura en la realidad, egreso por cohorte, plan vigente, régimen de ingreso. Van al lado de las voces, con la fuente dicha. |
| **Unidad académica** | La facultad: el nivel entre la institución y la carrera. Las carreras cuelgan de ella y los datos administrativos aterrizan ahí cuando corresponde. |
| **Respuesta del reseñado** | La cátedra o la institución responde, con nombre y cargo, a los **números agregados** de su ficha (no existe un testimonio individual al que responder). La ficha muestra "Sin respuesta · avisada el [fecha]" hasta que llegue. |
| **Ficha** | La página pública de un sujeto (cátedra, materia, carrera, institución) con sus conteos, su fama, sus comparaciones y su cobertura. Se lee sin cuenta, y se ve antes de reseñar. Nunca un puntaje. |
| **Reputación** | Lo que la ficha dice de un sujeto: su fama por convergencia y sus conteos con voces. **Nunca un número**: no hay score, índice, tier ni promedio ([ADR-0083](../decisions/0083-the-ficha-publishes-counts-not-scores.md)). |
| **Serie** | El mismo ítem por el período en que pasó, nunca por cuándo se reseñó. Si el ítem cambió de código, la serie declara el corte y los tramos no se comparan a través. |
| **Constancia** | La prueba opcional de condición de alumno. Verificarse pesa, no habilita. |
| **Aporte** | Genérico: cualquier cosa que alguien contribuye (una reseña, una respuesta administrativa, una corrección de dato, un pedido de carrera). "Mis aportes" es la pantalla que junta todo eso. |
| **Cátedra** | El equipo docente que dicta una materia: titular a cargo, adjuntos, JTPs, ayudantes. Persiste entre cuatrimestres. Una materia puede tener varias en paralelo y el alumno elige. **No existe hoy en el catálogo** (hay `Commission`, que es otra cosa). |
| **Comisión** | La división horaria y de cupo dentro de una cátedra (Com A, martes noche). Existe en el catálogo como `Commission`. |
| **Pendiente de vincular** | La materia que alguien nombró al reseñar y el catálogo no tiene. La reseña se guarda; no cuenta en ninguna ficha ni en la cobertura hasta que el catálogo la vincula a la materia canónica (US-197); el autor la ve como pendiente en Mis aportes. |
| **Co-cursada** | Llevar dos materias juntas, en el mismo período. Como conteo publicado: por par de materias y período, cuántas cuentas reseñaron las dos y cuántas dejaron una. Sale solo de las reseñas, que ya traen materia y período, y no le pide nada a nadie: el producto no sabe por dónde va tu carrera ([ADR-0086](../decisions/0086-the-product-informs-it-does-not-track-your-degree.md)). Contesta lo que se pregunta en el pasillo («¿se pueden llevar juntas?») y hoy contesta la anécdota de uno. |
| **Cohorte** | Las cuentas que entraron a una carrera el mismo año. En el producto vigente es sobre todo el corte de los **datos oficiales** ("egresan por cohorte: 14 %", serie SPU). |
| **Carrera canónica** | El nombre bajo el que el catálogo declara que dos ofertas de distintas instituciones son la misma carrera, para mostrarlas lado a lado. Lo decide el equipo, no el parecido del nombre. |
| **Dónde estudiarla** | La misma carrera canónica en las instituciones de una ciudad, lado a lado con **datos oficiales medidos igual para todas** (incluido el régimen de ingreso al lado del egreso); las señales de reseñas van por institución y no se cruzan. Sin compuesto, sin ganador. |
| **Nombre de pantalla** | Una pantalla se nombra por lo que dice arriba, en español, con mayúscula inicial y sin backticks: Mi carrera, Dónde estudiarla, Método, Reseñar, Ficha de cátedra. **Los backticks son código**: la URL va en inglés y con slug (`/reviews/write`) y se fija cuando la pantalla entra a sprint. |

## Producto, landing y datos

La distinción que se venía mezclando: los **datos de prueba** llenan la **aplicación** real (las herramientas funcionando); los **datos demo** ilustran esas herramientas en la **landing** (venta). No se cruzan: la landing no lee datos del backend.

| Término | Significado |
|---|---|
| **producto / aplicación** | El sistema real, plan-b (backend + frontend). Contiene las herramientas y los features de plataforma. Se prueba y se muestra cargándole datos de prueba. |
| **herramienta** | Feature de valor que un actor (alumno, docente, staff) usa para su tarea: reseñar, las fichas, comparar, curaduría, gestión de catálogo. Se nombran como las nombra la app. No es cualquier feature: los de plataforma (registro, login, recuperar contraseña, gestión de cuenta) habilitan el uso pero no son herramientas. |
| **landing** | La cara de venta del producto (marketing). Ilustra las herramientas con datos demo y puede idealizar. Es pública, pero eso no la define: hay herramientas públicas también (catálogo, fichas). Lo que la separa es que ilustra, no ejecuta. |
| **datos de prueba** | Datos sembrados en la DB para probar y mostrar la aplicación real funcionando (desarrollo, tests, defensa ante el tribunal). Los consumen los endpoints reales. Hoy se siembran las personas y el catálogo; **reseñas no siembra ninguno**, así que las fichas arrancan en cero (issue #374). La variable `PLANB_SEED_CORPUS` viaja desde el tooling pero todavía no la lee ningún código del backend. |
| **datos demo** | Datos de ejemplo hardcodeados en la UI de la landing (componentes `demo-*`), para ilustrar las herramientas. Marketing: no viven en el backend, no se fetchean, no pretenden exactitud. |

## Identidades y cuentas

| Término | Significado | Ubicación |
|---|---|---|
| **User** | Cuenta con credenciales (email, password). Rol único, inmutable después de creado salvo intervención admin. | `User` |
| **role** | Tipo funcional del usuario. Enum exclusivo. No acumulable. | `User.role` |
| **member** | Rol de usuario de comunidad académica. Puede tener perfiles de alumno y/o docente. Sin acceso administrativo. | `role = 'member'` |
| **moderator** | Rol staff de la versión anterior (resolvía reports de texto publicado). Con el texto libre sin publicar ([ADR-0084](../decisions/0084-free-text-feeds-curation-and-is-never-published.md)) su alcance se redefine con la poda; el rol sigue en el código hasta entonces. | `role = 'moderator'` |
| **admin** | Rol staff con permisos totales: curaduría + gestión de catálogo académico + alta/baja de staff. | `role = 'admin'` |
| **university_staff** | Rol de la versión anterior (dashboard institucional). El producto nuevo no tiene cliente institucional: la institución lee la ficha pública y responde con identidad verificada. El rol sigue en el código hasta la poda. | `role = 'university_staff'` |
| **cargo** | El puesto por el que alguien responde en nombre de una institución, **normalizado**: lo que en una institución es "Departamento de Alumnos", en otra "Sección Alumnos" y en otra "Secretaría de Alumnos" se guarda y se publica igual. El catálogo tiene una lista corta de cargos genéricos, no el nombre textual de cada institución ([ADR-0073](../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md)). | |
| **respuesta firmada** | Toda respuesta del reseñado la publica una persona con su nombre y su cargo, nunca una entidad: no existe "responde la UNSTA", responde alguien de la UNSTA ([ADR-0073](../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md)). | |
| **revalidación** | Una verificación (docente o cargo institucional) vence al año y hay que renovarla. Lo ya publicado no se retira: era cierto cuando se publicó. | |
| **StudentProfile** | Perfil de alumno vinculado a un `CareerPlan` específico. Un `member` puede tener múltiples (una por carrera cursada). | `StudentProfile` |
| **TeacherProfile** | Claim de identidad docente por parte de un `member`. Debe verificarse para activarse. | `TeacherProfile` |
| **verified (docente)** | `TeacherProfile` con `verified_at NOT NULL`. Única condición para responder por su cátedra. | |
| **verification_method** | Forma en que se verificó el `TeacherProfile`: `institutional_email` (automática) o `manual` (admin revisa evidencia). | `TeacherProfile.verification_method` |

## Dominio académico

| Término | Significado |
|---|---|
| **University** | Universidad. Entidad raíz del catálogo académico. Ej: UNSTA, SIGLO 21, USPT. |
| **institutional_email_domains** | Array de dominios de email válidos para verificación automática de docentes de la universidad. Ej: `['unsta.edu.ar']`. |
| **Career** | Carrera como concepto institucional estable. Ej: "Tecnicatura Universitaria en Desarrollo y Calidad de Software". |
| **CareerPlan** | Plan de estudios de una carrera para un año particular (`year`), con materias propias y un `label` editorial opcional. Ej: "Plan 2019", "Plan 2024". |
| **plan vigente** | `CareerPlan` con `status = Active`. Es el que se le ofrece a nuevos ingresantes; el plan anterior pasa a `Deprecated` pero sigue existiendo para los alumnos que ya lo cursan. |
| **Subject** | Materia. Pertenece a un `CareerPlan`. Tiene `year_in_plan` (año del plan), `term_kind` y `term_in_year`. |
| **carga horaria semanal** | `weekly_hours`: horas de cursada por semana. Rango 0 a 40. **0 no significa "sin trabajo"**: significa que la materia no tiene horario semanal fijo, como Proyecto Final (0 hs/sem y 350 totales en la TUDCS), una práctica profesional o una tesis. El techo de 40 es una jornada laboral completa; más que eso es un dato cargado mal. |
| **carga horaria total** | `total_hours`: horas de la materia en todo su período. Siempre positiva (una materia sin horas no existe) y nunca menor que la semanal. Es el número que el plan de estudios publica al lado de cada materia. |
| **Prerequisite** | Correlativa. Relación entre dos `Subject` del mismo plan con un `type`. |
| **para_cursar** | Tipo de correlativa: requiere que la materia requerida esté **regularizada** para inscribirse a la dependiente. |
| **para_rendir** | Tipo de correlativa: requiere que la materia requerida esté **aprobada** para rendir el final de la dependiente. |
| **Teacher** | Docente. Entidad del catálogo académico precargada, asociada a una universidad. Existe independientemente de si hay un `User` que la reclamó. |
| **Commission** | Comisión. Oferta concreta de una `Subject` en un `AcademicTerm`. Tiene nombre (A, B, Com 1), modalidad, capacidad. |
| **CommissionTeacher** | Asignación M:N entre `Teacher` y `Commission` con `role` (titular, adjunto, JTP, ayudante, invitado). |
| **AcademicTerm** | Período lectivo de una universidad. Tiene un `kind` (bimestral, cuatrimestral, semestral, anual) que define su duración. Ej: "2026-C1". |
| **term_kind** | Cadencia del período: `bimestral`, `cuatrimestral`, `semestral`, `anual`. Genérico para soportar universidades con distintos calendarios. |
| **cadencia (cómo se dice en la UI)** | `term_kind` mostrado al usuario: "1er cuatrimestre", "3er bimestre", "anual"; forma corta "1er cuatri". **Nunca codificada en letras** (`1c`, `3b`, `1s`): esas abreviaturas no están definidas en ninguna pantalla y no significan nada para quien las lee por primera vez. Fuente única: `frontend/src/lib/academic-terms.ts` ([ADR-0051](../decisions/0051-academic-vocabulary-with-a-canonical-representation-in-the-ui.md)). |
| **período (cómo se dice en la UI)** | Un `AcademicTerm` mostrado al usuario: "2025 · 2do cuatrimestre". No confundir con el `label` que se persiste ("2025-C1"): ese es un identificador estable del período, no copy. Cambiar cómo se lee un período no debería reescribir filas. |
| **archivar** | Sacar del catálogo algo que ya no se ofrece, sin borrarlo (`is_active = false`). Aplica a University, Career, Subject, Teacher y Commission; CareerPlan usa su propio `status` porque deprecar no es lo mismo que archivar. Lo archivado desaparece de las lecturas públicas y sigue existiendo para todo lo que ya lo referencia: una cursada vieja, una reseña, un plan ([ADR-0057](../decisions/0057-soft-delete-when-something-hangs-off-it.md)). |
| **reactivar** | La vuelta de **archivar**, y no un extra: es la única salida cuando alguien archiva algo por error. Los seis agregados de arriba tienen su endpoint `reactivate`, y el listado de backoffice muestra lo archivado con su estado justamente para poder usarlo. **Archivar no libera el nombre ni el código**: los UNIQUE del catálogo son sobre todas las filas, así que no se crea un duplicado "A" para reemplazar a la "A" archivada, se reactiva la que ya existe. |

## Desambiguación

Términos que se prestan a confusión. La columna "Uso correcto" es la regla que aplicamos en todo el proyecto.

| Término | Uso incorrecto | Uso correcto |
|---|---|---|
| **docente** | "Un rol de usuario" | Se refiere a `Teacher` (entidad catálogo) o a un `TeacherProfile` verificado. Nunca es un `role` de `User`. |
| **alumno** | "Un rol de usuario" | Se refiere a un `member` con `StudentProfile`. El rol es `member`. |
| **rol** | "Algo que un usuario puede tener varios a la vez" | Un `User` tiene exactamente un `role` del enum. Los profiles suman **capacidades**, no roles. |
| **carrera** | "Un plan de estudios específico" | `Career` es el concepto estable. `CareerPlan` es la versión específica. Un alumno cursa una `Career` bajo un `CareerPlan` determinado. |
| **comisión** | "Cursada del alumno" | `Commission` es la oferta (materia + cuatrimestre + docentes). `EnrollmentRecord` es la cursada específica del alumno en esa comisión. |
| **cuatrimestre** | Como sinónimo de cualquier período | `AcademicTerm` generaliza a bimestral/cuatrimestral/semestral/anual. "Cuatrimestre" es un `AcademicTerm` con `kind='cuatrimestral'`. Vale también para el código: concatenar una "c" fija al formatear un período asume la cadencia de UNSTA y rompe la generalidad que compró [ADR-0001](../decisions/0001-multi-university-as-root-domain-from-day-1.md). |
| **anónimo** | "Los datos del autor no existen en DB" | El anonimato es de **presentación**, no de storage. La identidad siempre se preserva internamente. |
| **cohorte** | "La misma combinación de materias" (la acepción del planificador, retirada con él) | La camada de ingreso: las cuentas que entraron a una carrera en una institución el mismo año. |
| **backoffice** | "Un módulo del backend, con su propio namespace de API (`/api/admin/...`)" | Es la **unión de las features no-públicas de cada agregado**, un corte transversal sobre los módulos que ya existen. No es un bounded context ni un prefijo de ruta: cada feature de backoffice vive en su módulo dueño y expone `/api/<modulo>/...` (ej. el CRUD de carreras es `/api/academic/...`). Ver [ADR-0050](../decisions/0050-backoffice-is-a-cross-cutting-slice-not-a-module.md). |
| **admin** | "Un módulo, un área del backend, o un namespace de API" | Es un `role` de `User` (ver Identidades y cuentas). Nombra al **actor**, no a un lugar del sistema. Al conjunto de pantallas que ese actor usa se lo llama **backoffice**; en el frontend "admin" sí nombra algo real, pero es una sección de UI (`src/app/(staff)/admin/`), no un módulo del backend. |

## Actores

Los actores del producto nuevo son las [personas](personas.md) y la lista cerrada de roles de los [requisitos](README.md): quien lee (sin cuenta), quien reseña (con cuenta), el reseñado que responde (la cátedra o la institución, con identidad verificada, a los números de su ficha), y el equipo (catálogo, curaduría, relevamiento oficial, verificación, administración). Qué puede y qué no puede cada uno lo dice cada requisito; la tabla de actores de la versión anterior está en el [ático](../history/domain-v1/ubiquitous-language-v1.md).
