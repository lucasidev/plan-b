# Trabajo con agentes

El objetivo es terminar trabajo correcto con menos lecturas y ejecuciones repetidas. Preservar el contexto principal sirve para eso, pero no minimiza por sí solo el consumo total: también cuentan los contextos y herramientas de los auxiliares.

## Elegir dónde ejecutar

- Archivo conocido, cambio acotado o comando con salida breve: directo en el principal.
- Inventario amplio, implementación independiente, browser o investigación ruidosa: delegación con alcance cerrado y el skill correspondiente.
- Revisión de un diff no trivial: contexto fresco, sin volver a pedir un inventario de todo el repo.
- Suite larga: `test-runner` si libera al principal para trabajo útil. No hace falta un modelo solo para esconder un log.

El handoff incluye rutas, base Git, criterio de éxito, evidencia ya obtenida, checks ya corridos y archivos prohibidos. El reporte devuelve resultado, evidencia, incertidumbres y ubicación del log; no devuelve la transcripción de herramientas. La integración verifica lo entregado sin rehacer toda la investigación.

## Salida de checks

Desde la raíz: `bun scripts/run-check.ts --cwd frontend -- bun run test`.

El wrapper ejecuta un único comando, sin shell intermedia, conserva stdout y stderr completos en un archivo temporal local y propaga el código de salida. Un éxito imprime comando, directorio, duración y ruta del log. Un fallo agrega solo el final del log; la causa puede estar antes y se busca en el archivo, no se supone ausente ni se pega entero. No impone timeout ni convierte corridas interrumpidas en éxito. Para scripts de shell, invocar el intérprete explícitamente.

Ante SIGINT o SIGTERM cierra el árbol del comando y devuelve 130 o 143. La terminación forzada del propio wrapper (SIGKILL o equivalente del sistema operativo) no permite ejecutar esa limpieza; quien lo invoca debe terminar el árbol completo en ese caso.

No reemplaza ningún check ni modifica CI. Lo usan tanto el principal como `test-runner`. Una suite verde se reutiliza solo si código, configuración, dependencias y estado relevante no cambiaron. Los E2E e integración requieren verificar también el entorno compartido.

## Revisiones acotadas

Los workflows nativos de Claude conservan los tiers de revisión: opus/high para encontrar problemas, sonnet/medium para refutarlos. Cada invocación hace como máximo dos llamadas secuenciales a agentes: un pase y una verificación conjunta. Sin hallazgos, la segunda no corre. Los duplicados exactos se quitan antes de verificar.

Alcance de la verificación del 2026-09-16: Claude Code 2.1.273 contiene un loader de workflows y validación de `meta`. Los tests del repo ejecutan la lógica con dobles de `agent`; no prueban el contrato de `schema`, la forma del retorno ni las interrupciones del motor real. Esa compatibilidad queda pendiente de una ejecución normal del workflow, sin generar una revisión facturada solo para medir consumo.

Por default revisan el diff `main...HEAD`. Aceptan un rango como string o `{ "target": "origin/main...HEAD" }`. Una auditoría sin diff exige un alcance explícito, por ejemplo `{ "scope": "backend/modules/identity" }`. `doc-drift` no toma los documentos archivados como especificación vigente. Ninguna revisión declara limpio lo que no pudo recorrer: las áreas pendientes y los hallazgos sin evidencia suficiente se devuelven como incompletos. Otro pase necesita una pregunta pendiente concreta, no una votación automática por hallazgo.

Los skills se cargan completos cuando aplican, no se precargan todos. Logs grandes se consultan por errores o rangos; browser/web conservan sus presupuestos. Esperar finalización usa eventos, no polling corto. Esto complementa [AGENTS.md](../../AGENTS.md); no cambia permisos, aprobaciones ni la regla de no tocar el trabajo de otro agente.

## Medición

Usar los registros locales existentes, sin copiar prompts, credenciales ni transcripciones al repo. Registrar por trabajo terminado: rol/modelo, invocaciones, tokens de entrada nueva, escritura y lectura de caché por separado, salida, herramientas, checks repetidos, tiempo y resultado de calidad. La revisión de permisos se identifica aparte; sus registros no prueban que descuente cuota del usuario.

- Claude: deduplicar las partes de una respuesta por `message.id`, conservando los contadores finales; no sumar las actualizaciones de streaming, el detalle `iterations` ni el resumen acumulado otra vez. La lectura de caché no es entrada nueva.
- Codex: `total_token_usage` es acumulativo. Medir diferencias dentro de la misma sesión y separar reinicios o segmentos; no sumar cada snapshot ni volver a sumar `last_token_usage`. Reportar razonamiento aparte, sin asumir que se adiciona a salida.
- Los tokens de logs no equivalen a dinero ni al porcentaje de la ventana de cinco horas. La equivalencia con cuota queda desconocida salvo información explícita del proveedor.

En la comprobación local del 2026-09-16, una sesión histórica de Claude tenía 4.704 filas de uso pero 2.135 IDs de respuesta únicos. Esa duplicación invalida sumar filas para diagnosticar consumo. No es una medición de ahorro de esta configuración.

Primera comparación: trabajos reales de tamaño y riesgo parecidos, registrando diferencias de caché y contexto inicial. Mantener modelos, esfuerzos, dos agentes simultáneos y auto-review mientras se observa este cambio de flujo. La primera tanda da señal, no prueba causal ni porcentaje garantizado. Si reaparece trabajo omitido o retrabajo, ajustar el alcance antes de bajar más el costo.

Referencias: [caché de Claude](https://code.claude.com/docs/en/prompt-caching), [contabilización de uso del SDK](https://code.claude.com/docs/en/agent-sdk/cost-tracking), [subagentes de Codex](https://learn.chatgpt.com/docs/agent-configuration/subagents).
