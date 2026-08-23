# US-192: Ordenar la cola por demanda

> Los casos de [US-192](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que en Pedidos hay tres carreras pedidas: "Ingeniería en Sistemas de Información" (UTN) con 34 pedidos confirmados, "Licenciatura en Nutrición" (USPT) con 21, y "Profesorado en Educación Física" (SIGLO 21) con 9.
Cuando Sofía abre Pedidos.
Entonces la lista se ordena 34, 21, 9 (de mayor a menor pedidos confirmados), y cada fila muestra la institución de origen (UTN, USPT, SIGLO 21) junto al conteo.

## Negativos

**N1.** Dado que "Profesorado en Educación Física" (SIGLO 21) entró a la cola hace apenas 2 días con 9 pedidos, y "Licenciatura en Nutrición" (USPT) entró hace 14 días con 21 pedidos. Cuando la cola se ordena. Entonces "Licenciatura en Nutrición" aparece antes que "Profesorado en Educación Física" pese a ser más vieja en la cola: el orden es estrictamente por pedidos confirmados (21 contra 9), nunca por antigüedad ni por orden de llegada.

## Edge cases

- Dos carreras con la misma cantidad de pedidos confirmados: el criterio de desempate no está definido (Falta decidir).
- Un mail que pidió una carrera pero nunca confirmó el link no suma al conteo de esa fila (D03).
- Una carrera que ya se publicó sale de esta cola: no vuelve a contarse acá aunque sigan llegando lecturas de su ficha.
