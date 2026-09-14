# El guion de la demo (R7, viernes 2026-09-18)

Lo que se muestra y en qué orden, sobre el stage (`https://planb.olisar.com.ar`) sembrado el jueves. El hilo del sprint es "la demo muestra la tesis": cada paso enseña una promesa de [`THESIS.md`](../THESIS.md) funcionando con datos del corpus de demostración y del relevamiento oficial. Tarea [#528](https://github.com/lucasidev/plan-b/issues/528) de [R7](status.md).

## Antes de arrancar (jueves a la tarde, en este orden)

1. Todo lo de R7 mergeado y el stage sirviendo ese SHA: `/health` devuelve el SHA de `main` (el deploy es automático; si CI de `main` cayó por una intermitente, relanzar el job y después el gate de deploy, como el 2026-09-14).
2. Los recorridos con cuenta (`just walk lucia`, `just walk matias`, `just walk copas`) corren **antes** del reset y nunca después: ensucian el corpus (P02, [#526](https://github.com/lucasidev/plan-b/issues/526)).
3. Reset y seed del stage ([runbook](../engineering/runbook.md), caso 7): la base queda con el catálogo, las personas, los datos oficiales y el corpus de demostración (Pérez en 14 con la comparación, Ibáñez en 16 con la fama, Aráoz con el corte de serie, Ruiz en 6 bajo el piso, Bravo en 9 a una de publicar).
4. La importación de la AGN desde el backoffice (`/admin/universities`): el seed no la trae.
5. Mailpit del stage arriba y accesible: la cuenta nueva de la demo verifica su mail ahí.
6. Una pasada de los recorridos sin cuenta (`just walk valentina`, `just walk sofia`) sobre el stage ya sembrado: ninguno de los dos escribe.
7. El tag narrativo sobre el SHA que se muestra (`presentacion-...`, [ADR-0089](../decisions/0089-the-stage-follows-main-and-production-is-promoted-from-a-release.md)).
8. Las cuentas de prueba, verificadas a mano el mismo jueves: una cuenta de alumno con reseñas (Lucía Mansilla, dos reseñas del corpus), una sin reseñas (Matías Ledesma) y la de administración. Las credenciales viven en `.env.stage.local`, nunca en el repo ni en el guion.
9. Una cuenta de alumno nueva para crear en vivo: un mail que Mailpit reciba y que no exista todavía.

## El camino (unos veinte minutos)

Cada paso dice la URL, qué se ve y qué promesa de la tesis está mostrando. Si un paso falla en vivo, se sigue con el siguiente: ninguno depende del anterior salvo la reseña y Mis aportes.

### 1. La entrada, sin cuenta

`/`. Qué es plan-b en una pantalla, con una ficha real de muestra. Leer no pide cuenta ("Posición tomada").

### 2. Explorar: el país en dos lentes

`/universities`. La barra lateral de la aplicación (Explorar, y Otros: Método, Ajustes, Ayuda, Sobre plan-b), sin cuenta: "Ingresar" arriba a la derecha. Las universidades con cuántas carreras tienen y cuáles juntan reseñas. A la derecha, "Lo que los datos dicen": la universidad más elegida, la carrera más ofrecida, la carrera con mejor tiempo de salida, la universidad donde más alumnos avanzan, la evaluación de la entidad auditora, cada línea con su fuente y quién no informa ([ADR-0096](../decisions/0096-explorar-interprets-official-data-by-institution-and-career.md)).

`/careers`. La otra lente: las carreras que se dictan en más de una institución, para comparar lado a lado, y las que se dictan en una sola.

### 3. La institución

`/universities/unsta/careers`. Los números de la institución con su fuente, las facultades con sus carreras (la Tecnicatura con sus reseñas), y la transparencia: lo que la institución publica y lo que no ("La institución no lo publica"), verificado a fuente pública ("Qué publicamos", relevamiento oficial).

### 4. La carrera y dónde estudiarla

`/careers/00000002-0000-4000-a000-000000000003`. La Tecnicatura: los datos oficiales en lenguaje de lector (dura en el papel, egreso por cohorte derivado con su regla en Método, "No publicado por falta de datos", "No aplica a esta carrera"), cuánto de la carrera está medido, el plan por año con las materias que ya juntan reseñas, y "Por dónde empezar".

`/careers/00000002-0000-4000-a000-000000000003/where-to-study`. La misma carrera en las tres instituciones que la dictan, con los datos oficiales medidos igual para todas: sin compuesto, sin ganador ("Qué no hace").

### 5. La materia 211 y sus cátedras

`/subjects/00000004-0000-4000-a000-000000000012`. Control de Calidad: reseñas en tres cátedras, "Depende de cuál te toque", y una conclusión por cátedra dicha en una frase con su porcentaje y sus reseñas; Ruiz "todavía sin conclusiones".

### 6. Las cátedras: fama, comparación, corte y piso

- `/chairs/00000008-0000-4000-a000-000000000004`, Ibáñez: la fama arriba (varias frases apuntando al mismo lado, "Convergencia") y las distribuciones con sus voces.
- `/chairs/00000008-0000-4000-a000-000000000001`, Pérez: "Comparada con las otras cátedras" de la misma materia, la frase donde Pérez difiere de sus hermanas con los dos porcentajes a la vista ("Comparación entre hermanas").
- `/chairs/00000008-0000-4000-a000-000000000007`, Aráoz: una frase que cambió de significado y su serie cortada, los dos tramos sin sumar ("Frase", código estable).
- `/chairs/00000008-0000-4000-a000-000000000003`, Ruiz: bajo el piso, "Junta 6 reseñas: con 4 más se publica" ("Piso", la privacidad de quien reseña).

### 7. Método

`/method` y `/method#graduation-flow-proxy`. Las reglas con las que se calcula todo lo anterior, incluida la del egreso por cohorte derivado. Sin frases de prueba (el reset las sacó).

### 8. La cuenta, la reseña, Mis aportes

- "+ Escribir reseña" sin cuenta lleva a la puerta con el motivo. Crear la cuenta nueva en vivo (la carrera se declara ahí, [ADR-0086](../decisions/0086-the-product-informs-it-does-not-track-your-degree.md)), verificar el mail en Mailpit y volver a la reseña.
- `/reviews/new`: reseñar una cursada de Bravo (`/chairs/00000008-0000-4000-a000-000000000008` está en 9): las tres capas, saltear vale, el campo libre que no se publica. Al guardar, Bravo publica: la décima reseña es la del público.
- `/reviews/mine`: Mis aportes con la reseña recién hecha y "junta 10 reseñas"; Editar y Borrar (Borrar en alarma). Con la cuenta de Lucía: sus dos reseñas, "Tu carrera" con el plan y cuánto está medido.

### 9. El backoffice

Con la cuenta de administración: `/admin/chairs` (la cátedra, el docente como se tipeó) y `/admin/curation` (una frase destilada del campo libre entrando a la versión siguiente del instrumento, "Curaduría").

## Si algo se rompe en vivo

- El stage no responde: el stack local con `just dev` y el mismo seed (`seed-db`, con `PLANB_SEED_CORPUS`), mismas URL con `http://localhost:3000`.
- Una pantalla falla: se sigue con la siguiente; el guion no tiene pasos que dependan de otro salvo el 8.
- La sesión se corta: es el criterio 1 de R7; volver a entrar y anotarlo como hallazgo.

## Listo cuando

El jueves a la tarde el guion se camina de punta a punta sobre el stage sembrado sin sorpresas, y lo que sorprenda queda anotado en el tracker con destino.
