# ADR-0082: The review captures the cursada in three layers

- **Estado**: aceptado (2026-08-25)
- **Fecha**: 2026-08-25

## Contexto

El instrumento venía de iterar formas (frases marcables con pares, preguntas de sí o no por inquietud, ítems contables de auditor) y todas compartían el mismo vicio de fondo: las preguntas se elegían por lo que permitían computar o publicar, no por lo que un estudiante puede recordar y quiere contar. El resultado era falsa precisión (nadie sale de una cursada sabiendo cuántas fechas de final se ofrecieron ni cuántos días tardó el primer parcial) o juicios globales sin ancla ("¿se entiende lo que explican?" como veredicto general).

A la vez, el dato necesitaba protección: reseñar entidades flotantes ("la universidad") es barato de bombear, y publicar agregados de dos o tres reseñas permite deducir quién dijo qué.

## Decisión

**Solo se reseña la cursada** (cuenta × materia × período, una voz), y el cuestionario pregunta en **tres capas**:

1. **Qué hizo la cátedra**: conducta observable que cualquiera en el aula vio, en frecuencias gruesas, nunca en conteos finos. Los ítems semilla: si contestaba las preguntas en clase (con «Nadie preguntaba» como opción), si se dictaron las clases, si el práctico daba lo mismo que el teórico, si respondía consultas fuera de clase, con cuánta anticipación avisó el parcial, si entregó el programa al inicio, si tomó temas fuera del programa.
2. **Qué te pasó a vos**: vivencia en primera persona, no juicio general: si salías de la clase entendiendo, si el material alcanzaba para el parcial, si pudiste seguir el ritmo, si podías preguntar sin quedar mal.
3. **Contexto, que no se publica**: período, cátedra, modalidad, cómo terminó y cuántas veces la cursó. Controla el sesgo en la lectura; ninguna reseña muestra jamás cómo terminó nadie.

Reglas que completan el instrumento:

- **Saltear siempre vale.** El que aporta regala el dato; nada es obligatorio y el denominador de cada ítem son quienes lo respondieron.
- **Piso de publicación: 10 reseñas por cátedra.** La razón es la privacidad del que reseña (con dos reseñas, el titular deduce quién dijo qué), no la vergüenza estadística. El estado se muestra ("junta 3 reseñas: con 7 más se publica").
- **La ficha se ve antes de reseñar.** El anclaje del que responde mirando los resultados previos se acepta como costo; lo compensa la dispersión temporal visible (ADR-0083).
- **El catálogo vive versionado en la base**: cada ítem con código estable (el texto puede cambiar; si cambia el significado, código nuevo), instrumento versionado con vigencias, y cada reseña atada a la versión con la que se respondió. Agregar o retirar un ítem es un alta de catálogo, no una migración, y la serie histórica se corta por código.

## Alternativas consideradas

**Frases marcables con pares.** Duplicaba cada aspecto en dos frases y toda la maquinaria existía para administrar esa duplicación.

**Preguntas de sí o no, una por inquietud.** Mejor que los pares, pero seguía pidiendo juicios globales sin ancla y abrió la puerta a los conteos de auditor cuando quisimos endurecerla.

**Ítems contables finos** (cuántas clases exactas, días de devolución, fechas de final). Piden precisión que la memoria no tiene: producen datos que parecen duros y son ruido. Solo sobrevive lo contable en grueso ("faltaron muchas").

**Obligatoriedad de respuesta.** Ir contra quien aporta a cambio de nada; además el salteo forzado se convierte en respuesta basura.

**Cegar la ficha antes de reseñar** (mitigar anclaje por ruteo). Rechazada explícitamente: fricción sin ganancia suficiente; la dispersión temporal mostrada cumple ese rol.

## Consecuencias

- El catálogo editorial ([phrases.md](../product/phrases.md)) se reescribe como las tres capas con sus opciones; la pantalla Reseñar y sus stories se rehacen sobre este flujo.
- Los issues de R1 ajustan contrato: el cuestionario se carga como catálogo versionado (ítems, opciones, instrumentos) y la reseña guarda respuestas por opción más el contexto.
- El piso de 10 entra al método público y a la navegación (las cátedras que no llegan aparecen como "junta N reseñas").
- El campo libre del final existe y tiene su propia decisión: ADR-0084.
