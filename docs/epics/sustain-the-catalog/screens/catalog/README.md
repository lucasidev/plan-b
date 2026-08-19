# Catálogo (la pantalla)

> Ficha de pantalla, dueña: la épica [Sostener el catálogo](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de varias vistas (huecos, cargar el plan, cátedras, atar la canónica, publicar, editar, reforma, materias declaradas); revisión adversarial pendiente antes del hi-fi. Backoffice, rol catálogo (hoy Sofía). Slug hoy `/admin/universities`, `/admin/teachers`, `/admin/commissions` (existe el ABM; el contenido se rehace, del inventario).

## Quién la usa

**Sofía** ("puedo cargar dos carreras por semana. Este mes me pidieron once"): carga planes, correlativas, la duración nominal, las cátedras y las materias canónicas a mano, porque la calidad del dato base es lo único que no se crowdsourcea, y decide qué ofertas de distintas instituciones son la misma carrera canónica. El flujo entero: [`flow.md`](../../flow.md), secciones BO-1 y BO-5.

## Qué stories resuelve

BO1-1 (dueña: la pantalla abre por huecos, y entre ellos los dos que bloquean publicar), BO1-6 (la cátedra como entidad propia, con su titular), BO1-5 (atar la oferta a su carrera canónica, con autor y fecha), BO4-3 (la fuente que no existe o se contradice, marcada, sin bloquear la carga), BO4-2 (editar una oferta publicada y avisar a quien la tiene marcada), BO5-1 (los dos planes conviviendo cuando la facultad reforma), BO1-7 (la cola de materias declaradas, para vincular o fusionar contra la canónica). La letra de cada una: [README de la épica](../../README.md#stories).

## Qué muestra, paso por paso

Para una oferta que se está cargando por primera vez:

1. **Huecos primero**: la pantalla abre listando las ofertas por cuántos campos les faltan, no por las que ya están casi listas; entre los huecos, dos bloquean publicar y se marcan aparte, la duración nominal del plan y la carrera canónica (BO1-1).
2. **Cargar el plan**: duración nominal (sin ella no hay brecha ni cohorte cerrada, ADR-0067) y materias canónicas del plan, con su año; el contador de huecos baja a medida que se completa.
3. **Cátedras**: se cargan como entidad propia, el equipo docente a cargo de una materia con su titular, no como comisión; persisten entre períodos (BO1-6).
4. **Atar la carrera canónica**: buscar una carrera canónica existente o declarar una nueva; la decisión queda con quién la tomó y cuándo (BO1-5). Es lo que permite que Dónde estudiarla compare esta oferta con las de otras instituciones.
5. **Publicar**: bloqueado mientras falte un hueco bloqueante, aunque el resto esté cargado (BO1-1); resueltos los dos, el botón se habilita.

**La fuente sin oficializar** (BO4-3): un campo admite marcarse "fuente: no oficial" cuando la facultad no publica el plan o publica versiones que no coinciden; no bloquea cargar, y la ficha pública lo muestra.

**Editar una oferta publicada** (BO4-2): cualquier campo se puede corregir después de publicada; guardar dispara el aviso a quienes la tienen marcada, con qué cambió.

**Cuando la facultad reforma el plan** (BO5-1): el plan nuevo no reemplaza al viejo, coexisten con su año; cada reseña ya hecha queda pegada al período y a la materia canónica, no a la fila del plan, así que reformar no parte el corpus en dos (D04).

**La cola de materias declaradas** (BO1-7): lo que alguien nombró al reseñar y el catálogo no tenía, con cuántas personas lo nombraron; se vincula a una materia canónica existente o se fusiona o crea una nueva, y queda registrado quién lo hizo.

## Lo que no muestra nunca

Una oferta publicada a medias: mientras falte un hueco bloqueante la oferta no sale, aunque el resto esté cargado (BO1-1); una carrera canónica decidida por parecido de nombre, es una decisión editorial registrada con autor y fecha, nunca automática (BO1-5); quién nombró una materia pendiente de vincular, solo cuántas personas lo hicieron.

## Adónde va

Llega desde [Pedidos](../requests/README.md) (cada fila abre la oferta que le corresponde) y directo, para reformar un plan o corregir algo que ya está publicado. Lo que se publica acá alimenta la Ficha de carrera, la Ficha de materia, la [Ficha de cátedra](../../../../design/screens/chair/README.md) y [Dónde estudiarla](../../../choose-where-to-study/screens/where-to-study/README.md); marcar una oferta como cargada dispara el aviso desde Pedidos.

## Decisiones que aplica

[ADR-0067](../../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (la carrera canónica curada por nosotros, la duración nominal del plan), los tres planos del [mapa de producto](../../../../design/product-map.md) (el catálogo lo cargamos nosotros, a mano y completo), D04 ([registro del 17](../../../../reviews/2026-08-17-catalog-propagation.md): con dos planes, la cobertura se mide sobre las materias canónicas de la carrera, la unión de los dos).

## Lo que esta ficha deja abierto

- **Qué pasa con las reseñas ya publicadas cuando se fusionan dos materias canónicas**: si las voces de las dos se suman directo o hay un paso de revisión (BO1-7, abierto también en el README de la épica).
- **Quién decide la carrera canónica cuando dos ofertas son parecidas pero no iguales**: BO1-5 pide que la decisión quede registrada con autor y fecha, no el criterio para tomarla.
- **Si la cátedra sigue siendo la misma entidad cuando cambia el titular**, o eso la vuelve una cátedra nueva (BO1-6).
- **Cómo se prioriza entre varios huecos bloqueantes a la vez**, cuando una oferta tiene más de uno (el flujo no lo dibuja).
