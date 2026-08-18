# Ubiquitous Language (planb)

Glosario de términos del dominio. Es la referencia autoritativa para el uso de cada término en código, UI, documentación y conversación con stakeholders. Si un término aparece acá con un significado específico, no se usa con otro significado en otro lado.

> **Estado (2026-08-17)**: este glosario es el vocabulario del producto vigente ([THESIS.md](../THESIS.md), [ADR-0063](../decisions/0063-the-product-is-a-pressure-instrument.md) a [0068](../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md)) más los términos del catálogo y de las cuentas que sobreviven al viraje. Lo que nombraba la versión anterior (historial, planificador, reseña de texto libre, embeddings, sus actores) está en [`docs/history/domain-v1/ubiquitous-language-v1.md`](../history/domain-v1/ubiquitous-language-v1.md) mientras exista el código que describe.

Basado en los principios de DDD (Eric Evans). Cuando aparecen nuevos términos en conversación o código, se agregan acá antes de propagarse.

## Convenciones generales

- **Identificadores en código** (clases, tablas, propiedades): inglés. C# → `PascalCase`, SQL → `snake_case`, TypeScript → `camelCase`.
- **Strings de UI**: español rioplatense.
- **Mensajes de error internos** (logs, excepciones, códigos de error): inglés.
- **Documentación y ADRs**: narrativa en español, nombres de entidades en inglés cuando referencia al modelo (ej. "el `EnrollmentRecord` tiene estado `aprobada`").

## El producto: reseñar y publicar

Vocabulario de la tesis vigente ([THESIS.md](../THESIS.md), "Qué recabamos" y "Qué publicamos"). Es lo que la persona hace, lo que el sistema recibe y lo que publica. Los términos de lo que se **publica** entran a medida que esa capa cierra (la proporción de voces, el encogimiento, los dos ejes, la atribución, la derivación, la cobertura, la trayectoria y las comparaciones, el testimonio): "qué publicamos" está cerrado entero.

