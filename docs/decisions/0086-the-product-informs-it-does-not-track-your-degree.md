# ADR-0086: The product informs; it does not track your degree

- **Estado**: aceptado
- **Fecha**: 2026-08-29

## Contexto

La épica Mi carrera pedía que el alumno señalara materias en su plan para que el producto le filtrara la co-cursada a su caso (US-144) y para que pudiera volver a marcar lo que va a cursar (US-145). ADR-0069 (2026-08-18) resolvió cómo hacerlo sin romper la regla de que un hecho entra solo por la reseña: lo marcado sería **preferencia privada**, no dato.

La [revisión adversarial del 2026-08-29](../history/reviews/2026-08-29-my-career-epic.md) encontró dos problemas de forma en esa solución (los hallazgos C02 y C09: el filtro quedaba aproximado, y marcar en negativo le trasladaba al lector un costo que el ADR no declaraba) y propuso arreglarla marcando lo cursado en vez de lo que falta.

**Esa propuesta y la anterior estaban las dos mal, en el mismo nivel.** Las dos preguntan *cómo* darle al producto el estado de tu carrera, y la pregunta que faltaba es *si el producto debe saberlo*. La tesis contesta que no, en dos lugares:

- "No es un buscador de carreras, ni un ranking, **ni una app de gestión académica**" ([THESIS.md](../THESIS.md), "Qué es").
- "**No planifica tu cuatrimestre.** Eso se resuelve con una lapicera en quince minutos, y competir con la lapicera fue lo que volvió compleja la versión anterior. Le damos lo que la lapicera NO puede calcular" (THESIS.md, "Qué no hace").

Marcar el plan es seguimiento de carrera. Que sea privado y no se publique no lo convierte en información: lo convierte en una función de gestión que el producto guarda para vos. Es competir con la lapicera con otro nombre.

## Decisión

**El producto informa sobre materias, cátedras e instituciones. No sabe ni guarda por dónde va tu carrera.**

Tres consecuencias directas:

1. **No se marca el plan.** Ni lo que falta, ni lo cursado, ni lo que estás considerando. No hay pantalla donde declarar tu trayectoria, y no existe la "preferencia privada" como tipo de dato.
2. **La co-cursada se publica como cualquier otro conteo**, sin filtrar a nadie: por par de materias y período, cuántas cuentas reseñaron las dos y cuántas dejaron una, con el mismo piso de 10 que protege a cualquier agregado. Sale sola de las reseñas, que ya traen materia y período, y no le pide nada a nadie. Vive en las fichas públicas (carrera y materia).
3. **Filtrar es del lector.** Ve el dato de los pares que le interesan y decide con la cabeza, que es lo que ya hace con la lapicera.

Lo único que el producto sabe de vos sigue siendo lo que declaraste al reseñar, y solo entra por ahí.

## Alternativas consideradas

### A. Marcar lo que falta, como preferencia privada

Era la decisión de ADR-0069 y se aplicó hasta hoy. Descartada: resuelve el problema de no crear un hecho por fuera de la reseña, pero no el de fondo. Una pantalla donde declarás qué materias te faltan es seguimiento de carrera, y encima uno que no alcanza para resolver correlativas (no dice qué aprobaste), así que pedía el inventario sin poder cumplir lo que prometía.

### B. Marcar lo cursado, como preferencia privada

Fue la propuesta de la revisión (hallazgo C09) y llegó a escribirse. Descartada por lo mismo, y es el ejemplo más claro de por qué: era mejor que A en todo (más natural de declarar, resolvía correlativas de verdad, se podía marcar un año entero de una) y por eso mismo era peor. Una mejor forma de hacer seguimiento sigue siendo seguimiento, y cuanto mejor funcione, más se parece el producto a la app de gestión que la tesis dice no ser.

### C. Cancelar la co-cursada entera

Descartada. Era la salida simétrica ("si el seguimiento se va, que se vaya la épica"), pero confunde el dato con la pantalla que lo filtraba. "Cuántos llevaron juntas estas dos materias y cuántos dejaron una" es un conteo sobre materias, del mismo tipo que "de cada 10 que la cursan, llegan 4": no sabe quién sos, no guarda nada tuyo, y es exactamente lo que la lapicera no puede calcular.

### D. Pedir el historial académico

Descartada desde [ADR-0063](0063-the-product-is-a-pressure-instrument.md), y esta decisión explica por qué de raíz: el historial es la forma más completa del seguimiento. El módulo `enrollments` que todavía lo implementa se poda (hallazgo C01 de la revisión).

## Consecuencias

- **US-144 y US-145 se cancelan.** Existían solo para filtrar a tu caso y para marcar lo que vas a cursar. **US-143 sobrevive** y se muda entera a las fichas públicas de carrera y de materia.
- **La pantalla Mi carrera se cierra**, y con ella el onboarding "marcá por dónde vas": era su única razón de ser. La cuenta se crea en el Registro y desde ahí se lee y se reseña, sin ningún paso intermedio que pida trayectoria. [US-170](../product/guarantees/US-170-use-it-without-being-asked-for-anything-first/README.md) ("todo funciona sin plan marcado") pasa a ser trivialmente cierta: no hay plan que marcar.
- **`enrollments` se poda**, con su importador de PDF, su carga manual y sus pantallas. Era el seguimiento en su forma vieja, y ningún módulo lo consume.
- **El glosario** gana **co-cursada** con su definición, y pierde **marcar el plan**.
- **El modelo de datos no gana nada.** La co-cursada se calcula sobre `reviews`, que ya tiene cuenta, materia y período, y ya tiene el desenlace para saber quién dejó una.
- **Lo que se pierde**: alguien que quiera ver solo los pares que le sirven tiene que buscarlos. Es el costo aceptado, y es el mismo que el producto ya le pide para todo lo demás: no hay recomendaciones, hay datos.
