# Escenarios de Cuidar lo publicado

> Traducción ejecutable del "listo cuando" de cada story, para escribir el test antes que el código. Los números salen de ADR-0075. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## US-188: Sumar una voz sin escribir

### Camino feliz

**E1.** Dado que Lucía reseñó Análisis Matemático II (Cátedra Fernández, UNSTA, período 2026-C1) marcando F18 (Hay clases que no se dan) y F01 (Es dura de verdad), con un comentario
Cuando Matías toca "a mí también me pasó" sobre el testimonio de Lucía
Entonces el voto es uno solo sobre toda la reseña, nunca sobre una frase suelta: suma la voz de Matías a F18 y a F01 a la vez, no a una sin la otra.

**E2.** Dado que antes del voto la cursada de Análisis Matemático II en 2026-C1 tiene 40 voces en total, F18 está en 12 de esas 40 (18,1%, ADR-0075), y Matías no había participado antes en esa cursada (ni la reseñó ni votó otra reseña de ella)
Cuando Matías vota el testimonio de Lucía
Entonces la cursada pasa a tener 41 voces y F18 pasa a 13 de 41 (19,6%): Matías se suma a la unión de frases que sostiene, que en este caso es la de Lucía.

**E3.** Dado que en la Ficha de cátedra los testimonios se ordenan por votos, el de Lucía tiene 2 y otro testimonio ya publicado en la misma ficha tiene 5
Cuando varias personas votan "a mí también me pasó" sobre el testimonio de Lucía hasta que llega a 6
Entonces el testimonio de Lucía pasa a ordenarse antes que el que tenía 5.

**E4.** Dado que Matías no inició sesión
Cuando toca "a mí también me pasó" sobre el testimonio de Lucía
Entonces el sistema lo lleva a Ingresar con el motivo "para votar esta reseña, necesitás una cuenta", y al ingresar vuelve a la ficha con el voto ya aplicado.

### Negativos

**N1.** Dado que Diego reseñó una cursada de Análisis Matemático II marcando frases pero sin escribir comentario (su reseña suma voz en los conteos, pero no aparece como testimonio), cuando alguien quiere votar "a mí también me pasó" sobre esa reseña, entonces no hay dónde: sin comentario la reseña no aparece como testimonio y hoy no tiene ninguna superficie que reciba el voto.
**Falta decidir**: dónde se vota una reseña sin comentario (README de la épica; US-188 no lo resuelve).

**N2.** Dado que Matías ya votó "a mí también me pasó" sobre el testimonio de Lucía, cuando vuelve a tocar el mismo botón sobre el mismo testimonio, entonces no suma una segunda voz: sigue siendo una sola voz de Matías en esa cursada (ADR-0075, punto 3).
**Falta decidir**: si el voto se puede retirar una vez puesto (README de la épica); esto solo cubre que repetirlo no duplica la voz.

### Edge cases

- Votar la propia reseña: ni US-188 ni ADR-0068 dicen si una cuenta puede confirmar su propio testimonio.
- Un testimonio se baja después de haber sido votado: el texto se retira, pero las frases que marcó y los votos que sumó siguen contando como voces, porque se baja el texto, nunca la voz (glosario, "Exposición").
- Votar un evento institucional (no una cursada): ADR-0068 y US-188 lo tratan igual que una reseña de cursada.

## US-189: Corregir un dato duro ahí mismo

### Camino feliz

**E1.** Dado que Valentina recién se creó una cuenta y todavía no escribió ninguna reseña, y la Ficha de materia de Análisis Matemático II (UNSTA, Ingeniería en Sistemas) muestra como correlativa "Álgebra" en vez de "Análisis Matemático I"
Cuando toca la fila de esa correlativa
Entonces se vuelve editable ahí mismo, sin pedirle ningún aporte previo (D07).

