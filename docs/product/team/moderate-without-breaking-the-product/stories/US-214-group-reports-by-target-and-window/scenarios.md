# US-214: Agrupar reportes por objetivo y ventana

> Los casos de [US-214](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que, en una ventana de 72 horas, llegan 12 reportes con mail confirmado, todos contra testimonios que marcan frases duras sobre UNSTA como institución.
Cuando Nahuel abre Reportes.
Entonces ve esos 12 reportes agrupados en un solo bloque por objetivo (UNSTA) y ventana (72 horas), en vez de 12 filas sueltas.

**E2.** Dado ese grupo de 12 reportes contra UNSTA.
Cuando Nahuel revisa y confirma que ninguno expone a una persona, porque son quejas duras contra la institución y no causal (US-205).
Entonces resuelve el grupo entero de una sola vez, con ese criterio, no reporte por reporte.

**E3.** Dado que, dentro de esos 12 reportes, el mismo mail confirmado de Prof. Paredes mandó dos reportes distintos contra dos testimonios distintos sobre UNSTA dentro de la ventana.
Cuando se arma el grupo.
Entonces ese mail cuenta una sola vez en el conteo de reportantes del grupo, no dos: el mail confirmado deduplica (D05).

## Negativos

**N1.** Dado que, en la misma ventana de 72 horas, llegan reportes contra Cátedra Pérez y, por separado, reportes contra UNSTA como institución.
Cuando se arma la cola.
Entonces esos dos conjuntos no se agrupan entre sí: cada objetivo arma su propio grupo, aunque coincidan en el tiempo.

## Edge cases

- Un reporte que entra pasadas las 72 horas desde el primero del grupo: si queda afuera del grupo o si la ventana se corre con cada reporte nuevo no está definido. **Falta decidir**.
- Un reporte sin mail confirmado nunca entra a la cola (US-167), así que tampoco entra a ningún grupo.
- Un reporte que llega solo, sin ningún otro contra el mismo objetivo en la ventana, no arma grupo: se resuelve individual, con el criterio de US-205 y el aviso de US-206.