| Término | Significado |
|---|---|
| **Reseñar** | El acto principal: elegir una materia que cursaste y contar lo que viviste cursándola. Pide cuenta. Cinco minutos. **No se dice "contar"** (era jerga del canvas del mapa) ni "escribir una reseña" (escribir es opcional). |
| **Reseña** | Lo que produce reseñar: una cuenta × una materia × el período en que la cursó, con **cómo terminó**, sus frases marcadas, su comentario opcional, y la cátedra si la recordó. Es la unidad de contribución. |
| **Cursada** | Lo que se reseña: la experiencia de haber cursado una materia, que incluye la materia (el contenido), la cátedra (cómo la dieron) y la gestión que la rodeó (mesas, aula, sistema, trato). Un solo acto cubre las tres. |
| **Frase** | Una oración predefinida ("Es dura de verdad", "Hay clases que no se dan", "Tiene un techo de nota"). No se escribe: se **marca**. Las hay nuestras (las semilla) y destiladas. Cada frase tiene un sujeto y un eje. |
| **Marcar** | Decir "esto me pasó" sobre una frase. Es lo mínimo que hace una reseña. **No se dice "tocar"**. |
| **Sujeto** de una frase | De qué habla: la materia, la cátedra, la institución, el centro de estudiantes. La lista no es cerrada. Determina a qué ficha va la frase. |
| **Eje** de una frase | De qué aspecto habla: **exigencia** (cuán duro) o **gestión** (cuán bien lo llevan). Son los dos ejes de la tesis. |
| **Comentario** | El campo opcional donde el que reseña escribe en sus palabras lo que ninguna frase cubre. **No se dice "texto libre"**. Se lee, no suma a los conteos, y alimenta la destilación siempre. Se publica como **testimonio** ([ADR-0068](../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md)). |
| **Testimonio** | La reseña tal como se lee en la ficha: su comentario, las frases que marcó, el período y la cátedra si la dio. Sin cuenta, sin nombre, sin "cómo terminó". Sin comentario, la reseña no aparece como testimonio: es voz en los conteos. Va debajo de las frases con voces, nunca como cuerpo, ordenado por votos. |
| **Exposición** | Lo que se modera: una persona fuera de su acto público (la que aportó, un tercero; su vida privada, salud, familia, aspecto, contacto). El docente nombrado en su rol no está expuesto: está evaluado. La queja dura contra la cátedra o la institución no es causal. Nada baja solo por cantidad de reportes; **se baja el texto, nunca la voz**. |
| **Chequeo previo** | Lo que corre antes de publicar un comentario o una réplica: marca lo que identifica por contexto (y decide el autor) y retiene, hasta que un humano mire, lo que habla de una persona fuera de su acto. Es la única inteligencia que toca lo publicado, y nunca decide sola. |
| **Evento institucional** | Lo que se reseña fuera de una cursada: un trámite, el título, una equivalencia, una vacante que no conseguiste, el sistema que falló, una mesa que no hubo, el trato de un administrativo o del centro. Se pregunta de a uno cuando aparece, sin materia. Lleva frases, comentario y votos igual que la reseña. |
| **Voto** | "A mí también me pasó", sobre una reseña o un evento entero, sin escribir. Convierte una reseña en muchas voces. Pide cuenta. |
| **Voces** | Cuántas personas sostienen algo: la reseña más sus votos. Es lo que acompaña a cualquier dato que se muestre. **No se dice "n"**. Arriba de la cursada, la **voz es una persona hablando de una cursada** y se suma: quien reseñó tres cursadas de una carrera son tres voces en ella ([ADR-0066](../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)). |
| **Hecho de trayectoria** | Un dato de la vida académica de la cuenta, preguntado de a uno cuando aparece: cuándo entraste, cuándo cursaste y cómo terminó (vienen con la reseña), si te fuiste cuándo, si te recibiste cuándo. Nunca como inventario, y **el silencio no se infiere**: quien no dijo es "no dijo" ([ADR-0067](../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md)). |
| **Cómo terminó** | El resultado de la cursada, un toque en la reseña: la aprobé, me quedó regular, la desaprobé, la dejé, sigo. Son los estados de cursada que el dominio ya tenía. De acá salen la aprobación y el abandono de cursada por materia. |
| **Constancia** | La prueba opcional de condición de alumno. Verificarse pesa, no habilita. |
| **Destilar** | Sacar, con inteligencia, frases nuevas de los comentarios de muchos, y sumarlas a las que se ofrecen para marcar. La frase destilada es dato derivado, no pedido. |
| **Aporte** | Genérico: cualquier cosa que alguien contribuye (una reseña, un evento, un voto, una corrección de dato, un pedido de carrera). "Mis aportes" es la pantalla que junta todo eso. No es sinónimo de reseña. |
| **Cátedra** | El equipo docente que dicta una materia: titular a cargo, adjuntos, JTPs, ayudantes. Persiste entre cuatrimestres. Una materia puede tener varias en paralelo y el alumno elige. **No existe hoy en el catálogo** (hay `Commission`, que es otra cosa). |
| **Comisión** | La división horaria y de cupo dentro de una cátedra (Com A, martes noche). Existe en el catálogo como `Commission`. |
| **Réplica** | La respuesta del docente (o de la institución), con su nombre, a lo publicado sobre su cátedra. Pide identidad verificada: para el docente, verificar es permiso. Queda al lado del testimonio, no lo baja ni mueve conteos; pasa el mismo chequeo previo; no cita lo que el autor marcó como identificante; y espera un plazo desde el aviso para que quien aportó edite, borre o pida revisión. |
| **Ficha** | La página pública de un sujeto (materia, cátedra, carrera, institución) con lo que se publica de él. Se lee sin cuenta. Muestra, por eje, la lista de frases con sus voces; nunca un puntaje. |
| **Proporción de voces** | Lo que se publica de cada frase: cuántas de las personas que reseñaron ese sujeto la marcaron o votaron, encogida por Wilson cuando son pocas ("37% de 120 personas"). Es la unidad de publicación ([ADR-0064](../decisions/0064-phrases-with-voices-not-scores.md)). |
| **Encogimiento** | Cómo se corrige una proporción cuando la sostienen pocas voces: se publica el límite inferior del intervalo de Wilson, que sube solo a medida que crece el corpus. Cuatro de cuatro no es 100%. Con nombre y fórmula publicada en `metodo`. |
| **Los dos ejes** | Exigencia y gestión, como dos familias de frases que nunca se mezclan. **No son "los dos números"**: no hay puntaje 1 a 5 por eje ni total. |
| **Atribución** | De qué lado cae una frase: "la carrera siendo dura" (eje exigencia) o "alguien fallando" (eje gestión). **La decide el eje**, nunca el sujeto ni la persona ([ADR-0065](../decisions/0065-attribution-is-the-axis-not-a-split.md)). Se publica como dos proporciones de voces con el mismo denominador ("5 de cada 10 dicen que es dura; 7 de cada 10 marcaron alguien fallando"; en la ficha de una cursada, una voz es una persona), **nunca como un split** ("el 65% de lo difícil"): ese número depende del catálogo, no de la gente. |
| **Frase semilla** | Una de las frases que ofrecemos nosotros para arrancar (las 32 del mapa). Se distingue de la **frase destilada**, que salió de los comentarios de muchos y las voces validaron. |
| **Derivar** | Armar la ficha de un sujeto que no se reseña (la materia en todos sus períodos, la cátedra, la carrera en una institución, la institución) sumando las voces de las cursadas que le pertenecen ([ADR-0066](../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)). La institución son tres cosas que no se mezclan: lo que se dice de ella como sujeto, sus cursadas, su cobertura. |
| **Cobertura** | Cuántas de las materias del plan tienen voces, sobre el total del plan ("22 de 40 materias"). Es distinto de las voces: 850 voces en 3 materias es mucha voz y poca cobertura. Viaja con todo dato derivado, y cada frase derivada dice en cuántas materias aparece. |
| **Gate de cobertura** | La condición para publicar la cabecera derivada de una carrera o institución: más de la mitad de las materias del plan con voces. Debajo, la ficha dice que todavía no derivamos y se lee materia por materia. No es un piso: las listas de frases se publican desde la primera voz. |
| **Piso** | **No existe.** Todo se publica desde la primera voz, como "X de N voces" con su encogimiento. Ni piso de personas, ni escalera de desbloqueos (la del mapa, 1/5/15, murió con [ADR-0066](../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)). Lo que se le dice al que reseña: no publicamos quién; en un grupo chico pueden sospechar. |
| **Cohorte** | Las cuentas que entraron a una carrera en una institución el mismo año (la acepción de siempre; la del planificador, "misma combinación de materias", se retiró con él). **Cohorte cerrada**: la que entró hace al menos una vez y media la duración nominal; solo ella publica egreso y abandono ([ADR-0067](../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md)). |
| **Duración nominal / real** | La nominal es la del plan. La real es la **mediana** de años entre entrar y recibirse, de los egresados que declararon las dos fechas; siempre "de los que se recibieron". |
| **Brecha** | Duración real menos duración nominal, en años ("el plan dice 5; la gente tarda 7,5: brecha de 2,5"). El cociente real/nominal va en el método; es el indicador que publica la SPU. |
| **Egreso / abandono** | Hechos de la carrera: "me recibí (año)" / "me fui (año)". Distintos de **dejé**, que es de una cursada. Se publican por cohorte cerrada como tres proporciones: se recibió, se fue, no dijo o sigue. |
| **Aprobación** | Aprobé sobre aprobé más desaprobé, por materia y período; afuera dejé, regular y sigo (la definición de [ADR-0047](../decisions/0047-pass-rate-publico-desde-historial-privado.md), desde lo declarado). **Abandono de cursada**: dejé sobre todos los que terminaron de alguna forma. |
| **Co-cursada** | Dos materias reseñadas por la misma cuenta en el mismo período. Se publica por par y período: cuántas personas las llevaron juntas y cuántas dejaron una. Solo desde reseñas, nunca desde el plan marcado. |
| **Serie** | La misma proporción, por el **período en que pasó** (período de cursada, fecha del evento), nunca por cuándo se reseñó. Cada punto con sus voces y su encogimiento, sin suavizar, con la publicación y la réplica marcadas. |
| **Carrera canónica** | El nombre bajo el que el catálogo declara que dos ofertas de distintas instituciones son la misma carrera, para compararlas en `donde`. Lo decide el equipo, no el parecido del nombre. |
| **Nombre de pantalla** | Cómo se nombra una pantalla en docs y stories: con el nombre del mapa, en español y en backticks (`donde`, `reseñar`, `micarrera`, `metodo`). Es vocabulario de UX, como la etiqueta visible. **No es la ruta**: la URL es código, va en inglés y con slug (`/my-career`, `/reviews/write`), y se fija cuando la pantalla entra a sprint. |
| **Comparar** (`donde`) | La misma carrera canónica en varias instituciones, lado a lado, dato por dato, sin compuesto, sin ganador y sin ordenar por valor. Quien quiere ordenar baja el CSV. |

