# US-218: Revisar lo que hizo el equipo

> Los casos de [US-218](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que en agosto de 2026 la curaduría publicó 2 notas editoriales y retiró 1, aprobó 3 frases destiladas y descartó 5, y resolvió 2 reclamos de instituciones sobre datos publicados (1 corrigió el catálogo, 1 se sostuvo)
Cuando cualquiera entra al registro público en agregado (Equipo o Anonimato)
Entonces ve esos números por categoría, sin ningún texto de campo libre ni nombre de quien reseñó.

**E2.** Dado que ese mismo registro público en agregado ya existe
Cuando la persona externa de la segunda capa lo lee, fuera del producto, por decisión de gobierno
Entonces lee el mismo agregado ya disociado: el producto no construye ningún acceso nuevo para ella.
**Falta decidir**: quién es esa persona externa, cómo se le da acceso y cada cuánto revisa el registro; es una decisión de gobierno, no un requisito del producto (README de la épica, US-218).

## Negativos

**N1.** Dado el registro público en agregado, cuando alguien lo lee, entonces nunca ve el texto del campo libre que la curaduría leyó, el reclamo completo tal como lo escribió la institución, ni el nombre de quien reseñó: sale por categoría y en números, nunca en contenido.

## Edge cases

- Un mes sin ninguna nota, ninguna frase destilada y ningún reclamo: el registro público muestra el agregado en cero, la sección no desaparece.
- Si el agregado se publica en Equipo, en Anonimato, o en ambos, es una pregunta abierta en las dos fichas (README de la épica).
- "Se revisa cada tanto" no es una cadencia: cada cuánto se revisa el registro no está decidido (README de la épica).
