# US-215: Cada rol ve solo sus colas

> Los casos de [US-215](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Sofía tiene asignado el rol catálogo en Equipo
Cuando intenta entrar a la cola de Reportes escribiendo su URL directamente en el navegador
Entonces no accede: el sistema no le muestra el contenido de esa cola.

**E2.** Dado que Sofía tiene asignado el rol catálogo
Cuando intenta entrar a la cola de Verificaciones por URL directa
Entonces tampoco accede: mismo resultado que con Reportes.

## Negativos

**N1.** Dado que Nahuel tiene asignado el rol moderación, cuando intenta entrar por URL directa a Pedidos (una cola de catálogo), entonces no accede: ningún rol llega a la cola de otro, ni por URL directa.

**N2.** Dado que Camila tiene asignado el rol verificación, cuando intenta entrar por URL directa a Correcciones (otra cola de catálogo), entonces tampoco accede.

## Edge cases

- Alguien copia el link de una cola ajena desde la sesión de otra persona del equipo y lo pega en la propia: el bloqueo depende del rol y la sesión de quien lo abre, no del link en sí.
- El Admin no tiene ningún rol operativo asignado: si puede leer el contenido de una cola sin operarla no está decidido (README de la épica).
- Una cuenta recién dada de alta en Equipo, todavía sin ningún rol asignado, intenta entrar a cualquier cola antes de que el Admin le asigne uno.
- El rol "curaduría de frases" no tiene a nadie asignado todavía y ninguna fuente dice si es un rol aparte de catálogo o el mismo (README de la épica): a qué cola exacta entraría queda abierto.
