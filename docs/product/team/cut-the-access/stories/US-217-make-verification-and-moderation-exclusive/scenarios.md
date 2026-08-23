# US-217: Verificación y moderación son roles excluyentes

> Los casos de [US-217](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Nahuel ya tiene asignado el rol moderación
Cuando el Admin intenta asignarle también el rol verificación en Equipo
Entonces la asignación es imposible: la opción no está disponible, no es algo que se registre para auditar después.

**E2.** Dado que Camila ya tiene asignado el rol verificación
Cuando el Admin intenta asignarle también el rol moderación
Entonces también es imposible, en el mismo sentido que E1.

**E3.** Dado que el registro guarda, por separado, la acción de Camila aprobando la constancia de un alumno (con su nombre real) y la acción de Nahuel bajando un testimonio de esa misma cátedra
Cuando Nahuel o Camila leen el registro con su propio rol
Entonces ninguno de los dos encuentra ahí una referencia que le permita unir ese nombre real con ese testimonio o esa cuenta: las referencias que ve un rol no alcanzan para reconstruir el cruce.

**E4.** Dado que el Admin está en Equipo
Cuando intenta asignarse a sí mismo el rol catálogo, curaduría de frases, moderación o verificación
Entonces la asignación es imposible: el Admin no se auto-asigna ningún rol operativo.

## Negativos

**N1.** Dado que el Admin necesita cubrir una ausencia (por ejemplo, Camila de licencia) y busca alguna opción para asignar moderación y verificación a la misma persona por esta vez, cuando la busca en Equipo, entonces no existe: ninguna combinación de permisos habilita esa mezcla, ni siquiera de forma temporal.

## Edge cases

- El Admin intenta asignarle el rol moderación a Nahuel una segunda vez, cuando ya lo tiene: si es un error visible o simplemente no hace nada no está decidido.
- Cómo se cubre la cola de verificación si Camila está de licencia sin violar la exclusión: hace falta un segundo verificador, nunca un moderador supliendo, y quién es ese segundo verificador no está decidido (README de la épica).
- El Admin le saca el rol moderación a Nahuel y se lo da a otra persona nueva; después intenta darle verificación a Nahuel, que hoy no tiene ningún rol: si alcanza con que hoy no lo tenga, o el sistema recuerda que lo tuvo, no está decidido.
