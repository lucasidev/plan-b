# El catálogo de frases (semilla)

Las frases que el producto ofrece para marcar al reseñar una cursada o un evento institucional. Es **contenido editorial nuestro** y la decisión más visible del producto: el eje de cada frase es su atribución ([ADR-0065](../decisions/0065-attribution-is-the-axis-not-a-split.md)), el sujeto dice a qué ficha va ([ADR-0064](../decisions/0064-phrases-with-voices-not-scores.md)), y Método publica esta lista entera (US-130, US-183). Se edita en un solo lugar (Frases, en el backoffice: US-198); corregir un eje reprocesa las fichas. A estas semilla se suman las **destiladas** de los comentarios, aprobadas con sujeto y eje antes de ofrecerse (US-199), y marcadas como síntesis.

> **Estado (2026-08-18)**: borrador para decidir. El canvas traía 17 frases (marcadas "canvas"); las demás son propuestas para cubrir lo que la tesis y las stories piden y el canvas no traía: los dos sentidos de cada aspecto (US-164), el trato y el acoso como cualquier frase, los eventos institucionales, el centro de estudiantes, y una frase ambigua partida en dos. Ninguna está aprobada hasta que Lucas lo diga.

## Las reglas del catálogo

1. **Cada frase tiene un sujeto y un eje**, y ninguno se pregunta: están en la redacción. Sujetos: materia, cátedra, institución, administración, centro de estudiantes (lista abierta). Ejes: exigencia (la carrera siendo dura: información) y gestión (alguien fallando o no fallando: alarma o su ausencia).
2. **Cada aspecto tiene sus dos sentidos** (US-164): quien discrepa marca la frase del otro lado; cada una publica su propia proporción y ninguna resta de la otra.
3. **Ninguna frase admite dos lecturas.** "El final es otro nivel" se parte en una de exigencia y una de gestión.
4. **El catálogo se mantiene balanceado por eje** dentro de cada sujeto: la proporción de personas por eje es sensible a cuántas frases hay de cada lado ([ADR-0065](../decisions/0065-attribution-is-the-axis-not-a-split.md), riesgo aceptado).
5. **Convivencia, trato y acoso entran como cualquier otra frase**, sin categoría aparte ([THESIS.md](../THESIS.md), "Qué recabamos").
6. **Se redactan como las dice la gente**, en primera persona del plural o impersonal, cortas, sin adjetivos que juzguen a la persona: hablan del acto.

## Las frases

Sentido: **+** describe algo que funciona; **−** describe una falla o una carga. Procedencia: **canvas** (el mapa las traía) o **propuesta**.

### Materia (la materia como contenido y exigencia)

| ID | Frase | Eje | Sentido | Procedencia |
|---|---|---|---|---|
| F01 | Es dura de verdad | exigencia | − | canvas |
| F02 | Se aprueba yendo a clase | exigencia | + | canvas |
| F03 | Es muchísimo contenido | exigencia | − | canvas |
| F04 | El final es exigente | exigencia | − | canvas ("El final es otro nivel", partida) |
| F05 | El final toma cosas que no se dieron | gestión | − | canvas ("El final es otro nivel", partida) |
| F06 | El contenido está al día | gestión | + | canvas |
| F07 | Contenido de hace diez años | gestión | − | canvas |
| F08 | Se puede rendir libre y aprobar | gestión | + | propuesta |
| F09 | Nadie aprueba libre | gestión | − | propuesta (Lucas: "el nadie aprueba mi materia libre") |
| F10 | Las correlativas tienen sentido | gestión | + | propuesta |
| F11 | Las correlativas te traban | gestión | − | canvas |

### Cátedra (el equipo docente a cargo)

