# El catálogo de frases (semilla)

Las frases que el producto ofrece para marcar al reseñar una cursada o un evento institucional. Es **contenido editorial nuestro** y la decisión más visible del producto: el eje de cada frase es su atribución ([ADR-0065](../decisions/0065-attribution-is-the-axis-not-a-split.md)), el sujeto dice a qué ficha va ([ADR-0064](../decisions/0064-phrases-with-voices-not-scores.md)), y Método publica esta lista entera (US-130, US-183). Se edita en un solo lugar (Frases, en el backoffice: US-198); corregir un eje reprocesa las fichas. A estas semilla se suman las **destiladas** de los comentarios, aprobadas con sujeto y eje antes de ofrecerse (US-199), y marcadas como síntesis.

> **Estado (2026-08-18)**: borrador para decidir. El canvas traía 17 frases (marcadas "canvas"); las demás son propuestas, incluidas las cuatro familias materiales de la sesión del 2026-08-24 (costos, infraestructura, carga y vida, promesa) para cubrir lo que la tesis y las stories piden y el canvas no traía: los dos sentidos de cada aspecto (US-164), el trato y el acoso como cualquier frase, los eventos institucionales, el centro de estudiantes, y una frase ambigua partida en dos. Ninguna está aprobada hasta que Lucas lo diga.

## Las reglas del catálogo

1. **Cada frase tiene un sujeto y un eje**, y ninguno se pregunta: están en la redacción. Sujetos: **materia, cátedra, institución**: el sujeto dice a qué ficha va el dato, y esas son las fichas (la carrera no es sujeto: se deriva, ADR-0066; el mostrador y el centro de estudiantes son temas de la vivencia institucional). Ejes: exigencia (la carrera siendo dura: información) y gestión (alguien fallando o no fallando: alarma o su ausencia).
2. **El par es dato del catálogo** (columna Par): donde el aspecto tiene dos sentidos reales, cada frase nombra a su contraparte, y quien discrepa marca la del otro lado en vez de reportar (US-164). **Los dos lados de un par son excluyentes en una misma reseña**: marcar uno reemplaza al otro; es regla del dato, no del formulario. No todo aspecto tiene par: el acoso, la dificultad, el costo van solos (Par: ·), porque el otro lado no es un hecho que alguien afirme. Y no toda adyacencia es par: "El final es exigente" y "El final toma cosas que no se dieron" se marcan juntas si pasaron las dos.
3. **Ninguna frase admite dos lecturas.** "El final es otro nivel" se parte en una de exigencia y una de gestión.
4. **El catálogo no se balancea ni se hace simétrico.** Recolectar e informar son capas separadas ([ADR-0078](../decisions/0078-the-questionnaire-collects-in-pairs-the-ficha-reports-by-theme.md)): este documento define qué se puede marcar, y nada más. Qué información se deriva de las marcas y cómo se presenta es la spec de la ficha, que no lee este catálogo como layout. Por eso cuántas frases hay de cada lado no es una variable a cuidar acá. Esto **deroga el balance-por-eje** que pedía el modelo de cabecera dual, muerto en ADR-0078.
5. **Convivencia, trato y acoso entran como cualquier otra frase**, sin categoría aparte ([THESIS.md](../THESIS.md), "Qué recabamos").
6. **Se redactan como las dice la gente**, en primera persona del plural o impersonal, cortas, sin adjetivos que juzguen a la persona: hablan del acto. La prueba es el pasillo: si nadie lo diría así en un pasillo de facultad (suena a oficina, a informe o a literatura), se reescribe.

## Las frases

Cada frase tiene tres coordenadas ([ADR-0078](../decisions/0078-the-questionnaire-collects-in-pairs-the-ficha-reports-by-theme.md)): el **sujeto** (a qué ficha va), el **tema** (qué parte de la vivencia nombra) y el **eje** (su atribución: exigencia o gestión). Las tres son metadatos del dato recolectado, para la capa de información; no describen qué muestra ninguna pantalla. Sentido: **+** describe algo que funciona; **−** una falla o una carga. No toda frase tiene su opuesto: algunas van solas (el acoso, la dificultad, el costo) porque nadie afirma el otro lado; otras son pares reales. Procedencia: **canvas** (el mapa las traía) o **propuesta**.

