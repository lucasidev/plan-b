# La tesis y los docs contra el producto (2026-09-13)

> Registro de revisión ([índice](README.md)). **Alcance**: lo que describe al producto ([`THESIS.md`](../../THESIS.md), el [glosario](../../product/language.md), las [personas](../../product/personas.md), las [garantías](../../product/guarantees/README.md), los 19 README de recorrido y épica y las 34 fichas de pantalla con carpeta) contra el producto tal como está construido: el código en `main` (`10cda38f`) y el stage que lo sirve. **Norma**: al revés que en los recorridos, acá el producto es el hecho y el papel es lo revisado: la pregunta es si cada afirmación describe lo que hay, dice algo que todavía no está, o dice otra cosa. **Método**: lectura de la tesis, el glosario, las personas y las garantías afirmación por afirmación, con `grep` sobre `frontend/src` y `backend/modules` y con las páginas del stage; las fichas de pantalla y los README, con dos scouts de solo lectura sobre `frontend/src/app` y `frontend/src/features`, ficha por ficha, con `file:line`. Los recorridos de persona del mismo día ([Valentina](2026-09-13-valentina-walk.md), [Lucía](2026-09-13-lucia-walk.md), [Copas](2026-09-13-copas-walk.md), [Matías](2026-09-13-matias-walk.md)) son la evidencia de lo que el stage muestra.

Estados: **Resuelto** (con el commit o PR), **Cerrado** (una decisión lo cerró), **Pendiente** (espera una decisión de Lucas o entra a un sprint), **Descartado** (con la razón), **Confirmación** (no era hallazgo).

## Qué se encontró, en una línea

La tesis describe bien el núcleo: lo que el producto publica de una cátedra (la moda con su distribución, la fama por convergencia, la comparación entre hermanas, la tasa agregada, el piso) y lo que no hace es exactamente lo que el stage muestra. Lo que no describe bien es de dos clases: la cabecera y tres detalles del glosario están viejos (la poda ya entró, la tasa no se compara con hermanas, `Commission` ya no existe), y una docena de afirmaciones en presente ("recabamos la modalidad", "la institución tiene su plantel", "el reseñado responde con nombre", "los datos se bajan") describen lo que el producto va a hacer, no lo que hace. En las fichas de pantalla, 17 de 34 describen lo construido, cuatro tienen el slug viejo, una promete una cola que otra ficha niega, y diez son de pantallas que no existen y lo dicen.

## La tesis, afirmación por afirmación

Solo las afirmaciones sobre el producto. **Está**: el producto lo hace así. **Parcial**: lo hace en parte. **No está**: no lo hace todavía. **Dice otra cosa**: el papel describe algo distinto de lo construido.