| ID | Frase | Eje | Sentido | Procedencia |
|---|---|---|---|---|
| F12 | Explican bien | gestión | + | canvas |
| F13 | No se entiende nada | gestión | − | propuesta (el otro sentido de F12) |
| F14 | Están para las consultas | gestión | + | canvas |
| F15 | No responden consultas | gestión | − | propuesta |
| F16 | Te la estudiás solo | gestión | − | canvas (la cátedra no enseña; no es la dificultad de la materia, que es F01) |
| F17 | Las clases se dan | gestión | + | propuesta (el otro sentido de F18) |
| F18 | Hay clases que no se dan | gestión | − | canvas |
| F19 | El cronograma se cumple | gestión | + | canvas |
| F20 | El cronograma no se cumple | gestión | − | propuesta |
| F21 | Ponen la nota que merecés | gestión | + | propuesta |
| F22 | Tiene un techo de nota | gestión | − | propuesta (Lucas: "el no te pongo 10") |
| F23 | Corrigen con criterio claro | gestión | + | propuesta |
| F24 | Los criterios de corrección cambian | gestión | − | propuesta |
| F25 | Te tratan con respeto | gestión | + | propuesta |
| F26 | Hubo malos tratos | gestión | − | propuesta (convivencia y trato) |
| F27 | Hubo acoso | gestión | − | propuesta (entra como cualquier otra frase) |
| F28 | Exigen mucho, y se puede | exigencia | + | propuesta (la cátedra que exige: información, no defecto) |
| F29 | Se puede promocionar | exigencia | + | propuesta |

### Institución (la que da la carrera)

| ID | Frase | Eje | Sentido | Procedencia |
|---|---|---|---|---|
| F30 | El nivel académico es alto | exigencia | + | canvas |
| F31 | El título tardó meses | gestión | − | canvas (evento) |
| F32 | El título salió en tiempo | gestión | + | propuesta (evento) |
| F33 | Hubo mesas cuando correspondía | gestión | + | propuesta |
| F34 | Faltaron mesas de examen | gestión | − | propuesta (evento) |
| F35 | Conseguí vacante | gestión | + | propuesta |
| F36 | No conseguí vacante | gestión | − | propuesta (evento) |
| F37 | El sistema anda | gestión | + | propuesta |
| F38 | El sistema se cae cuando más se necesita | gestión | − | propuesta (evento) |
| F39 | Las equivalencias salieron | gestión | + | propuesta (evento) |
| F40 | Las equivalencias no avanzan | gestión | − | propuesta (evento) |

### Administración (el mostrador, los trámites)

| ID | Frase | Eje | Sentido | Procedencia |
|---|---|---|---|---|
| F41 | Te tratan como una persona | gestión | + | canvas |
| F42 | Cada trámite es una pelea | gestión | − | canvas |
| F43 | Los trámites salen rápido | gestión | + | propuesta |
| F44 | Te contestan mal o no te contestan | gestión | − | propuesta (Lucas: "administrativos maleducados/lentos") |

### Centro de estudiantes

| ID | Frase | Eje | Sentido | Procedencia |
|---|---|---|---|---|
| F45 | El centro te ayuda con lo tuyo | gestión | + | propuesta |
| F46 | El centro solo hace política | gestión | − | propuesta (Lucas: "el centro de estudiantes que solo hace política") |

## Lo que este catálogo todavía no resuelve

- **Cuántas ofrecer por vez.** Cuarenta y seis frases no se muestran todas al reseñar: la pantalla Reseñar ofrece las del sujeto que corresponde (la cursada ofrece materia, cátedra y lo de alrededor: administración, institución; el evento institucional queda para lo que pasa fuera de una cursada, con institución, administración y centro), y el orden y el corte son diseño de esa ficha de pantalla.
- **La materia como sujeto de gestión** (F05 a F11) habla de decisiones que toma la cátedra o el plan, no "la materia": el sujeto dice a qué ficha va, no quién falla ([ADR-0065](../decisions/0065-attribution-is-the-axis-not-a-split.md)).
- **Los sentidos + de institución** (F32, F33, F35, F37, F39) existen para que discrepar sea marcar y no reportar (US-164); si nadie los marca, no pesan.
- **La tercera coordenada está por asignar** ([ADR-0078](../decisions/0078-the-questionnaire-collects-in-pairs-the-ficha-reports-by-theme.md)): cada frase debe llevar su **tema** además del sujeto y el eje, y el cuestionario las ofrece en pares por tema. Pendiente de la sesión de curaduría: asignar tema a las 46, poblar las familias hoy vacías (**economía, infraestructura, carga y vida, promesa contra realidad**) y sostener el presupuesto de 6 a 10 hechos por tema. Las frases las escribe el equipo en sesión, no se delegan.
