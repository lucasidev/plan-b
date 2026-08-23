# US-212: Mostrar la cola de moderación desbordada

> Los casos de [US-212](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Reportes tiene 40 reportes (contenido ya publicado y denunciado después) y 30 retenidos (contenido que el chequeo previo frenó antes de publicar, que todavía nadie leyó).
Cuando Nahuel abre la cola.
Entonces ve cuánto se tarda, en promedio, en resolver cada uno y qué cantidad queda para después, con los reportes y los retenidos mostrados en secciones separadas.

**E2.** Dado esa misma cola, con 40 reportados y 30 retenidos.
Cuando Nahuel decide qué mirar primero.
Entonces la cola le prioriza los 30 retenidos por sobre los 40 reportados: lo retenido no está publicado y lo reportado sigue publicado mientras espera, así que lo sin publicar va primero.

## Negativos

**N1.** Dado la misma cola desbordada.
Cuando se arma el orden de trabajo dentro de cada sección.
Entonces nunca se ordena estrictamente por fecha de llegada: ni el más viejo de los retenidos ni el más viejo de los reportados van primero solo por antigüedad, el criterio es sin publicar antes que reportado.

## Edge cases

- Cómo se calcula exactamente "cuánto se tarda", y si usa el mismo cálculo que Pedidos (US-200), no está decidido (README de la épica). **Falta decidir**.
- Una cola sin nada pendiente, ni reportes ni retenidos: la story no dice si se muestra un estado especial o simplemente la cola vacía. **Falta decidir**.
- Hoy hay un solo moderador (Nahuel); si el equipo escalara a un segundo moderador, qué pasa cuando dos abren el mismo reporte a la vez no está resuelto en ninguna story de la épica. **Falta decidir**.
