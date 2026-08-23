# US-205: Bajar solo lo que expone a alguien

> Los casos de [US-205](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Matías reseña Análisis Matemático II, Cátedra Pérez, UNSTA, 2024, primer cuatrimestre, marca la frase F18 (Hay clases que no se dan, hoy en 12 de 40 voces, 18,1%, ADR-0075) y en su comentario deja el número de teléfono personal del ayudante Ibarra para que otros lo llamen directamente, y alguien reporta ese testimonio.
Cuando Nahuel abre el reporte en Reportes.
Entonces ve el motivo que dejó quien reportó y el criterio de exposición siempre a la vista arriba de la cola, y encuentra que lo que puede exponer ahí es al ayudante Ibarra (un tercero fuera de su acto público), no a Cátedra Pérez ni a UNSTA como institución.

**E2.** Dado que el testimonio de Matías sobre Cátedra Pérez tiene ese reporte pendiente de resolver.
Cuando pasan los días sin que Nahuel lo haya mirado todavía.
Entonces el testimonio sigue publicado igual, con F18 sumando sus 12 de 40 voces (18,1%) sin ningún cambio: reportado no es lo mismo que bajado, y solo el único caso de riesgo inmediato, con criterio escrito, se despublica antes de resolver.

**E3.** Dado que Nahuel revisa el reporte contra el testimonio de Matías y decide que el número de teléfono del ayudante Ibarra expone datos de contacto de un tercero.
Cuando confirma bajar ese texto.
Entonces tiene que elegir una categoría (por ejemplo "Datos de contacto", una de las que Método muestra agregadas en US-181) antes de poder bajarlo, y al confirmar se baja el comentario, nunca la voz: F18 sigue sumando la voz de Matías en sus 12 de 40 (18,1%).

## Negativos

**N1.** Dado que un reporte contra un testimonio de Prof. Paredes en Cátedra Paredes (Análisis Matemático II, UNSTA) dice que la cátedra entera es un desastre y que toda la facultad debería revisarla, sobre un testimonio que solo marca frases duras contra esa cátedra sin exponer a ninguna persona.
Cuando Nahuel lo revisa.
Entonces no lo baja: una queja dura contra la cátedra o la institución no es causal, aunque sea muy dura, porque la exposición protegida es la de quien aportó y la de terceros, nunca la del docente evaluado ni la de la institución.

**N2.** Dado que Nahuel decide bajar el comentario de Matías por exponer el teléfono del ayudante Ibarra.
Cuando intenta confirmar la baja sin elegir ninguna categoría.
Entonces el sistema no lo deja: bajar exige elegir la categoría antes de confirmar.

## Edge cases

- Un reporte llega contra un testimonio que Nahuel ya había bajado antes por otro reporte anterior: la story no dice qué hace la cola con un reporte sobre contenido ya bajado. **Falta decidir**.
- Prof. Paredes reporta su propio testimonio después de escribirlo, arrepentido de haber contado un dato que lo identifica: la story no distingue si reportar la propia reseña se trata distinto a reportar la de otro. **Falta decidir**.
- Matías se da de baja de su cuenta mientras su testimonio todavía tiene un reporte esperando en la cola: la Baja no frena la moderación (US-166), así que Nahuel sigue resolviendo el reporte igual, ahora sobre contenido de una cuenta ya anonimizada.
- El texto exacto del criterio escrito de riesgo inmediato, el único caso que despublica antes de resolver, todavía no está redactado (README de la épica). **Falta decidir**.
