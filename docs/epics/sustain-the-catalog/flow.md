# Sostener el catálogo: el flujo

> Reemplaza a las filas BO-1 (Cargar lo que piden, por prioridad), BO-2 (Contrastar una corrección contra la fuente), BO-9 (Destilar y clasificar frases nuevas), BO-5 (Cuando la facultad reforma el plan) y la mitad de BO-7 (Cuando la cola nos gana) que habla de la cola del catálogo, de la tabla de flujos del [mapa](../../design/product-map.md). Persona: Sofía (BO-1, BO-2, BO-5, BO-7) y quien cura las frases (BO-9). Disparador: la cola de pedidos, una corrección que llega desde una ficha, los comentarios que se acumulan para destilar, o la facultad publicando un plan nuevo. Stories que cubre: BO1-1 a BO1-9, BO4-1, BO4-2, BO4-3, BO4-5, BO5-1, T1-2.

### BO-1: cargar lo que piden, por prioridad

```mermaid
flowchart TD
  A([Pedidos: la cola ordenada por cantidad confirmada<br/>con la institución de origen, BO1-2]) --> B[Catálogo abre por huecos: los que bloquean primero,<br/>duración nominal y carrera canónica, BO1-1]
  B --> C[Carga el plan, las materias canónicas y las cátedras:<br/>el equipo docente a cargo, BO1-6]
  C --> D[Ata la oferta a su carrera canónica<br/>con autor y fecha, BO1-5]
  D --> E{Terminó la oferta}
  E -->|no| B
  E -->|sí| F([Se publica: no antes, BO1-1])
  F --> G[Aviso a todos los que la pidieron, BO1-3 → Pedir una carrera]
  H([Cola de materias declaradas: cuántas personas<br/>nombraron cada una, BO1-7]) --> I{Es la canónica o una nueva}
  I -->|ya existe con otro nombre| J[Se vincula, con quién lo hizo]
  I -->|no existe| K[Se fusiona o se crea, con quién lo hizo]
```

### BO-2: contrastar una corrección contra la fuente

```mermaid
flowchart TD
  A([Llega una corrección desde una ficha, T1-2]) --> B[Correcciones: valor viejo y nuevo a la vista]
  B --> C[Contrastar contra la fuente]
  C --> D[Aplicar: queda registrado quién la aprobó, BO1-4]
  D --> E([La ficha cambia para todos, sin votación])
```

### BO-9: destilar y clasificar frases nuevas

```mermaid
flowchart TD
  A([Los comentarios de muchas reseñas se acumulan]) --> B[La máquina propone una frase]
  B --> C[Frases: cola de curaduría con los comentarios<br/>de los que salió, BO1-9]
  C --> D{Se aprueba o se descarta}
  D -->|se descarta| E([No se ofrece: no queda rastro público])
  D -->|se aprueba| F[Se le asigna sujeto y eje, BO1-9]
  F --> G([Recién ahora se ofrece para marcar,<br/>marcada como destilada, O8-8])
  H([Alguien corrige el eje de una frase existente, BO1-8]) --> I([Reprocesa las fichas afectadas])
```

### Cuando la cola nos gana: doscientos pendientes, dos carreras por semana

```mermaid
flowchart TD
  A([Pedidos: doscientos pendientes]) --> B[La cola dice cuánto se tarda en promedio<br/>y qué queda afuera del mes, sin fingir, BO4-1]
  B --> C{¿Es el primer día, sin pedidos todavía?}
  C -->|sí| C1[Arranca con un criterio explícito de arranque,<br/>no vacía esperando demanda, BO4-5]
  C -->|no| D[Carga la oferta: el recorrido de BO-1]
  C1 --> D
  D -->|la fuente no existe o se contradice| D1[Se marca de dónde salió el dato:<br/>la ficha lo muestra si no es oficial, BO4-3]
  D1 --> E
  D --> E[Algo ya publicado tenía un error]
  E -->|cuarenta personas ya lo tienen marcado| F([Se edita la oferta publicada:<br/>los que la tienen marcada se enteran de qué cambió, BO4-2])
```

### BO-5: cuando la facultad reforma el plan

```mermaid
flowchart TD
  A([La facultad publica un plan nuevo]) --> B[Los dos planes coexisten, cada uno con su año]
  B --> C[Cada reseña queda pegada al período y a la materia canónica,<br/>no a la fila del plan, BO5-1]
  C --> D{¿Alguien nombra una materia del plan viejo<br/>que ya no está en el nuevo?}
  D -->|sí| E[Pendiente de vincular: fusión contra la materia canónica, BO1-7]
  D -->|no| F([El corpus no se parte en dos])
  E --> F
```

## Salidas y errores

- **No se publica a medias**: mientras falte un hueco bloqueante, duración nominal o carrera canónica, la oferta no sale aunque el resto esté cargado (BO1-1).
- **Una materia declarada puede vincularse a una canónica existente o volverse una nueva**, y en los dos casos queda registrado quién lo hizo (BO1-7).
- **Aplicar una corrección queda registrado con quién la aprobó** (BO1-4): no es un cambio anónimo del catálogo.
- **Una frase destilada que se descarta no se ofrece nunca** ni deja rastro en la lista pública (BO1-9).
- **Corregir el eje de una frase reprocesa las fichas que la usan** (BO1-8): nunca es un cambio aislado.
- **El primer día no hay pedidos**: la cola arranca con un criterio explícito, no vacía esperando demanda (BO4-5).
- **La fuente del dato no existe o se contradice**: se marca de dónde salió y la ficha lo muestra cuando no es oficial (BO4-3); no bloquea cargar, declara el origen.
- **Algo publicado tenía un error y ya lo usan**: se edita la oferta publicada y los que la tienen marcada se enteran de qué cambió (BO4-2); no hay que despublicar para corregir.
- **La materia del plan viejo que nadie vinculó todavía** sigue sosteniendo las reseñas hechas con ella: no desaparece con la reforma (BO5-1).

## Lo que el flujo no dibuja y la ficha de la pantalla decide

Cómo se prioriza entre varios huecos bloqueantes a la vez; el criterio para decidir si dos ofertas son la misma carrera canónica; cuántos comentarios hacen falta para que la máquina proponga una frase.
