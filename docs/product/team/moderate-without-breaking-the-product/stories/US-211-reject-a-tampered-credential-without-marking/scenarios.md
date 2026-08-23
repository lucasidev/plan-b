# US-211: Detectar una constancia adulterada

> Los casos de [US-211](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Matías sube en Verificar una constancia de alumno regular cuyo formato no corresponde al que emite UNSTA.
Cuando Camila la revisa en Verificaciones y decide rechazarla.
Entonces tiene que escribir un motivo, por ejemplo "el formato no corresponde al de la institución declarada", antes de poder confirmar el rechazo.

**E2.** Dado que la constancia de Matías quedó rechazada con ese motivo.
Cuando Matías entra a Verificar de nuevo.
Entonces ve el estado "rechazada" con el motivo que escribió Camila, y puede subir una constancia nueva sin que su cuenta quede marcada de ninguna forma: ni advertencia, ni límite de intentos, ni ninguna señal para Camila de que ya falló antes.

## Negativos

**N1.** Dado que Camila decide rechazar una constancia.
Cuando intenta confirmar el rechazo sin escribir ningún motivo.
Entonces el sistema no la deja: el motivo es obligatorio para rechazar.

## Edge cases

- Matías reintenta varias veces seguidas con constancias que siguen sin coincidir: la story no fija un tope de intentos ni un bloqueo tras varios rechazos. **Falta decidir**.
- El motivo del rechazo es el mismo texto que ve Camila y el que ve Matías en Verificar: la story no distingue una versión interna de una versión pública del motivo.