| Dónde | Afirmación | Estado | Evidencia |
|---|---|---|---|
| Cabecera, líneas 3 a 7 | "El código de hoy contiene la versión anterior (el planificador) en retiro"; "Estado de la poda"; "Lo que sigue es propagarla a los requisitos" | Dice otra cosa | La poda entró: `backend/modules` es `academic`, `identity` y `reviews`, y no hay ruta `/plan`. Quedan dos roles del enum sin pantalla (`UserRole.cs:10-12`, `Moderator` y `UniversityStaff`) y tres campos del perfil que ningún doc describe (Legajo, Año cursando, Estado: `my-profile-form.tsx:87-91`) |
| Decisión 1 | Conteos con voces, la moda con su porcentaje, la distribución, nunca un puntaje | Está | Valentina, paso 7: "Casi nunca · 57 %" con la distribución "siempre 14 · a veces 29 · casi nunca 57 · nadie preguntaba 0 · de 14"; ningún puntaje en ninguna ficha |
| Decisión 2 | Los dos bloques, separados y sin sumar | Está | "Qué hizo la cátedra" y "Qué les pasó a los que cursaron" (`chair-facts-sheet.tsx:41-50`) |
| Decisión 3 | Leer no pide cuenta; el gate está en la acción | Está | Matías, paso 1; Valentina, paso 1 |
| Decisión 4 | Se reseña esa cursada, en un acto corto, saltear vale; las frases destiladas del campo libre entran versionadas | Está | Lucía, pasos 3 y 6 (1,7 s; saltear vale); Copas, 7b (la destilada "entró en la versión 3" y Método la publica) |
| Decisión 5 | El catálogo lo carga el equipo, con correlativas; lo oficial con fuente y fecha | Está | El backoffice carga universidades, carreras, planes, materias, períodos, docentes y cátedras (`(staff)/admin/**`); `Prerequisites` existe en el dominio; los datos oficiales con fuente y período (Valentina, paso 3) |
| Qué recabamos, 1 | El contexto: "el período, la cátedra, la modalidad, cómo terminó y cuántas veces la cursaste" | Parcial | La reseña pide período, cátedra y cómo terminó (Lucía, paso 3). Modalidad y cuántas veces no se preguntan (`grep -ri "modalidad\|veces" frontend/src/features/write-review`: nada), aunque [ADR-0082](../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) §3 las lista |
| Qué recabamos, 2 | El campo libre, uno, al final, que no se publica | Está | Matías, pasos 2, 4 y 5 |
| Qué recabamos, 3 | El instrumento administrativo, re-preguntado con el tiempo | No está | Ninguna pantalla ni endpoint (`grep -ri "administrativo" frontend/src`: nada) |
| Qué recabamos, 4 | La constancia, opcional | No está | SC-022 sin slug; US-190 en el Backlog |
| Qué recabamos, 5 | Lo destilado, versionado | Está | Copas, 7b |
| Qué publicamos, 1 | La unidad es el conteo de una frase, con su denominador | Está | Valentina, paso 7 |
| Qué publicamos, 2 | La fama es la convergencia, arriba de la ficha, con su sustento | Está | Ibáñez en el stage: "3 respuestas distintas apuntan al mismo lado", con cada frase y su porcentaje debajo |
| Qué publicamos, 3 | Comparar solo contra las hermanas, solo si los intervalos no se tocan | Está | Pérez en el stage: "Comparada con las otras cátedras de Fundamentos de Control de Calidad: ¿Se dictaron las clases? Faltaron muchas: 56 % acá, 11 % en las otras" |
| Qué publicamos, 4 | La tasa de finalización, agregada, nunca el desenlace individual | Está | "De cada 10 que la cursan, llegan 6"; "Ninguna reseña muestra cómo terminó nadie" (`chair-facts-sheet.tsx:168-205`) |
| Qué publicamos, 5 | El piso de 10, con el estado a la vista | Está | Ruiz: "Junta 9 reseñas: con 1 más se publica" |
| Qué publicamos, 6 | Cada dato con sus voces, su período y su dispersión temporal ("412 reseñas, 380 cargadas en marzo de 2026") | Parcial | La ficha dice las voces, el rango de períodos y la fecha de la última ("14 voces · de 2024 a 2024 · lo último es de …", `chair-facts-sheet.tsx:96-99`); no dice cuántas se cargaron cuándo |
| Qué publicamos, 7 | La materia muestra la dispersión entre cátedras; la carrera, "qué materia frena a cuántas" y la cobertura | Parcial | La materia muestra sus cátedras por separado y la co-cursada (Valentina, paso 6); la carrera muestra la cobertura ("4 de 21 materias"). "Qué frena la cursada" no está, y el código lo dice (`career-facts-sheet.tsx:19-21`) |
| Qué publicamos, 8 | La institución: plantel navegable, transparencia con fuentes, notas de curaduría, cobertura | Parcial | La ficha de UNSTA en el stage tiene identidad institucional, la lista de carreras, la transparencia con "Ver fuentes" y el aviso de cobertura; no tiene plantel ni notas (la nota del equipo existe solo en la carrera: `career-facts-sheet.tsx:163`) |
| Qué publicamos, 9 | Los datos oficiales al lado de las voces; Dónde estudiarla lado a lado, sin ganador | Está | Valentina, pasos 3 y 4 |
| Qué publicamos, 10 | Notas de curaduría sin nombres, con procedencia y fecha | Está en carrera | `career-facts-sheet.tsx:163`: "Nota del equipo, leída de comentarios que no se publican"; en institución no |
| Qué publicamos, 11 | El instrumento se versiona, la serie declara sus cortes y el reproceso se dice | Está en la ficha, no en Método | Las versiones existen (Copas, 7b) y Método marca lo destilado; la ficha de Aráoz declara el corte ("acá cambió la pregunta (septiembre de 2026), los tramos no se comparan"); Método no explica los cortes ni el reproceso (en `/method` no aparecen "corte", "reprocesa" ni "versión") |
| Qué publicamos, 12 | El método es público; los datos se bajan como se publican | Parcial | Método está (Valentina, paso 10); la descarga no (V08, US-180 en el Backlog) |
| Qué no hace | No investiga causas, no juzga, no publica texto, no planifica, no tiene convenios | Está | Método: "En ningún lado se afirma una causa"; "No tenemos acuerdos con ninguna institución"; el campo libre no se publica (Matías, paso 4); el planificador ya no está |
| Posición | "La respuesta del reseñado se publica con nombre" | No está | Ninguna pantalla de Responder (SC-020 sin slug); US-172 a US-179 en el Backlog; el glosario promete "Sin respuesta · avisada el [fecha]" y la ficha no lo muestra |
| Posición | "El contrato se le dice en la cara antes de enviar" | Está | Lucía, paso 3; Matías, paso 2 |
| A quién sirve | "Al que investiga… se descarga sin registro" | No está | V08 |

