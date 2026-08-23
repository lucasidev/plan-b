# US-201: Corregir una oferta ya publicada

> Los casos de [US-201](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que "Ingeniería en Sistemas" (UNSTA) está publicada, y su correlativa dice "Análisis Matemático II pide Álgebra aprobada para cursar", cuando en realidad la facultad pide "regularizada".
Cuando Sofía corrige el campo a "Análisis Matemático II pide Álgebra regularizada para cursar" y guarda.
Entonces el dato queda corregido en la oferta publicada, sin necesidad de despublicarla.

**E2.** Dado el mismo caso de E1, y que 40 personas tienen esa correlativa marcada en Mi carrera.
Cuando Sofía guarda la corrección.
Entonces las 40 personas reciben el aviso de qué cambió: de "Álgebra aprobada" a "Álgebra regularizada" para cursar Análisis Matemático II.

## Negativos

**N1.** Dado que "Licenciatura en Nutrición" (USPT) todavía no está publicada, porque le faltan 2 correlativas, y por lo tanto nadie la tiene marcada en Mi carrera. Cuando Sofía edita una de esas correlativas antes de publicar. Entonces no sale ningún aviso: editar antes de publicar no es "corregir una oferta ya publicada", así que no hay a quién notificar todavía.

## Edge cases

- Un campo corregido que nadie tenía marcado: guardar el cambio no dispara ningún mail, pero el dato queda corregido igual.
- Dos correcciones directas sobre el mismo campo el mismo día: si cada guardado dispara su propio aviso o solo el último no está definido (Falta decidir).
- La corrección directa de Sofía en Catálogo y una corrección propuesta por un tercero en Correcciones (US-194) son dos caminos distintos para el mismo dato: cuál gana si coinciden en el tiempo no está definido (Falta decidir).