## Producto, landing y datos

La distinción que se venía mezclando: los **datos de prueba** llenan la **aplicación** real (las herramientas funcionando); los **datos demo** ilustran esas herramientas en la **landing** (venta). No se cruzan: la landing no lee datos del backend.

| Término | Significado |
|---|---|
| **producto / aplicación** | El sistema real, plan-b (backend + frontend). Contiene las herramientas y los features de plataforma. Se prueba y se muestra cargándole datos de prueba. |
| **herramienta** | Feature de valor que un actor (alumno, docente, staff) usa para su tarea: reseñar, las fichas, comparar, moderación, gestión de catálogo. Se nombran como las nombra la app. No es cualquier feature: los de plataforma (registro, login, recuperar contraseña, gestión de cuenta) habilitan el uso pero no son herramientas. |
| **landing** | La cara de venta del producto (marketing). Ilustra las herramientas con datos demo y puede idealizar. Es pública, pero eso no la define: hay herramientas públicas también (catálogo, reseñas de una materia). Lo que la separa es que ilustra, no ejecuta. |
| **datos de prueba** | Datos sembrados en la DB para probar y mostrar la aplicación real funcionando (desarrollo, tests, defensa ante el tribunal). Los consumen los endpoints reales. Implementados como el `SeedCorpus` en el host (gateado por `PLANB_SEED_CORPUS`) más los seeders por módulo (`AuthorsSeeder`, `EnrollmentsSeeder`, `ReviewsSeeder`). |
| **datos demo** | Datos de ejemplo hardcodeados en la UI de la landing (componentes `demo-*`), para ilustrar las herramientas. Marketing: no viven en el backend, no se fetchean, no pretenden exactitud. |