## El glosario, las personas y las garantías

Los términos que describen un mecanismo del producto y no lo describen como es:

| Dónde | Dice | El producto | Estado |
|---|---|---|---|
| Glosario, Tasa de finalización | "Se publica solo agregada… **y comparada con sus hermanas**" | Se publica agregada y sola (`chair-facts-sheet.tsx:168-205`); [ADR-0083](../../decisions/0083-the-ficha-publishes-counts-not-scores.md) §6 tampoco la compara | Dice otra cosa |
| Glosario, Dispersión temporal | "siempre visible ('412 reseñas, 380 cargadas en marzo de 2026')" | Rango de períodos y fecha de la última | Parcial |
| Glosario, Contexto | "período, cátedra, modalidad, cómo terminó, cuántas veces la cursaste" | Período, cátedra, cómo terminó | Parcial |
| Glosario, archivar | "Aplica a University, Career, Subject, Teacher y Commission" | No hay `Commission` en el dominio (`Planb.Academic.Domain/` no tiene la carpeta); la Desambiguación del mismo glosario dice que la comisión no se modela | Dice otra cosa |
| Glosario, Nombre de pantalla | "la URL va en inglés y con slug (`/reviews/write`)" | Reseñar vive en `/reviews/new` | Dice otra cosa (el ejemplo) |
| Glosario, Respuesta del reseñado | "La ficha muestra 'Sin respuesta · avisada el [fecha]' hasta que llegue" | La ficha no tiene esa línea | No está |
| Glosario, Pendiente de vincular, Instrumento administrativo, Constancia, Serie | Describen mecanismos en presente | US-197, el instrumento administrativo, US-190 y US-177 están en el Backlog | No está |
| Glosario, moderator y university_staff | "El rol sigue en el código hasta la poda" | Siguen en `UserRole.cs`, y la poda del resto ya entró | Está, pero la poda que espera no tiene fecha |
| Personas: Ana | "El vacío se explica en sus tres estados (no la cargamos / cargada sin llegar al piso / con voces publicadas)" | Los dos últimos están (Ruiz; la cobertura de la carrera); "no la cargamos" es Pedir una carrera (SC-009, SC-010, S01), sin construir | Parcial |
| Personas: Claudia y Prof. Paredes | La respuesta firmada; "la ficha declara el estado del canal" | Sin construir (Responder) | No está |
| Personas: Diego | "Su año de salida se le pregunta una vez, y si no vuelve, por mail" | US-152 y US-156 en el Backlog | No está |
| Personas: Rocío | "El crudo se descarga sin registro" | V08 | No está |
| Personas: Valentina, Lucía, Matías, Silvia | La lectura pública, la fama arriba, Dónde estudiarla; frases cerradas y cómo terminó en un toque; el gate en la acción y la reseña que queda; dura en el papel y en la realidad arriba de la ficha | Está | Los cuatro recorridos |
| Garantías: US-167 | "Donde algo está publicado, se puede reportar sin registrarse" | Sin construir (V07); la ficha de cátedra no tiene control de reporte | No está |
| Garantías: US-168, US-170, US-171 | Leer sin cuenta, nada antes de leer, nada vendido | Está | Valentina, paso 1; Matías, paso 1 |

