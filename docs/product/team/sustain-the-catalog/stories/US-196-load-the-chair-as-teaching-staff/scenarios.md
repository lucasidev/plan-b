# US-196: Cargar la cátedra como entidad propia

> Los casos de [US-196](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que "Análisis Matemático I" (Ingeniería en Sistemas de Información, UTN) no tiene ninguna cátedra cargada todavía.
Cuando Sofía carga una cátedra nueva con materia "Análisis Matemático I", titular "R. Domínguez", equipo "1 adjunto, 2 ayudantes" y "vigente desde: 2024".
Entonces la cátedra queda guardada como entidad propia, distinta de una comisión, y en el período siguiente (2024-C2) sigue siendo la misma cátedra, sin recargarse de cero.

**E2.** Dado que la cátedra "Análisis Matemático I, R. Domínguez" (UTN) ya está cargada con su equipo, cada integrante con su nombre.
Cuando Lucía reseña esa cursada en Reseñar y se le pregunta la cátedra que recuerda.
Entonces "Análisis Matemático I, R. Domínguez" aparece en la lista que Reseñar ofrece.

**E3.** Dado que la cátedra "Análisis Matemático I, R. Domínguez" (UTN) ya tiene cargado su equipo completo, con el nombre de cada integrante: el titular R. Domínguez, un adjunto y dos ayudantes.
Cuando llega un pedido de réplica de alguien que dice ser el adjunto de esa cátedra, y Camila lo verifica.
Entonces Camila compara el nombre declarado contra el nombre del adjunto que ya está cargado en Catálogo: la verificación se hace contra ese dato, nunca contra lo que la persona declara de sí misma.

## Negativos

**N1.** Dado que la cátedra "Análisis Matemático I, R. Domínguez" (UTN) tiene cargados un titular, un adjunto y dos ayudantes, y llega un pedido de réplica de alguien que dice ser un segundo adjunto que el catálogo no tiene cargado. Cuando Camila compara ese pedido contra el equipo cargado. Entonces Camila NO agrega ese nombre al equipo de la cátedra a partir de lo que la persona declaró: si no está cargado, no cuenta como parte de la cátedra hasta que Sofía lo cargue.

## Edge cases

- Cambia el titular de una cátedra ya cargada: si sigue siendo la misma entidad o se vuelve una cátedra nueva no está definido (Falta decidir, la épica lo deja abierto explícitamente).
- Una materia con dos cátedras en paralelo, cada una con su propio equipo docente en el mismo período: se cargan como entidades separadas.
- Una cátedra sin ningún integrante cargado todavía y llega un pedido de réplica sobre ella: qué pasa con ese pedido es ADR-0073 punto 5, y es territorio de US-225 en Replicar, no de esta story.
