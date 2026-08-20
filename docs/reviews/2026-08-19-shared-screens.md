# Revisión adversarial: las catorce pantallas compartidas (2026-08-19)

> Registro de revisión ([índice](README.md)). **Alcance**: las 14 pantallas compartidas de `docs/design/screens/` (ficha y boceto de cada una) y sus filas del inventario; el cruce contra las pantallas propias que citan. Es la revisión que el [registro de las épicas](2026-08-19-epics-and-screens.md) del mismo día dejó declarada como pendiente. **Método**: dos revisores en contexto fresco con las mismas fuentes de aquella (tesis, ADR-0063 a 0070, D01-D10, glosario, catálogo de frases, personas) más aquel registro como canon (Wilson gobierna todo número; los datos de ejemplo canónicos); toda proporción verificada con python. **Aplicado** el 2026-08-19 (commit `docs(design): the shared screens survive their own review`).

La lección del lote: **los tres hallazgos graves son regresiones de lo que la revisión anterior ya había corregido**, porque los escritores corrieron en paralelo con los arregladores y copiaron del canon viejo (S1-01/S1-02/S1-03 reintroducen R1-01, R1-02 y R2-02; S2-01 reintroduce R3-02). Escribir y corregir el canon a la vez tiene este costo; la próxima tanda de pantallas se escribe sobre canon quieto.

Estados: **corregido**, **abierto** (registrado como pregunta abierta donde corresponde), **descartado** (con el porqué).

## S1 · Las públicas (Inicio, Explorar, Buscar, las tres fichas de lectura, Anonimato, Error)

| ID | Hallazgo | Estado |
|---|---|---|
| S1-01 | La Ficha de carrera publicaba proporciones crudas (la alternativa que ADR-0064 rechaza) | Corregido: formato canon, "k de 612 voces · encogido X% · en M materias" |
| S1-02 | La cohorte sumaba 100 (regresión de R1-02) y llamaba "voces" a personas | Corregido: cada proporción con su encogido; "personas" |
| S1-03 | Inicio y Ficha de materia repetían la cabecera vieja de Pérez (49%/68%: regresión de R2-02) | Corregido: 41%/61%, el canon |
| S1-04 | Frases sin voces ni período en la Ficha de carrera (regresión de R1-01) | Corregido con S1-01 |
| S1-05 | El ejemplo de "todavía no derivamos" de Explorar pasaba el gate (9 de 14 es más de la mitad) | Corregido: 6 de 14 |
| S1-06 | La Ficha de institución usaba un denominador distinto por frase, ninguno el declarado | Corregido: todas sobre las 1.340 voces del sujeto, con encogido |
| S1-07 | Botón "Reseñar esta carrera": la carrera no se reseña (tesis, ADR-0064 §8) | Corregido: "Reseñar una cursada" |
| S1-08 | Aprobación y abandono de cursada compartían denominador, y en voces (los votos no declaran cómo terminó) | Corregido: cada uno con su base de reseñas y su definición del glosario |
| S1-09 | "Sin resultados" de Buscar listaba causas de fichas que sí existen (y la búsqueda devolvería) | Corregido: quedan "no la cargamos" y el typo |
| S1-10 | La carrera y la materia contradecían el canon de Dónde estudiarla en la misma oferta (correlativas con y sin voces, conteos de materias, período) | Corregido: canon en todo |
| S1-11 | Datos de ejemplo pisándose entre bocetos (la Tecnicatura, Siglo 21 con y sin voces, el nombre local de UTN/UNT, la carrera fantasma de UTN) | Corregido: canon unificado |
| S1-12 | La columna de voces de instituciones mezclaba "como sujeto" con "sus cursadas" (ADR-0066: nunca un número que las mezcle) | Corregido: la columna es "como sujeto"; UTN dice que todavía no tiene |
| S1-13 | El inventario declaraba slugs que no existen en `frontend/src/app/` (`/careers`, `/careers/[id]`, `/universities/[slug]`) | Corregido: los slugs reales (`/careers/[id]/plans`, `/universities/[slug]/careers`) o "sin slug" |
| S1-14 | La serie y la comparación de la institución sin voces ni encogido (regresión de R2-03) | Corregido: tooltips y filas con voces y encogido |
| S1-15 | "Encogido de 51% a 48%" no daba con la fórmula | Corregido: 51% a 47%, verificado |
| S1-16 | "(c) Su cobertura" era el estado del catálogo, no la cobertura del glosario | Corregido: renombrado |
| S1-17 | Reciprocidad rota ficha↔inventario↔épica (Reseñar en institución, Deshacer en materia, Llevarse el dato en las tres de lectura) | Corregido en filas y blockquotes |
| S1-18 | La épica decía "Inicio no es de esta épica" y la listaba entre sus compartidas | Corregido: entra por la épica, la identidad visual se diseña aparte |
| S1-19 | "Titular: M. Pérez" en Buscar (y un resto en la Ficha de cátedra) contra el canon Claudia Fernández | Corregido en los dos |
| S1-20 | Explorar citaba O1-6 (la búsqueda) para la lente de universidades | Corregido: O2-1/O6-4 |

