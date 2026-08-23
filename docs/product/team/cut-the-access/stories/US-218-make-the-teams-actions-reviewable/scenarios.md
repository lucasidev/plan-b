# US-218: Revisar lo que hizo el equipo

> Los casos de [US-218](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que en agosto de 2026 Nahuel bajó 3 testimonios (2 por exposición de un tercero, 1 por publicar el contacto de una persona) y el chequeo previo retuvo 4 comentarios que nunca se publicaron
Cuando cualquiera entra al registro público en agregado (Equipo o Anonimato)
Entonces ve esos números por categoría (3 bajados: 2 exposición de terceros, 1 datos de contacto; 4 retenidos), sin ningún texto ni nombre.

**E2.** Dado que ese mismo registro público en agregado ya existe
Cuando la persona externa de la segunda capa lo lee, fuera del producto, por decisión de gobierno
Entonces lee el mismo agregado ya disociado: el producto no construye ningún acceso nuevo para ella.
**Falta decidir**: quién es esa persona externa, cómo se le da acceso y cada cuánto revisa el registro; es una decisión de gobierno, no un requisito del producto (README de la épica, US-218).

## Negativos

**N1.** Dado el registro público en agregado, cuando alguien lo lee, entonces nunca ve el texto del testimonio bajado, el motivo completo tal como lo escribió quien reportó, ni el nombre de quien escribió o de quien reportó: sale por categoría y en números, nunca en contenido.

## Edge cases

- Un mes sin ninguna baja ni retención: el registro público muestra el agregado en cero, la sección no desaparece.
- Si el agregado se publica en Equipo, en Anonimato, o en ambos, es una pregunta abierta en las dos fichas (README de la épica).
- "Se revisa cada tanto" no es una cadencia: cada cuánto se revisa el registro no está decidido (README de la épica).
