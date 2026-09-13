# El recorrido de <Persona> sobre <qué corte del stage> (<YYYY-MM-DD>)

> **Plantilla** ([reglas](README.md)). Copiar a `YYYY-MM-DD-<persona>-walk.md`, completar cada `<placeholder>` y borrar esta línea.

> Registro de revisión ([índice](README.md)). **Alcance**: el stage <en qué corte, `main` en `<sha>`, qué corpus>, caminado como [<Persona>](../../product/personas.md), <el rasgo o la necesidad que la trae>. **Norma**: la persona, las stories de <los recorridos o épicas de `docs/product/` que aplican>, las [garantías](../../product/guarantees/README.md) y las restricciones del producto, y el [Método](../../THESIS.md). **Método**: prueba manual simulada, inquisitiva, con la spec [`frontend/e2e/walks/<persona>.spec.ts`](../../../frontend/e2e/walks/<persona>.spec.ts): cada paso asevera lo que <Persona> espera, y las capturas quedan en [`assets/<YYYY-MM-DD>-<persona>/`](assets/<YYYY-MM-DD>-<persona>) (si la spec las escribe). <Si repite un recorrido anterior de la misma persona: "Repite el [recorrido del <YYYY-MM-DD anterior>](<YYYY-MM-DD>-<persona>-walk.md) sobre <qué cambió>; los hallazgos de aquel registro cambian de estado ahí, y acá quedan solo los nuevos.">

Estados: **Resuelto** (con el commit o PR), **Cerrado** (una decisión lo cerró), **Pendiente** (espera una decisión de Lucas o entra a un sprint), **Descartado** (con la razón), **Confirmación** (no era hallazgo).

## Qué se encontró, en una línea

<Una o dos frases: qué puede hacer <Persona> hoy, y qué le sigue faltando.>

## El recorrido, paso por paso

Los textos entre comillas son los que el stage mostró, copiados por la spec.

<Pegar tal cual la tabla que la spec escribió en `frontend/test-results/<persona>-verdicts.md` (columnas Paso, Story, qué esperaba <Persona>, qué mostró el stage, veredicto y captura).>

## Hallazgos

<Si repite un recorrido anterior de la misma persona: "Los de <letra><rango anterior, ej. V01 a V14> cambian de estado en [su registro](<YYYY-MM-DD>-<persona>-walk.md#hallazgos). Nuevos:">

| ID | Hallazgo | Story | Estado |
|---|---|---|---|
| <letra><NN> | <qué encontró, con la evidencia del paso que lo muestra> | <US-NNN o la referencia que aplica> | <Pendiente / Resuelto / Cerrado / Descartado / Confirmación, con quién o qué lo decide> |
