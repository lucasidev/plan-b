# Moderar sin romper el producto: el flujo

> Reemplaza a las filas BO-3 (Moderar sin bajar la queja incómoda), BO-4 (Ver un nombre una sola vez), BO-8 (Lo que el chequeo previo retuvo), BO-6 (Cuando alguien intenta inflar el corpus) y la mitad de BO-7 (Cuando la cola nos gana) que habla de la cola de moderación, de la tabla de flujos del [mapa](../../design/product-map.md). Personas: Nahuel (BO-3, BO-6, BO-7, BO-8), Camila (BO-4). Disparador: un reporte con mail confirmado, algo que el chequeo previo retuvo al publicarse, una constancia o una identidad docente que alguien sube para verificar, o un patrón de cuentas o de reportes que no se explica por cuánta gente vivió lo mismo. Stories que cubre: BO2-1 a BO2-6, BO4-4, BO4-6, BO5-2, BO5-3, O5-4, O7-8, O8-6, O8-7.

### BO-3: moderar sin bajar la queja incómoda

```mermaid
flowchart TD
  A([Reporte con mail confirmado, O5-4]) --> B[Sigue publicado mientras espera]
  B -->|riesgo inmediato, con criterio escrito| B1[Se despublica antes de resolver]
  B --> C{¿Expone a una persona fuera de su acto?}
  B1 --> C
  C -->|sí| D[Se baja el texto, con su categoría:<br/>nunca la voz, sus frases siguen contando]
  D --> E[La ficha muestra el texto retirado, O8-7]
  C -->|no, es queja dura contra la cátedra o la institución| F([Queda publicado: no es causal])
  E --> G[El criterio aplicado va al mail del que reportó, BO2-2]
  F --> G
  G --> H([Lo bajado queda contable por categoría, O8-6])
```

### BO-8: lo que el chequeo previo retuvo

```mermaid
flowchart TD
  A([Comentario o réplica que el chequeo previo retuvo<br/>al publicarse en Reseñar o Replicar]) --> B[Reportes: cola de retenidos<br/>con la parte marcada, BO2-5]
  B --> C{Una persona lo mira}
  C -->|libera| D([Se publica])
  C -->|baja| E([Se baja, con su categoría, O8-7])
  C -->|vuelve al autor| F([No se publica: puede reescribirlo])
  D --> G[Quien lo escribió ve que estuvo retenido y por qué]
  E --> G
  F --> G
  G --> H([Nada se publica solo por vencimiento de tiempo])
```

### BO-4: ver un nombre una sola vez

```mermaid
flowchart TD
  A([Constancia de alumno]) --> B[Verificaciones: se compara contra lo declarado,<br/>viendo lo mínimo, BO2-3]
  B --> C{Aprobar o rechazar}
  C -->|aprueba| D([El documento se destruye al resolver:<br/>sin camino a los aportes de esa cuenta, BO2-4])
  C -->|rechaza, adulterada| E([Motivo, sin marcar: puede volver a intentar, BO4-4])
  F([Identidad docente]) --> G[Verificaciones: se prueba contra la cátedra<br/>que dice tener, en su propia cola, BO2-6]
  G --> H{Aprobar o rechazar}
  H -->|aprueba| I([Con autor y fecha: habilita la réplica, O7-8])
  H -->|rechaza| J([Con autor y fecha: no habilita la réplica ni marca a nadie])
```

### Cuando la cola nos gana: cuarenta reportes, treinta retenidos

```mermaid
flowchart TD
  G([Reportes: cuarenta reportes y treinta retenidos]) --> H[Separa las dos colas: lo retenido, que nadie leyó y no está publicado,<br/>de lo reportado, que sigue publicado]
  H --> I[Dice cuánto se tarda y qué queda para después;<br/>prioriza lo sin publicar, no el orden de llegada, BO4-6]
  I --> J[Entre lo que resuelve: una constancia resulta adulterada]
  J --> K([Rechazo con motivo, sin marcar a quien la subió:<br/>puede volver a intentar, BO4-4])
```

### BO-6: cuando alguien intenta inflar el corpus

```mermaid
flowchart TD
  G([Un grupo de cuentas reseña la misma cátedra]) --> H{La alarma mira la procedencia:<br/>fecha de alta, patrón idéntico, ausencia de trayectoria}
  H -->|coincide, no es cuestión de volumen| I[Las cuentas quedan marcadas:<br/>no suman voces ni entran a ningún agregado de trayectoria, BO5-2]
  I --> J([Los conteos se pueden congelar sin borrar nada])
  H -->|cuarenta cuentas con historia distinta| K([No dispara la alarma])
  L([Doce reportes contra lo que critica a la misma facultad]) --> M[Se agrupan por objetivo y ventana de 72 horas;<br/>el mail confirmado deduplica, D05]
  M --> N([Se resuelven con un criterio, no de a uno, BO5-3])
```

## Salidas y errores

- **El único caso que despublica antes de resolver es el riesgo inmediato**, con criterio escrito: todo lo demás reportado sigue visible mientras espera.
- **La queja dura contra la cátedra o la institución no es causal**: se modera la exposición de una persona, no lo que incomoda a quien evalúan.
- **Nada baja ni se publica solo por cantidad ni por vencimiento**: en las dos colas de Reportes decide una persona.
- **La constancia adulterada se rechaza con motivo y sin marcar** a quien la subió: puede volver a intentar (BO4-4).
- **Rechazar la identidad docente no habilita la réplica ni marca a nadie**: no es una sanción, es la ausencia del permiso.
- **Lo retenido no es lo reportado**: lo retenido nadie lo leyó y no está publicado; lo reportado sigue publicado mientras espera; la cola prioriza lo sin publicar (BO4-6).
- **Cuarenta cuentas con historia distinta reseñando la misma cátedra no disparan la alarma**: mira la procedencia, no el volumen (BO5-2); una cuenta marcada deja de sumar, pero su reseña no se borra; congelar un conteo no lo pone en cero.
- **El mail confirmado deduplica**: dos reportes del mismo mail sobre el mismo objetivo cuentan uno (D05, BO5-3).

## Lo que el flujo no dibuja y la ficha de la pantalla decide

Qué ve exactamente Nahuel de un comentario retenido, la reseña entera o solo la parte marcada; cómo se ordenan entre sí las dos colas de Reportes cuando las dos tienen pendientes; el copy exacto del estado "retenido" que ve el autor.
