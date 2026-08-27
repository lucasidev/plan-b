# US-189: Corregir un dato duro ahí mismo

> Los casos de [US-189](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Valentina recién se creó una cuenta y todavía no escribió ninguna reseña, y la Ficha de materia de Análisis Matemático II (UNSTA, Ingeniería en Sistemas) muestra como correlativa "Álgebra" en vez de "Análisis Matemático I"
Cuando toca la fila de esa correlativa
Entonces se vuelve editable ahí mismo, sin pedirle ningún aporte previo (D07).

**E2.** Dado que Valentina propuso cambiar la correlativa de Análisis Matemático II de "Álgebra" a "Análisis Matemático I"
Cuando entra a Mis aportes
Entonces ve esa corrección listada ("corregiste la correlativa de Análisis Matemático II"), con el valor que propuso y marcada como todavía no aplicada: el sistema registró que fue ella quien la propuso.

## Negativos

**N1.** Dado que Valentina no inició sesión, cuando toca la fila de la correlativa de Análisis Matemático II para corregirla, entonces el sistema no le muestra ningún campo editable y la lleva a Ingresar con un motivo del tipo "para corregir este dato, necesitás una cuenta": corregir pide cuenta igual que reseñar.

**N2.** Dado que Valentina ya propuso el cambio de "Álgebra" a "Análisis Matemático I", cuando cualquiera lee la Ficha de materia de Análisis Matemático II en ese momento, entonces todavía ve "Álgebra": la ficha no cambia para nadie hasta que Sofía contrasta la corrección contra la fuente y la aplica (US-194, fuera de esta story).

## Edge cases

- Qué datos duros son editables inline y cuáles no (correlativas, duración nominal, nombre de cátedra) no está decidido (README de la épica y ficha de Correcciones).
- Dos cuentas proponen correcciones distintas para la misma fila antes de que se resuelva la primera: si la segunda se acumula o pisa a la primera no está decidido.
- Si Correcciones le muestra a Sofía qué cuenta propuso el cambio (para frenar abuso) o queda anónimo para ella no está decidido (ficha de Correcciones), aunque la propia cuenta sí ve su autoría en Mis aportes.
