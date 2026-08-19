# Replicar: el flujo

> Reemplaza a las filas 06 (Claudia contesta, con nombre porque es público) y 10 (Los evaluados, responder y abandonar) de la tabla de flujos del [mapa](../../design/product-map.md); la mitad de "Mi situación" de la fila 10 vive en Reseñar, sigue en [Reseñar](../write-a-review/flow.md). Personas: Claudia, Prof. Paredes, la institución. Disparador: llega el resumen periódico por mail. Stories que cubre: O7-1, O7-2, O7-3, O7-5, O7-6, O7-7, O7-8, T2-2, BO2-6, BO2-5.

```mermaid
flowchart TD
  A([Llega el resumen periódico por mail<br/>sin fecha ni hora por reseña, O7-5]) --> B{¿Identidad verificada?}
  B -->|no| C[Verificar: contra la cátedra que dice tener<br/>en su propia cola, BO2-6, O7-8]
  C -->|rechazada| C1([No habilita la réplica y no marca a nadie])
  C -->|aprobada| D
  B -->|sí| D[Responder]
  D --> E{Chequeo previo, el mismo que el aporte, T2-2}
  E -->|cita lo marcado como identificante| E1([Esa parte no se puede citar: se retira antes de publicar])
  E -->|habla de una persona fuera de su acto| E2[Retenida en la cola de Reportes, BO2-5]
  E -->|pasa| F[Aviso al autor del testimonio]
  F --> G[La réplica queda retenida el plazo desde el aviso, T2-2]
  G -->|el autor edita| E
  G -->|el autor borra| G1([No sale])
  G -->|pasa el plazo sin acción| H([Publicada al lado, con nombre y rol<br/>no baja el testimonio ni mueve conteos, O7-1])
  H --> I[La serie marca la fecha de publicación y de la réplica, O7-7]

  A -.->|Paredes, verificado, no contesta| J([La ficha declara: sin réplica, O7-6])

  M([Docente sin identidad verificada: no se le pudo avisar]) -.-> N([La ficha lo declara, D06])

  K([La institución lee su ficha]) --> L[Ficha de institución: frase por frase contra las demás<br/>sin puesto ni orden por valor, O7-3]
  L --> I
```

## Salidas y errores

- **Identidad rechazada**: no habilita la réplica y no marca a nadie (O7-8, BO2-6).
- **La réplica cita la parte marcada como identificante**: se retira antes de publicarse (T2-2).
- **La réplica habla de una persona fuera de su acto**: queda retenida en la cola de Reportes hasta que alguien la mire (BO2-5).
- **El autor borra el testimonio en el plazo**: la réplica no sale (T2-2).
- **Paredes no contesta**: la ficha declara "sin réplica", nunca "no quiso responder" (O7-6, D06).
- **Publicada**: no baja el testimonio ni mueve ningún conteo (O7-1).

## Lo que el flujo no dibuja y la ficha de la pantalla decide

El copy exacto del estado del canal; cuánto dura el plazo de retención antes de publicar (T2-2, el número que falta); el layout de la comparación frase por frase en la Ficha de institución.
