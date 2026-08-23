# Moderar sin romper el producto: el flujo

> Reemplaza a las filas BO-3 (Moderar sin bajar la queja incómoda), BO-4 (Ver un nombre una sola vez), BO-8 (Lo que el chequeo previo retuvo), BO-6 (Cuando alguien intenta inflar el corpus) y la mitad de BO-7 (Cuando la cola nos gana) que habla de la cola de moderación, de la tabla de flujos del [mapa](../../map.md). Personas: Nahuel (BO-3, BO-6, BO-7, BO-8), Camila (BO-4). Disparador: un reporte con mail confirmado, algo que el chequeo previo retuvo al publicarse, una constancia, una identidad docente o un cargo institucional que alguien sube para verificar, que pase un año desde la última verificación, o un patrón de cuentas o de reportes que no se explica por cuánta gente vivió lo mismo. Stories que cubre: US-205 a US-210, US-211, US-212, US-213, US-214, US-167, US-178, US-181, US-186, US-225, US-226.

### BO-3: moderar sin bajar la queja incómoda

```mermaid
flowchart TD
  A([Reporte con mail confirmado, US-167]) --> B[Reportes: sigue publicado mientras espera]
  B -->|riesgo inmediato, con criterio escrito| B1[Se despublica antes de resolver]
  B --> C{¿Expone a una persona fuera de su acto?}
  B1 --> C
  C -->|sí| D[Se baja el texto, con su categoría:<br/>nunca la voz, sus frases siguen contando]
  D --> E[La ficha muestra el texto retirado, US-186]
  C -->|no, es queja dura contra la cátedra o la institución| F([Queda publicado: no es causal])
  E --> G[El criterio aplicado va al mail del que reportó, US-206]
  F --> G
  G --> H([Lo bajado queda contable por categoría, US-181])
```

Pantalla: [Reportes](screens/SC-031-reports/README.md).

### BO-8: lo que el chequeo previo retuvo

```mermaid
flowchart TD
  A([Comentario o réplica que el chequeo previo retuvo<br/>al publicarse en Reseñar o Replicar]) --> B[Reportes: cola de retenidos<br/>con la parte marcada, US-209]
  B --> C{Una persona lo mira}
  C -->|libera| D([Se publica])
  C -->|baja| E([Se baja, con su categoría, US-186])
  D --> G[Quien lo escribió ve que estuvo retenido y por qué]
  E --> G
  G --> H([Nada se publica solo por vencimiento de tiempo])
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
  H -->|aprueba| I([Con autor y fecha: habilita la réplica, US-178])
  H -->|rechaza| J([Con autor y fecha: no habilita la réplica ni marca a nadie])
  K([Cargo institucional]) --> L[Verificaciones: se prueba contra los cargos<br/>que el catálogo tiene cargados de esa institución, en su propia cola, US-225]
  L -->|el catálogo no tiene ese cargo| L1([Pasa a cargarse como trabajo de catálogo:<br/>se resuelve cuando el dato está])
  L --> M{Aprobar o rechazar}
  M -->|aprueba| N([Con autor y fecha: habilita la réplica, US-225])
  M -->|rechaza| O([Con autor y fecha: no habilita la réplica ni marca a nadie])
  I -.->|al año, US-226| H
  N -.->|al año, US-226| M
```

Pantalla: [Verificaciones](screens/SC-032-verifications/README.md).

### Cuando la cola nos gana: cuarenta reportes, treinta retenidos

```mermaid
flowchart TD
  G([Reportes: cuarenta reportes y treinta retenidos]) --> H[Separa las dos colas: lo retenido, que nadie leyó y no está publicado,<br/>de lo reportado, que sigue publicado]
  H --> I[Dice cuánto se tarda y qué queda para después;<br/>prioriza lo sin publicar, no el orden de llegada, US-212]
  I --> J([Lo que queda para después queda a la vista, con su demora:<br/>nada se resuelve ni se publica solo por vencimiento])
```

Pantalla: [Reportes](screens/SC-031-reports/README.md).

> **La cola de Verificaciones también se desborda, y no la absorbe esta persona.** Verificación y moderación no pueden convivir en el mismo rol ([US-217](../cut-the-access/README.md#stories)): es imposible de asignar, no algo que se audite después. Su sobrecarga se prioriza igual (US-212) pero en [Verificaciones](screens/SC-032-verifications/README.md) y con otro operador. El caso de la constancia adulterada se resuelve ahí, y está dibujado en BO-4.

### BO-6: cuando alguien intenta inflar el corpus

```mermaid
flowchart TD
  G([Un grupo de cuentas reseña la misma cátedra]) --> H{Reportes: la alarma mira la procedencia,<br/>fecha de alta, patrón idéntico, ausencia de trayectoria}
  H -->|coincide, no es cuestión de volumen| I[Las cuentas quedan marcadas:<br/>no suman voces ni entran a ningún agregado de trayectoria, US-213]
  I --> J([Los conteos se pueden congelar sin borrar nada])
  H -->|cuarenta cuentas con historia distinta| K([No dispara la alarma])
  L([Doce reportes contra lo que critica a la misma facultad]) --> M[Se agrupan por objetivo y ventana de 72 horas;<br/>el mail confirmado deduplica, D05]
  M --> N([Se resuelven con un criterio, no de a uno, US-214])
```

Pantalla: [Reportes](screens/SC-031-reports/README.md).

## Salidas y errores

- **El único caso que despublica antes de resolver es el riesgo inmediato**, con criterio escrito: todo lo demás reportado sigue visible mientras espera.
- **La queja dura contra la cátedra o la institución no es causal**: se modera la exposición de una persona, no lo que incomoda a quien evalúan.
- **Nada baja ni se publica solo por cantidad ni por vencimiento**: en las dos colas de Reportes decide una persona.
- **La constancia adulterada se rechaza con motivo y sin marcar** a quien la subió: puede volver a intentar (US-211).
- **Rechazar la identidad docente no habilita la réplica ni marca a nadie**: no es una sanción, es la ausencia del permiso. Lo mismo vale para el cargo institucional (US-225); si el catálogo todavía no tiene ese cargo cargado, el pedido pasa a catálogo en vez de rechazarse.
- **Una identidad verificada, docente o institucional, vence al año y vuelve a la cola para revisarse de nuevo**: lo ya publicado con ella no se retira, porque era cierto cuando se publicó (US-226).
- **Lo retenido no es lo reportado**: lo retenido nadie lo leyó y no está publicado; lo reportado sigue publicado mientras espera; la cola prioriza lo sin publicar (US-212).
- **Cuarenta cuentas con historia distinta reseñando la misma cátedra no disparan la alarma**: mira la procedencia, no el volumen (US-213); una cuenta marcada deja de sumar, pero su reseña no se borra; congelar un conteo no lo pone en cero.
- **El mail confirmado deduplica**: dos reportes del mismo mail sobre el mismo objetivo cuentan uno (D05, US-214).

## Lo que el flujo no dibuja y la ficha de la pantalla decide

Qué ve exactamente Nahuel de un comentario retenido, la reseña entera o solo la parte marcada; cómo se ordenan entre sí las dos colas de Reportes cuando las dos tienen pendientes; el copy exacto del estado "retenido" que ve el autor.
