# US-158: Avisar si el comentario me delata

> Los casos de [US-158](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Matías escribe en su comentario "los tres que cursamos con Pérez en el turno noche vamos a reclamar juntos".
Cuando llega al paso 6 y corre el chequeo previo, antes de publicar.
Entonces el sistema resalta esa parte como algo que puede identificarlo por contexto, y Matías decide dejarla, sabiendo que la réplica no va a poder citar esa parte.

**E2.** Dado que Lucía escribe en su comentario que el titular de la cátedra es alcohólico y que se nota en las clases (habla de la persona fuera de su acto público: salud).
Cuando corre el chequeo previo.
Entonces ese comentario queda retenido hasta que alguien del equipo lo mire, y a Lucía se le dice que quedó retenido.

## Negativos

**N1.** Dado que Matías escribe en su comentario que el titular lo acosó (un acto hacia alumnos, dentro de su rol docente), Cuando corre el chequeo previo, Entonces NO queda retenido: se publica al instante, porque describe un acto público del docente y no su vida privada.

## Edge cases

- Comentario sin nada que identifique por contexto ni hable de un tercero: el chequeo previo lo deja pasar directo a publicar.
- Si se edita después un comentario ya publicado, el chequeo previo vuelve a correr solo si el texto cambió; si no se tocó, no vuelve a pasar por ahí.
- Falta decidir: qué hace el chequeo previo con un comentario que identifica a un tercero alumno, ni el autor ni un docente.
