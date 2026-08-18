# Revisión de `docs/domain` (2026-08-18)

> Registro de revisión ([índice](README.md)). **Alcance**: las 20 entradas de `docs/domain`. **Método**: inventario medido (tamaño, banner, último cambio, referencias entrantes desde fuera de la carpeta) y veredicto por entrada. **Aplicado** en el commit `bcf3c7a`.

| ID | Hallazgo | Estado |
|---|---|---|
| H01 | Más de la mitad de la carpeta describía la versión anterior (actores y 49 UC, dos ciclos de vida, event storming, process modeling, strategic, tactical, 12 épicas), ya con banner "Historia" pero en el mismo lugar que el contrato nuevo. | **Resuelto**: al ático `docs/history/domain-v1/` con `git mv`, README con reglas (no se edita; se va con el código que describe), 233 archivos con sus links corregidos. |
| H02 | El glosario mezclaba cuatro secciones de la versión anterior y dos contaminadas, y el vocabulario del producto nuevo estaba en el medio. | **Resuelto**: el glosario abre con "El producto: reseñar y publicar" y solo tiene términos vivos; lo viejo, en `ubiquitous-language-v1.md` del ático. |
| H03 | `dev-seed-personas.md` (fixtures del seed de auth) estaba en dominio. | **Resuelto**: a `docs/testing/`. |
| H04 | `verification-flows.md` decía "vigente con alcance parcial" y describe la verificación docente v1 con el email institucional deprecado por ADR-0048; dos archivos de código la citan. | **Resuelto**: se queda con banner nuevo (describe la implementación, no la decisión: BO2-6 / ADR-0068). |
| H05 | 29 fichas v1 seguían en Backlog o Planificada con el catálogo v1 muerto. | **Resuelto**: cada una dice qué story del catálogo nuevo la reemplaza o que el viraje la canceló; las Done no se tocan. |
| H06 | `epics.md` era la tabla v1 con un banner. | **Resuelto**: stub honesto hasta el paso de épicas; la tabla, al ático. |
| H07 | Las revisiones y auditorías no tenían casa ni trazabilidad (una en dominio, otra adentro del mapa, las demás solo en commits). | **Resuelto** con esta carpeta ([README](README.md)). |