**E2.** Dado que Valentina propuso cambiar la correlativa de Análisis Matemático II de "Álgebra" a "Análisis Matemático I"
Cuando entra a Mis aportes
Entonces ve esa corrección listada ("corregiste la correlativa de Análisis Matemático II"), con el valor que propuso y marcada como todavía no aplicada: el sistema registró que fue ella quien la propuso.

### Negativos

**N1.** Dado que Valentina no inició sesión, cuando toca la fila de la correlativa de Análisis Matemático II para corregirla, entonces el sistema no le muestra ningún campo editable y la lleva a Ingresar con un motivo del tipo "para corregir este dato, necesitás una cuenta": corregir pide cuenta igual que votar.

**N2.** Dado que Valentina ya propuso el cambio de "Álgebra" a "Análisis Matemático I", cuando cualquiera lee la Ficha de materia de Análisis Matemático II en ese momento, entonces todavía ve "Álgebra": la ficha no cambia para nadie hasta que Sofía contrasta la corrección contra la fuente y la aplica (US-194, fuera de esta story).

### Edge cases

- Qué datos duros son editables inline y cuáles no (correlativas, duración nominal, nombre de cátedra) no está decidido (README de la épica y ficha de Correcciones).
- Dos cuentas proponen correcciones distintas para la misma fila antes de que se resuelva la primera: si la segunda se acumula o pisa a la primera no está decidido.
- Si Correcciones le muestra a Sofía qué cuenta propuso el cambio (para frenar abuso) o queda anónimo para ella no está decidido (ficha de Correcciones), aunque la propia cuenta sí ve su autoría en Mis aportes.

## US-190: Verificarme sin que sea obligatorio

### Camino feliz

**E1.** Dado que Matías reseñó la cursada de Análisis Matemático II (Cátedra Fernández, UNSTA) sin haberse verificado nunca
Cuando cualquiera lee su testimonio en la Ficha de cátedra
Entonces se publica igual que cualquier otro, sin ninguna marca de "pendiente de verificar" ni ningún bloqueo: aportar nunca pidió verificarse.

**E2.** Dado que Matías sube su certificado de alumno regular en Verificar y Camila lo aprueba en Verificaciones el 2026-08-21
Cuando Matías entra a Mi perfil
Entonces ve la señal de verificado con la fecha "2026-08-21".
**Falta decidir**: cómo se ve esa misma señal en la Ficha de cátedra, al lado de su testimonio, sin identificarlo (qué texto o ícono usa) no está resuelto (README de la épica).

**E3.** Dado que la frase F18 (Hay clases que no se dan) de Cátedra Fernández en Análisis Matemático II está en 12 de 40 voces (18,1%, ADR-0075), y una de esas 40 es la reseña de Matías, todavía sin verificar
Cuando Matías se verifica (sube su certificado y Camila lo aprueba)
Entonces la frase sigue en 12 de 40 voces (18,1%): la proporción no cambia, las voces se cuentan igual verificadas o no.

### Negativos

**N1.** Dado que Matías se verificó, cuando revisa si eso le habilitó algo que antes no podía hacer (responder, tener más votos, algo especial), entonces no encuentra nada nuevo: verificarse es señal, nunca permiso, a diferencia de la identidad docente o el cargo institucional, que sí habilitan Responder.

### Edge cases

- Cómo se ve la señal de verificado en la ficha pública sin identificar a nadie ("12 de 20 voces verificadas"? un ícono al lado del testimonio?) es una pregunta abierta, no una decisión (README de la épica).
- La constancia se rechaza por parecer adulterada: el motivo queda a la vista y Matías puede volver a intentarlo sin quedar marcado (US-211, cola de Verificaciones).
- Diego dejó la carrera hace tres años: puede reseñar igual, porque aportar no exige estar cursando, pero un certificado de alumno regular lo emite la universidad solo a quien sigue inscripto; si Diego puede verificarse sin estar cursando no está resuelto en ninguna fuente.
