# US-179: No quedar expuesto por la réplica

> Los casos de [US-179](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Claudia Fernández escribe una respuesta al testimonio de Matías sobre Cátedra Pérez (2024, primer cuatrimestre, con las frases F18 "Hay clases que no se dan" y F05 "El final toma cosas que no se dieron" marcadas)
Cuando manda esa respuesta
Entonces corre el mismo chequeo previo que corre sobre cualquier comentario (ADR-0068 punto 5): si la respuesta habla de alguien fuera de su rol en la cátedra, queda retenida hasta que un humano la mire.

**E2.** Dado que el testimonio de Matías dice «El titular faltó todo mayo y después tomó todo igual. Los tres que cursamos a la noche lo hablamos con el coordinador y no pasó nada. El final fue sobre temas que nunca se dieron.», con "los tres que cursamos a la noche" marcada por el propio Matías como la parte que lo identifica
Cuando Claudia intenta mandar una respuesta que cita textualmente esa parte
Entonces el sistema se lo avisa antes de mandarla, y no la deja publicar así hasta que saque la cita.

**E3.** Dado que Claudia mandó su respuesta al testimonio de Matías
Cuando se le avisa a Matías por mail que va a salir una réplica
Entonces en Mis aportes a Matías se le muestra la fecha en la que se publica si no hace nada, con tres salidas disponibles: editar el testimonio, borrarlo o pedir revisión.

**E4.** Dado que Matías, dentro del plazo, borra su testimonio sobre Cátedra Pérez
Cuando llega la fecha en la que iba a publicarse la respuesta de Claudia
Entonces la respuesta de Claudia no se publica: ya no queda testimonio al que responder.

## Negativos

**N1.** Dado que el testimonio de Matías tiene "los tres que cursamos a la noche" marcada como parte identificante
Cuando Claudia intenta citarla en su respuesta
Entonces esa versión de la respuesta no se publica: se rechaza hasta que la reescriba sin la cita.

## Edge cases

- Matías no hace nada durante todo el plazo (ni edita, ni borra, ni pide revisión): al vencer, la respuesta de Claudia se publica normalmente (camino feliz de US-172).
- Matías pide revisión en vez de editar o borrar: qué resuelve exactamente esa opción no está definido. **Falta decidir** (abierto en la ficha de pantalla de Responder).
- Cuánto dura el plazo entre el aviso a Matías y la publicación: el número no está fijado en ninguna story de la épica. **Falta decidir** (abierto en el README de la épica y en la ficha de Responder).
- La identidad docente de Claudia vence (US-226) durante el plazo de retención, antes de que la respuesta se publique: qué pasa con esa respuesta pendiente. **Falta decidir**.
