# ADR-0080: Numbers publish without floor and series declare their breaks

- **Estado**: aceptado (2026-08-24)
- **Fecha**: 2026-08-24
- **Cierra**: la decisión abierta de [ADR-0078](0078-the-questionnaire-collects-in-pairs-the-ficha-reports-by-theme.md) (política de muestra chica) y el hueco de comparabilidad que la auditoría del 2026-08-24 encontró en la prevalencia por tema

## Contexto

ADR-0078 dejó una decisión abierta que gateaba la spec de la ficha: qué pasa con los números cuando los sostienen pocas voces (supresión, sin piso, o híbrida). Y la auditoría adversarial del mismo día encontró un segundo hueco: la prevalencia por tema ("cuántas voces marcaron al menos un hecho del tema") depende mecánicamente de cuánto vocabulario ofrece el tema, así que **cuando el catálogo de un tema cambia, su serie deja de ser comparable** sin que la vivencia haya cambiado. Ninguna fórmula del método podía escribirse completa sin cerrar los dos.

## Decisión

**1. Sin piso, confirmando la tesis.** Todo número se publica desde la primera voz, como "X de N voces", encogido por el límite inferior de Wilson (z = 1,96, [ADR-0075](0075-the-published-proportion-has-a-z-a-denominator-and-one-voice-per-cursada.md)) y con sus voces a la vista. Vale para los hechos, las prevalencias, el retrato y los derivados. La defensa contra la muestra chica es el encogimiento, no un umbral: 3 marcas de 3 publican 43,8%, no 100%; 2 de 3 publican 20,8%. El costo de exposición en grupo chico la tesis ya lo asume por escrito ("la sospecha existe y no es nuestra para eliminar; es el precio de reclamar, y se le dice al que reseña antes de publicar").

**2. Las series declaran sus rupturas.** Cuando el vocabulario de un tema cambia (alta o baja de hechos en el catálogo), la serie de prevalencia de ese tema marca un **corte visible** en el punto del cambio; los tramos a cada lado del corte **no se comparan** entre sí, y el período en que cayó el cambio se parte en dos puntos (antes y después), cada uno con sus voces y su encogimiento. Es la práctica de las series estadísticas oficiales ante cambios metodológicos: no se esconde el cambio ni se empalma, se declara. Las series **por hecho** no necesitan ruptura: cada hecho ya tiene su ventana de disponibilidad ([ADR-0075](0075-the-published-proportion-has-a-z-a-denominator-and-one-voice-per-cursada.md)).

Las dos reglas se publican en el método, con las demás fórmulas.

## Alternativas consideradas

**A. Supresión con umbral** (nada se muestra bajo N voces). Rechazada: contradice frontalmente el punto 9 de la tesis ("no hay piso; nada se desbloquea por escalones"), que es posición tomada, no accidente. Además crea el efecto escalón que la tesis quiso evitar: el dato aparece de golpe y parece premio.

**B. Híbrida: hechos sin piso, síntesis con gate estructural** (el retrato espera que el tema tenga más de un hecho con voces). Rechazada hoy por YAGNI: Wilson ya ordena razonablemente el retrato con muestras mixtas. Queda nombrada como salida si el retrato en producción muestra patologías de muestra chica que el encogimiento no corrija.

**C. Cohortes de composición** (comparar solo voces que vieron el mismo catálogo del tema). Rechazada: es lo estadísticamente más fino, pero el costo de computarlo y sobre todo de **explicarlo** en un método que cualquier estudiante debe poder leer no se justifica frente a la ruptura declarada, que resuelve el mismo problema con una regla de una línea.

**D. Sin serie de prevalencia** (solo el valor puntual del período actual). Rechazada: la serie es central al instrumento de presión ("empeora/mejora" es lo que una mesa de discusión necesita), y matarla por un problema que la ruptura declarada resuelve es tirar valor.

## Consecuencias

- La spec de la ficha pierde su última compuerta de medición: sin piso, con rupturas declaradas, y las fórmulas de [ADR-0075](0075-the-published-proportion-has-a-z-a-denominator-and-one-voice-per-cursada.md), el método se puede escribir completo.
- El punto 11 de la tesis (las series) gana la ruptura declarada; el punto 9 (sin piso) queda confirmado tal como está.
- [ADR-0078](0078-the-questionnaire-collects-in-pairs-the-ficha-reports-by-theme.md) cierra su decisión abierta.
- El catálogo gana una consecuencia operativa: **editar el vocabulario de un tema tiene costo público** (una ruptura visible en su serie). La curaduría deja de ser gratis, que es correcto: obliga a agrupar cambios en vez de gotearlos.