## Identidades y cuentas

| Término | Significado | Ubicación |
|---|---|---|
| **User** | Cuenta con credenciales (email, password). Rol único, inmutable después de creado salvo intervención admin. | `User` |
| **role** | Tipo funcional del usuario. Enum exclusivo. No acumulable. | `User.role` |
| **member** | Rol de usuario de comunidad académica. Puede tener perfiles de alumno y/o docente. Sin acceso administrativo. | `role = 'member'` |
| **moderator** | Rol staff para resolver reports y remover contenido inapropiado. No puede tener StudentProfile ni TeacherProfile. | `role = 'moderator'` |
| **admin** | Rol staff con permisos totales: moderación + gestión de catálogo académico + alta/baja de staff. | `role = 'admin'` |
| **university_staff** | Rol de la versión anterior (dashboard institucional). El producto nuevo no tiene cliente institucional: la institución lee la ficha pública y replica con identidad verificada. El rol sigue en el código hasta la poda. | `role = 'university_staff'` |
| **StudentProfile** | Perfil de alumno vinculado a un `CareerPlan` específico. Un `member` puede tener múltiples (una por carrera cursada). | `StudentProfile` |
| **TeacherProfile** | Claim de identidad docente por parte de un `member`. Debe verificarse para activarse. | `TeacherProfile` |
| **verified (docente)** | `TeacherProfile` con `verified_at NOT NULL`. Única condición para responder reseñas. | |
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
| **cadencia (cómo se dice en la UI)** | `term_kind` mostrado al usuario: "1er cuatrimestre", "3er bimestre", "anual"; forma corta "1er cuatri". **Nunca codificada en letras** (`1c`, `3b`, `1s`): esas abreviaturas no están definidas en ninguna pantalla y no significan nada para quien las lee por primera vez. Fuente única: `frontend/src/lib/academic-terms.ts` ([ADR-0051](../decisions/0051-vocabulario-academico-canonico-en-la-ui.md)). |
| **período (cómo se dice en la UI)** | Un `AcademicTerm` mostrado al usuario: "2025 · 2do cuatrimestre". No confundir con el `label` que se persiste ("2025-C1"): ese es un identificador estable del período, no copy. Cambiar cómo se lee un período no debería reescribir filas. |
| **archivar** | Sacar del catálogo algo que ya no se ofrece, sin borrarlo (`is_active = false`). Aplica a University, Career, Subject, Teacher y Commission; CareerPlan usa su propio `status` porque deprecar no es lo mismo que archivar. Lo archivado desaparece de las lecturas públicas y sigue existiendo para todo lo que ya lo referencia: una cursada vieja, una reseña, un plan ([ADR-0057](../decisions/0057-borrado-logico-cuando-hay-algo-colgando.md)). |
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
| **cuatrimestre** | Como sinónimo de cualquier período | `AcademicTerm` generaliza a bimestral/cuatrimestral/semestral/anual. "Cuatrimestre" es un `AcademicTerm` con `kind='cuatrimestral'`. Vale también para el código: concatenar una "c" fija al formatear un período asume la cadencia de UNSTA y rompe la generalidad que compró [ADR-0001](../decisions/0001-multi-universidad-desde-dia-1.md). |
| **moderador-docente** | "Un docente puede moderar" | Estructuralmente imposible: `moderator` y `member` son roles exclusivos. Un docente que quiera moderar necesita una segunda cuenta con rol `moderator`. |
| **anónimo** | "Los datos del autor no existen en DB" | El anonimato es de **presentación**, no de storage. La identidad siempre se preserva internamente. |
| **cohorte** | "La misma combinación de materias" (la acepción del planificador, retirada con él) | La camada de ingreso: las cuentas que entraron a una carrera en una institución el mismo año. |
| **backoffice** | "Un módulo del backend, con su propio namespace de API (`/api/admin/...`)" | Es la **unión de las features no-públicas de cada agregado**, un corte transversal sobre los módulos que ya existen. No es un bounded context ni un prefijo de ruta: cada feature de backoffice vive en su módulo dueño y expone `/api/<modulo>/...` (ej. el CRUD de carreras es `/api/academic/...`). Ver [ADR-0050](../decisions/0050-backoffice-como-corte-transversal.md). |
| **admin** | "Un módulo, un área del backend, o un namespace de API" | Es un `role` de `User` (ver Identidades y cuentas). Nombra al **actor**, no a un lugar del sistema. Al conjunto de pantallas que ese actor usa se lo llama **backoffice**; en el frontend "admin" sí nombra algo real, pero es una sección de UI (`src/app/(staff)/admin/`), no un módulo del backend. |

## Actores

Los actores del producto nuevo son las [personas](user-personas.md) y la lista cerrada de roles del [catálogo de stories](user-stories.md): quien lee (sin cuenta), quien reseña y vota (con cuenta), el docente y la institución (réplica con identidad verificada), y el equipo (catálogo, frases, moderación, verificación, administración). Qué puede y qué no puede cada uno lo dice cada story; la tabla de actores de la versión anterior está en el [ático](../history/domain-v1/ubiquitous-language-v1.md).
