# US-212: Mostrar la cola de moderación desbordada

> Los casos de [US-212](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Reportes tiene 40 comentarios del campo libre que el filtro grueso marcó, todavía sin revisar, y 12 reclamos institucionales pendientes.
Cuando Nahuel abre la cola.
Entonces ve cuánto se tarda, en promedio, en resolver cada uno y qué cantidad queda para después, con el campo libre filtrado y los reclamos mostrados en secciones separadas.

**E2.** Dado esa misma cola, con 40 del campo libre y 12 reclamos.
Cuando Nahuel decide qué mirar primero.
Entonces la cola no lo obliga a un único orden entre las dos secciones: cada una prioriza puertas adentro por su propio criterio (el campo libre, por ejemplo, nada llega a curaduría hasta que se libera; los reclamos, ninguno baja un dato solo).

## Negativos

**N1.** Dado la misma cola desbordada.
Cuando se arma el orden de trabajo dentro de cada sección.
Entonces nunca se ordena estrictamente por fecha de llegada solo por antigüedad, sin ningún otro criterio.

## Edge cases

- Cómo se calcula exactamente "cuánto se tarda", y si usa el mismo cálculo que Pedidos (US-200 de [Sostener el catálogo](../../../sustain-the-catalog/README.md)), no está decidido (README de la épica). **Falta decidir**.
- Una cola sin nada pendiente, ni campo libre filtrado ni reclamos: la story no dice si se muestra un estado especial o simplemente la cola vacía. **Falta decidir**.
- Hoy hay un solo moderador (Nahuel); si el equipo escalara a un segundo moderador, qué pasa cuando dos abren el mismo caso a la vez no está resuelto en ninguna story de la épica. **Falta decidir**.
