# ADR-0085: Three instruments and official data

- **Estado**: aceptado (2026-08-25)
- **Fecha**: 2026-08-25

## Contexto

La vivencia institucional (trámites, becas, infraestructura, seguridad) no vive en ninguna cursada: el que pide el certificado analítico no está cursando nada, y el egresado que espera su título ya no cursa. A la vez, permitir reseñar "la universidad" directo es abrir la puerta al bombeo: opinión flotante, barata de fabricar, imposible de auditar. Y hay una tercera familia de datos que nadie tiene que opinar porque son públicos: duración real de la carrera, egreso por cohorte, acreditaciones, actas, presupuesto.

La opinión sobre la carrera y la universidad además cambia con el tiempo a medida que se cursa: un dato institucional respondido una vez no puede contar para siempre.

## Decisión

**Tres instrumentos, cada uno con su fuente y su disparador.**

1. **La reseña de cursada** (ADR-0082): el único acto de reseña sobre lo académico. La cátedra es el sujeto directo; materia, carrera e institución se derivan hacia arriba, siempre condicionadas a cobertura. A nivel materia el indicador es la dispersión entre cátedras ("depende de cuál te toque"); a nivel carrera, la estructura (cuellos de botella con el grafo de correlativas, cobertura), nunca el promedio.
2. **El instrumento administrativo**: preguntas cortas de trámites, infraestructura y becas, con disparador propio (el perfil, re-preguntado con el tiempo, o el evento puntual), y con anclaje: **solo cuenta lo respondido por cuentas con al menos una cursada reseñada**. El que no puso el cuerpo en una cursada no mueve ningún número.
3. **El relevamiento oficial**: transparencia verificada contra fuente pública (SPU, CONEAU, AGN, sitio institucional): actas publicadas, presupuesto ejecutado, nómina docente con condición de cargo, acreditaciones. Es trabajo editorial nuestro, con fecha y fuente por fila, y "Ver fuentes" en la ficha.

Completan la decisión:

- **La unidad académica (facultad) entra como nivel del modelo**: las carreras cuelgan de ella y los datos administrativos aterrizan ahí cuando corresponde.
- **La institución no tiene puntaje**: su ficha es la navegación de su plantel, su transparencia relevada, las notas de curaduría (ADR-0084) y su cobertura.
- **El comparador de una carrera entre instituciones existe** y es legítimo porque compara **datos oficiales medidos igual para todas** (duración real, egreso, plan, régimen de ingreso: el ingreso al lado del egreso, porque un 34 % con examen de admisión no se lee igual que un 14 % irrestricto). Las señales de reseñas van cada una en su caja y no se cruzan entre instituciones; donde no se llega al piso, silencio honesto ("7 reseñas. No alcanza").

## Alternativas consideradas

**Reseñar la institución directamente.** Bombeable por marketing institucional o por partidarios; sin ancla verificable.

**Un solo instrumento con todo dentro de la reseña de cursada.** Alarga el flujo, mezcla ámbitos que no se viven juntos, y deja afuera al egresado (su título es de los datos más valiosos).

**Agregar carrera → universidad en un número.** Agrega Medicina con Filosofía: no describe nada.

**Preguntas institucionales de una sola vez para siempre.** Envejecen: la respuesta de 2024 sobre el wifi no puede contar en 2026.

## Consecuencias

- El modelo `academic` gana la unidad académica; el perfil gana el instrumento administrativo con su anclaje y su re-pregunta.
- La transparencia relevada necesita su propia tabla (afirmación, estado, fuente, fecha) y su proceso editorial recurrente: viable a mano para una institución, pipeline propio si escala.
- La ficha de institución y el comparador quedan especificados por esta decisión; ninguna ficha compara señales de reseñas entre instituciones.
- El cruce de nuestras series con las oficiales (capa 4 de ADR-0083) queda habilitado como validación externa del instrumento.