| ID | Frase | Sujeto | Tema | Eje | Sentido | Par | Procedencia |
|---|---|---|---|---|---|---|---|
| F06 | El contenido está al día | materia | enseñanza | gestión | + | F07 | canvas |
| F07 | Contenido de hace diez años | materia | enseñanza | gestión | − | F06 | canvas |
| F02 | Se aprueba yendo a clase | materia | evaluación | exigencia | + | · | canvas |
| F04 | El final es exigente | materia | evaluación | exigencia | − | · | canvas ("El final es otro nivel", partida) |
| F05 | El final toma cosas que no se dieron | materia | evaluación | gestión | − | · | canvas ("El final es otro nivel", partida) |
| F08 | Se puede rendir libre y aprobar | materia | evaluación | gestión | + | F09 | propuesta |
| F09 | Nadie aprueba libre | materia | evaluación | gestión | − | F08 | propuesta (Lucas: "el nadie aprueba mi materia libre") |
| F01 | Es dura de verdad | materia | carga | exigencia | − | · | canvas |
| F03 | Es muchísimo contenido | materia | carga | exigencia | − | · | canvas |
| F10 | Las correlativas tienen sentido | materia | organización | gestión | + | F11 | propuesta |
| F11 | Las correlativas te traban | materia | organización | gestión | − | F10 | canvas |
| F47 | Los materiales cuestan un ojo | materia | costos | exigencia | − | · | propuesta (sin antagonista) |
| F59 | No se puede trabajar y cursarla | materia | carga y vida | exigencia | − | · | propuesta (sin antagonista; habla de la cursada que reseñás, no de "la carrera": la carrera no se marca, se deriva) |
| F60 | Hay comisiones en varios turnos | materia | carga y vida | gestión | + | F61 | propuesta (Lucas: turnos para poder trabajar) |
| F61 | Solo hay comisión en un horario | materia | carga y vida | gestión | − | F60 | propuesta |
| F12 | Explican bien | cátedra | enseñanza | gestión | + | F13 | canvas |
| F13 | No se entiende nada | cátedra | enseñanza | gestión | − | F12 | propuesta (el otro sentido de F12) |
| F14 | Están para las consultas | cátedra | enseñanza | gestión | + | F15 | canvas |
| F15 | No responden consultas | cátedra | enseñanza | gestión | − | F14 | propuesta |
| F16 | Te la estudiás solo | cátedra | enseñanza | gestión | − | · | canvas (la cátedra no enseña; no es la dificultad de la materia, que es F01) |
| F21 | Ponen la nota que merecés | cátedra | evaluación | gestión | + | F22 | propuesta |
| F22 | Nunca te ponen un 10 | cátedra | evaluación | gestión | − | F21 | propuesta (Lucas: "el no te pongo 10") |
| F23 | Corrigen con criterio claro | cátedra | evaluación | gestión | + | F24 | propuesta |
| F24 | Los criterios de corrección cambian | cátedra | evaluación | gestión | − | F23 | propuesta |
| F29 | Se puede promocionar | cátedra | evaluación | exigencia | + | · | propuesta |
| F28 | Exigen mucho, y se puede | cátedra | carga | exigencia | + | · | propuesta (la cátedra que exige: información, no defecto) |
| F17 | Las clases se dan | cátedra | cumplimiento | gestión | + | F18 | propuesta (el otro sentido de F18) |
| F18 | Hay clases que no se dan | cátedra | cumplimiento | gestión | − | F17 | canvas |
| F19 | El cronograma se cumple | cátedra | cumplimiento | gestión | + | F20 | canvas |
| F20 | El cronograma no se cumple | cátedra | cumplimiento | gestión | − | F19 | propuesta |
| F25 | Te tratan con respeto | cátedra | trato | gestión | + | F26 | propuesta |
| F26 | Hubo malos tratos | cátedra | trato | gestión | − | F25 | propuesta (convivencia y trato) |
| F27 | Hubo acoso | cátedra | trato | gestión | − | · | propuesta (entra como cualquier otra frase) |
| F62 | Las clases quedan grabadas | cátedra | carga y vida | gestión | + | F63 | propuesta |
| F63 | Si faltás una clase, la perdiste | cátedra | carga y vida | gestión | − | F62 | propuesta |
| F30 | El nivel académico es alto | institución | enseñanza | exigencia | + | · | canvas |
| F33 | Hubo mesas cuando correspondía | institución | cumplimiento | gestión | + | F34 | propuesta |
| F34 | Faltaron mesas de examen | institución | cumplimiento | gestión | − | F33 | propuesta (evento) |
| F48 | Los aranceles son claros y sin sorpresas | institución | costos | gestión | + | F49 | propuesta |
| F49 | Te cobran con costos ocultos | institución | costos | gestión | − | F48 | propuesta |
| F50 | Las becas llegan | institución | costos | gestión | + | F51 | propuesta |
| F51 | Las becas son promesa y no llegan | institución | costos | gestión | − | F50 | propuesta |
| F52 | Hay buenos espacios para estar y estudiar | institución | infraestructura | gestión | + | F53 | propuesta (biblioteca, SUM, bar, canchas, estacionamiento) |
| F53 | No hay dónde estar entre clases | institución | infraestructura | gestión | − | F52 | propuesta |
| F54 | Los baños dan asco | institución | infraestructura | gestión | − | · | propuesta (sin antagonista: lo más marcado en la vida real) |
| F55 | Los laboratorios tienen lo que la materia pide | institución | infraestructura | gestión | + | F56 | propuesta |
| F56 | Faltan laboratorios o equipos que la carrera necesita | institución | infraestructura | gestión | − | F55 | propuesta (lo académico sí puede faltar de verdad) |
| F57 | El wifi anda en toda la facultad | institución | infraestructura | gestión | + | F58 | propuesta |
| F58 | El wifi no llega ni a las aulas | institución | infraestructura | gestión | − | F57 | propuesta |
| F31 | El título tardó meses | institución | trámites | gestión | − | F32 | canvas (evento) |
| F32 | El título salió rápido | institución | trámites | gestión | + | F31 | propuesta (evento) |
| F35 | Conseguí vacante | institución | trámites | gestión | + | F36 | propuesta |
| F36 | No conseguí vacante | institución | trámites | gestión | − | F35 | propuesta (evento) |
| F39 | Las equivalencias salieron | institución | trámites | gestión | + | F40 | propuesta (evento) |
| F40 | Las equivalencias no avanzan | institución | trámites | gestión | − | F39 | propuesta (evento) |
| F37 | El sistema anda | institución | autogestión | gestión | + | F38 | propuesta |
| F38 | El sistema se cae cuando más se necesita | institución | autogestión | gestión | − | F37 | propuesta (evento) |
| F64 | Las prácticas profesionales existen de verdad | institución | promesa | gestión | + | F65 | propuesta |
| F65 | Las prácticas prometidas no aparecen | institución | promesa | gestión | − | F64 | propuesta |
| F66 | La bolsa de trabajo funciona | institución | promesa | gestión | + | F67 | propuesta |
| F67 | La bolsa de trabajo es humo | institución | promesa | gestión | − | F66 | propuesta |
| F41 | Te atienden bien | institución | trato | gestión | + | F44 | canvas |
| F44 | Te contestan mal o no te contestan | institución | trato | gestión | − | F41 | propuesta (Lucas: "administrativos maleducados/lentos") |
| F42 | Cada trámite es una pelea | institución | trámites | gestión | − | F43 | canvas |
| F43 | Los trámites salen rápido | institución | trámites | gestión | + | F42 | propuesta |
| F45 | El centro te ayuda con lo tuyo | institución | centro | gestión | + | F46 | propuesta |
| F46 | El centro solo hace política | institución | centro | gestión | − | F45 | propuesta (Lucas: "el centro de estudiantes que solo hace política") |

