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
Cuando llega un pedido de verificación de alguien que dice ser el adjunto de esa cátedra, y Camila lo verifica.
Entonces Camila compara el nombre declarado contra el nombre del adjunto que ya está cargado en Catálogo: la verificación se hace contra ese dato, nunca contra lo que la persona declara de sí misma.

## Continuidad del contexto y del historial

**E4.** Dado que Sofía abrió las cátedras de Fundamentos de Control de Calidad, del plan 2018 de la Tecnicatura Universitaria en Desarrollo y Calidad de Software de UNSTA.
Cuando agrega una cátedra y luego un integrante del equipo.
Entonces los dos formularios muestran esa materia, plan, carrera y universidad; al guardar ve el detalle con el integrante y puede volver a las cátedras de la misma materia sin volver a seleccionarla.
Verificado por E2E: `frontend/e2e/admin/chairs.spec.ts` carga la cátedra, crea un docente conservando rol y período, agrega el integrante y cierra su tramo desde la pantalla.

**E5.** Dado que la Cátedra Pérez dictó durante 2024 y cerró al finalizar ese año; el equipo registra su archivo en 2026.
Cuando una persona sin cuenta abre su enlace directo.
Entonces la ficha sigue accesible, muestra que está archivada y conserva sus conteos con el mismo piso y privacidad que antes del archivo.
No construido: la lectura pública de cátedra filtra `is_active` y no devuelve estado de archivo.

**E6.** Dado el cierre efectivo de E5 y un alumno que cursó con Pérez en el primer cuatrimestre de 2024.
Cuando aporta esa cursada en 2026, después del archivo.
Entonces puede reseñarla si cumple las demás reglas de aportación; se conserva el período cursado y no se atribuye la experiencia a 2026.
No construido: no se persiste el cierre efectivo ni se distingue disponibilidad actual de elegibilidad histórica.

## Negativos de contexto y tiempo

**N2.** Dado un integrante de una cátedra de UNSTA cuyo tramo comenzó en un período de UNSTA.
Cuando Sofía intenta cerrar el tramo usando un período de UNT.
Entonces la operación se rechaza sin modificar el equipo y explica que el período debe pertenecer a la universidad de la cátedra.
Verificado por integración HTTP: `AdminChairsEndpointTests.Closing_with_a_term_from_another_university_preserves_the_current_member`.

**N3.** Dado un integrante cuyo tramo comenzó en el primer cuatrimestre de 2025.
Cuando Sofía intenta cerrarlo en un período de 2024.
Entonces se rechaza el cierre y el tramo original se conserva.
Verificado por integración HTTP: `AdminChairsEndpointTests.Closing_before_the_start_preserves_the_current_member`. El período final es inclusivo; se compara su fecha de fin con el inicio del tramo.

**N4.** Dado el cierre efectivo de E5.
Cuando se intenta aportar una cursada de Pérez correspondiente a 2025, por formulario o directamente por API.
Entonces se rechaza el período posterior al cierre; conocer el identificador de la cátedra no evita la validación.
No construido: falta la regla temporal de elegibilidad de cátedras archivadas.

## Negativos de verificación

**N1.** Dado que la cátedra "Análisis Matemático I, R. Domínguez" (UTN) tiene cargados un titular, un adjunto y dos ayudantes, y llega un pedido de verificación de alguien que dice ser un segundo adjunto que el catálogo no tiene cargado. Cuando Camila compara ese pedido contra el equipo cargado. Entonces Camila NO agrega ese nombre al equipo de la cátedra a partir de lo que la persona declaró: si no está cargado, no cuenta como parte de la cátedra hasta que Sofía lo cargue.
No construido: el pedido de verificación del cargo es del recorrido reviewed (US-225 y US-227, Backlog)

## Edge cases

- Cambia el titular de una cátedra ya cargada: si sigue siendo la misma entidad o se vuelve una cátedra nueva no está definido (Falta decidir, la épica lo deja abierto explícitamente).
- Una materia con dos cátedras en paralelo, cada una con su propio equipo docente en el mismo período: se cargan como entidades separadas.
- Una cátedra sin ningún integrante cargado todavía y llega un pedido de verificación sobre ella: qué pasa con ese pedido es ADR-0073 punto 5, y es territorio de US-210 (la cola de identidad docente, en Moderar sin romper el producto), no de esta story.
