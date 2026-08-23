# US-207: Ver lo mínimo para verificar una constancia

> Los casos de [US-207](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Matías declaró en su perfil que cursa Ingeniería en Sistemas en UNSTA y sube su certificado de alumno regular, con su nombre y DNI, en Verificar.
Cuando Camila abre ese pedido en la cola de constancias de Verificaciones.
Entonces ve lo mínimo para decidir: el nombre y el DNI que trae la constancia, contrastados contra lo que Matías declaró (nombre, carrera, institución), sin ver ningún otro dato de su cuenta.

**E2.** Dado que el nombre y la carrera de la constancia de Matías coinciden con lo que declaró.
Cuando Camila confirma la aprobación.
Entonces el documento que subió se destruye en ese momento: no queda ningún archivo guardado para volver a mirarlo después.

## Negativos

**N1.** Dado que el pedido de Matías todavía está pendiente, sin que Camila lo haya resuelto.
Cuando se consulta el estado de ese pedido.
Entonces el documento todavía existe: no se destruye antes de resolverse, ni apenas se sube.

## Edge cases

- El documento también se destruye si Camila rechaza la constancia, no solo si la aprueba: "al resolver" cubre las dos resoluciones (US-211).
- Matías sube una segunda constancia mientras la primera todavía está pendiente de revisión: si reemplaza a la primera o se acumulan las dos no está definido. **Falta decidir**.
- Una constancia en un formato que Camila no puede abrir o leer: la story no dice qué pasa en ese caso. **Falta decidir**.
