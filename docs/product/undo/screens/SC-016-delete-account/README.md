# Baja (la pantalla)

> Ficha de pantalla, dueña: la épica [Deshacer](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html); revisada el 2026-08-19 ([registro](../../../../history/reviews/2026-08-19-epics-and-screens.md)); hi-fi pendiente. Con cuenta: la propia, desde Mi perfil. Sin slug.

## Quién la usa

Quien ya aportó y quiere irse: Matías o Lucía cuando dejan la carrera y no vuelven más, Diego cuando ya contó por qué se fue y no le queda nada más para decir. El flujo completo: [`flow.md`](../../flow.md).

## Qué stories resuelve

US-166 (dueña): los aportes se borran de a uno antes, en [Editar](../SC-017-edit/README.md); la baja de cuenta anonimiza la identidad y preserva lo que quedó aportado, hechos de trayectoria incluidos, exactos; y la pantalla lo dice con esas palabras antes de confirmar. La letra completa: [README de la épica](../../README.md).

## Qué muestra

- **Qué pasa, con esas palabras**: tu nombre se borra y tu mail se convierte en un hash irreversible (ADR-0044): queda solo para detectar cuentas repetidas, nadie puede volver de ahí a tu mail. Tus reseñas, tus frases marcadas y tus hechos de trayectoria (cuándo entraste, si te fuiste o te recibiste, cuándo) quedan publicados exactos, sin vos atrás. Es irreversible: si volvés, es con una cuenta nueva.
- **Confirmar**: una acción explícita (no un solo click apurado) que repite que no se puede deshacer, antes del botón final.

## Estados

- **Con aportes pendientes de borrar sugeridos**: antes de confirmar, la pantalla lista lo que diste (reseñas, hechos de trayectoria) con un link a Editar para cada uno, por si hay algo puntual que preferís sacar antes en vez de dejarlo publicado y anónimo.
- **Confirmada**: la cuenta ya se anonimizó; se cierra la sesión y vuelve a Ingresar.

## Lo que no muestra nunca

Una forma de recuperar la cuenta o el mail después de confirmar (ADR-0044: es terminal); un cero o un resumen inventado de lo aportado; cualquier aporte de otra cuenta.

## Adónde va

Llega desde Mi perfil. Antes de confirmar puede desviarse a [Editar](../SC-017-edit/README.md) para sacar algo puntual. Al confirmar, cierra la sesión y vuelve a Ingresar.

## Decisiones que aplica

[ADR-0044](../../../../decisions/0044-soft-delete-of-the-user-with-corpus-preservation.md) (soft delete con anonimización, preserva el corpus, operación irreversible), D10 ([registro del 17](../../../../history/reviews/2026-08-17-catalog-propagation.md): los hechos de trayectoria quedan exactos y ya anónimos), [ADR-0067](../../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (una baja no recalcula una cohorte ni generaliza un año a rango).

## Lo que esta ficha deja abierto

- **El copy exacto** de "qué pasa": el ADR y US-166 fijan el contenido, no la redacción final.
- **Si la lista de aportes pendientes de borrar sugeridos se muestra siempre o solo cuando hay algo "sensible"** (un comentario, por ejemplo, contra una frase marcada sola).
- **Qué pasa con una réplica publicada sobre un testimonio del que se dio de baja**: no está resuelto en ninguna decisión (ver también Editar).
