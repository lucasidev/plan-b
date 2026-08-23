# Sostener el catálogo: el flujo

> Reemplaza a las filas BO-1 (Cargar lo que piden, por prioridad), BO-2 (Contrastar una corrección contra la fuente), BO-9 (Destilar y clasificar frases nuevas), BO-5 (Cuando la facultad reforma el plan) y la mitad de BO-7 (Cuando la cola nos gana) que habla de la cola del catálogo, de la tabla de flujos del [mapa](../../map.md). Persona: Sofía (BO-1, BO-2, BO-5, BO-7) y quien cura las frases (BO-9). Disparador: la cola de pedidos, una corrección que llega desde una ficha, los comentarios que se acumulan para destilar, o la facultad publicando un plan nuevo. Stories que cubre: US-191 a US-199, US-200, US-201, US-202, US-203, US-204, US-189, US-224.

### BO-1: cargar lo que piden, por prioridad

```mermaid
flowchart TD
  A([Pedidos: la cola ordenada por cantidad confirmada<br/>con la institución de origen, US-192]) --> B[Catálogo abre por huecos: los que bloquean primero,<br/>duración nominal y carrera canónica, US-191]
  B --> C[Carga el plan, las materias canónicas y las cátedras:<br/>el equipo docente a cargo, US-196]
  C --> D[Ata la oferta a su carrera canónica<br/>con autor y fecha, US-195]
  D --> E{Terminó la oferta}
  E -->|no| B
  E -->|sí| F([Se publica: no antes, US-191])
  F --> G[Aviso a todos los que la pidieron, US-193 → Pedir una carrera]
  H([Cola de materias declaradas: cuántas personas<br/>nombraron cada una, US-197]) --> I{Es la canónica o una nueva}
  I -->|ya existe con otro nombre| J[Se vincula, con quién lo hizo]
  I -->|no existe| K[Se fusiona o se crea, con quién lo hizo]
```

Pantallas: [Pedidos](screens/SC-030-requests/README.md) (nodo A) y [Catálogo](screens/SC-027-catalog/README.md) (nodos B a K).

### BO-2: contrastar una corrección contra la fuente

```mermaid
flowchart TD
  A([Llega una corrección desde una ficha, US-189]) --> B[Correcciones: valor viejo y nuevo a la vista]
  B --> C[Contrastar contra la fuente]
  C --> D[Aplicar: queda registrado quién la aprobó, US-194]
  D --> E([La ficha cambia para todos, sin votación])
```

Pantalla: [Correcciones](screens/SC-028-corrections/README.md).

### BO-9: destilar y clasificar frases nuevas

```mermaid
flowchart TD
  A([Los comentarios de muchas reseñas se acumulan]) --> B[La máquina propone una frase]
  B --> C[Frases: cola de curaduría con los comentarios<br/>de los que salió, US-199]
  C --> D{Se aprueba o se descarta}
  D -->|se descarta| E([No se ofrece: no queda rastro público])
  D -->|se aprueba| F[Se le asigna sujeto y eje, US-199]
  F --> G([Recién ahora se ofrece para marcar,<br/>marcada como destilada, US-187])
  H([Alguien corrige el eje de una frase existente, US-198]) --> I([Reprocesa las fichas afectadas])
```

Pantalla: [Frases](screens/SC-029-phrases/README.md).

### Cuando la cola nos gana: doscientos pendientes, dos carreras por semana

```mermaid
flowchart TD
  A([Pedidos: doscientos pendientes]) --> B[La cola dice cuánto se tarda en promedio<br/>y qué queda afuera del mes, sin fingir, US-200]
  B --> C{¿Es el primer día, sin pedidos todavía?}
  C -->|sí| C1[Arranca con un criterio explícito de arranque,<br/>no vacía esperando demanda, US-203]
  C -->|no| D[Carga la oferta: el recorrido de BO-1]
  C1 --> D
  D -->|la fuente no existe o se contradice| D1[Se marca de dónde salió el dato:<br/>la ficha lo muestra si no es oficial, US-202]
  D1 --> E
  D --> E[Algo ya publicado tenía un error]
  E -->|cuarenta personas ya lo tienen marcado| F([Se edita la oferta publicada:<br/>los que la tienen marcada se enteran de qué cambió, US-201])
```

Pantallas: [Pedidos](screens/SC-030-requests/README.md) (nodos A a C1) y [Catálogo](screens/SC-027-catalog/README.md) (nodos D a F).

### BO-5: cuando la facultad reforma el plan

```mermaid
flowchart TD
  A([La facultad publica un plan nuevo]) --> B[Catálogo: los dos planes coexisten, cada uno con su año]
  B --> C[Cada reseña queda pegada al período y a la materia canónica,<br/>no a la fila del plan, US-204]
  C --> D{¿Alguien nombra una materia del plan viejo<br/>que ya no está en el nuevo?}
  D -->|sí| E[Pendiente de vincular: fusión contra la materia canónica, US-197]
  D -->|no| F([El corpus no se parte en dos])
  E --> F
```

Pantalla: [Catálogo](screens/SC-027-catalog/README.md).

## Salidas y errores

- **No se publica a medias**: mientras falte un hueco bloqueante, duración nominal o carrera canónica, la oferta no sale aunque el resto esté cargado (US-191).
- **Una materia declarada puede vincularse a una canónica existente o volverse una nueva**, y en los dos casos queda registrado quién lo hizo (US-197).
- **Aplicar una corrección queda registrado con quién la aprobó** (US-194): no es un cambio anónimo del catálogo.
- **Una frase destilada que se descarta no se ofrece nunca** ni deja rastro en la lista pública (US-199).
- **Corregir el eje de una frase reprocesa las fichas que la usan** (US-198): nunca es un cambio aislado.
- **El primer día no hay pedidos**: la cola arranca con un criterio explícito, no vacía esperando demanda (US-203).
- **La fuente del dato no existe o se contradice**: se marca de dónde salió y la ficha lo muestra cuando no es oficial (US-202); no bloquea cargar, declara el origen.
- **Algo publicado tenía un error y ya lo usan**: se edita la oferta publicada y los que la tienen marcada se enteran de qué cambió (US-201); no hay que despublicar para corregir.
- **La materia del plan viejo que nadie vinculó todavía** sigue sosteniendo las reseñas hechas con ella: no desaparece con la reforma (US-204).
- **Un pedido de réplica sobre una cátedra sin equipo docente cargado no se rechaza**: se convierte en trabajo de catálogo y se resuelve cuando el dato está (US-225).
- **El cargo institucional se publica normalizado, nunca con el nombre textual de la institución**: se ata a la lista corta de cargos genéricos del catálogo (US-224).

## Lo que el flujo no dibuja y la ficha de la pantalla decide

Cómo se prioriza entre varios huecos bloqueantes a la vez; el criterio para decidir si dos ofertas son la misma carrera canónica; cuántos comentarios hacen falta para que la máquina proponga una frase.