## Las fichas de pantalla

Las 34 con carpeta, contra `frontend/src/app` y `frontend/src/features`. **Construida**: la pantalla existe con lo que la ficha describe. **Embebida**: lo que la ficha describe existe dentro de otra pantalla, y la ficha lo dice ("sin slug"). **Parcial**: existe y difiere en algo concreto. **No construida**: no existe, y la ficha lo dice.

| Estado | Fichas |
|---|---|
| Construida (17) | SC-001 Ficha de carrera, SC-002 Ficha de cátedra, SC-003 Explorar, SC-004 La entrada, SC-005 Ficha de institución, SC-007 Ficha de materia, SC-008 Dónde estudiarla, SC-011 Inicio, SC-015 Reseñar, SC-018 Mis aportes, SC-019 Mi perfil, SC-021 Método, SC-024 Recuperar, SC-025 Ingresar, SC-026 Registro, SC-035 Docente, SC-036 Curaduría |
| Con el slug viejo (4 de las 17) | SC-008 "sin slug" (vive en `/careers/[id]/where-to-study`, también en el índice); SC-015 "`/reviews/write` (existe el editor texto-libre de la versión anterior)" (vive en `/reviews/new`); SC-018 "`/reviews`" (vive en `/reviews/mine`); SC-021 "sin slug, sección de la landing" (vive en `/method`) |
| Embebida (3) | SC-006 Buscar (el buscador del topbar, sin pantalla propia); SC-016 Baja (el diálogo de Mi perfil); SC-017 Editar (la corrección en el lugar, en Mis aportes) |
| Parcial (4) | SC-013 Anonimato (`/about` habla del proyecto, y la ficha ya lo dice); SC-023 Error (es un componente, no una ruta, y la ficha lo dice); SC-027 Catálogo (las tres rutas existen, "los huecos primero" no: listas sin priorizar, `(staff)/admin/universities/page.tsx:8-37`); SC-029 Frases (`/admin/items` existe; la cola de curaduría con Aprobar y Descartar que promete en sus líneas 15 y 16 no, y SC-036 línea 37 lo dice: "destilar publica en un solo paso") |
| No construida (10) | SC-009 La cola, SC-010 Pedir, SC-014 Mi situación (rebasada el 2026-08-25, con banner), SC-020 Responder, SC-022 Verificarme, SC-028 Correcciones, SC-030 Pedidos, SC-031 Reportes, SC-032 Verificaciones, SC-033 Equipo |

De los README: el de Sostener el catálogo describe la destilación con aprobación previa (línea 7) que SC-036 niega; el de Moderar sin romper el producto habla de "las dos colas que cada rol ve" (línea 44) que no existen; el de Cortar los accesos, del "equipo mínimo de cuatro" (línea 8) sin pantalla que lo sostenga. Las 13 rutas de alta y edición del backoffice (`/admin/universities/new`, `/admin/teachers/[id]/edit`, los períodos, las materias de un plan) cuelgan de la cascada que SC-027 describe y no tienen ficha propia, que es lo que el índice del producto decidió para ellas.

## Hallazgos