### Cobertura: qué combinaciones de sujeto y tema existen

Cuántas frases hay por sujeto (fila) y tema (columna). Un punto es un hueco: esa combinación no tiene frase todavía, y no siempre debe tenerla (los baños no son de una cátedra).

| Sujeto | enseñanza | evaluación | carga | organización | cumplimiento | trato | costos | carga y vida | infraestructura | trámites | autogestión | promesa | centro |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **materia** | 2 | 5 | 2 | 2 | · | · | 1 | 3 | · | · | · | · | · |
| **cátedra** | 5 | 5 | 1 | · | 4 | 3 | · | 2 | · | · | · | · | · |
| **institución** | 1 | · | · | · | 2 | · | 5 | · | 7 | 6 | 2 | 4 | · |
| **administración** | · | · | · | · | · | 2 | · | · | · | 2 | · | · | · |
| **centro** | · | · | · | · | · | · | · | · | · | · | · | · | 2 |

La carrera no aparece como sujeto: su ficha se **deriva** sumando las voces de sus materias ([ADR-0066](../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)). "Esta carrera es cara" se arma de los costos de sus materias e institución, no se marca directo.

## Lo que este catálogo todavía no resuelve

- **Cuántas ofrecer por vez.** Cuarenta y seis frases no se muestran todas al reseñar: la pantalla Reseñar ofrece las del sujeto que corresponde (la cursada ofrece materia, cátedra y lo de alrededor: administración, institución; el evento institucional queda para lo que pasa fuera de una cursada, con institución, administración y centro), y el orden y el corte son diseño de esa ficha de pantalla.
- **La materia como sujeto de gestión** (F05 a F11) habla de decisiones que toma la cátedra o el plan, no "la materia": el sujeto dice a qué ficha va, no quién falla ([ADR-0065](../decisions/0065-attribution-is-the-axis-not-a-split.md)).
- **Los sentidos + de institución** (F32, F33, F35, F37, F39) existen para que discrepar sea marcar y no reportar (US-164); si nadie los marca, no pesan.
- **El eje del costo inherente está sin cerrar a propósito** (F47, "los materiales cuestan un ojo"): no hay culpable (gestión no es) y exigencia está definida como dureza (ADR-0065). Clasificarla no cambia la recolección; se decide con la spec de la ficha, donde la atribución se vuelve lectura.
- **Los temas materiales de cátedra y materia están flacos** (ver la matriz de cobertura): costos y carga tienen frases de materia, pero la mayoría de lo material es institucional. Si la vivencia pide, por ejemplo, "esta cátedra te hace comprar su propio libro" (costo de cátedra), se agrega; la matriz muestra dónde.
