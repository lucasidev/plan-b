# Moderar sin romper el producto: el flujo

> Reemplaza a las filas BO-3 (Moderar sin bajar la queja incómoda), BO-4 (Ver un nombre una sola vez), BO-8 (Lo que el chequeo previo retenía) y BO-6 (Cuando alguien intenta inflar el corpus) de la tabla de flujos del [mapa](../../map.md); ya no hay contenido público que reportar, así que BO-3 y BO-8 se reemplazan por el filtro grueso del campo libre y el canal de reclamos. Personas: Nahuel (filtro grueso, reclamos, cuentas correlacionadas), Camila (verificaciones). Disparador: una reseña que carga su campo libre, una institución que objeta un dato publicado, una constancia, una identidad docente o un cargo institucional que alguien sube para verificar, que pase un año desde la última verificación, o un patrón de cuentas que no se explica por cuánta gente vivió lo mismo. Stories que cubre: US-207, US-208, US-210, US-211, US-212, US-213, US-214, US-225, US-226.

### El filtro grueso del campo libre

```mermaid
flowchart TD
  A([Una reseña carga su campo libre]) --> B{El filtro automático<br/>ADR-0055, repropuesto}
  B -->|no dispara| C([Pasa a la cola normal de curaduría:<br/>Sostener el catálogo])
  B -->|dispara: agresión dirigida o dato personal de un tercero| D[Reportes: cola de campo libre filtrado]
  D --> E{Nahuel lo mira}
  E -->|lo libera| C
  E -->|lo descarta| F([No pasa a curaduría: no se destila ni se cita, nunca se publicó])
```

Pantalla: [Reportes](screens/SC-031-reports/README.md).

### El canal de reclamos

```mermaid
flowchart TD
  A([Una institución objeta una nota editorial<br/>o un dato relevado como publicado]) --> B[Reportes: cola de reclamos, con el dato<br/>y el motivo del reclamo]
  B --> C{Nahuel revisa contra la fuente}
  C -->|el reclamo tiene razón| D([Se corrige el dato o se retira la nota,<br/>con quién lo resolvió y cuándo])
  C -->|el reclamo no tiene razón| E([El dato queda igual: el reclamo no lo baja solo])
  D --> F([El dato no baja solo por reclamarlo: lo resuelve una persona])
  E --> F
```

Pantalla: [Reportes](screens/SC-031-reports/README.md).

### BO-4: ver un nombre una sola vez

```mermaid
flowchart TD
  A([Constancia de alumno]) --> B[Verificaciones: se compara contra lo declarado,<br/>viendo lo mínimo, US-207]
  B --> C{Aprobar o rechazar}
  C -->|aprueba| D([El documento se destruye al resolver:<br/>sin camino a los aportes de esa cuenta, US-208])
  C -->|rechaza, adulterada| E([Motivo, sin marcar: puede volver a intentar, US-211])
  F([Identidad docente]) --> G[Verificaciones: se prueba contra el equipo docente<br/>que el catálogo tiene cargado, en su propia cola, US-210]
  G --> H{Aprobar o rechazar}
  H -->|aprueba| I([Con autor y fecha: habilita Responder, US-178 de Responder])
  H -->|rechaza| J([Con autor y fecha: no habilita Responder ni marca a nadie])
  K([Cargo institucional]) --> L[Verificaciones: se prueba contra los cargos<br/>que el catálogo tiene cargados de esa institución, en su propia cola, US-225]
  L -->|el catálogo no tiene ese cargo| L1([Pasa a cargarse como trabajo de catálogo:<br/>se resuelve cuando el dato está])
  L --> M{Aprobar o rechazar}
  M -->|aprueba| N([Con autor y fecha: habilita Responder, US-225])
  M -->|rechaza| O([Con autor y fecha: no habilita Responder ni marca a nadie])
  I -.->|al año, US-226| H
  N -.->|al año, US-226| M
```

Pantalla: [Verificaciones](screens/SC-032-verifications/README.md).

### Cuando la cola nos gana

```mermaid
flowchart TD
  G([Reportes: campo libre filtrado sin revisar<br/>y reclamos pendientes]) --> H[Separa las dos colas]
  H --> I[Dice cuánto se tarda y qué queda para después;<br/>prioriza según su propio criterio, no el orden de llegada, US-212]
  I --> J([Lo que queda para después queda a la vista, con su demora:<br/>nada se resuelve solo por vencimiento])
```

Pantalla: [Reportes](screens/SC-031-reports/README.md).

> **La cola de Verificaciones también se desborda, y no la absorbe esta persona.** Verificación y moderación no pueden convivir en el mismo rol ([US-217](../cut-the-access/README.md#stories)): es imposible de asignar, no algo que se audite después. Su sobrecarga se prioriza igual (US-212) pero en [Verificaciones](screens/SC-032-verifications/README.md) y con otro operador. El caso de la constancia adulterada se resuelve ahí, y está dibujado arriba.

### Cuando alguien intenta inflar el corpus

```mermaid
flowchart TD
  G([Un grupo de cuentas reseña la misma cátedra]) --> H{Reportes: la alarma mira la procedencia,<br/>fecha de alta, patrón idéntico, ausencia de trayectoria}
  H -->|coincide, no es cuestión de volumen| I[Las cuentas quedan marcadas:<br/>no suman voces ni entran a ningún agregado de trayectoria, US-213]
  I --> J([Los conteos se pueden congelar sin borrar nada])
  H -->|cuarenta cuentas con historia distinta| K([No dispara la alarma])
  L([Doce reclamos contra el mismo dato de la misma institución]) --> M[Se agrupan por objetivo y ventana de 72 horas;<br/>el mail confirmado deduplica, D05]
  M --> N([Se resuelven con un criterio, no de a uno, US-214])
```

Pantalla: [Reportes](screens/SC-031-reports/README.md).

## Salidas y errores

- **El filtro grueso del campo libre no bloquea nada público**: el campo libre nunca se publicó, así que lo único que decide es si pasa a curaduría filtrado o directo.
- **Ningún reclamo baja un dato solo**: en las dos colas de Reportes decide una persona, con un criterio escrito.
- **La constancia adulterada se rechaza con motivo y sin marcar** a quien la subió: puede volver a intentar (US-211).
- **Rechazar la identidad docente no habilita Responder ni marca a nadie**: no es una sanción, es la ausencia del permiso. Lo mismo vale para el cargo institucional (US-225); si el catálogo todavía no tiene ese cargo cargado, el pedido pasa a catálogo en vez de rechazarse.
- **Una identidad verificada, docente o institucional, vence al año y vuelve a la cola para revisarse de nuevo**: lo ya publicado con ella no se retira, porque era cierto cuando se publicó (US-226).
- **Cuarenta cuentas con historia distinta reseñando la misma cátedra no disparan la alarma**: mira la procedencia, no el volumen (US-213); una cuenta marcada deja de sumar, pero su reseña no se borra; congelar un conteo no lo pone en cero.
- **El mail confirmado deduplica**: dos reclamos del mismo mail sobre el mismo objetivo cuentan uno (D05, US-214).

## Lo que el flujo no dibuja y la ficha de la pantalla decide

Cómo se ordenan entre sí las colas de Reportes cuando las tres (filtro, reclamos, alarma) tienen pendientes; el copy exacto del criterio escrito de cada guardia.
