# R7: preparación y evidencia de aceptación

Revisión del 2026-09-16. Este registro separa los cambios verificados localmente de la aceptación pendiente sobre stage. El estado del sprint sigue en [el tracker](../../plan/status.md#r7--la-demo-muestra-la-tesis).

## Correcciones verificadas

| Tarea | Evidencia | Pendiente |
|---|---|---|
| #522, comparación entre hermanas | La consulta excluye individualmente a las cátedras bajo el piso. Los dos tests HTTP fallan con la consulta anterior y pasan con el filtro; los doce tests focalizados de privacidad y corpus pasan. El corpus ficticio conserva el contraste de Pérez: 56 % contra 0 %, sobre 16 y 12 voces. Revisión independiente sin hallazgos pendientes | Desplegar, sembrar y caminar Valentina |
| #518, retorno desde el mail | Registro y reenvío transportan el destino saneado. Los seis E2E de registro y reenvío pasan, incluidos los dos que abren el mail en otro navegador sin cookies y vuelven a la materia y cátedra elegidas. Pasan los 840 tests de integración completos, 780 tests unitarios y de arquitectura y 1115 tests frontend. El guard de autenticación pasa del layout a las páginas para conservar el destino tras iniciar sesión | Recorrido de Lucía sobre stage |
| #521, nombres de docentes | Se conserva lo tipeado al crear y editar, con trim. Las lecturas dejan de transformar el nombre y mantienen la búsqueda insensible a mayúsculas y tildes. La migración conserva la representación previa de las filas existentes en minúsculas; no puede recuperar las mayúsculas originales perdidas. Pasan 47 tests HTTP de migración, creación, edición, búsqueda y catálogo; revisión independiente sin hallazgos pendientes | Recorrido de Copas sobre stage |
| #527, Mi perfil | La vista, edición y payload retiran Legajo, Año cursando y Estado. Año de ingreso permanece. Pasan 1095 tests frontend, siete E2E de perfil, lint, tipos y build; revisión independiente sin hallazgos pendientes | Comprobación en stage |

## Recorrido local con los cuatro cambios

El recorrido de Valentina corrió contra el build de producción local con los cuatro cambios integrados y el corpus sembrado. Verificó la cobertura de la materia 211 (2 de 3 cátedras), la fama de Ibáñez (tres respuestas convergen), la comparación de Pérez (56 % contra 0 %, con 16 y 12 voces), los tramos de Aráoz (7 y 6 voces), Ruiz en 6 y Bravo en 9 sin conteos publicados, y las pantallas de cátedra y Método sin desborde horizontal a 393 px.

La suite completa terminó en rojo por US-180 (descarga CSV) y US-167 (reporte de contenido), los dos faltantes que R7 conserva en el backlog como V08 y V07. Sus aserciones siguen activas. Esta ejecución local no reemplaza la aceptación sobre stage después del seed final.

Lucía verificó el mail real, volvió al flujo de reseñar y pudo editar desde Mis aportes. La primera ejecución registró un borrado sin efecto: el selector buscaba otro botón «Borrar» cuando la confirmación real dice «Sí, borrarla», así que no enviaba el DELETE. También contaba elementos `listitem` cuando los aportes actuales son `article`. Con ambos selectores corregidos, la repetición confirmó un solo aporte después del intento duplicado, la desaparición del aporte confirmado y el conteo de Ruiz de 8 a 7. Recuperar el borrador sigue fuera de R7 (L07, backlog); permanecen parciales en registro y presentación de las respuestas del aporte. No se declara cumplido todo el recorrido por el exit code.

Copas completó los tres pasos locales: registro y verificación del mail, reseña de Ruiz (de 6 a 7) y backoffice con creación de cátedra y frase destilada. Las aserciones de los nombres exactos pasaron.

## Navegación en CI

Siete corridas de `main` con el arreglo de los links del shell terminaron con el job E2E en verde. Las corridas anteriores al arreglo y los jobs salteados no cuentan para el criterio de doce de #525.

| Corrida | SHA |
|---|---|
| [34848250371](https://github.com/lucasidev/plan-b/actions/runs/34848250371) | `8ee7bc2a` |
| [35021234989](https://github.com/lucasidev/plan-b/actions/runs/35021234989) | `455eac78` |
| [35022310588](https://github.com/lucasidev/plan-b/actions/runs/35022310588) | `9119a8fe` |
| [35056218311](https://github.com/lucasidev/plan-b/actions/runs/35056218311) | `fc7d558b` |
| [35162668178](https://github.com/lucasidev/plan-b/actions/runs/35162668178) | `ff4b39f7` |
| [35168764171](https://github.com/lucasidev/plan-b/actions/runs/35168764171) | `5f619f2d` |
| [35169986589](https://github.com/lucasidev/plan-b/actions/runs/35169986589) | `58e665f4` |

La corrida del [PR #548](https://github.com/lucasidev/plan-b/actions/runs/35174536230) terminó en rojo en el ingreso a Ajustes: el click ocurrió en 130641,809 ms de la traza; el RSC respondió 200 en 17,851 ms, pero la URL siguió en Mis aportes. El GET de documento de Ajustes comenzó en 134648,225 ms, después del segundo plazo del fallback. La recuperación llegó al destino; el test falló al exigir que sobreviviera una propiedad de `window` que la recarga elimina. Se corrige ese criterio conservando la comprobación de URL y contenido, y registrando el modo de navegación. Los diez E2E de Ajustes, Ayuda y recuperación pasan contra el build de producción local. El test nuevo falla al retrasar temporalmente el fallback a 60 segundos porque no observa la carga del documento. La corrida roja de CI no se cuenta como evidencia verde ni habilita el merge.

## Stage

`/health` respondió `ok` para API, PostgreSQL y Redis, sirviendo `58e665f473315d218e6109b78f36f8422f519b89`. La comprobación de sesión transcurrió el 2026-09-17 de 01:54:01 a 02:54:04 UTC (3603 segundos). En los siete controles separados por diez minutos permaneció en Mis aportes sin pedir otro login. Los access tokens duraron 900 segundos y se renovaron a los minutos 20, 40 y 60. La renovación durante una hora está verificada por URL y cookies. La captura final se tomó durante la carga y no prueba el render final; la aceptación visual sigue pendiente en los recorridos de stage. La ausencia de la variable temporal en Dokploy también sigue pendiente de confirmar en el panel.

La preparación final sigue el [runbook](../../engineering/runbook.md#7-reset-destructivo-de-stage): recorridos con cuenta antes del reset, backup y reset autorizados, seed del SHA desplegado, importación de la AGN, recorridos sin cuenta y tag narrativo. No se registra el sprint como cerrado hasta verificar ese estado.
