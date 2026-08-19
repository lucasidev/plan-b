# Reseñar: el flujo

> Reemplaza a las filas 03, 05, 12 y 14 de la tabla de flujos del [mapa](../../design/product-map.md) (Matías vuelve y esta vez completa; Lucía reseña; el texto que te delata; cuando el dato no me alcanza), que ahora son un solo recorrido con sus ramas. Personas: Lucía, Matías (llega desde una ficha y recién ahí pasa el umbral) y Diego (llega sin cursar). Disparador: el aviso al cerrar el período, una ficha que se acaba de leer, o entrar con una materia en la cabeza. Stories que cubre: las 19 de la épica (O4-1, O4-2, O4-4, O4-5, O4-6, O4-7, O4-8, O4-9, O4-10, O4-11, O4-12, O4-13, T2-1, T2-4, T3-1, T3-3, T3-4, T3-5, T4-1), más las garantías O6-2 y O6-3 que se verifican acá.

```mermaid
flowchart TD
  A([Aviso por mail: cerró el período, con una materia concreta, O4-5<br/>o entra con una materia en la cabeza]) --> B[Reseñar: elegir la materia]
  A2([Mail anual a la cuenta inactiva: ¿te recibiste?, O4-12]) -->|responde desde el mail, sin entrar| C3
  A2 -->|responde desde el mail| C4
  M([Matías leyó una ficha y quiere que quede registrado]) --> M1[Ingresar / Registro: el gate está en la acción, con el motivo a la vista y vuelta a donde iba]
  M1 --> M2[Empezar: marcás por dónde vas; saltable y retomable, O6-3]
  M2 --> B
  B -->|la materia no está en el plan cargado| B2[Se acepta igual: queda pendiente de vincular<br/>no cuenta hasta que el catálogo la vincula, T3-1]
  B2 --> C
  B -->|es un trámite, el título, una mesa| E1[Evento institucional: sin materia<br/>mismas frases del sujeto institución, O4-13]
  E1 --> E2[¿Cuándo pasó? el período o la fecha del evento, ADR-0067]
  E2 --> F
  B --> C[¿Cuándo la cursaste? período]
  C -->|primera reseña de esta carrera| C1[¿En qué año entraste? una sola vez, O4-11]
  C1 --> C2
  C -->|el período es viejo y la cuenta no dijo su situación| C2{¿Seguís cursando?}
  C2 -->|sí| D
  C2 -->|me recibí, cuándo| C3[Hecho de trayectoria: me recibí]
  C2 -->|me fui, cuándo| C4[Hecho de trayectoria: me fui]
  C3 --> D
  C4 --> D4[Su reseña suma voces igual que cualquier otra: lo publicado no dice cómo terminó ni quién, O4-9]
  D4 --> D
  C --> D[¿Cómo terminó? aprobé, regular, desaprobé, la dejé, sigo · un toque, O4-10]
  D -->|ya reseñé esta materia en otro período| D1[Segunda reseña: otro período, T3-5]
  D1 --> F
  D --> F[Frases del sujeto que corresponde: marcar las que te pasaron<br/>los dos sentidos de cada aspecto, T4-1]
  F -->|leyó en la ficha algo que a él no le pasó| F1[Marca la frase del otro sentido: cada una publica su proporción,<br/>ninguna resta de la otra; discrepar no es reportar, T4-1]
  F1 --> G
  F --> G[¿Cátedra? opcional]
  F -->|viene del evento institucional: sin cátedra| H
  G -->|marcó que hubo clases sin dar| G1[¿Cuántas? O4-6]
  G1 --> H
  G --> H[Comentario, opcional, con tope]
  H --> H1{Chequeo previo, T2-1}
  H1 -->|identifica por contexto| H2[Se marca la parte: decidís vos<br/>la réplica no podrá citarla]
  H2 --> I
  H1 -->|habla de una persona fuera de su acto| H3[Queda retenido hasta que alguien lo mire<br/>y se te dice, BO2-5]
  H3 --> I
  H1 -->|nada que marcar| I[Aviso: no publicamos quién;<br/>en un grupo chico pueden sospechar]
  I --> J{Publicar}
  J -->|con comentario| K([Publicada: suma voz a sus frases;<br/>el testimonio se lee debajo de las frases])
  J -->|sin comentario| K2([Publicada: suma voz; sin testimonio])
  H -.->|cerré la pestaña| R[Queda guardada a medias: se retoma, T3-3]
  R -.-> H
  K --> L[Mis aportes: lo que sumó cada frase y cuántos la leyeron, T3-4]
  K2 --> L
```

## Salidas y errores

- **La materia no está** (T3-1): se acepta, queda pendiente de vincular a la materia canónica; el autor la ve como pendiente en Mis aportes; no cuenta en ninguna ficha ni en la cobertura hasta que BO1-7 la vincule.
- **El período es viejo y no dijo su situación**: la pregunta de Mi situación aparece acá, una sola vez; si no contesta, queda como "no dijo" (nunca se infiere).
- **Ya reseñó esta materia**: se acepta una segunda si el período es otro (la reseña es cuenta × materia × período); la cátedra, que es opcional, no entra en la clave.
- **El comentario habla de una persona fuera de su acto**: se retiene para un humano (cola BO2-5); la reseña se publica igual con sus frases; el comentario sale o se baja después, con su categoría.
- **Cerró la pestaña**: la reseña a medias se guarda y aparece para retomar (T3-3).
- **Discrepar no es reportar** (T4-1): el que leyó en la ficha algo que no le pasó reseña su cursada y marca la frase del otro sentido; reportar es acusar de daño y vive en [Deshacer](../undo/flow.md).
- **Sin cuenta**: no se llega a Reseñar; el gate está en la acción (Ingresar / Registro, con el motivo a la vista y vuelta a donde ibas), no en la lectura. Empezar se puede saltear: todo funciona sin plan marcado (O6-3), y marcar el plan es preferencia privada ([ADR-0069](../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md)).

## Lo que el flujo no dibuja y la ficha de la pantalla decide

Cuántas frases se ofrecen por vez y en qué orden; cómo se ve la lista con los dos sentidos; el tope del comentario; el copy exacto del aviso de la sospecha; qué muestra Mis aportes al terminar.
