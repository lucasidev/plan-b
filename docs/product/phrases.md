# El catálogo de ítems

Los ítems que el producto pregunta al reseñar una cursada, con sus opciones, y los instrumentos que los agrupan. Es **contenido editorial nuestro** y la decisión más visible del producto ([ADR-0082](../decisions/0082-the-review-captures-the-cursada-in-three-layers.md)): se pregunta conducta observable y vivencia en frecuencias gruesas, y la ficha publica sus conteos ([ADR-0083](../decisions/0083-the-ficha-publishes-counts-not-scores.md)). Se edita en un solo lugar (el backoffice: US-198); a estos ítems semilla se suman los **destilados** del campo libre, aprobados antes de ofrecerse (US-199). El archivo conserva su nombre histórico (`phrases.md`) hasta la propagación completa.

> **Estado (2026-08-25)**: catálogo rehecho al modelo de tres capas y aprobado en boceto. Cada ítem tendrá su código estable al cargarse a la base (issue #357); si un ítem cambia de significado, es un código nuevo y su serie se corta.

## Las reglas

1. **Cada ítem nace de una inquietud real**: algo que un estudiante quiere saber antes de meterse, o quiere contar al salir. Si no traza a eso, no entra.
2. **Se pregunta lo que la memoria puede responder**: frecuencias y estados gruesos ("casi nunca", "faltaron muchas"), jamás conteos finos (días exactos, cantidad de fechas). La precisión que el recuerdo no tiene produce datos que parecen duros y son ruido.
3. **Conducta observable y vivencia van separadas** y no se suman: lo que cualquiera en el aula vio, y lo que te pasó a vos.
4. **El contexto no se publica**: controla el sesgo de lectura y alimenta solo agregados (la tasa de finalización, los intentos).
5. **Saltear siempre vale**: quien saltea no cuenta en el denominador de ese ítem. Nada es obligatorio.
6. **La prueba es el pasillo**: si nadie lo contaría así en un pasillo de facultad, se reescribe.
7. **La opción negativa está escrita de antemano**: es la única que carga el rojo en la ficha, y el badge de la moda repite la opción literal, nunca una etiqueta nuestra.

## La reseña de una cursada

### Capa de contexto (no se publica)

| Ítem | Opciones |
|---|---|
| ¿Cuándo la cursaste? | período (chips de los últimos, y "otro") |
| ¿Con qué cátedra? | las cátedras de la materia · No sé |
| ¿Cómo cursaste? | Presencial · A distancia · Mezcla |
| ¿Cómo terminó? | La aprobé · Me quedó regular · La recursé · La dejé |
| ¿Cuántas veces la cursaste, contando esta? | Una · Dos · Tres o más |

### Qué hizo la cátedra (conducta observable)

| Ítem | Opciones (la negativa, en negrita) |
|---|---|
| ¿Contestaba las preguntas que le hacían en clase? | Siempre · A veces · **Casi nunca** · Nadie preguntaba |
| ¿Se dictaron las clases? | Casi todas · Faltaron algunas · **Faltaron muchas** |
| ¿El práctico daba lo mismo que el teórico? | Sí · Había diferencias · **Eran dos materias distintas** |
| ¿Respondía consultas fuera de clase? | Sí · A veces · **No había forma** |
| ¿Avisó la fecha del parcial con anticipación? | Más de 2 semanas · 1 a 2 semanas · Menos de una semana · **Nos enteramos de casualidad** |
| ¿Entregó el programa al inicio? | Sí · Tarde · **Nunca lo vi** |
| ¿Tomó temas que no estaban en el programa? | No · Alguno · **Varios** |

### Qué te pasó a vos (vivencia)

| Ítem | Opciones |
|---|---|
| ¿Salías de la clase entendiendo el tema? | Casi siempre · A veces · **Casi nunca** |
| ¿El material alcanzaba para preparar el parcial? | Sí · Había que buscar por afuera · **No servía** |
| ¿Pudiste seguir el ritmo? | Sí · Con esfuerzo · **Me quedé atrás** |
| ¿Sentías que podías preguntar sin quedar mal? | Sí · Depende del día · **No** |

### El campo libre (no se publica)

Uno solo, al final: **"¿Algo que no te preguntamos y deberíamos?"**. La pantalla dice para qué sirve y que no se publica. Alimenta a la curaduría: destilación de ítems nuevos y notas editoriales sin nombres ([ADR-0084](../decisions/0084-free-text-feeds-curation-and-is-never-published.md)).

## El instrumento administrativo (semilla, por curar)

Preguntas cortas con disparador propio (el perfil, re-preguntado con el tiempo), que solo cuentan ancladas a cuentas con al menos una cursada reseñada ([ADR-0085](../decisions/0085-three-instruments-and-official-data.md)). Semilla propuesta, pendiente de su propia pasada de curaduría:

| Ítem | Opciones |
|---|---|
| ¿Tu último trámite salió sin pelearla? | Sí · Costó pero salió · **Sigue trabado** · No hice trámites |
| ¿El sistema de autogestión anda cuando lo necesitás? | Sí · A veces · **Se cae justo cuando más se necesita** |
| ¿Las instalaciones que usás están en condiciones? | Sí · Más o menos · **Venidas abajo** |
| ¿Las becas llegan? | Sí · Tarde · **Son promesa y no llegan** · No apliqué |
| ¿Te sentís seguro en el edificio y la zona? | Sí · Depende del horario · **No** |

## El relevamiento oficial (lo hace el equipo)

No se le pregunta a nadie: se verifica contra fuente pública, con fecha y fuente por fila, y "Ver fuentes" en la ficha ([ADR-0085](../decisions/0085-three-instruments-and-official-data.md)). El checklist editorial semilla: actas del órgano de gobierno publicadas; presupuesto ejecutado publicado; nómina docente con condición de cargo; proporción de cargos interinos; acreditaciones al día; y los datos de carrera (duración real, egreso por cohorte, plan vigente, régimen de ingreso) de la serie SPU/CONEAU.

## Lo que este catálogo todavía no resuelve

- **El maltrato y el acoso**: cómo entra al instrumento (ítem directo, campo propio, o solo por el campo libre hacia la curaduría) sigue siendo decisión abierta de producto. Hasta decidirse, el campo libre recibe lo que alguien quiera contar, y no se publica.
- **La segunda curaduría del administrativo**: la semilla de arriba no pasó por la pasada de inquietudes reales que sí pasó la de cursada.
- **La carga a la base** (issue #357) asigna códigos estables y versiona el instrumento; este documento queda como fuente editorial y espeja lo cargado.
