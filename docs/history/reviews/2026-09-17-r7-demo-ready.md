# R7: preparación del corpus de demostración en stage

## Destino y ejecución

El 2026-09-17 Lucas autorizó descartar y recrear los datos de prueba de stage. Se omitió el backup porque el propósito era reconstruir ese corpus descartable desde el seed; no se agregó S3 ni SSH. Esta decisión no aplica a datos que se deban conservar ni a producción.

En Dokploy se confirmó el proyecto `planb`, ambiente `stage`, PostgreSQL `r03w-D6eEOKbKxKtyL4Iw`, base `planb` y host interno `planb-postgres-l2drhr`. API y Migrate tenían la imagen `ghcr.io/lucasidev/plan-b/planb-api:097a17257944a35761b81a8c018ad970f0cdadae`.

Con API detenida, la terminal de esa PostgreSQL eliminó en una transacción los schemas `academic`, `identity`, `reviews` y `wolverine`; la salida terminó en `DROP SCHEMA` y `COMMIT`. Se mantuvieron la Database, su endpoint y sus credenciales.

Migrate se ejecutó desde Dokploy. La nueva task terminó en `exited` y sus logs en `Wolverine: listo.` a las 15:56:27 UTC. Después se inició API y se ejecutó `seed-db` desde `/app`, en el contenedor de la misma imagen. Terminó a las 16:00:53 UTC: `CorpusSeeder: inserted 390 reviews`, `Siembras: listo.` y `SEED_EXIT=0`.

Dos intentos previos no ejecutaron el seed: una terminal apuntaba al contenedor anterior, ya retirado por Swarm; en la segunda, el directorio inicial era `/` y no encontraba `Planb.Api.dll` (exit 155). La carga efectiva fue una sola, desde `/app`.

La consulta de `/health` desde el contenedor de API a las 16:08:35 UTC devolvió HTTP 200, `status: ok`, PostgreSQL y Redis `ok`, y versión `097a17257944a35761b81a8c018ad970f0cdadae`. Las páginas públicas se verificaron desde el navegador y el recorrido contra la URL de stage. La lectura de health de esta preparación fue interna al contenedor.

## AGN y backoffice

Desde `/admin/universities`, con la cuenta de administración sembrada, se ejecutó Actualizar auditorías AGN. Resultado visible: 5 de 5 instituciones consultadas, 2 con informes y 3 sin informes, fecha 17/09/2026. UNT y UTN-FRT mostraron enlaces a sus informes.

La revisión posterior del backoffice fue de lectura:

- La materia 211 mostró González, Pérez y Ruiz, con Patricia González, Martín Pérez y Sergio Ruiz como titulares desde 2024-C1.
- Frases mostró 14 preguntas vigentes y 1 retirada, todas las vigentes marcadas semilla; la pregunta sobre el desenlace tenía 390 respuestas.
- Curaduría mostró 9 textos del corpus y los formularios de destilar y publicar nota, sin usarlos.

El guion anterior clasificaba `just walk sofia` como un recorrido sin escrituras. La spec crea una cátedra y destila una frase: se corrigieron el guion y el runbook para ubicarlo antes del reset. No se ejecutó esa suite sobre el corpus final. Las escrituras del backoffice y el nombre exacto ya fueron comprobados por Copas antes del reset, en la [aceptación previa](2026-09-17-r7-stage.md).

## Recorrido público después del seed

`just walk valentina` terminó en 44,1 segundos con exit 1: 40 filas cumple, 2 no cumple y ninguna parcial. La [tabla completa](assets/2026-09-17-r7-clean-valentina/verdicts.md) y las capturas conservan ese resultado.

Los dos rojos son US-180 (descarga CSV) y US-167 (reporte sin cuenta), explícitamente en el backlog fuera de R7. No se reclasifica la suite completa como verde.

Los criterios de R7 comprobados:

| Criterio | Resultado |
|---|---|
| Materia 211 | 2 de 3 cátedras publican. |
| Pérez | 16 reseñas; Faltaron muchas: 56 % contra 0 %, con 16 y 12 voces. Ruiz no aporta al contraste. |
| Ibáñez | 16 reseñas y 3 respuestas convergentes, con sus sustentos. |
| Aráoz | Dos tramos, 7 y 6 voces, con aviso explícito de corte no comparable. |
| Ruiz | 6 reseñas, faltan 4, sin conteos publicados. |
| Bravo | 9 reseñas, falta 1, sin conclusiones publicadas. |
| Método | 14 preguntas vigentes, sin frases destiladas de prueba. |
| Celular de 393 px | Ficha y Método sin desborde horizontal. |

Se inspeccionaron visualmente las capturas de Pérez, Ibáñez y Ruiz: contenido renderizado y lectura sin cuenta. La tabla del recorrido conserva dos descripciones antiguas que contradicen sus propios resultados: dice que solo existe una lente y que la búsqueda no devuelve carreras. No se usan esas frases como evidencia. Se comprobó aparte `/careers` renderizado, con las pestañas Universidades y Carreras y las ofertas agrupadas para comparar; el resultado de búsqueda registrado sí incluye la Tecnicatura etiquetada Carrera.

## Límite del cierre

Las escrituras de Lucía, Matías y Copas se verificaron antes del reset y no se repitieron después. Esta preparación deja el corpus limpio para la demo. El cierre administrativo de R7 todavía requiere integrar las evidencias y publicar el tag narrativo sobre el SHA que se mostrará; no se afirma que ese tag exista.