| ID | Hallazgo | Dónde | Estado |
|---|---|---|---|
| T01 | La cabecera de la tesis describe un código que ya no existe: "contiene la versión anterior (el planificador) en retiro", "estado de la poda", "lo que sigue es propagarla a los requisitos" (líneas 3 a 7). La poda entró; lo que queda de la versión anterior son dos roles del enum sin pantalla y tres campos de Mi perfil (Legajo, Año cursando, Estado) que ningún doc pide y [ADR-0086](../../decisions/0086-the-product-informs-it-does-not-track-your-degree.md) retira de espíritu. | `THESIS.md`, `UserRole.cs`, `my-profile-form.tsx` | Pendiente: decisión de Lucas, reescribir la cabecera y sacar o documentar los tres campos |
| T02 | La tesis, el glosario y las personas hablan en presente de lo que el producto todavía no hace: la modalidad y cuántas veces la cursaste en el contexto; el instrumento administrativo; la constancia; "qué materia frena a cuántas"; el plantel y las notas en la institución; el reproceso dicho en Método; la descarga; la respuesta del reseñado y el estado del canal; reportar sin cuenta; el año de salida por mail. Once afirmaciones, todas con su story en el Backlog salvo la modalidad y las veces, que ADR-0082 pide y ninguna story lleva. | `THESIS.md` (Qué recabamos 1, 3, 4; Qué publicamos 7, 8, 11, 12; Posición; A quién sirve), glosario, personas, garantías | Pendiente: decisión de Lucas, si la tesis queda normativa y el estado vive en el mapa, o si cada afirmación dice "hoy"; y si modalidad y veces son una story |
| T03 | El glosario dice que la tasa de finalización se publica "comparada con sus hermanas": ni ADR-0083 §6 ni la ficha la comparan. | `language.md`, Tasa de finalización | Pendiente: corregir el glosario |
| T04 | Tres errores de hecho en el glosario: "Commission" entre los agregados que se archivan (no existe, y la Desambiguación lo dice); la dispersión temporal como "cuántas se cargaron cuándo" cuando la ficha muestra el rango de períodos y la última fecha; el ejemplo `/reviews/write` para una pantalla que vive en `/reviews/new`. | `language.md`: archivar, Dispersión temporal, Nombre de pantalla | Pendiente: corregir el glosario |
| T05 | Cuatro fichas con el slug viejo: SC-008, SC-015 (que además dice que existe el editor de texto libre de la versión anterior), SC-018 y SC-021; el índice del producto repite el de SC-008. | `SC-008`, `SC-015`, `SC-018`, `SC-021`, `docs/product/README.md:83` | Pendiente: corregir las fichas y el índice |
| T06 | SC-029 Frases promete la cola de curaduría con Aprobar y Descartar, y SC-036 Curaduría dice que no existe: dos fichas de la misma épica se contradicen sobre el mismo mecanismo (S03, US-199). | `SC-029:15-16`, `SC-036:37`, README de Sostener el catálogo | Pendiente: decisión de Lucas, si SC-029 describe el destino o el presente |
| T07 | SC-031 declara su ruta en castellano, `/admin/moderacion/reportes`; la URL es código y va en inglés. | `SC-031:3` | Pendiente: corregir la ficha |
| T08 | SC-027 Catálogo describe "los huecos primero" (ordenar por lo que falta y por cuánta gente lo pidió) como si estuviera, y el backoffice lista sin priorizar. Es la story de Sofía (US-191), en el Backlog. | `SC-027`, `(staff)/admin/universities/page.tsx:8-37` | Pendiente: la ficha dice que es el destino, o US-191 entra a un sprint |
| T09 | Dos fichas de Método sobre el stage dicen cosas que el corpus de demostración ya no sostiene: el catálogo de frases lleva dos preguntas con sufijo aleatorio destiladas por los recorridos de Copas ("¿Encontraste la cátedra que buscabas en el catálogo? (RL94E)", "¿Avisaban los cambios de aula? (RAJWM)"). No es el papel, es el stage: es P02. | `/method` en el stage | Cerrado: lo resuelve el reset y seed (P02, [runbook](../../engineering/runbook.md) caso 7) |
