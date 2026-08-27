# US-214: Agrupar reclamos por objetivo y ventana

> Los casos de [US-214](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que, en una ventana de 72 horas, llegan 12 reclamos con mail confirmado, todos objetando el mismo dato de transparencia relevada publicado sobre UNSTA.
Cuando Nahuel abre Reportes.
Entonces ve esos 12 reclamos agrupados en un solo bloque por objetivo (el dato de UNSTA) y ventana (72 horas), en vez de 12 filas sueltas.

**E2.** Dado ese grupo de 12 reclamos contra el mismo dato de UNSTA.
Cuando Nahuel contrasta el dato contra la fuente.
Entonces resuelve el grupo entero de una sola vez, con un solo criterio (el dato se corrige o se mantiene), no reclamo por reclamo.

**E3.** Dado que, dentro de esos 12 reclamos, el mismo mail confirmado manda dos reclamos distintos sobre el mismo dato de UNSTA dentro de la ventana.
Cuando se arma el grupo.
Entonces ese mail cuenta una sola vez en el conteo de reclamantes del grupo, no dos: el mail confirmado deduplica (D05).

## Negativos

**N1.** Dado que, en la misma ventana de 72 horas, llegan reclamos contra un dato de UNSTA y, por separado, reclamos contra una nota editorial de UTN.
Cuando se arma la cola.
Entonces esos dos conjuntos no se agrupan entre sí: cada objetivo arma su propio grupo, aunque coincidan en el tiempo.

## Edge cases

- Un reclamo que entra pasadas las 72 horas desde el primero del grupo: si queda afuera del grupo o si la ventana se corre con cada reclamo nuevo no está definido. **Falta decidir**.
- Un reclamo sin mail confirmado nunca entra a la cola (mismo mecanismo de confirmación que reportar, [US-167](../../../../guarantees/US-167-report-content-without-an-account/README.md) de [Que no me molesten](../../../../guarantees/README.md)), así que tampoco entra a ningún grupo.
- Un reclamo que llega solo, sin ningún otro contra el mismo objetivo en la ventana, no arma grupo: se resuelve individual. Qué le avisa a quien reclamó cuando se resuelve (antes lo hacía US-206, que se retiró con este viraje) es un hueco declarado en el README de la épica. **Falta decidir**.