## S2 · El umbral y la cuenta (Ingresar, Registro, Recuperar, Mis aportes, Mi perfil, Verificar)

| ID | Hallazgo | Estado |
|---|---|---|
| S2-01 | Mi perfil hacía apagable el aviso de la réplica (regresión de R3-02: mata la protección P1) | Corregido: siempre prendido; tres apagables, el reenganche fijo hasta responder |
| S2-02 | Registro preguntaba la situación (cursé y dejé / me recibí) que jura no preguntar: un quinto camino que O4-8 no tiene | Corregido: pregunta quién sos (estudiante o docente); la situación va después, de a una |
| S2-03 | Mis aportes sumaba frases de materia y cátedra sobre el mismo denominador | Corregido: cada frase con su sujeto y su denominador |
| S2-04 | El mismo aporte estaba a la vez retenido y con réplica en plazo (sin testimonio publicado no hay réplica) | Corregido: son dos aportes distintos |
| S2-05 | Cátedra Pérez respondía por Base de Datos I (da Análisis Matemático II) | Corregido con S2-04 |
| S2-06 | Los hechos de trayectoria no tenían dónde borrarse desde Mis aportes (O5-2: se borran de a uno antes) | Corregido: cada hecho con su Corregir y su Borrar vía Editar, incluido el año de ingreso |
| S2-07 | La señal de verificado prometida en "tu ficha" (no existe) y en Mis aportes (no la tiene): lo abierto de T1-3 presentado como decidido | Corregido: la señal viaja con lo aportado; cómo se ve sin identificar a nadie sigue abierto |
| S2-08 | El boceto ofrecía "Ver la respuesta" antes de publicarse: una cuarta salida que ninguna fuente da | Corregido: tres salidas |
| S2-09 | Mis aportes decía "nunca" y "abierto" sobre los votos, y no mostraba las correcciones de datos que el glosario incluye | Corregido: los votos quedan solo abiertos; las correcciones aparecen |
| S2-10 | Verificar reabría la verificación por dominio de mail que ADR-0048 depreció ("nunca por el email") | Corregido: la pregunta abierta es qué documento sirve |
| S2-11 | Verificar reclamaba como propias las cuatro stories de la cola de Verificaciones | Corregido: las cita como el otro lado del mostrador; resuelve T1-3 y O7-8 |
| S2-12 | El boceto de Mi perfil decidía ("se corrige acá") lo que su ficha deja abierto | Corregido: sigue abierto |
| S2-13 | El inventario llamaba "Rol" a lo que el glosario reserva para otra cosa | Corregido: "quién sos (estudiante o docente)" |

## Lo que pasó limpio

Anonimato y Error enteros (la política dice lo que dicen ADR-0068, T2-1/T2-2/T2-4, O4-4, BO2-1 y BO6-1); las cuatro garantías de O6 en las ocho públicas (nada pide cuenta para leer, nada repregunta, nada depende del plan marcado, nada destacado ni ordenado por conveniencia); ningún puntaje, ranking ni nombre de autor; períodos siempre en forma larga; las frases textuales del catálogo con su eje; los slugs del umbral y de la cuenta verificados contra el código; Ingresar con el motivo y la vuelta; Recuperar como garantía sin story inventada.

## Deuda que queda explícita

- **Dejar escrita la respuesta a las cuatro preguntas de O6 en cada ficha** (hoy verificadas por esta revisión, no escritas ficha por ficha).
- **Retirar un voto** sigue abierto (Cuidar lo publicado) y Mis aportes lo hereda.
- El detalle de cada hallazgo (archivo:línea, citas de las dos fuentes) está en los reportes de los revisores de esta fecha; este registro guarda el qué y el estado.
