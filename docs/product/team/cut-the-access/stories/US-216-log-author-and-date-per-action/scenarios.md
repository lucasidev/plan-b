# US-216: Registrar quién hizo cada cosa

> Los casos de [US-216](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que la carrera Ingeniería en Sistemas de Información de UTN espera en Pedidos con 34 mails confirmados
Cuando Sofía (rol catálogo) la marca como cargada el 2026-08-21
Entonces la acción queda en el registro con autor "Sofía" y fecha "2026-08-21".

**E2.** Dado que la curaduría publicó una nota editorial en la ficha de Ingeniería en Sistemas de la UNT, leída de comentarios que no se publican
Cuando Nahuel (rol curaduría) la retira el 2026-08-21 porque una precisión la volvió inexacta
Entonces la acción queda en el registro con autor "Nahuel" y fecha "2026-08-21".

**E3.** Dado que Matías subió su certificado de alumno regular en Verificar
Cuando Camila (rol verificación) lo aprueba en Verificaciones el 2026-08-21
Entonces la acción queda en el registro con autor "Camila" y fecha "2026-08-21".

## Negativos

**N1.** Dado cualquier acción del equipo (marcar una carrera como cargada, publicar o retirar una nota editorial, resolver una constancia, verificar una identidad, editar el catálogo), cuando esa acción se guarda en el registro, entonces nunca queda sin autor ni sin fecha: no existe una fila de acción anónima.

## Edge cases

- Si el equipo creciera y hubiera dos personas con el mismo rol (un segundo catálogo, por ejemplo), cada fila del registro identifica a la persona, no solo el rol.
- Dos acciones sobre la misma fila en momentos distintos (Nahuel publica una nota editorial y más tarde la reescribe): si el registro guarda las dos acciones o solo la última no está decidido.
- El registro es interno del equipo: nadie fuera de él lo lee directo, salvo lo que sale agregado en US-218.
